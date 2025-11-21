import { executeQuery } from '@/lib/db';
import { createHash } from 'crypto';

interface LogEnvioRequest {
  socio_id: string | number;
  telefono?: string;
  mensaje: string;
  estado_envio?: string;
  canal?: string;
  workflow_id?: string;
  respuesta_api?: string;
}

export async function POST(request: Request) {
  try {
    const body: LogEnvioRequest = await request.json();

    console.log('[API n8n/log-envio] Recibido:', {
      socio_id: body.socio_id,
      telefono: body.telefono,
      mensaje_length: body.mensaje?.length,
      estado_envio: body.estado_envio
    });

    if (!body.socio_id) {
      return Response.json(
        { status: 'error', detalle: 'campo faltante: socio_id' },
        { status: 400 }
      );
    }

    if (!body.mensaje || body.mensaje.trim() === '') {
      return Response.json(
        { status: 'error', detalle: 'campo faltante: mensaje' },
        { status: 400 }
      );
    }

    const hashMensaje = createHash('md5').update(body.mensaje).digest('hex');

    const datos = {
      NUMSOCIO: String(body.socio_id),
      telefono: body.telefono || null,
      mensaje: body.mensaje,
      estado_envio: body.estado_envio || 'enviado',
      canal: body.canal || 'whatsapp',
      workflow_id: body.workflow_id || 'cobranzas_n8n',
      hash_mensaje: hashMensaje,
      respuesta_api: body.respuesta_api || null
    };

    const query = `
      INSERT INTO MensajesEnviados
        (NUMSOCIO, telefono, mensaje, estado_envio, canal, workflow_id, hash_mensaje, respuesta_api)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      datos.NUMSOCIO,
      datos.telefono,
      datos.mensaje,
      datos.estado_envio,
      datos.canal,
      datos.workflow_id,
      datos.hash_mensaje,
      datos.respuesta_api
    ]);

    console.log('[API n8n/log-envio] Registro guardado para socio:', datos.NUMSOCIO);

    return Response.json({ status: 'ok' });

  } catch (error) {
    console.error('[API n8n/log-envio] Error:', error);
    return Response.json(
      { status: 'error', detalle: String(error) },
      { status: 500 }
    );
  }
}
