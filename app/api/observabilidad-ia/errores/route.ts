import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT
        workflow_id,
        socio_id,
        telefono,
        errormessage,
        model_used,
        created_at
      FROM IAUsageLogs
      WHERE status = 'error'
      ORDER BY created_at DESC
      LIMIT 30
    `;

    const rows = (await executeQuery(query)) as any[];

    const errores = rows.map(row => ({
      workflow_id: row.workflow_id,
      socio_id: row.socio_id || 'N/A',
      telefono: row.telefono || 'N/A',
      errormessage: row.errormessage || 'Sin mensaje de error',
      model_used: row.model_used,
      created_at: row.created_at
    }));

    return Response.json(errores);
  } catch (error) {
    console.error('[API observabilidad-ia/errores] Error:', error);
    return Response.json(
      { error: 'Error al obtener errores de IA' },
      { status: 500 }
    );
  }
}
