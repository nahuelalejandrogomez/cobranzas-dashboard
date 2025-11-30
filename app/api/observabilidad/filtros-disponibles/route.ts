import { executeQuery } from '@/lib/db';

/**
 * Obtiene los valores únicos de estado y resultado_envio
 * para poblar los filtros dinámicamente
 */
export async function GET() {
  try {
    const queryEstados = `
      SELECT DISTINCT estado
      FROM EstadoEnvioLiquidaciones
      WHERE estado IS NOT NULL
      ORDER BY estado ASC
    `;

    const queryResultados = `
      SELECT DISTINCT resultado_envio
      FROM EstadoEnvioLiquidaciones
      WHERE resultado_envio IS NOT NULL
      ORDER BY resultado_envio ASC
    `;

    const [estados, resultados] = await Promise.all([
      executeQuery(queryEstados) as Promise<any[]>,
      executeQuery(queryResultados) as Promise<any[]>
    ]);

    return Response.json({
      estados: estados.map(row => row.estado),
      resultados: resultados.map(row => row.resultado_envio)
    });
  } catch (error) {
    console.error('[API observabilidad/filtros-disponibles] Error:', error);
    return Response.json(
      { error: 'Error al obtener filtros disponibles' },
      { status: 500 }
    );
  }
}
