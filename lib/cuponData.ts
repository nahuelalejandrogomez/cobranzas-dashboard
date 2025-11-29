import { executeQuery } from './db';

export interface CuponData {
  numeroComprobante: string;
  socioNumero: string;
  apellidoNombre: string;
  direccion: string;
  periodo: string;
  zona: string;
  valorAbono: number;
}

/**
 * Obtiene los datos de una liquidación para generar el cupón de pago
 * @param id - ID de la liquidación
 * @returns Datos del cupón o null si no existe
 */
export async function getLiquidacionById(id: number): Promise<CuponData | null> {
  try {
    const query = `
      SELECT
        L.CUPLIQUIDA as numeroComprobante,
        S.NUMSOCIO as socioNumero,
        S.NOMSOCIO as apellidoNombre,
        S.DOMSOCIO as direccion,
        DATE_FORMAT(L.PERLIQUIDANRO, '%m-%Y') as periodo,
        S.LOCSOCIO as zona,
        L.IMPLIQUIDA as valorAbono
      FROM Liquidaciones L
      INNER JOIN Socios S ON L.SOCLIQUIDA = S.NUMSOCIO
      WHERE L.id = ?
      LIMIT 1
    `;

    const results = (await executeQuery(query, [id])) as any[];

    if (results.length === 0) {
      return null;
    }

    const row = results[0];

    return {
      numeroComprobante: row.numeroComprobante || '',
      socioNumero: row.socioNumero || '',
      apellidoNombre: row.apellidoNombre || '',
      direccion: row.direccion || '',
      periodo: row.periodo || '',
      zona: row.zona || '',
      valorAbono: Number(row.valorAbono) || 0
    };

  } catch (error) {
    console.error('[getLiquidacionById] Error:', error);
    throw error;
  }
}
