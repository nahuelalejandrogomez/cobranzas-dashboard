import { executeQuery } from '@/lib/db';

/**
 * API para n8n - Consulta de Socio por Teléfono
 *
 * Endpoint: GET /api/n8n/socio/[telefono]
 *
 * Retorna información completa del socio incluyendo:
 * - Datos básicos del socio
 * - Todas las liquidaciones con deuda (ESTLIQUIDA IN ('AD', 'DE'))
 * - Total adeudado
 * - Historial de conversaciones (últimos 25 mensajes)
 *
 * Parámetros:
 * - telefono (path): número de teléfono del socio
 * - ?test_phone=true (query): usa teléfono de prueba 541134722453
 */

const TELEFONO_PRUEBA = '541134722453';

// Convertir fecha UTC a zona horaria Argentina (UTC-3)
function formatArgentinaDateTime(date: Date): string {
  const argentinaOffset = -3 * 60; // UTC-3 en minutos
  const argentinaTime = new Date(date.getTime() + (argentinaOffset - date.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 19).replace('T', ' ');
}

// Formatear periodo como "mes YYYY"
function formatPeriodo(perliquidanro: Date | string): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const fecha = typeof perliquidanro === 'string' ? new Date(perliquidanro) : perliquidanro;
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();

  return `${mes} ${anio}`;
}

// Mapear estado de liquidación a texto legible
function mapearEstado(estliquida: string): string {
  const estados: { [key: string]: string } = {
    'DE': 'pendiente',
    'AD': 'adelantada',
    'CA': 'cancelada',
    'PE': 'pendiente'
  };
  return estados[estliquida] || estliquida.toLowerCase();
}

// Normalizar teléfono (quitar +, espacios, guiones)
function normalizarTelefono(telefono: string): string {
  return telefono.replace(/[\s\-\+]/g, '');
}

interface DeudaDetalle {
  liquidacion_id: number;
  periodo: string;
  monto: number;
  estado: string;
}

interface ConversacionMensaje {
  rol: string;
  mensaje: string;
  fecha: string;
}

interface SocioInfo {
  socio_id: string;
  nombre: string;
  telefono: string;
  estado_socio: string;
  deuda_total: number;
  cantidad_cuotas_adeudadas: number;
  deuda_detalle: DeudaDetalle[];
  conversacion: ConversacionMensaje[];
}

export async function GET(
  request: Request,
  { params }: { params: { telefono: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const usarTelefonoPrueba = searchParams.get('test_phone') === 'true';

    const telefonoParam = params.telefono;
    const telefonoNormalizado = normalizarTelefono(telefonoParam);

    console.log('[API n8n/socio] Iniciando consulta...');
    console.log(`  - Teléfono recibido: ${telefonoParam}`);
    console.log(`  - Teléfono normalizado: ${telefonoNormalizado}`);
    console.log(`  - Modo prueba: ${usarTelefonoPrueba}`);

    let querySocio: string;
    let paramsSocio: any[];

    if (usarTelefonoPrueba) {
      // Modo prueba: buscar cualquier socio con deuda y asignarle el teléfono de prueba
      console.log(`  - Buscando socio con deuda para asignar teléfono de prueba: ${TELEFONO_PRUEBA}`);

      querySocio = `
        SELECT DISTINCT
          S.NUMSOCIO as socio_id,
          S.NOMSOCIO as nombre,
          S.BAJA as baja
        FROM Socios S
        INNER JOIN Liquidaciones L ON S.NUMSOCIO = L.SOCLIQUIDA
        WHERE L.COBLIQUIDA = 30
          AND L.BAJA = 0
          AND L.ESTLIQUIDA IN ('AD', 'DE')
          AND (L.IMPLIQUIDA - COALESCE(L.ABOLIQUIDA, 0)) > 0
        LIMIT 1
      `;
      paramsSocio = [];
    } else {
      // Modo normal: buscar por teléfono
      querySocio = `
        SELECT
          NUMSOCIO as socio_id,
          NOMSOCIO as nombre,
          TELSOCIO as telefono,
          BAJA as baja
        FROM Socios
        WHERE REPLACE(REPLACE(REPLACE(TELSOCIO, ' ', ''), '-', ''), '+', '') LIKE ?
        LIMIT 1
      `;
      paramsSocio = [`%${telefonoNormalizado}%`];
    }

    const socioResult = (await executeQuery(querySocio, paramsSocio)) as any[];

    if (socioResult.length === 0) {
      console.log('  - Socio no encontrado');
      return Response.json(
        { error: 'Socio no encontrado' },
        { status: 404 }
      );
    }

    const socio = socioResult[0];
    const socioId = socio.socio_id;
    const telefonoFinal = usarTelefonoPrueba ? TELEFONO_PRUEBA : socio.telefono;

    console.log(`  - Socio encontrado: ${socio.nombre} (ID: ${socioId})`);
    console.log(`  - Teléfono asignado: ${telefonoFinal}`);

    // Consultar liquidaciones con deuda
    const queryLiquidaciones = `
      SELECT
        L.id as liquidacion_id,
        L.PERLIQUIDANRO as perliquidanro,
        L.ESTLIQUIDA as estado,
        (L.IMPLIQUIDA - COALESCE(L.ABOLIQUIDA, 0)) as deuda
      FROM Liquidaciones L
      WHERE L.SOCLIQUIDA = ?
        AND L.COBLIQUIDA = 30
        AND L.BAJA = 0
        AND L.ESTLIQUIDA IN ('AD', 'DE')
        AND (L.IMPLIQUIDA - COALESCE(L.ABOLIQUIDA, 0)) > 0
      ORDER BY L.PERLIQUIDANRO ASC
    `;

    const liquidaciones = (await executeQuery(queryLiquidaciones, [socioId])) as any[];
    console.log(`  - Liquidaciones con deuda: ${liquidaciones.length}`);

    // Calcular deuda total y formatear detalle
    let deudaTotal = 0;
    const deudaDetalle: DeudaDetalle[] = liquidaciones.map(liq => {
      const monto = Number(liq.deuda) || 0;
      deudaTotal += monto;

      return {
        liquidacion_id: liq.liquidacion_id,
        periodo: formatPeriodo(liq.perliquidanro),
        monto: Math.round(monto * 100) / 100,
        estado: mapearEstado(liq.estado)
      };
    });

    // Consultar conversaciones
    const queryConversaciones = `
      SELECT rol, mensaje, fecha
      FROM Conversaciones
      WHERE telefono = ?
      ORDER BY fecha DESC
      LIMIT 25
    `;

    const conversaciones = (await executeQuery(queryConversaciones, [telefonoFinal])) as any[];
    console.log(`  - Conversaciones encontradas: ${conversaciones.length}`);

    const conversacion: ConversacionMensaje[] = conversaciones.map(conv => ({
      rol: conv.rol,
      mensaje: conv.mensaje,
      fecha: formatArgentinaDateTime(new Date(conv.fecha))
    }));

    // Formatear respuesta
    const resultado: SocioInfo = {
      socio_id: socioId,
      nombre: socio.nombre || 'Sin nombre',
      telefono: telefonoFinal,
      estado_socio: socio.baja === 0 ? 'activo' : 'inactivo',
      deuda_total: Math.round(deudaTotal * 100) / 100,
      cantidad_cuotas_adeudadas: liquidaciones.length,
      deuda_detalle: deudaDetalle,
      conversacion: conversacion
    };

    console.log(`  - Deuda total: $${resultado.deuda_total}`);
    console.log(`  - Cuotas adeudadas: ${resultado.cantidad_cuotas_adeudadas}`);

    return Response.json(resultado);

  } catch (error) {
    console.error('[API n8n/socio] Error:', error);
    return Response.json(
      { error: 'Error al consultar información del socio', details: String(error) },
      { status: 500 }
    );
  }
}
