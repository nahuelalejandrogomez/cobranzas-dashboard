import { executeQuery } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || new Date().getMonth() + 1;
    const anio = searchParams.get('anio') || new Date().getFullYear();

    const query = `
      SELECT
        workflow_id,
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(AVG(latency_ms), 0) as avg_latency
      FROM IAUsageLogs
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
      GROUP BY workflow_id
      ORDER BY requests DESC
    `;

    const rows = (await executeQuery(query, [mes, anio])) as any[];

    const datos = rows.map(row => ({
      workflow_id: row.workflow_id,
      requests: Number(row.requests) || 0,
      tokens: Number(row.tokens) || 0,
      avg_latency: Math.round(Number(row.avg_latency) || 0)
    }));

    return Response.json(datos);
  } catch (error) {
    console.error('[API observabilidad-ia/mensual-por-workflow] Error:', error);
    return Response.json(
      { error: 'Error al obtener datos por workflow' },
      { status: 500 }
    );
  }
}
