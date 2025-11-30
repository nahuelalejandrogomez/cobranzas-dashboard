import { executeQuery } from '@/lib/db';

/**
 * API para n8n - Envío de Cupones Pagados sin PDF
 *
 * Lógica:
 * PASO 1: Identificar liquidaciones PAGADAS sin PDF enviado
 *   - ESTLIQUIDA = 'CA' (cancelada/pagada)
 *   - PAGLIQUIDA en los últimos X días (default 30, configurable)
 *   - BAJA <> 1
 *   - COBLIQUIDA = 30 (transferencias)
 *   - Sin registro en EstadoEnvioLiquidaciones con estado='ENVIO_CUPON' + resultado_envio='OK'
 *   - Incluye: sin registro O con resultado_envio='ERROR'
 *
 * PASO 2: Para esos socios, traer TODAS sus liquidaciones pagadas sin PDF
 *
 * PASO 3: Traer historial de conversaciones de esos socios
 *
 * Parámetros opcionales:
 * - ?telefono_override=XXXX (filtrar solo por ese teléfono)
 * - ?limit=N (cantidad de socios a devolver, default 30)
 * - ?dias_atras=N (días hacia atrás para PAGLIQUIDA, default 30)
 * - ?test_phone=false (usar teléfono real de BD)
 */

const TELEFONO_PRUEBA = '812001079';

// Convertir fecha UTC a zona horaria Argentina (UTC-3)
function formatArgentinaDateTime(date: Date): string {
  const argentinaOffset = -3 * 60; // UTC-3 en minutos
  const argentinaTime = new Date(date.getTime() + (argentinaOffset - date.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 19).replace('T', ' ');
}

interface LiquidacionPagada {
  liquidacion_id: number;
  NUMLIQUIDA: string;
  IMPLIQUIDA: number;
  ABOLIQUIDA: number;
  PAGLIQUIDA: string;
  PERLIQUIDA: string;
  PERLIQUIDANRO: string;
}

interface ConversacionMensaje {
  rol: string;
  mensaje: string;
  fecha: string;
}

interface SocioCuponPendiente {
  socio_id: string;
  nombre: string;
  telefono: string;
  liquidaciones_pagadas: LiquidacionPagada[];
  conversacion: ConversacionMensaje[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const diasAtras = Number(searchParams.get('dias_atras')) || 30;
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);
    const usarTelefonoReal = searchParams.get('test_phone') === 'false';
    const telefonoOverride = searchParams.get('telefono_override') || null;

    console.log('[API n8n/pendiente_envio_cupon] Iniciando consulta...');
    console.log(`  - Días atrás: ${diasAtras}`);
    console.log(`  - Límite: ${limit}`);
    console.log(`  - Teléfono: ${telefonoOverride ? 'OVERRIDE: ' + telefonoOverride : (usarTelefonoReal ? 'REAL' : 'PRUEBA')}`);

    // PASO 1: Identificar liquidaciones PAGADAS sin PDF enviado
    const queryLiquidacionesPagadas = `
      SELECT
        L.id as liquidacion_id,
        L.SOCLIQUIDA as numsocio
      FROM Liquidaciones L
      WHERE L.COBLIQUIDA = 30
        AND L.BAJA <> 1
        AND L.ESTLIQUIDA = 'CA'
        AND L.PAGLIQUIDA BETWEEN CURDATE() - INTERVAL ? DAY AND CURDATE()
        ${telefonoOverride ? 'AND L.SOCLIQUIDA IN (SELECT NUMSOCIO FROM Socios WHERE TELSOCIO = ?)' : ''}
    `;

    const paramsLiquidaciones = telefonoOverride ? [diasAtras, telefonoOverride] : [diasAtras];
    const liquidacionesPagadas = (await executeQuery(queryLiquidacionesPagadas, paramsLiquidaciones)) as any[];
    console.log(`  - Liquidaciones pagadas en los últimos ${diasAtras} días: ${liquidacionesPagadas.length}`);

    if (liquidacionesPagadas.length === 0) {
      console.log('  - No hay liquidaciones pagadas sin PDF para enviar');
      return Response.json([]);
    }

    // Filtrar liquidaciones según EstadoEnvioLiquidaciones
    const liquidacionesIds = liquidacionesPagadas.map(c => c.liquidacion_id);
    const placeholders = liquidacionesIds.map(() => '?').join(',');

    const queryEstados = `
      SELECT liquidacion_id, resultado_envio
      FROM EstadoEnvioLiquidaciones
      WHERE liquidacion_id IN (${placeholders})
        AND estado = 'ENVIO_CUPON'
    `;

    const estados = (await executeQuery(queryEstados, liquidacionesIds)) as any[];
    console.log(`  - Estados de envío encontrados: ${estados.length}`);

    // Crear mapa de estados
    const estadosPorLiquidacion = new Map<number, string>();
    for (const estado of estados) {
      estadosPorLiquidacion.set(estado.liquidacion_id, estado.resultado_envio);
    }

    // Filtrar liquidaciones sin PDF enviado
    const liquidacionesSinPDF = liquidacionesPagadas.filter(liq => {
      const estado = estadosPorLiquidacion.get(liq.liquidacion_id);
      // Incluir si: no existe registro O tiene ERROR
      // Excluir si: tiene OK
      if (!estado) return true;
      if (estado === 'ERROR') return true;
      if (estado === 'OK') return false;
      return true; // Otros estados
    });

    console.log(`  - Liquidaciones sin PDF enviado (después de filtro): ${liquidacionesSinPDF.length}`);

    if (liquidacionesSinPDF.length === 0) {
      console.log('  - Todos los cupones ya fueron enviados exitosamente');
      return Response.json([]);
    }

    // Obtener lista única de socios con liquidaciones sin PDF
    const sociosConLiquidacionesPendientes = [...new Set(liquidacionesSinPDF.map(c => c.numsocio))];
    console.log(`  - Socios con cupones pendientes de envío: ${sociosConLiquidacionesPendientes.length}`);

    // PASO 2: Para esos socios, traer TODAS sus liquidaciones pagadas sin PDF
    const placeholdersSocios = sociosConLiquidacionesPendientes.map(() => '?').join(',');
    const queryDetalles = `
      SELECT
        L.id as liquidacion_id,
        L.SOCLIQUIDA as numsocio,
        S.NOMSOCIO as nombre,
        S.TELSOCIO as telefono_real,
        L.NUMLIQUIDA,
        L.IMPLIQUIDA,
        L.ABOLIQUIDA,
        DATE_FORMAT(L.PAGLIQUIDA, '%Y-%m-%d') as PAGLIQUIDA,
        L.PERLIQUIDA,
        DATE_FORMAT(L.PERLIQUIDANRO, '%Y-%m-%d') as PERLIQUIDANRO
      FROM Liquidaciones L
      INNER JOIN Socios S ON L.SOCLIQUIDA = S.NUMSOCIO
      WHERE L.SOCLIQUIDA IN (${placeholdersSocios})
        AND L.COBLIQUIDA = 30
        AND L.BAJA <> 1
        AND L.ESTLIQUIDA = 'CA'
        AND L.PAGLIQUIDA BETWEEN CURDATE() - INTERVAL ? DAY AND CURDATE()
      ORDER BY L.PAGLIQUIDA DESC
    `;

    const paramsDetalles = [...sociosConLiquidacionesPendientes, diasAtras];
    const liquidacionesDetalle = (await executeQuery(queryDetalles, paramsDetalles)) as any[];
    console.log(`  - Total liquidaciones con detalle: ${liquidacionesDetalle.length}`);

    // PASO 3: Agrupar liquidaciones por socio
    const sociosMapa = new Map<string, {
      socio_id: string;
      nombre: string;
      telefono_real: string;
      liquidaciones: LiquidacionPagada[];
    }>();

    for (const liq of liquidacionesDetalle) {
      const socioId = liq.numsocio;

      // Solo incluir liquidaciones que están en la lista de pendientes
      const liquidacionId = liq.liquidacion_id;
      const estado = estadosPorLiquidacion.get(liquidacionId);
      const debeProcesar = !estado || estado === 'ERROR';

      if (!debeProcesar) continue;

      if (!sociosMapa.has(socioId)) {
        sociosMapa.set(socioId, {
          socio_id: socioId,
          nombre: liq.nombre || 'Sin nombre',
          telefono_real: liq.telefono_real || '',
          liquidaciones: []
        });
      }

      const socio = sociosMapa.get(socioId)!;

      socio.liquidaciones.push({
        liquidacion_id: liq.liquidacion_id,
        NUMLIQUIDA: liq.NUMLIQUIDA || '',
        IMPLIQUIDA: Number(liq.IMPLIQUIDA) || 0,
        ABOLIQUIDA: Number(liq.ABOLIQUIDA) || 0,
        PAGLIQUIDA: liq.PAGLIQUIDA || '',
        PERLIQUIDA: liq.PERLIQUIDA || '',
        PERLIQUIDANRO: liq.PERLIQUIDANRO || ''
      });
    }

    // Convertir a array
    let sociosArray = Array.from(sociosMapa.values());

    console.log(`  - Socios con liquidaciones agrupadas: ${sociosArray.length}`);

    // Ordenar por fecha de pago más reciente
    sociosArray.sort((a, b) => {
      const fechaA = a.liquidaciones[0]?.PAGLIQUIDA || '';
      const fechaB = b.liquidaciones[0]?.PAGLIQUIDA || '';
      return fechaB.localeCompare(fechaA);
    });

    // Limitar resultados
    sociosArray = sociosArray.slice(0, limit);

    // Determinar teléfonos finales para cada socio
    const telefonoFinal = telefonoOverride || (usarTelefonoReal ? null : TELEFONO_PRUEBA);
    const telefonosParaConversacion = sociosArray.map(s =>
      telefonoFinal || s.telefono_real
    ).filter(Boolean);

    console.log(`  - Teléfonos para consultar conversaciones: ${telefonosParaConversacion.length}`);

    // Consultar conversaciones para los socios seleccionados
    let conversacionesMapa = new Map<string, ConversacionMensaje[]>();

    if (telefonosParaConversacion.length > 0) {
      const placeholdersConv = telefonosParaConversacion.map(() => '?').join(',');
      const queryConversaciones = `
        SELECT telefono, rol, mensaje, fecha
        FROM Conversaciones
        WHERE telefono IN (${placeholdersConv})
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

    // Formatear respuesta final
    const resultado: SocioCuponPendiente[] = sociosArray.map(s => {
      const telefono = telefonoFinal || s.telefono_real;
      const conversacion = conversacionesMapa.get(telefono) || [];

      return {
        socio_id: s.socio_id,
        nombre: s.nombre,
        telefono: telefono,
        liquidaciones_pagadas: s.liquidaciones,
        conversacion: conversacion
      };
    });

    console.log(`  - Socios retornados: ${resultado.length}`);

    return Response.json(resultado);

  } catch (error) {
    console.error('[API n8n/pendiente_envio_cupon] Error:', error);
    return Response.json(
      { error: 'Error al obtener socios con cupones pendientes de envío', details: String(error) },
      { status: 500 }
    );
  }
}
