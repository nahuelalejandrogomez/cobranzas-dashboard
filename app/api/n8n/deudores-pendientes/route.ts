import { executeQuery } from '@/lib/db';

/**
 * API para n8n - Envío Masivo Inicial (anteriormente deudores-pendientes)
 *
 * Lógica:
 * - Solo liquidaciones con COBLIQUIDA = 30 (transferencias), BAJA = 0, ESTLIQUIDA IN ('AD','DE')
 * - Deuda = IMPLIQUIDA - ABOLIQUIDA (si > 0, debe plata)
 * - Excluye liquidaciones ya enviadas (tabla EstadoEnvioLiquidaciones)
 * - Filtra: total_adeudado >= 1000
 * - Ordena: por monto total DESC (prioridad)
 * - Límite: 30 resultados
 *
 * Parámetros opcionales:
 * - ?telefono_override=XXXX (filtrar solo por ese teléfono)
 * - ?limit=N (cantidad de socios a devolver, default 30)
 * - ?monto_minimo=1000 (default 1000)
 * - ?test_phone=false (usar teléfono real de BD)
 */

const TELEFONO_PRUEBA = '812001079';

// Convertir fecha UTC a zona horaria Argentina (UTC-3)
function formatArgentinaDateTime(date: Date): string {
  const argentinaOffset = -3 * 60; // UTC-3 en minutos
  const argentinaTime = new Date(date.getTime() + (argentinaOffset - date.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 19).replace('T', ' ');
}

interface LiquidacionPendiente {
  liquidacion_id: number;
  mes: string;
  perliquidanro: number;
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
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);
    const usarTelefonoReal = searchParams.get('test_phone') === 'false';
    const telefonoOverride = searchParams.get('telefono_override') || null;

    console.log('[API n8n/envio-masivo-inicial] Iniciando consulta...');
    console.log(`  - Monto mínimo: $${montoMinimo}`);
    console.log(`  - Límite: ${limit}`);
    console.log(`  - Teléfono: ${telefonoOverride ? 'OVERRIDE: ' + telefonoOverride : (usarTelefonoReal ? 'REAL' : 'PRUEBA')}`);

    // 1. Obtener liquidaciones que cumplan los filtros y no hayan sido enviadas exitosamente
    const queryLiquidaciones = `
      SELECT
        L.id as liquidacion_id,
        L.SOCLIQUIDA as socio_id,
        S.NUMSOCIO as numsocio,
        S.NOMSOCIO as nombre,
        S.TELSOCIO as telefono_real,
        DATE_FORMAT(L.PERLIQUIDANRO, '%Y-%m') as mes,
        (YEAR(L.PERLIQUIDANRO) * 100 + MONTH(L.PERLIQUIDANRO)) as perliquidanro,
        (L.IMPLIQUIDA - COALESCE(L.ABOLIQUIDA, 0)) as deuda
      FROM Liquidaciones L
      INNER JOIN Socios S ON L.SOCLIQUIDA = S.NUMSOCIO
      WHERE L.COBLIQUIDA = 30
        AND L.BAJA = 0
        AND L.ESTLIQUIDA IN ('AD', 'DE')
        AND (L.IMPLIQUIDA - COALESCE(L.ABOLIQUIDA, 0)) > 0
        ${telefonoOverride ? 'AND S.TELSOCIO = ?' : ''}
      ORDER BY L.SOCLIQUIDA, L.PERLIQUIDANRO ASC
    `;

    const queryParams = telefonoOverride ? [telefonoOverride] : [];
    const liquidaciones = (await executeQuery(queryLiquidaciones, queryParams)) as any[];
    console.log(`  - Liquidaciones con filtros aplicados: ${liquidaciones.length}`);

    // 2. Filtrar liquidaciones según tabla EstadoEnvioLiquidaciones
    const liquidacionesIds = liquidaciones.map(l => l.liquidacion_id);
    let liquidacionesFiltradas = liquidaciones;

    if (liquidacionesIds.length > 0) {
      const placeholdersEstados = liquidacionesIds.map(() => '?').join(',');
      const queryEstados = `
        SELECT liquidacion_id, resultado_envio
        FROM EstadoEnvioLiquidaciones
        WHERE liquidacion_id IN (${placeholdersEstados})
          AND estado = 'ENVIO_INICIAL'
      `;

      const estados = (await executeQuery(queryEstados, liquidacionesIds)) as any[];
      console.log(`  - Estados de envío encontrados: ${estados.length}`);

      // Crear mapa de estados por liquidacion_id
      const estadosPorLiquidacion = new Map<number, string>();
      for (const estado of estados) {
        estadosPorLiquidacion.set(estado.liquidacion_id, estado.resultado_envio);
      }

      // Filtrar liquidaciones según lógica de estado
      liquidacionesFiltradas = liquidaciones.filter(liq => {
        const estado = estadosPorLiquidacion.get(liq.liquidacion_id);

        // Si no existe ningún registro → incluir
        if (!estado) return true;

        // Si existe ENVIO_INICIAL con ERROR → incluir (reintento)
        if (estado === 'ERROR') return true;

        // Si existe ENVIO_INICIAL con OK → excluir (ya enviado)
        if (estado === 'OK') return false;

        // Para cualquier otro caso (PENDIENTE, etc.) → incluir
        return true;
      });

      console.log(`  - Liquidaciones después de filtro de estado: ${liquidacionesFiltradas.length}`);
    }

    // 3. Agrupar por socio
    const deudoresMapa = new Map<string, {
      socio_id: string;
      nombre: string;
      telefono_real: string;
      liquidaciones: LiquidacionPendiente[];
      total_adeudado: number;
    }>();

    for (const liq of liquidacionesFiltradas) {
      const socioId = liq.numsocio;

      if (!deudoresMapa.has(socioId)) {
        deudoresMapa.set(socioId, {
          socio_id: socioId,
          nombre: liq.nombre || 'Sin nombre',
          telefono_real: liq.telefono_real || '',
          liquidaciones: [],
          total_adeudado: 0
        });
      }

      const deudor = deudoresMapa.get(socioId)!;
      const montoDeuda = Number(liq.deuda) || 0;

      deudor.liquidaciones.push({
        liquidacion_id: liq.liquidacion_id,
        mes: liq.mes,
        perliquidanro: Number(liq.perliquidanro) || 0,
        monto: montoDeuda
      });
      deudor.total_adeudado += montoDeuda;
    }

    // 4. Filtrar por monto mínimo y convertir a array
    let deudoresArray = Array.from(deudoresMapa.values())
      .filter(d => d.total_adeudado >= montoMinimo);

    console.log(`  - Deudores con >= $${montoMinimo}: ${deudoresArray.length}`);

    // 5. Ordenar por total_adeudado DESC (prioridad: los que más deben)
    deudoresArray.sort((a, b) => b.total_adeudado - a.total_adeudado);

    // 6. Limitar resultados
    deudoresArray = deudoresArray.slice(0, limit);

    // 7. Determinar teléfonos finales para cada deudor
    const telefonoFinal = telefonoOverride || (usarTelefonoReal ? null : TELEFONO_PRUEBA);
    const telefonosParaConversacion = deudoresArray.map(d =>
      telefonoFinal || d.telefono_real
    ).filter(Boolean);

    console.log(`  - Teléfonos para consultar conversaciones: ${telefonosParaConversacion.length}`);

    // 8. Consultar conversaciones para los deudores seleccionados
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

    // 9. Formatear respuesta final
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
    console.error('[API n8n/envio-masivo-inicial] Error:', error);
    return Response.json(
      { error: 'Error al obtener deudores para envío masivo inicial', details: String(error) },
      { status: 500 }
    );
  }
}
