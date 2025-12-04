import { executeQuery } from '@/lib/db';

/**
 * API para n8n - Envío Masivo Inicial (anteriormente deudores-pendientes)
 *
 * Lógica ACTUALIZADA:
 * PASO 1: Identificar socios con cupones nuevos sin informar
 *   - Busca liquidaciones del mes actual (Argentina UTC-3)
 *   - ESTLIQUIDA = 'DE' (deuda/cupón nuevo)
 *   - Sin registro en EstadoEnvioLiquidaciones o con resultado_envio = 'ERROR'
 *   - Excluye las que tienen resultado_envio = 'OK'
 *
 * PASO 2: Para esos socios, traer TODAS sus liquidaciones con deuda
 *   - ESTLIQUIDA IN ('AD', 'DE')
 *   - COBLIQUIDA = 30 (transferencias), BAJA = 0
 *   - Deuda > 0 (IMPLIQUIDA - ABOLIQUIDA)
 *
 * PASO 3: Traer historial de conversaciones de esos socios
 *
 * Parámetros opcionales:
 * - ?telefono_override=XXXX (filtrar solo por ese teléfono)
 * - ?limit=N (cantidad de socios a devolver, default 30)
 * - ?monto_minimo=1000 (default 1000)
 * - ?test_phone=false (usar teléfono real de BD)
 * - ?mes_override=202511 (usar mes específico para testing, formato YYYYMM)
 */

const TELEFONO_PRUEBA = '812001079';

// Convertir fecha UTC a zona horaria Argentina (UTC-3)
function formatArgentinaDateTime(date: Date): string {
  const argentinaOffset = -3 * 60; // UTC-3 en minutos
  const argentinaTime = new Date(date.getTime() + (argentinaOffset - date.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 19).replace('T', ' ');
}

// Obtener mes actual en Argentina (YYYYMM)
function getCurrentMonthArgentina(): number {
  const now = new Date();
  const argentinaOffset = -3 * 60; // UTC-3 en minutos
  const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
  const year = argentinaTime.getFullYear();
  const month = argentinaTime.getMonth() + 1; // getMonth() es 0-indexed
  return year * 100 + month;
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
    const mesOverride = searchParams.get('mes_override') ? Number(searchParams.get('mes_override')) : null;

    console.log('[API n8n/envio-masivo-inicial] Iniciando consulta...');
    console.log(`  - Monto mínimo: $${montoMinimo}`);
    console.log(`  - Límite: ${limit}`);
    console.log(`  - Teléfono: ${telefonoOverride ? 'OVERRIDE: ' + telefonoOverride : (usarTelefonoReal ? 'REAL' : 'PRUEBA')}`);

    const mesActual = mesOverride || getCurrentMonthArgentina();
    console.log(`  - Mes a consultar: ${mesActual}${mesOverride ? ' (OVERRIDE para testing)' : ' (mes actual Argentina)'}`);

    // PASO 1: Identificar liquidaciones del mes actual sin informar
    const queryCuponesNuevos = `
      SELECT
        L.id as liquidacion_id,
        L.SOCLIQUIDA as numsocio
      FROM Liquidaciones L
      WHERE L.COBLIQUIDA = 30
        AND L.BAJA = 0
        AND L.ESTLIQUIDA = 'DE'
        AND (YEAR(L.PERLIQUIDANRO) * 100 + MONTH(L.PERLIQUIDANRO)) = ?
        AND (L.IMPLIQUIDA - COALESCE(L.ABOLIQUIDA, 0)) > 0
        ${telefonoOverride ? 'AND L.SOCLIQUIDA IN (SELECT NUMSOCIO FROM Socios WHERE TELSOCIO = ?)' : ''}
    `;

    const paramsCuponesNuevos = telefonoOverride ? [mesActual, telefonoOverride] : [mesActual];
    const cuponesNuevos = (await executeQuery(queryCuponesNuevos, paramsCuponesNuevos)) as any[];
    console.log(`  - Cupones nuevos del mes actual: ${cuponesNuevos.length}`);

    if (cuponesNuevos.length === 0) {
      console.log('  - No hay cupones nuevos para informar');
      return Response.json([]);
    }

    // Filtrar cupones según EstadoEnvioLiquidaciones
    const cuponesIds = cuponesNuevos.map(c => c.liquidacion_id);
    const placeholdersCupones = cuponesIds.map(() => '?').join(',');

    const queryEstadosCupones = `
      SELECT liquidacion_id, resultado_envio
      FROM EstadoEnvioLiquidaciones
      WHERE liquidacion_id IN (${placeholdersCupones})
        AND estado = 'ENVIO_INICIAL'
    `;

    const estadosCupones = (await executeQuery(queryEstadosCupones, cuponesIds)) as any[];
    console.log(`  - Estados de envío encontrados para cupones nuevos: ${estadosCupones.length}`);

    // Crear mapa de estados
    const estadosPorCupon = new Map<number, string>();
    for (const estado of estadosCupones) {
      estadosPorCupon.set(estado.liquidacion_id, estado.resultado_envio);
    }

    // Filtrar cupones sin informar
    const cuponesSinInformar = cuponesNuevos.filter(cupon => {
      const estado = estadosPorCupon.get(cupon.liquidacion_id);
      // Incluir si: no existe registro O tiene ERROR
      // Excluir si: tiene OK
      if (!estado) return true;
      if (estado === 'ERROR') return true;
      if (estado === 'OK') return false;
      return true; // PENDIENTE u otros
    });

    console.log(`  - Cupones sin informar (después de filtro): ${cuponesSinInformar.length}`);

    if (cuponesSinInformar.length === 0) {
      console.log('  - Todos los cupones ya fueron informados exitosamente');
      return Response.json([]);
    }

    // Obtener lista única de socios con cupones sin informar
    const sociosConCuponesNuevos = [...new Set(cuponesSinInformar.map(c => c.numsocio))];
    console.log(`  - Socios con cupones sin informar: ${sociosConCuponesNuevos.length}`);

    // PASO 2: Para esos socios, traer TODAS sus liquidaciones con deuda
    const placeholdersSocios = sociosConCuponesNuevos.map(() => '?').join(',');
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
      WHERE L.SOCLIQUIDA IN (${placeholdersSocios})
        AND L.COBLIQUIDA = 30
        AND L.BAJA = 0
        AND L.ESTLIQUIDA IN ('AD', 'DE')
        AND (L.IMPLIQUIDA - COALESCE(L.ABOLIQUIDA, 0)) > 0
      ORDER BY L.SOCLIQUIDA, L.PERLIQUIDANRO ASC
    `;

    const liquidaciones = (await executeQuery(queryLiquidaciones, sociosConCuponesNuevos)) as any[];
    console.log(`  - Total liquidaciones con deuda de esos socios: ${liquidaciones.length}`);

    // PASO 3: Agrupar liquidaciones por socio
    const deudoresMapa = new Map<string, {
      socio_id: string;
      nombre: string;
      telefono_real: string;
      liquidaciones: LiquidacionPendiente[];
      total_adeudado: number;
    }>();

    for (const liq of liquidaciones) {
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
