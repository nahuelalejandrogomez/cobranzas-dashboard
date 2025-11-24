import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT
        DATE(fecha_envio) as fecha,
        SUM(CASE WHEN estado_envio = 'enviado' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN estado_envio = 'error' THEN 1 ELSE 0 END) as errores,
        COUNT(*) as total
      FROM MensajesEnviados
      WHERE fecha_envio >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(fecha_envio)
      ORDER BY fecha ASC
    `;

    const rows = (await executeQuery(query)) as any[];

    const datos = rows.map(row => ({
      fecha: row.fecha,
      enviados: Number(row.enviados) || 0,
      errores: Number(row.errores) || 0,
      total: Number(row.total) || 0
    }));

    return Response.json(datos);
  } catch (error) {
    console.error('[API observabilidad/ultimos-7-dias] Error:', error);
    return Response.json(
      { error: 'Error al obtener datos de últimos 7 días' },
      { status: 500 }
    );
  }
}
