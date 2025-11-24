import { executeQuery } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || new Date().getMonth() + 1;
    const anio = searchParams.get('anio') || new Date().getFullYear();

    const query = `
      SELECT
        DATE(created_at) as fecha,
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens
      FROM IAUsageLogs
      WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
      GROUP BY DATE(created_at)
      ORDER BY fecha ASC
    `;

    const rows = (await executeQuery(query, [mes, anio])) as any[];

    const datos = rows.map(row => ({
      fecha: row.fecha,
      requests: Number(row.requests) || 0,
      tokens: Number(row.tokens) || 0
    }));

    return Response.json(datos);
  } catch (error) {
    console.error('[API observabilidad-ia/mensual-por-dia] Error:', error);
    return Response.json(
      { error: 'Error al obtener datos por día' },
      { status: 500 }
    );
  }
}
