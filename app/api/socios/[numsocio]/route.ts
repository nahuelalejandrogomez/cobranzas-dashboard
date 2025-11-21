import { executeQuery } from '@/lib/db';
import { Socio } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numsocio: string }> }
) {
  try {
    const { numsocio } = await params;
    const query = `
      SELECT *
      FROM Socios
      WHERE NUMSOCIO = ?
    `;

    const results = (await executeQuery(query, [numsocio])) as any[];

    if (results.length === 0) {
      return Response.json(
        { error: 'Socio not found' },
        { status: 404 }
      );
    }

    // Calcular deuda total del socio
    const deudaQuery = `
      SELECT COALESCE(SUM(IMPLIQUIDA - ABOLIQUIDA), 0) as deudaTotal
      FROM Liquidaciones
      WHERE SOCLIQUIDA = ?
    `;
    
    const deudaResults = (await executeQuery(deudaQuery, [numsocio])) as any[];
    const deudaTotal = deudaResults[0]?.deudaTotal || 0;

    const data: Socio = {
      numsocio: results[0].NUMSOCIO || '',
      nomsocio: results[0].NOMSOCIO || '',
      subsocio: Number(results[0].SUBSOCIO) || 0,
      impsocio: Number(results[0].IMPSOCIO) || 0,
      baja: Number(results[0].BAJA) || 0,
      comsocio: results[0].COMSOCIO || '',
      deudaTotal: Number(deudaTotal) || 0,
    };

    return Response.json(data);
  } catch (error) {
    console.error('Socio detail error:', error);
    return Response.json(
      { error: 'Failed to fetch socio' },
      { status: 500 }
    );
  }
}
