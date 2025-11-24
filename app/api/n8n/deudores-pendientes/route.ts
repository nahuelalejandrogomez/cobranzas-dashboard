import { executeQuery } from '@/lib/db';

/**
 * API para n8n - Obtiene deudores pendientes para envío de WhatsApp
 *
 * Lógica:
 * - Deuda = IMPLIQUIDA - ABOLIQUIDA (si > 0, debe plata)
 * - Filtra: total_adeudado >= 1000
 * - Ordena: por monto total DESC (prioridad)
 * - Límite: 30 resultados
 * - Teléfono: modo prueba (fijo)
 *
 * Parámetros opcionales:
 * - ?monto_minimo=1000 (default 1000)
 * - ?limit=30 (default 30)
 * - ?test_phone=541134722453 (si se omite, usa el real de la BD). ID de telegram: '812001079';
 */

const TELEFONO_PRUEBA = '812001079';

// Convertir fecha UTC a zona horaria Argentina (UTC-3)
function formatArgentinaDateTime(date: Date): string {
  const argentinaOffset = -3 * 60; // UTC-3 en minutos
  const argentinaTime = new Date(date.getTime() + (argentinaOffset - date.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 19).replace('T', ' ');
}

interface LiquidacionPendiente {
  mes: string;
  monto: number;
}

interface ConversacionMensaje {
  rol: string;
  mensaje: string;
  fecha: string;
}

interface DeudorPendiente {
  socio_id: string;
  nombre: string;
  telefono: string;
  liquidaciones_pendientes: LiquidacionPendiente[];
  total_adeudado: number;
  cantidad_cuotas: number;
  conversacion: ConversacionMensaje[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const montoMinimo = Number(searchParams.get('monto_minimo')) || 1000;
    const limit = Math.min(Number(searchParams.get('limit')) || 3, 100); // Default 3 para pruebas
    const usarTelefonoReal = searchParams.get('test_phone') === 'false';
    const telefonoOverride = searchParams.get('telefono_override') || null;

    console.log('[API n8n/deudores-pendientes] Iniciando consulta...');
    console.log(`  - Monto mínimo: $${montoMinimo}`);
    console.log(`  - Límite: ${limit}`);
    console.log(`  - Teléfono: ${telefonoOverride ? 'OVERRIDE: ' + telefonoOverride : (usarTelefonoReal ? 'REAL' : 'PRUEBA')}`);

    // 1. Obtener todas las liquidaciones con deuda > 0
    const queryLiquidaciones = `
      SELECT
        L.SOCLIQUIDA as socio_id,
        S.NOMSOCIO as nombre,
        S.FANSOCIO as apellido,
        S.TELSOCIO as telefono_real,
        DATE_FORMAT(L.PERLIQUIDANRO, '%Y-%m') as mes,
        (L.IMPLIQUIDA - COALESCE(L.ABOLIQUIDA, 0)) as deuda
      FROM Liquidaciones L
      INNER JOIN Socios S ON L.SOCLIQUIDA = S.NUMSOCIO
      WHERE (L.IMPLIQUIDA - COALESCE(L.ABOLIQUIDA, 0)) > 0
      ORDER BY L.SOCLIQUIDA, L.PERLIQUIDANRO ASC
    `;

    const liquidaciones = (await executeQuery(queryLiquidaciones)) as any[];
    console.log(`  - Liquidaciones con deuda encontradas: ${liquidaciones.length}`);

    // 2. Agrupar por socio
    const deudoresMapa = new Map<string, {
      socio_id: string;
      nombre: string;
      telefono_real: string;
      liquidaciones: LiquidacionPendiente[];
      total_adeudado: number;
    }>();

    for (const liq of liquidaciones) {
      const socioId = liq.socio_id;

      if (!deudoresMapa.has(socioId)) {
        const nombreCompleto = [liq.nombre, liq.apellido]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Sin nombre';

        deudoresMapa.set(socioId, {
          socio_id: socioId,
          nombre: nombreCompleto,
          telefono_real: liq.telefono_real || '',
          liquidaciones: [],
          total_adeudado: 0
        });
      }

      const deudor = deudoresMapa.get(socioId)!;
      const montoDeuda = Number(liq.deuda) || 0;

      deudor.liquidaciones.push({
        mes: liq.mes,
        monto: montoDeuda
      });
      deudor.total_adeudado += montoDeuda;
    }

    // 3. Filtrar por monto mínimo y convertir a array
    let deudoresArray = Array.from(deudoresMapa.values())
      .filter(d => d.total_adeudado >= montoMinimo);

    console.log(`  - Deudores con >= $${montoMinimo}: ${deudoresArray.length}`);

    // 4. Ordenar por total_adeudado DESC (prioridad: los que más deben)
    deudoresArray.sort((a, b) => b.total_adeudado - a.total_adeudado);

    // 5. Limitar resultados
    deudoresArray = deudoresArray.slice(0, limit);

    // 6. Determinar teléfonos finales para cada deudor
    const telefonoFinal = telefonoOverride || (usarTelefonoReal ? null : TELEFONO_PRUEBA);
    const telefonosParaConversacion = deudoresArray.map(d =>
      telefonoFinal || d.telefono_real
    ).filter(Boolean);

    console.log(`  - Teléfonos para consultar conversaciones: ${telefonosParaConversacion.length}`);

    // 7. Consultar conversaciones para los deudores seleccionados
    let conversacionesMapa = new Map<string, ConversacionMensaje[]>();

    if (telefonosParaConversacion.length > 0) {
      const placeholders = telefonosParaConversacion.map(() => '?').join(',');
      const queryConversaciones = `
        SELECT telefono, rol, mensaje, fecha
        FROM Conversaciones
        WHERE telefono IN (${placeholders})
        ORDER BY fecha DESC
        LIMIT ${telefonosParaConversacion.length * 25}
      `;

      const conversaciones = (await executeQuery(queryConversaciones, telefonosParaConversacion)) as any[];
      console.log(`  - Conversaciones encontradas: ${conversaciones.length}`);

      // Agrupar conversaciones por teléfono (máximo 25 por teléfono)
      for (const conv of conversaciones) {
        const tel = conv.telefono;
        if (!conversacionesMapa.has(tel)) {
          conversacionesMapa.set(tel, []);
        }
        const lista = conversacionesMapa.get(tel)!;
        if (lista.length < 25) {
          lista.push({
            rol: conv.rol,
            mensaje: conv.mensaje,
            fecha: formatArgentinaDateTime(new Date(conv.fecha))
          });
        }
      }
    }

    // 8. Formatear respuesta final
    const resultado: DeudorPendiente[] = deudoresArray.map(d => {
      const telefono = telefonoFinal || d.telefono_real;
      const conversacion = conversacionesMapa.get(telefono) || [];

      return {
        socio_id: d.socio_id,
        nombre: d.nombre,
        telefono: telefono,
        liquidaciones_pendientes: d.liquidaciones,
        total_adeudado: Math.round(d.total_adeudado * 100) / 100,
        cantidad_cuotas: d.liquidaciones.length,
        conversacion: conversacion
      };
    });

    console.log(`  - Deudores retornados: ${resultado.length}`);

    return Response.json(resultado);

  } catch (error) {
    console.error('[API n8n/deudores-pendientes] Error:', error);
    return Response.json(
      { error: 'Error al obtener deudores pendientes', details: String(error) },
      { status: 500 }
    );
  }
}
