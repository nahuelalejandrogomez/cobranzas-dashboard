import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    // 1. Ver valores de PERLIQUIDANRO
    const query1 = `
      SELECT
        PERLIQUIDANRO,
        PERLIQUIDA,
        COUNT(*) as cnt
      FROM Liquidaciones
      GROUP BY PERLIQUIDANRO, PERLIQUIDA
      ORDER BY PERLIQUIDANRO DESC
      LIMIT 15
    `;
    const result1 = await executeQuery(query1);

    // 2. Verificar si PERLIQUIDANRO tiene valores NULL
    const query2 = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN PERLIQUIDANRO IS NULL THEN 1 ELSE 0 END) as nulls,
        SUM(CASE WHEN PERLIQUIDANRO IS NOT NULL THEN 1 ELSE 0 END) as not_nulls,
        MIN(PERLIQUIDANRO) as min_date,
        MAX(PERLIQUIDANRO) as max_date
      FROM Liquidaciones
    `;
    const [result2] = await executeQuery(query2) as any[];

    // 3. Probar la consulta de distribucion-mensual
    const query3 = `
      SELECT
        YEAR(PERLIQUIDANRO) as año,
        MONTH(PERLIQUIDANRO) as mes_numero,
        COUNT(*) as total
      FROM Liquidaciones
      WHERE PERLIQUIDANRO IS NOT NULL
      GROUP BY YEAR(PERLIQUIDANRO), MONTH(PERLIQUIDANRO)
      ORDER BY año DESC, mes_numero DESC
      LIMIT 10
    `;
    const result3 = await executeQuery(query3);

    return NextResponse.json({
      valores_perliquidanro: result1,
      estadisticas: result2,
      agrupacion_mensual: result3
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
