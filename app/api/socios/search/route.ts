import { executeQuery } from '@/lib/db';
import { TopSocio } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    if (!query.trim()) {
      return Response.json([]);
    }

    let sql = `
      SELECT 
        s.NUMSOCIO as numsocio,
        s.NOMSOCIO as nomsocio,
        COUNT(l.CUPLIQUIDA) as liquidaciones,
        COALESCE(SUM(l.IMPLIQUIDA), 0) as monto
      FROM Socios s
      LEFT JOIN Liquidaciones l ON s.NUMSOCIO = l.SOCLIQUIDA
      WHERE (s.NUMSOCIO LIKE ? OR s.NOMSOCIO LIKE ?)
    `;

    const params: any[] = [`%${query}%`, `%${query}%`];

    // Add amount filters if provided
    if (minAmount) {
      sql += ` AND COALESCE(SUM(l.IMPLIQUIDA), 0) >= ?`;
      params.push(Number(minAmount));
    }

    if (maxAmount) {
      sql += ` AND COALESCE(SUM(l.IMPLIQUIDA), 0) <= ?`;
      params.push(Number(maxAmount));
    }

    sql += ` GROUP BY s.NUMSOCIO, s.NOMSOCIO ORDER BY monto DESC LIMIT 50`;

    const results = (await executeQuery(sql, params)) as any[];
    const data: TopSocio[] = results.map((row) => ({
      numsocio: row.numsocio || '',
      nomsocio: row.nomsocio || 'N/A',
      liquidaciones: row.liquidaciones || 0,
      monto: row.monto || 0,
    }));

    return Response.json(data);
  } catch (error) {
    console.error('Socio search error:', error);
    return Response.json(
      { error: 'Failed to search socios' },
      { status: 500 }
    );
  }
}
