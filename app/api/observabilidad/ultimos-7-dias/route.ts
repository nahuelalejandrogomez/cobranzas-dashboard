import { executeQuery } from '@/lib/db';

// Obtener fecha en Argentina (UTC-3)
function getArgentinaDate(daysOffset: number = 0): string {
  const now = new Date();
  const argentinaOffset = -3 * 60;
  const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
  argentinaTime.setDate(argentinaTime.getDate() + daysOffset);
  return argentinaTime.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get('desde') || getArgentinaDate(-7);
    const hasta = searchParams.get('hasta') || getArgentinaDate();

    const query = `
      SELECT
        DATE(fecha_evento) as fecha,
        SUM(CASE WHEN resultado_envio = 'OK' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN resultado_envio = 'ERROR' THEN 1 ELSE 0 END) as errores,
        COUNT(*) as total
      FROM EstadoEnvioLiquidaciones
      WHERE DATE(fecha_evento) BETWEEN ? AND ?
      GROUP BY DATE(fecha_evento)
      ORDER BY fecha ASC
    `;

    const rows = (await executeQuery(query, [desde, hasta])) as any[];

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
      { error: 'Error al obtener datos de rango de fechas' },
      { status: 500 }
    );
  }
}
