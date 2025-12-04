import { executeQuery } from '@/lib/db';

// Obtener fecha de hoy en Argentina (UTC-3)
function getArgentinaDate(): string {
  const now = new Date();
  const argentinaOffset = -3 * 60;
  const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha') || getArgentinaDate();

    // 🔥 FIX: Convertir fecha_evento de UTC a Argentina (UTC-3) para filtrar correctamente
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN resultado_envio = 'OK' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN resultado_envio = 'ERROR' THEN 1 ELSE 0 END) as errores
      FROM EstadoEnvioLiquidaciones
      WHERE DATE(CONVERT_TZ(fecha_evento, '+00:00', '-03:00')) = ?
    `;

    const [result] = (await executeQuery(query, [fecha])) as any[];

    const total = Number(result?.total) || 0;
    const enviados = Number(result?.enviados) || 0;
    const errores = Number(result?.errores) || 0;
    const porcentajeExito = total > 0 ? Math.round((enviados / total) * 100) : 0;

    return Response.json({
      fecha,
      total,
      enviados,
      errores,
      porcentajeExito
    });
  } catch (error) {
    console.error('[API observabilidad/resumen-hoy] Error:', error);
    return Response.json(
      { error: 'Error al obtener resumen del día' },
      { status: 500 }
    );
  }
}
