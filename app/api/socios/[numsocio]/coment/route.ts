import { executeQuery } from '@/lib/db';
import { Comentario } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ numsocio: string }> }
) {
  try {
    const { numsocio } = await params;
    const query = `
      SELECT 
        IdComment as idcomment,
        NUMSOCIO as numsocio,
        Comment as comment,
        FechaCommet as fecha
      FROM TbComentariosSocios
      WHERE NUMSOCIO = ?
      ORDER BY FechaCommet DESC
    `;

    const results = (await executeQuery(query, [numsocio])) as any[];
    const data: Comentario[] = results.map((row) => ({
      idcomment: row.idcomment || 0,
      numsocio: row.numsocio || '',
      comment: row.comment || '',
      fecha: row.fecha || '',
    }));

    return Response.json(data);
  } catch (error) {
    console.error('Comments error:', error);
    return Response.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
