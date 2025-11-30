import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT
        DATE(fecha_evento) AS dia,
        COUNT(*) AS total,
        SUM(resultado_envio = 'OK') AS ok,
        SUM(resultado_envio = 'ERROR') AS error,
        SUM(resultado_envio = 'Planificado') AS planificado
      FROM EstadoEnvioLiquidaciones
      WHERE MONTH(fecha_evento) = MONTH(CURDATE())
        AND YEAR(fecha_evento) = YEAR(CURDATE())
      GROUP BY DATE(fecha_evento)
      ORDER BY dia ASC
    `;

    const results = (await executeQuery(query)) as any[];

    const data = results.map(row => ({
      dia: row.dia,
      total: Number(row.total) || 0,
      ok: Number(row.ok) || 0,
      error: Number(row.error) || 0,
      planificado: Number(row.planificado) || 0
    }));

    return Response.json(data);

  } catch (error) {
    console.error('[API dashboard/mensajes-por-dia] Error:', error);
    return Response.json(
      { error: 'Error al obtener mensajes por dia' },
      { status: 500 }
    );
  }
}
