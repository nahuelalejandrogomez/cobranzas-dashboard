import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT
        DATE(fecha_envio) AS dia,
        COUNT(*) AS total,
        SUM(estado_envio = 'enviado') AS ok,
        SUM(estado_envio = 'error') AS error
      FROM MensajesEnviados
      WHERE MONTH(fecha_envio) = MONTH(CURDATE())
        AND YEAR(fecha_envio) = YEAR(CURDATE())
      GROUP BY DATE(fecha_envio)
      ORDER BY dia ASC
    `;

    const results = (await executeQuery(query)) as any[];

    const data = results.map(row => ({
      dia: row.dia,
      total: Number(row.total) || 0,
      ok: Number(row.ok) || 0,
      error: Number(row.error) || 0
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
