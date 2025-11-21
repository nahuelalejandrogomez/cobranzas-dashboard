import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Iniciando diagnóstico para noviembre 2025...');
    
    // 1. Contar TODAS las liquidaciones de noviembre 2025
    const totalQuery = `
      SELECT 
        COUNT(*) as totalLiquidaciones,
        MIN(FECLIQUIDA) as fechaMinima,
        MAX(FECLIQUIDA) as fechaMaxima
      FROM Liquidaciones 
      WHERE MONTH(FECLIQUIDA) = 11 AND YEAR(FECLIQUIDA) = 2025
    `;
    
    const [totalResult] = (await executeQuery(totalQuery)) as any[];
    console.log('📊 Total liquidaciones nov-2025:', totalResult);
    
    // 2. Desglose por estado de liquidación
    const estadosQuery = `
      SELECT 
        ESTLIQUIDA as estado,
        COUNT(*) as cantidad,
        COALESCE(SUM(IMPLIQUIDA), 0) as montoTotal,
        COALESCE(SUM(ABOLIQUIDA), 0) as montoCobrado,
        COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) as montoDeuda
      FROM Liquidaciones 
      WHERE MONTH(FECLIQUIDA) = 11 AND YEAR(FECLIQUIDA) = 2025
      GROUP BY ESTLIQUIDA
      ORDER BY cantidad DESC
    `;
    
    const estadosResult = (await executeQuery(estadosQuery)) as any[];
    console.log('📈 Desglose por estados:', estadosResult);
    
    // 3. Verificar fechas más recientes
    const fechasQuery = `
      SELECT 
        FECLIQUIDA as fecha,
        ESTLIQUIDA as estado,
        COUNT(*) as cantidad
      FROM Liquidaciones 
      WHERE MONTH(FECLIQUIDA) = 11 AND YEAR(FECLIQUIDA) = 2025
      GROUP BY FECLIQUIDA, ESTLIQUIDA
      ORDER BY FECLIQUIDA DESC
      LIMIT 10
    `;
    
    const fechasResult = (await executeQuery(fechasQuery)) as any[];
    console.log('📅 Fechas más recientes:', fechasResult);
    
    // 4. Comparar con octubre 2025 para verificar diferencias
    const octubreQuery = `
      SELECT 
        COUNT(*) as totalLiquidaciones,
        COALESCE(SUM(ABOLIQUIDA), 0) as montoCobrado
      FROM Liquidaciones 
      WHERE MONTH(FECLIQUIDA) = 10 AND YEAR(FECLIQUIDA) = 2025
    `;
    
    const [octubreResult] = (await executeQuery(octubreQuery)) as any[];
    console.log('🍂 Octubre 2025 comparación:', octubreResult);
    
    return NextResponse.json({
      diagnostico: 'Noviembre 2025',
      fecha_consulta: new Date().toISOString(),
      noviembre_2025: {
        total_liquidaciones: totalResult?.totalLiquidaciones || 0,
        fecha_minima: totalResult?.fechaMinima,
        fecha_maxima: totalResult?.fechaMaxima,
        desglose_estados: estadosResult,
        fechas_recientes: fechasResult
      },
      octubre_2025_comparacion: {
        total_liquidaciones: octubreResult?.totalLiquidaciones || 0,
        monto_cobrado: octubreResult?.montoCobrado || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({ 
      error: 'Error en diagnóstico',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}