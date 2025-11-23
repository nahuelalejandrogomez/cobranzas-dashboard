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

    // Reglas de negocio:
    // CA = Cobrado completo, AD = Adeudado parcial, DE = Deuda completa, BO = Bonificado
    // cobrado = ABOLIQUIDA solo de CA y AD (NO incluye BO)
    // deuda = (IMPLIQUIDA - ABOLIQUIDA) solo de AD y DE
    if (startDate && endDate) {
      currentQuery = `
        SELECT
          COALESCE(SUM(CASE WHEN ESTLIQUIDA IN ('CA', 'AD') THEN ABOLIQUIDA ELSE 0 END), 0) as totalRecaudado,
          COALESCE(SUM(CASE WHEN ESTLIQUIDA IN ('CA', 'AD') THEN ABOLIQUIDA ELSE 0 END), 0) as cobrado,
          COALESCE(SUM(CASE WHEN ESTLIQUIDA IN ('AD', 'DE') THEN (IMPLIQUIDA - ABOLIQUIDA) ELSE 0 END), 0) as deuda
        FROM Liquidaciones
        WHERE PERLIQUIDANRO BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      `;
      currentParams = [startDate, endDate];
    } else {
      currentQuery = `
        SELECT
          COALESCE(SUM(CASE WHEN ESTLIQUIDA IN ('CA', 'AD') THEN ABOLIQUIDA ELSE 0 END), 0) as totalRecaudado,
          COALESCE(SUM(CASE WHEN ESTLIQUIDA IN ('CA', 'AD') THEN ABOLIQUIDA ELSE 0 END), 0) as cobrado,
          COALESCE(SUM(CASE WHEN ESTLIQUIDA IN ('AD', 'DE') THEN (IMPLIQUIDA - ABOLIQUIDA) ELSE 0 END), 0) as deuda
        FROM Liquidaciones
        WHERE YEAR(PERLIQUIDANRO) = ? AND MONTH(PERLIQUIDANRO) = ?
      `;
      currentParams = [currentPeriod.getFullYear(), currentPeriod.getMonth() + 1];
    }

    const [currentResult] = (await executeQuery(currentQuery, currentParams)) as any[];
    const totalCurrentMonth = Number(currentResult?.totalRecaudado) || 0;
    const totalCobrado = Number(currentResult?.cobrado) || 0;
    const totalDeuda = Number(currentResult?.deuda) || 0;

    // Total mes anterior - Solo CA y AD (NO incluye BO)
    const previousQuery = `
      SELECT COALESCE(SUM(CASE WHEN ESTLIQUIDA IN ('CA', 'AD') THEN ABOLIQUIDA ELSE 0 END), 0) as totalCobrado
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

    // Query de desglose por estado
    // deuda = (IMPLIQUIDA - ABOLIQUIDA) para AD y DE
    // bonificado = (IMPLIQUIDA - ABOLIQUIDA) para BO
    if (startDate && endDate) {
      estadoQuery = `
        SELECT
          ESTLIQUIDA as estado,
          COALESCE(SUM(IMPLIQUIDA), 0) as monto,
          COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) as deuda,
          COALESCE(SUM(ABOLIQUIDA), 0) as cobrado
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
          COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) as deuda,
          COALESCE(SUM(ABOLIQUIDA), 0) as cobrado
        FROM Liquidaciones
        WHERE YEAR(PERLIQUIDANRO) = ? AND MONTH(PERLIQUIDANRO) = ?
        GROUP BY ESTLIQUIDA
      `;
      estadoParams = [currentPeriod.getFullYear(), currentPeriod.getMonth() + 1];
    }

    const estadoResults = (await executeQuery(estadoQuery, estadoParams)) as any[];

    // Desglose por estado:
    // AD = Adeudado parcial: tiene deuda pendiente (IMPLIQUIDA - ABOLIQUIDA)
    // DE = Deuda completa: tiene deuda pendiente (IMPLIQUIDA - ABOLIQUIDA)
    // BO = Bonificado: monto bonificado (IMPLIQUIDA - ABOLIQUIDA), NO cuenta como cobrado ni adeudado
    // CA = Cobrado completo: sin deuda
    let deudaCompleta = 0;     // DE - Deuda de cupones DE (deuda total)
    let deudaParcial = 0;      // AD - Deuda de cupones AD (deuda parcial)
    let bonificado = 0;        // BO - Monto bonificado (IMPLIQUIDA - ABOLIQUIDA)

    for (const row of estadoResults) {
      switch (row.estado) {
        case 'AD':
          deudaParcial = Number(row.deuda) || 0;
          break;
        case 'DE':
          deudaCompleta = Number(row.deuda) || 0;
          break;
        case 'BO':
          // Bonificado = IMPLIQUIDA - ABOLIQUIDA de BO
          bonificado = Number(row.deuda) || 0;
          break;
      }
    }

    // pagadoCompleto = totalCobrado (ya calculado con CA y AD solamente)
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
