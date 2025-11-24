import { executeQuery } from '@/lib/db';

// Obtener fecha/hora en Argentina (UTC-3)
function getArgentinaDateTime(): string {
  const now = new Date();
  const argentinaOffset = -3 * 60; // UTC-3 en minutos
  const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 19).replace('T', ' ');
}

interface ConversacionLogRequest {
  telefono: string;
  socio_id?: string;
  rol: 'usuario' | 'bot' | 'agente';
  mensaje: string;
  canal: 'whatsapp' | 'telegram';
  workflow_id?: string;
  conversacion_id?: string;
  raw_json?: string;
}

export async function POST(request: Request) {
  try {
    const body: ConversacionLogRequest = await request.json();

    console.log('[API conversaciones/log] Recibido:', {
      telefono: body.telefono,
      socio_id: body.socio_id,
      rol: body.rol,
      canal: body.canal,
      mensaje_length: body.mensaje?.length
    });

    if (!body.telefono) {
      return Response.json(
        { status: 'error', detalle: 'campo faltante: telefono' },
        { status: 400 }
      );
    }

    if (!body.mensaje || body.mensaje.trim() === '') {
      return Response.json(
        { status: 'error', detalle: 'campo faltante: mensaje' },
        { status: 400 }
      );
    }

    if (!body.rol) {
      return Response.json(
        { status: 'error', detalle: 'campo faltante: rol' },
        { status: 400 }
      );
    }

    if (!['usuario', 'bot', 'agente'].includes(body.rol)) {
      return Response.json(
        { status: 'error', detalle: 'rol debe ser: usuario, bot o agente' },
        { status: 400 }
      );
    }

    if (!body.canal) {
      return Response.json(
        { status: 'error', detalle: 'campo faltante: canal' },
        { status: 400 }
      );
    }

    if (!['whatsapp', 'telegram'].includes(body.canal)) {
      return Response.json(
        { status: 'error', detalle: 'canal debe ser: whatsapp o telegram' },
        { status: 400 }
      );
    }

    const datos = {
      telefono: body.telefono,
      socio_id: body.socio_id || null,
      rol: body.rol,
      mensaje: body.mensaje,
      canal: body.canal,
      workflow_id: body.workflow_id || null,
      conversacion_id: body.conversacion_id || null,
      raw_json: body.raw_json || null
    };

    const fechaArgentina = getArgentinaDateTime();

    const query = `
      INSERT INTO Conversaciones
        (telefono, socio_id, rol, mensaje, canal, fecha, workflow_id, conversacion_id, raw_json)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      datos.telefono,
      datos.socio_id,
      datos.rol,
      datos.mensaje,
      datos.canal,
      fechaArgentina,
      datos.workflow_id,
      datos.conversacion_id,
      datos.raw_json
    ]);

    console.log('[API conversaciones/log] Registro guardado para telefono:', datos.telefono);

    return Response.json({ status: 'ok' });

  } catch (error) {
    console.error('[API conversaciones/log] Error:', error);
    return Response.json(
      { status: 'error', detalle: String(error) },
      { status: 500 }
    );
  }
}
