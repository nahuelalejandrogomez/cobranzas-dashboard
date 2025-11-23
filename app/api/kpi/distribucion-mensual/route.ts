import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    console.log('[API distribucion-mensual] Starting query...');

    // Query corregida con reglas de negocio:
    // CA = Cobrado completo, AD = Adeudado parcial, DE = Deuda completa, BO = Bonificado
    // cuponesCobrados = CA + AD (cupones donde se cobró algo)
    // montoCobrado = ABOLIQUIDA solo de CA y AD (NO incluye BO)
    // cuponesAdeudados = AD + DE (cupones con deuda pendiente)
    // montoAdeudado = (IMPLIQUIDA - ABOLIQUIDA) solo de AD y DE
    // montoBonificado = (IMPLIQUIDA - ABOLIQUIDA) de BO
    const query = `
      SELECT
        YEAR(PERLIQUIDANRO) as año,
        MONTH(PERLIQUIDANRO) as mes_numero,
        MONTHNAME(PERLIQUIDANRO) as mes,
        COUNT(CASE WHEN ESTLIQUIDA IN ('CA', 'AD') THEN 1 END) as cuponesCobrados,
        COALESCE(SUM(CASE WHEN ESTLIQUIDA IN ('CA', 'AD') THEN ABOLIQUIDA ELSE 0 END), 0) as montoCobrado,
        COUNT(CASE WHEN ESTLIQUIDA IN ('AD', 'DE') THEN 1 END) as cuponesAdeudados,
        COALESCE(SUM(CASE WHEN ESTLIQUIDA IN ('AD', 'DE') THEN (IMPLIQUIDA - ABOLIQUIDA) ELSE 0 END), 0) as montoAdeudado,
        COUNT(CASE WHEN ESTLIQUIDA = 'BO' THEN 1 END) as cuponesBonificados,
        COALESCE(SUM(CASE WHEN ESTLIQUIDA = 'BO' THEN (IMPLIQUIDA - ABOLIQUIDA) ELSE 0 END), 0) as montoBonificado
      FROM Liquidaciones
      WHERE PERLIQUIDANRO IS NOT NULL
        AND PERLIQUIDANRO >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY YEAR(PERLIQUIDANRO), MONTH(PERLIQUIDANRO), MONTHNAME(PERLIQUIDANRO)
      ORDER BY año DESC, mes_numero DESC
      LIMIT 5
    `;

    console.log('[API distribucion-mensual] Executing query...');
    const rows = await executeQuery(query) as any[];
    console.log('[API distribucion-mensual] Query returned', rows?.length || 0, 'rows');

    if (!rows || rows.length === 0) {
      console.log('[API distribucion-mensual] No data found');
      return NextResponse.json([]);
    }

    const distribucion = rows.map(row => ({
      mes: row.mes || 'Unknown',
      año: Number(row.año) || 0,
      cuponesCobrados: Number(row.cuponesCobrados) || 0,
      montoCobrado: Number(row.montoCobrado) || 0,
      cuponesAdeudados: Number(row.cuponesAdeudados) || 0,
      montoAdeudado: Number(row.montoAdeudado) || 0,
      cuponesBonificados: Number(row.cuponesBonificados) || 0,
      montoBonificado: Number(row.montoBonificado) || 0,
    }));

    console.log('[API distribucion-mensual] Returning', distribucion.length, 'records');
    return NextResponse.json(distribucion);

  } catch (error) {
    console.error('[API distribucion-mensual] ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
