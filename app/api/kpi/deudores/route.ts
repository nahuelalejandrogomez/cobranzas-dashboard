import { executeQuery } from '@/lib/db';

/**
 * API para obtener detalle de personas con deudas (AD y DE)
 * Ordenadas por importe descendente
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const estado = searchParams.get('estado'); // 'AD', 'DE', o ambos si no se especifica

    // Get the last available period with data
    const [lastDate] = (await executeQuery(`
      SELECT MAX(PERLIQUIDANRO) as lastDate FROM Liquidaciones
    `)) as any[];
    
    const lastAvailablePeriod = lastDate?.lastDate ? new Date(lastDate.lastDate) : new Date();
    const currentPeriod = new Date(lastAvailablePeriod.getFullYear(), lastAvailablePeriod.getMonth(), 1);

    let query: string;
    let params: any[];

    const estadoFilter = estado ? `AND L.ESTLIQUIDA = '${estado}'` : `AND L.ESTLIQUIDA IN ('AD', 'DE')`;

    if (startDate && endDate) {
      query = `
        SELECT 
          S.NUMSOCIO as numsocio,
          S.NOMSOCIO as nomsocio,
          L.ESTLIQUIDA as estado,
          COUNT(CASE WHEN (L.IMPLIQUIDA - L.ABOLIQUIDA) > 0 THEN 1 END) as cuponesVencidosPeriodo,
          COUNT(L.CUPLIQUIDA) as cuponesTotalesPeriodo,
          COALESCE(SUM(L.IMPLIQUIDA), 0) as montoTotalPeriodo,
          COALESCE(SUM(L.ABOLIQUIDA), 0) as montoCobradoPeriodo,
          COALESCE(SUM(L.IMPLIQUIDA - L.ABOLIQUIDA), 0) as deudaPendientePeriodo,
          COALESCE(SUM(CASE WHEN L.ESTLIQUIDA IN ('AD', 'DE') THEN L.IMPLIQUIDA - L.ABOLIQUIDA ELSE 0 END), 0) as deudaTotalHistorica,
          COUNT(CASE WHEN L.ESTLIQUIDA IN ('AD', 'DE') THEN 1 END) as cuponesTotalHistorica,
          (SELECT C.NOMCOB 
           FROM Liquidaciones L4 
           INNER JOIN Cobradores C ON L4.COBLIQUIDA = C.NUMCOB
           WHERE L4.SOCLIQUIDA = S.NUMSOCIO 
           ORDER BY L4.PERLIQUIDANRO DESC 
           LIMIT 1) as nombreCobrador,
          (SELECT L4.COBLIQUIDA 
           FROM Liquidaciones L4 
           WHERE L4.SOCLIQUIDA = S.NUMSOCIO 
           ORDER BY L4.PERLIQUIDANRO DESC 
           LIMIT 1) as numCobrador
        FROM Socios S
        INNER JOIN Liquidaciones L ON S.NUMSOCIO = L.SOCLIQUIDA
        WHERE L.PERLIQUIDANRO BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
        ${estadoFilter}
        GROUP BY S.NUMSOCIO, S.NOMSOCIO, L.ESTLIQUIDA
        ORDER BY deudaTotalHistorica DESC, deudaPendientePeriodo DESC
        LIMIT 100
      `;
      params = [startDate, endDate];
    } else {
      // Query optimizada: usa subqueries para evitar duplicación de filas
      query = `
        SELECT
          S.NUMSOCIO as numsocio,
          S.NOMSOCIO as nomsocio,
          -- Estado predominante del período (tomamos el más reciente)
          (SELECT L.ESTLIQUIDA
           FROM Liquidaciones L
           WHERE L.SOCLIQUIDA = S.NUMSOCIO
             AND YEAR(L.PERLIQUIDANRO) = ?
             AND MONTH(L.PERLIQUIDANRO) = ?
             AND L.ESTLIQUIDA IN ('AD', 'DE')
           ORDER BY L.PERLIQUIDANRO DESC
           LIMIT 1) as estado,
          -- Cupones con deuda del período actual
          (SELECT COUNT(DISTINCT L.CUPLIQUIDA)
           FROM Liquidaciones L
           WHERE L.SOCLIQUIDA = S.NUMSOCIO
             AND YEAR(L.PERLIQUIDANRO) = ?
             AND MONTH(L.PERLIQUIDANRO) = ?
             AND L.ESTLIQUIDA IN ('AD', 'DE')) as cuponesVencidosPeriodo,
          -- Montos del período actual
          (SELECT COALESCE(SUM(L.IMPLIQUIDA), 0)
           FROM Liquidaciones L
           WHERE L.SOCLIQUIDA = S.NUMSOCIO
             AND YEAR(L.PERLIQUIDANRO) = ?
             AND MONTH(L.PERLIQUIDANRO) = ?
             AND L.ESTLIQUIDA IN ('AD', 'DE')) as montoTotalPeriodo,
          (SELECT COALESCE(SUM(L.ABOLIQUIDA), 0)
           FROM Liquidaciones L
           WHERE L.SOCLIQUIDA = S.NUMSOCIO
             AND YEAR(L.PERLIQUIDANRO) = ?
             AND MONTH(L.PERLIQUIDANRO) = ?
             AND L.ESTLIQUIDA IN ('AD', 'DE')) as montoCobradoPeriodo,
          (SELECT COALESCE(SUM(L.IMPLIQUIDA - L.ABOLIQUIDA), 0)
           FROM Liquidaciones L
           WHERE L.SOCLIQUIDA = S.NUMSOCIO
             AND YEAR(L.PERLIQUIDANRO) = ?
             AND MONTH(L.PERLIQUIDANRO) = ?
             AND L.ESTLIQUIDA IN ('AD', 'DE')) as deudaPendientePeriodo,
          -- Deuda total histórica (todos los períodos)
          (SELECT COALESCE(SUM(L.IMPLIQUIDA - L.ABOLIQUIDA), 0)
           FROM Liquidaciones L
           WHERE L.SOCLIQUIDA = S.NUMSOCIO
             AND L.ESTLIQUIDA IN ('AD', 'DE')) as deudaTotalHistorica,
          -- Total cupones con deuda histórica
          (SELECT COUNT(DISTINCT L.CUPLIQUIDA)
           FROM Liquidaciones L
           WHERE L.SOCLIQUIDA = S.NUMSOCIO
             AND L.ESTLIQUIDA IN ('AD', 'DE')) as cuponesTotalHistorica,
          -- Cobrador (del registro más reciente del período)
          (SELECT C.NOMCOB
           FROM Liquidaciones L4
           INNER JOIN Cobradores C ON L4.COBLIQUIDA = C.NUMCOB
           WHERE L4.SOCLIQUIDA = S.NUMSOCIO
           ORDER BY L4.PERLIQUIDANRO DESC
           LIMIT 1) as nombreCobrador,
          (SELECT L4.COBLIQUIDA
           FROM Liquidaciones L4
           WHERE L4.SOCLIQUIDA = S.NUMSOCIO
           ORDER BY L4.PERLIQUIDANRO DESC
           LIMIT 1) as numCobrador
        FROM Socios S
        WHERE EXISTS (
          SELECT 1 FROM Liquidaciones L
          WHERE L.SOCLIQUIDA = S.NUMSOCIO
            AND YEAR(L.PERLIQUIDANRO) = ?
            AND MONTH(L.PERLIQUIDANRO) = ?
            AND L.ESTLIQUIDA IN ('AD', 'DE')
        )
        HAVING deudaTotalHistorica > 0
        ORDER BY deudaTotalHistorica DESC, deudaPendientePeriodo DESC
        LIMIT 100
      `;
      // Parámetros repetidos para cada subquery (año, mes se usan 10 veces en el query)
      const year = currentPeriod.getFullYear();
      const month = currentPeriod.getMonth() + 1;
      params = [
        year, month,  // estado
        year, month,  // cuponesVencidosPeriodo
        year, month,  // montoTotalPeriodo
        year, month,  // montoCobradoPeriodo
        year, month,  // deudaPendientePeriodo
        year, month   // WHERE EXISTS
      ];
    }

    const results = (await executeQuery(query, params)) as any[];
    
    const deudores = results.map(row => ({
      numsocio: row.numsocio || '',
      nomsocio: row.nomsocio || '',
      estado: row.estado as 'AD' | 'DE',
      cantidadCuponesPeriodo: Number(row.cuponesVencidosPeriodo) || 0,
      montoTotalPeriodo: Number(row.montoTotalPeriodo) || 0,
      montoCobradoPeriodo: Number(row.montoCobradoPeriodo) || 0,
      deudaPendientePeriodo: Number(row.deudaPendientePeriodo) || 0,
      deudaTotalHistorica: Number(row.deudaTotalHistorica) || 0,
      cuponesTotalHistorica: Number(row.cuponesTotalHistorica) || 0,
      nombreCobrador: row.nombreCobrador || 'Sin asignar',
      numCobrador: row.numCobrador || null,
      estadoDescripcion: getEstadoDescripcion(row.estado),
    }));

    // Calcular estadísticas agregadas del mes actual y totales históricos
    // Reglas: CA=Cobrado, DE=Deuda, AD=Adeudado parcial, BO=Bonificado (no cuenta)
    const statsQuery = `
      SELECT
        -- MES ACTUAL
        -- Cantidad de cupones con deuda del mes actual (solo AD y DE)
        COUNT(*) as cuponesDeudaMesActual,
        -- $ deuda del mes actual (IMPLIQUIDA - ABOLIQUIDA solo de AD y DE)
        COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) as deudaMesActual,
        -- $ cobrado del mes actual (ABOLIQUIDA solo de CA y AD, NO incluye BO)
        (SELECT COALESCE(SUM(ABOLIQUIDA), 0)
         FROM Liquidaciones
         WHERE YEAR(PERLIQUIDANRO) = ?
           AND MONTH(PERLIQUIDANRO) = ?
           AND ESTLIQUIDA IN ('CA', 'AD')) as cobradoMesActual,
        -- $ bonificado del mes actual (IMPLIQUIDA - ABOLIQUIDA de BO)
        (SELECT COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0)
         FROM Liquidaciones
         WHERE YEAR(PERLIQUIDANRO) = ?
           AND MONTH(PERLIQUIDANRO) = ?
           AND ESTLIQUIDA = 'BO') as bonificadoMesActual,

        -- TOTAL HISTÓRICO
        -- Cantidad de cupones con deuda histórica (solo AD y DE)
        (SELECT COUNT(*)
         FROM Liquidaciones
         WHERE ESTLIQUIDA IN ('AD', 'DE')) as cuponesDeudaTotal,
        -- $ deuda total histórica (IMPLIQUIDA - ABOLIQUIDA solo de AD y DE)
        (SELECT COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0)
         FROM Liquidaciones
         WHERE ESTLIQUIDA IN ('AD', 'DE')) as deudaTotal,
        -- $ cobrado total histórico (ABOLIQUIDA solo de CA y AD)
        (SELECT COALESCE(SUM(ABOLIQUIDA), 0)
         FROM Liquidaciones
         WHERE ESTLIQUIDA IN ('CA', 'AD')) as cobradoTotal,
        -- $ bonificado total histórico (IMPLIQUIDA - ABOLIQUIDA de BO)
        (SELECT COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0)
         FROM Liquidaciones
         WHERE ESTLIQUIDA = 'BO') as bonificadoTotal
      FROM Liquidaciones
      WHERE YEAR(PERLIQUIDANRO) = ?
        AND MONTH(PERLIQUIDANRO) = ?
        AND ESTLIQUIDA IN ('AD', 'DE')
    `;

    const [statsResult] = (await executeQuery(statsQuery, [
      currentPeriod.getFullYear(), currentPeriod.getMonth() + 1,
      currentPeriod.getFullYear(), currentPeriod.getMonth() + 1,
      currentPeriod.getFullYear(), currentPeriod.getMonth() + 1
    ])) as any[];

    return Response.json({
      deudores,
      stats: {
        // Mes Actual
        cuponesDeudaMesActual: Number(statsResult?.cuponesDeudaMesActual) || 0,
        deudaMesActual: Number(statsResult?.deudaMesActual) || 0,
        cobradoMesActual: Number(statsResult?.cobradoMesActual) || 0,
        bonificadoMesActual: Number(statsResult?.bonificadoMesActual) || 0,
        // Total Histórico
        cuponesDeudaTotal: Number(statsResult?.cuponesDeudaTotal) || 0,
        deudaTotal: Number(statsResult?.deudaTotal) || 0,
        cobradoTotal: Number(statsResult?.cobradoTotal) || 0,
        bonificadoTotal: Number(statsResult?.bonificadoTotal) || 0,
      }
    });
  } catch (error) {
    console.error('Deudores detalle error:', error);
    return Response.json({ error: 'Failed to fetch deudores' }, { status: 500 });
  }
}

function getEstadoDescripcion(estado: string): string {
  switch (estado) {
    case 'AD':
      return 'Adeuda Total';
    case 'DE':
      return 'Deuda Parcial';
    default:
      return 'Desconocido';
  }
}