import { executeQuery } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || new Date().getMonth() + 1;
    const anio = searchParams.get('anio') || new Date().getFullYear();

    const query = `
      SELECT
        COUNT(*) as total_requests,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens,
        COALESCE(AVG(latency_ms), 0) as avg_latency,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as total_errors,
        COUNT(*) as total_count
      FROM IAUsageLogs
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
    `;

    const [result] = (await executeQuery(query, [mes, anio])) as any[];

    // Top 5 workflows más usados
    const workflowsQuery = `
      SELECT
        workflow_id,
        COUNT(*) as requests,
        SUM(total_tokens) as tokens
      FROM IAUsageLogs
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
      GROUP BY workflow_id
      ORDER BY requests DESC
      LIMIT 5
    `;

    const workflows = (await executeQuery(workflowsQuery, [mes, anio])) as any[];

    const totalRequests = Number(result?.total_requests) || 0;
    const totalErrors = Number(result?.total_errors) || 0;
    const tasaError = totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 100) : 0;

    return Response.json({
      total_requests: totalRequests,
      total_tokens: Number(result?.total_tokens) || 0,
      input_tokens: Number(result?.input_tokens) || 0,
      output_tokens: Number(result?.output_tokens) || 0,
      avg_latency: Math.round(Number(result?.avg_latency) || 0),
      tasa_error: tasaError,
      workflows_mas_usados: workflows.map(w => ({
        workflow_id: w.workflow_id,
        requests: Number(w.requests),
        tokens: Number(w.tokens)
      }))
    });
  } catch (error) {
    console.error('[API observabilidad-ia/resumen-mensual] Error:', error);
    return Response.json(
      { error: 'Error al obtener resumen mensual' },
      { status: 500 }
    );
  }
}
