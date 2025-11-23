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
 * - ?test_phone=541134722453 (si se omite, usa el real de la BD)
 */

const TELEFONO_PRUEBA = '812001079';

interface LiquidacionPendiente {
  mes: string;
  monto: number;
}

interface DeudorPendiente {
  socio_id: string;
  nombre: string;
  telefono: string;
  liquidaciones_pendientes: LiquidacionPendiente[];
  total_adeudado: number;
  cantidad_cuotas: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const montoMinimo = Number(searchParams.get('monto_minimo')) || 1000;
    const limit = Math.min(Number(searchParams.get('limit')) || 2, 100); // Default 2 para pruebas
    const usarTelefonoReal = searchParams.get('test_phone') === 'false';

    console.log('[API n8n/deudores-pendientes] Iniciando consulta...');
    console.log(`  - Monto mínimo: $${montoMinimo}`);
    console.log(`  - Límite: ${limit}`);
    console.log(`  - Teléfono: ${usarTelefonoReal ? 'REAL' : 'PRUEBA'}`);

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

    // 6. Formatear respuesta final
    const resultado: DeudorPendiente[] = deudoresArray.map(d => ({
      socio_id: d.socio_id,
      nombre: d.nombre,
      telefono: usarTelefonoReal ? d.telefono_real : TELEFONO_PRUEBA,
      liquidaciones_pendientes: d.liquidaciones,
      total_adeudado: Math.round(d.total_adeudado * 100) / 100,
      cantidad_cuotas: d.liquidaciones.length
    }));

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
