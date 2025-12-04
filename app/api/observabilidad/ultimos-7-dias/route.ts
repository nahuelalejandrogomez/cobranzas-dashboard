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

    // 🔥 FIX: Convertir fecha_evento de UTC a Argentina (UTC-3) para filtrar correctamente
    // Query para obtener los totales por día
    const queryTotales = `
      SELECT
        DATE(CONVERT_TZ(fecha_evento, '+00:00', '-03:00')) as fecha,
        SUM(CASE WHEN resultado_envio = 'OK' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN resultado_envio = 'ERROR' THEN 1 ELSE 0 END) as errores,
        COUNT(*) as total
      FROM EstadoEnvioLiquidaciones
      WHERE DATE(CONVERT_TZ(fecha_evento, '+00:00', '-03:00')) BETWEEN ? AND ?
      GROUP BY DATE(CONVERT_TZ(fecha_evento, '+00:00', '-03:00'))
      ORDER BY fecha ASC
    `;

    // Query para obtener la lista de socios por día y resultado
    const querySocios = `
      SELECT
        DATE(CONVERT_TZ(E.fecha_evento, '+00:00', '-03:00')) as fecha,
        E.resultado_envio,
        L.SOCLIQUIDA as socio_id,
        S.NOMSOCIO as nombre_socio
      FROM EstadoEnvioLiquidaciones E
      LEFT JOIN Liquidaciones L ON E.liquidacion_id = L.id
      LEFT JOIN Socios S ON L.SOCLIQUIDA = S.NUMSOCIO
      WHERE DATE(CONVERT_TZ(E.fecha_evento, '+00:00', '-03:00')) BETWEEN ? AND ?
      ORDER BY DATE(CONVERT_TZ(E.fecha_evento, '+00:00', '-03:00')) ASC, E.resultado_envio ASC
    `;

    const [rowsTotales, rowsSocios] = await Promise.all([
      executeQuery(queryTotales, [desde, hasta]) as Promise<any[]>,
      executeQuery(querySocios, [desde, hasta]) as Promise<any[]>
    ]);

    // Agrupar socios por fecha y resultado
    const sociosPorDia: { [key: string]: { ok: Array<{socio_id: string, nombre: string}>, error: Array<{socio_id: string, nombre: string}> } } = {};

    rowsSocios.forEach((row: any) => {
      const fechaKey = row.fecha;
      if (!sociosPorDia[fechaKey]) {
        sociosPorDia[fechaKey] = { ok: [], error: [] };
      }

      const socio = {
        socio_id: row.socio_id || 'N/A',
        nombre: row.nombre_socio || 'Sin nombre'
      };

      if (row.resultado_envio === 'OK') {
        sociosPorDia[fechaKey].ok.push(socio);
      } else if (row.resultado_envio === 'ERROR') {
        sociosPorDia[fechaKey].error.push(socio);
      }
    });

    const datos = rowsTotales.map(row => ({
      fecha: row.fecha,
      enviados: Number(row.enviados) || 0,
      errores: Number(row.errores) || 0,
      total: Number(row.total) || 0,
      socios: sociosPorDia[row.fecha] || { ok: [], error: [] }
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
