import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT
        NUMSOCIO as socio_id,
        telefono,
        errormessage,
        fecha_envio,
        mensaje
      FROM MensajesEnviados
      WHERE estado_envio = 'error'
      ORDER BY fecha_envio DESC
      LIMIT 20
    `;

    const rows = (await executeQuery(query)) as any[];

    const errores = rows.map(row => ({
      socio_id: row.socio_id,
      telefono: row.telefono || 'N/A',
      errormessage: row.errormessage || 'Sin mensaje de error',
      fecha_envio: row.fecha_envio,
      mensaje: row.mensaje ? (row.mensaje.length > 50 ? row.mensaje.substring(0, 50) + '...' : row.mensaje) : ''
    }));

    return Response.json(errores);
  } catch (error) {
    console.error('[API observabilidad/errores] Error:', error);
    return Response.json(
      { error: 'Error al obtener errores' },
      { status: 500 }
    );
  }
}
