import { executeQuery } from '@/lib/db';
import { KPIData } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Use current date to calculate current and previous period
    const now = new Date();
    const currentPeriod = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    const previousPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1); // First day of previous month

    let currentQuery: string;
    let currentParams: any[];

    if (startDate && endDate) {
      currentQuery = `
        SELECT 
          COALESCE(SUM(ABOLIQUIDA), 0) as totalRecaudado,
          COALESCE(SUM(ABOLIQUIDA), 0) as cobrado,
          COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) as deuda
        FROM Liquidaciones
        WHERE PERLIQUIDANRO BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      `;
      currentParams = [startDate, endDate];
    } else {
      currentQuery = `
        SELECT 
          COALESCE(SUM(ABOLIQUIDA), 0) as totalRecaudado,
          COALESCE(SUM(ABOLIQUIDA), 0) as cobrado,
          COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) as deuda
        FROM Liquidaciones
        WHERE YEAR(PERLIQUIDANRO) = ? AND MONTH(PERLIQUIDANRO) = ?
      `;
      currentParams = [currentPeriod.getFullYear(), currentPeriod.getMonth() + 1];
    }

    const [currentResult] = (await executeQuery(currentQuery, currentParams)) as any[];
    const totalCurrentMonth = Number(currentResult?.totalRecaudado) || 0;
    const totalCobrado = Number(currentResult?.cobrado) || 0;
    const totalDeuda = Number(currentResult?.deuda) || 0;

    // Total mes anterior - CONSISTENCIA: usar ABOLIQUIDA (monto cobrado) no IMPLIQUIDA (monto total)
    const previousQuery = `
      SELECT COALESCE(SUM(ABOLIQUIDA), 0) as totalCobrado
      FROM Liquidaciones
      WHERE YEAR(PERLIQUIDANRO) = ? AND MONTH(PERLIQUIDANRO) = ?
    `;
    const [previousResult] = (await executeQuery(previousQuery, [
      previousPeriod.getFullYear(),
      previousPeriod.getMonth() + 1,
    ])) as any[];
    const totalPreviousMonth = Number(previousResult?.totalCobrado) || 0;

    // Total liquidaciones
    let liqQuery: string;
    let liqParams: any[];

    if (startDate && endDate) {
      liqQuery = `
        SELECT COUNT(*) as count
        FROM Liquidaciones
        WHERE PERLIQUIDANRO BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      `;
      liqParams = [startDate, endDate];
    } else {
      liqQuery = `
        SELECT COUNT(*) as count
        FROM Liquidaciones
        WHERE YEAR(PERLIQUIDANRO) = ? AND MONTH(PERLIQUIDANRO) = ?
      `;
      liqParams = [currentPeriod.getFullYear(), currentPeriod.getMonth() + 1];
    }

    const [liqResult] = (await executeQuery(liqQuery, liqParams)) as any[];
    const totalLiquidations = Number(liqResult?.count) || 0;

    // Desglose por estado de liquidación
    let estadoQuery: string;
    let estadoParams: any[];

    if (startDate && endDate) {
      estadoQuery = `
        SELECT 
          ESTLIQUIDA as estado,
          COALESCE(SUM(IMPLIQUIDA), 0) as monto,
          COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) as deuda
        FROM Liquidaciones
        WHERE PERLIQUIDANRO BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY ESTLIQUIDA
      `;
      estadoParams = [startDate, endDate];
    } else {
      estadoQuery = `
        SELECT 
          ESTLIQUIDA as estado,
          COALESCE(SUM(IMPLIQUIDA), 0) as monto,
          COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) as deuda
        FROM Liquidaciones
        WHERE YEAR(PERLIQUIDANRO) = ? AND MONTH(PERLIQUIDANRO) = ?
        GROUP BY ESTLIQUIDA
      `;
      estadoParams = [currentPeriod.getFullYear(), currentPeriod.getMonth() + 1];
    }

    const estadoResults = (await executeQuery(estadoQuery, estadoParams)) as any[];
    
    // CONCEPTO GLOBAL: usar totales globales ya calculados
    // deudaCompleta = Total deuda de cupones AD
    // deudaParcial = Total deuda de cupones DE  
    // pagadoCompleto = totalCobrado (ya calculado globalmente)
    // bonificado = Total de cupones BO
    let deudaCompleta = 0;     // AD - Deuda de cupones AD
    let deudaParcial = 0;      // DE - Deuda de cupones DE
    let bonificado = 0;        // BO - Monto de bonificados

    for (const row of estadoResults) {
      switch (row.estado) {
        case 'AD':
          deudaCompleta = Number(row.deuda) || 0;
          break;
        case 'DE':
          deudaParcial = Number(row.deuda) || 0;
          break;
        case 'BO':
          bonificado = Number(row.monto) || 0;
          break;
        // CA se maneja globalmente con totalCobrado
      }
    }

    // GLOBAL: pagadoCompleto = totalCobrado (suma de ABOLIQUIDA de todas las liquidaciones)
    const pagadoCompleto = totalCobrado;

    const variation =
      totalPreviousMonth > 0
        ? ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100
        : 0;

    const data: KPIData = {
      totalCurrentMonth: Number(totalCurrentMonth) || 0,
      totalPreviousMonth: Number(totalPreviousMonth) || 0,
      variation: Number(variation) || 0,
      totalLiquidations: Number(totalLiquidations) || 0,
      totalCobrado: Number(totalCobrado) || 0,
      totalDeuda: Number(totalDeuda) || 0,
      deudaCompleta: Number(deudaCompleta) || 0,
      deudaParcial: Number(deudaParcial) || 0,
      pagadoCompleto: Number(pagadoCompleto) || 0,
      bonificado: Number(bonificado) || 0,
    };

    return Response.json(data);
  } catch (error) {
    console.error('KPI Error:', error);
    return Response.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}
