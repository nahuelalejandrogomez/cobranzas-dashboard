import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT
        COUNT(*) AS total_mensajes,
        SUM(estado_envio = 'enviado') AS total_ok,
        SUM(estado_envio = 'error') AS total_error
      FROM MensajesEnviados
      WHERE MONTH(fecha_envio) = MONTH(CURDATE())
        AND YEAR(fecha_envio) = YEAR(CURDATE())
    `;

    const [result] = (await executeQuery(query)) as any[];

    return Response.json({
      total_mensajes_del_mes: Number(result?.total_mensajes) || 0,
      total_ok: Number(result?.total_ok) || 0,
      total_error: Number(result?.total_error) || 0
    });

  } catch (error) {
    console.error('[API dashboard/mensajes-mes] Error:', error);
    return Response.json(
      { error: 'Error al obtener totales de mensajes' },
      { status: 500 }
    );
  }
}
