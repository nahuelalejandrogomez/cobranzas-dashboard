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

    // Parámetros de filtro
    const desde = searchParams.get('desde') || getArgentinaDate(-7);
    const hasta = searchParams.get('hasta') || getArgentinaDate();
    const estado = searchParams.get('estado') || null;
    const resultado = searchParams.get('resultado') || null;

    // Parámetros de paginación
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
    const offset = (page - 1) * limit;

    // Construir WHERE clause dinámico
    const whereClauses = ['DATE(E.fecha_evento) BETWEEN ? AND ?'];
    const params: any[] = [desde, hasta];

    if (estado && estado !== 'TODOS') {
      whereClauses.push('E.estado = ?');
      params.push(estado);
    }

    if (resultado && resultado !== 'TODOS') {
      whereClauses.push('E.resultado_envio = ?');
      params.push(resultado);
    }

    const whereClause = whereClauses.join(' AND ');

    // Query principal con LEFT JOIN para obtener info del socio (aunque no exista)
    const query = `
      SELECT
        E.id,
        E.liquidacion_id,
        E.estado,
        E.resultado_envio,
        E.metadata,
        E.fecha_evento,
        L.SOCLIQUIDA as socio_id,
        S.NOMSOCIO as nombre_socio,
        S.TELSOCIO as telefono_socio
      FROM EstadoEnvioLiquidaciones E
      LEFT JOIN Liquidaciones L ON E.liquidacion_id = L.id
      LEFT JOIN Socios S ON L.SOCLIQUIDA = S.NUMSOCIO
      WHERE ${whereClause}
      ORDER BY E.fecha_evento DESC
      LIMIT ? OFFSET ?
    `;

    // Query para contar total (sin LIMIT)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM EstadoEnvioLiquidaciones E
      LEFT JOIN Liquidaciones L ON E.liquidacion_id = L.id
      LEFT JOIN Socios S ON L.SOCLIQUIDA = S.NUMSOCIO
      WHERE ${whereClause}
    `;

    const [rows, countResult] = await Promise.all([
      executeQuery(query, [...params, limit, offset]) as Promise<any[]>,
      executeQuery(countQuery, params) as Promise<any[]>
    ]);

    const total = Number(countResult[0]?.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const mensajes = rows.map(row => {
      // Parsear metadata para extraer mensaje de error
      let mensajeError = '';
      try {
        if (row.metadata) {
          const metadata = typeof row.metadata === 'string'
            ? JSON.parse(row.metadata)
            : row.metadata;
          mensajeError = metadata.error || metadata.mensaje || '';
        }
      } catch (e) {
        mensajeError = row.metadata || '';
      }

      return {
        id: row.id,
        liquidacion_id: row.liquidacion_id || 0,
        socio_id: row.socio_id || 'N/A',
        nombre_socio: row.nombre_socio || 'Sin nombre',
        telefono_socio: row.telefono_socio || 'N/A',
        estado: row.estado,
        resultado_envio: row.resultado_envio,
        fecha_evento: row.fecha_evento,
        mensaje_error: mensajeError
      };
    });

    return Response.json({
      mensajes,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('[API observabilidad/detalle-mensajes] Error:', error);
    return Response.json(
      { error: 'Error al obtener detalle de mensajes', details: String(error) },
      { status: 500 }
    );
  }
}
