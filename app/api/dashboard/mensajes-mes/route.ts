import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT
        COUNT(*) AS total_mensajes,
        SUM(resultado_envio = 'OK') AS total_ok,
        SUM(resultado_envio = 'ERROR') AS total_error,
        SUM(resultado_envio = 'Planificado') AS total_planificado
      FROM EstadoEnvioLiquidaciones
      WHERE MONTH(fecha_evento) = MONTH(CURDATE())
        AND YEAR(fecha_evento) = YEAR(CURDATE())
    `;

    const [result] = (await executeQuery(query)) as any[];

    return Response.json({
      total_mensajes_del_mes: Number(result?.total_mensajes) || 0,
      total_ok: Number(result?.total_ok) || 0,
      total_error: Number(result?.total_error) || 0,
      total_planificado: Number(result?.total_planificado) || 0
    });

  } catch (error) {
    console.error('[API dashboard/mensajes-mes] Error:', error);
    return Response.json(
      { error: 'Error al obtener totales de mensajes' },
      { status: 500 }
    );
  }
}
