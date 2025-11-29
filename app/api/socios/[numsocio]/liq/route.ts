import { executeQuery } from '@/lib/db';
import { Liquidacion } from '@/lib/types';

// Fixed: Case sensitivity issue resolved
export async function GET(
  request: Request,
  { params }: { params: Promise<{ numsocio: string }> }
) {
  try {
    const { numsocio } = await params;
    const { searchParams } = new URL(request.url);
    const soloDeuda = searchParams.get('soloDeuda') === 'true';

    // Query principal: obtener liquidaciones
    const query = `
      SELECT
        l.id as id,
        l.CUPLIQUIDA as cupliquida,
        l.FECLIQUIDA as fecliquida,
        l.IMPLIQUIDA as impliquida,
        l.ABOLIQUIDA as aboliquida,
        l.ESTLIQUIDA as estliquida,
        c.NOMCOB as nomcob,
        l.PERLIQUIDANRO as perliquidanro
      FROM Liquidaciones l
      LEFT JOIN Cobradores c ON l.COBLIQUIDA = c.NUMCOB
      WHERE l.SOCLIQUIDA = ?
      ${soloDeuda ? "AND l.ESTLIQUIDA IN ('AD', 'DE')" : ''}
      ORDER BY l.FECLIQUIDA DESC
      ${soloDeuda ? '' : 'LIMIT 50'}
    `;

    const results = (await executeQuery(query, [numsocio])) as any[];
    const data: Liquidacion[] = results.map((row) => ({
      id: Number(row.id) || undefined,
      cupliquida: row.cupliquida || '',
      fecliquida: row.fecliquida || '',
      impliquida: Number(row.impliquida) || 0,
      aboliquida: Number(row.aboliquida) || 0,
      estliquida: row.estliquida as 'CA' | 'DE' | 'AD' | 'BO' | undefined,
      deuda: Number(row.impliquida || 0) - Number(row.aboliquida || 0),
      nomcob: row.nomcob || 'N/A',
    }));

    return Response.json(data);
  } catch (error) {
    console.error('Liquidaciones error:', error);
    return Response.json(
      { error: 'Failed to fetch liquidaciones' },
      { status: 500 }
    );
  }
}
