import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

interface DistribucionMensual {
  mes: string;
  año: number;
  cuponesCobrados: number;
  montoCobrado: number;
  cuponesAdeudados: number;
  montoAdeudado: number;
  cuponesBonificados: number;
  montoBonificado: number;
}

export async function GET() {
  try {
    

    
    // Obtener datos de los últimos 5 períodos (usando PERLIQUIDANRO)
    // CONCEPTO GLOBAL: Total Cobrado = SUM(ABOLIQUIDA) global, Total Deuda = SUM(IMPLIQUIDA - ABOLIQUIDA) global
    const query = `
      SELECT 
        YEAR(L.PERLIQUIDANRO) as año,
        MONTH(L.PERLIQUIDANRO) as mes_numero,
        MONTHNAME(L.PERLIQUIDANRO) as mes,
        
        -- Cupones cobrados completamente (CA - Cobrado)
        COUNT(CASE WHEN L.ESTLIQUIDA = 'CA' THEN 1 END) as cuponesCobrados,
        -- GLOBAL: Total cobrado de TODAS las liquidaciones del período
        COALESCE(SUM(L.ABOLIQUIDA), 0) as montoCobrado,
        
        -- Cupones con deuda (AD - Adeudado + DE - Debe)
        COUNT(CASE WHEN L.ESTLIQUIDA IN ('AD', 'DE') THEN 1 END) as cuponesAdeudados,
        -- GLOBAL: Total deuda de TODAS las liquidaciones del período
        COALESCE(SUM(L.IMPLIQUIDA - L.ABOLIQUIDA), 0) as montoAdeudado,
        
        -- Cupones bonificados (BO - Bonificado)
        COUNT(CASE WHEN L.ESTLIQUIDA = 'BO' THEN 1 END) as cuponesBonificados,
        -- Solo bonificados: monto total de liquidaciones BO
        COALESCE(SUM(CASE WHEN L.ESTLIQUIDA = 'BO' THEN L.IMPLIQUIDA END), 0) as montoBonificado
        
      FROM Liquidaciones L
      WHERE L.PERLIQUIDANRO >= DATE_SUB(CURDATE(), INTERVAL 4 MONTH)
        AND L.PERLIQUIDANRO <= LAST_DAY(CURDATE())
      GROUP BY YEAR(L.PERLIQUIDANRO), MONTH(L.PERLIQUIDANRO)
      ORDER BY año DESC, mes_numero DESC
      LIMIT 5
    `;
    
    const rows = await executeQuery(query) as any[];
    

    
    const distribucion = rows.map(row => ({
      mes: row.mes,
      año: row.año,
      cuponesCobrados: parseInt(row.cuponesCobrados),
      montoCobrado: parseFloat(row.montoCobrado),
      cuponesAdeudados: parseInt(row.cuponesAdeudados),
      montoAdeudado: parseFloat(row.montoAdeudado),
      cuponesBonificados: parseInt(row.cuponesBonificados),
      montoBonificado: parseFloat(row.montoBonificado),
    }));
    
    return NextResponse.json(distribucion);
    
  } catch (error) {
    console.error('Error en distribucion-mensual:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}