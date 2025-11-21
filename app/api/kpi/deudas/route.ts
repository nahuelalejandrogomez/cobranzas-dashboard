import { executeQuery } from '@/lib/db';
import { DeudaDetalle } from '@/lib/types';

/**
 * API para análisis detallado de deudas por estado
 * 
 * Estados:
 * - CA: Pagado al 100%
 * - DE: Debe (pago parcial)
 * - AD: Adeuda toda la cuota
 * - BO: Bonificado (no paga, empresa bonifica)
 * 
 * Fórmula deuda: IMPLIQUIDA - ABOLIQUIDA
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get the last available period with data
    const [lastDate] = (await executeQuery(`
      SELECT MAX(PERLIQUIDANRO) as lastDate FROM Liquidaciones
    `)) as any[];
    
    const lastAvailablePeriod = lastDate?.lastDate ? new Date(lastDate.lastDate) : new Date();
    const currentPeriod = new Date(lastAvailablePeriod.getFullYear(), lastAvailablePeriod.getMonth(), 1);

    let query: string;
    let params: any[];

    if (startDate && endDate) {
      query = `
        SELECT 
          ESTLIQUIDA as estado,
          COUNT(*) as cantidad,
          COALESCE(SUM(IMPLIQUIDA), 0) as montoTotal,
          -- GLOBAL: Total cobrado = suma de ABOLIQUIDA de todas las liquidaciones del período
          (SELECT COALESCE(SUM(ABOLIQUIDA), 0) FROM Liquidaciones 
           WHERE PERLIQUIDANRO BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)) as montoCobrado,
          -- GLOBAL: Total deuda = suma de (IMPLIQUIDA - ABOLIQUIDA) de todas las liquidaciones del período  
          (SELECT COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) FROM Liquidaciones 
           WHERE PERLIQUIDANRO BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)) as deuda
        FROM Liquidaciones
        WHERE PERLIQUIDANRO BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY ESTLIQUIDA
        ORDER BY 
          CASE ESTLIQUIDA
            WHEN 'AD' THEN 1
            WHEN 'DE' THEN 2
            WHEN 'CA' THEN 3
            WHEN 'BO' THEN 4
            ELSE 5
          END
      `;
      params = [startDate, endDate, startDate, endDate, startDate, endDate];
    } else {
      query = `
        SELECT 
          ESTLIQUIDA as estado,
          COUNT(*) as cantidad,
          COALESCE(SUM(IMPLIQUIDA), 0) as montoTotal,
          -- GLOBAL: Total cobrado = suma de ABOLIQUIDA de todas las liquidaciones del período actual
          (SELECT COALESCE(SUM(ABOLIQUIDA), 0) FROM Liquidaciones 
           WHERE YEAR(PERLIQUIDANRO) = ? AND MONTH(PERLIQUIDANRO) = ?) as montoCobrado,
          -- GLOBAL: Total deuda = suma de (IMPLIQUIDA - ABOLIQUIDA) de todas las liquidaciones del período actual
          (SELECT COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) FROM Liquidaciones 
           WHERE YEAR(PERLIQUIDANRO) = ? AND MONTH(PERLIQUIDANRO) = ?) as deuda
        FROM Liquidaciones
        WHERE YEAR(PERLIQUIDANRO) = ? AND MONTH(PERLIQUIDANRO) = ?
        GROUP BY ESTLIQUIDA
        ORDER BY 
          CASE ESTLIQUIDA
            WHEN 'AD' THEN 1
            WHEN 'DE' THEN 2
            WHEN 'CA' THEN 3
            WHEN 'BO' THEN 4
            ELSE 5
          END
      `;
      params = [currentPeriod.getFullYear(), currentPeriod.getMonth() + 1, currentPeriod.getFullYear(), currentPeriod.getMonth() + 1, currentPeriod.getFullYear(), currentPeriod.getMonth() + 1];
    }

    const results = (await executeQuery(query, params)) as any[];
    
    const deudas: DeudaDetalle[] = results.map(row => ({
      estado: row.estado as 'CA' | 'DE' | 'AD' | 'BO',
      cantidad: Number(row.cantidad) || 0,
      montoTotal: Number(row.montoTotal) || 0,
      deuda: Number(row.deuda) || 0,
    }));

    // Agregar descripción de cada estado
    const deudasConDescripcion = deudas.map(d => ({
      ...d,
      descripcion: getEstadoDescripcion(d.estado),
      color: getEstadoColor(d.estado),
    }));

    return Response.json(deudasConDescripcion);
  } catch (error) {
    console.error('Deudas Error:', error);
    return Response.json({ error: 'Failed to fetch deudas' }, { status: 500 });
  }
}

function getEstadoDescripcion(estado: string): string {
  switch (estado) {
    case 'AD':
      return 'Adeuda toda la cuota';
    case 'DE':
      return 'Debe (pago parcial)';
    case 'CA':
      return 'Pagado al 100%';
    case 'BO':
      return 'Bonificado';
    default:
      return 'Desconocido';
  }
}

function getEstadoColor(estado: string): string {
  switch (estado) {
    case 'AD':
      return 'red';      // Crítico
    case 'DE':
      return 'yellow';   // Advertencia
    case 'CA':
      return 'green';    // Exitoso
    case 'BO':
      return 'blue';     // Informativo
    default:
      return 'gray';
  }
}
