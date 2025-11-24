import { executeQuery } from '@/lib/db';

// Obtener fecha/hora en Argentina (UTC-3)
function getArgentinaDateTime(): string {
  const now = new Date();
  const argentinaOffset = -3 * 60;
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

    // Validaciones
    if (!body.telefono || !body.mensaje || !body.rol || !body.canal) {
      return Response.json(
        {
          status: 'error',
          detalle: 'Campos obligatorios: telefono, mensaje, rol, canal'
        },
        { status: 400 }
      );
    }

    // Validar valores de enum
    if (!['usuario', 'bot', 'agente'].includes(body.rol)) {
      return Response.json(
        {
          status: 'error',
          detalle: 'rol debe ser: usuario, bot o agente'
        },
        { status: 400 }
      );
    }

    if (!['whatsapp', 'telegram'].includes(body.canal)) {
      return Response.json(
        {
          status: 'error',
          detalle: 'canal debe ser: whatsapp o telegram'
        },
        { status: 400 }
      );
    }

    const fechaArgentina = getArgentinaDateTime();

    const query = `
      INSERT INTO Conversaciones
        (telefono, socio_id, rol, mensaje, canal, fecha, workflow_id, conversacion_id, raw_json)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      body.telefono,
      body.socio_id || null,
      body.rol,
      body.mensaje,
      body.canal,
      fechaArgentina,
      body.workflow_id || null,
      body.conversacion_id || null,
      body.raw_json || null
    ]);

    return Response.json({ status: 'ok' });

  } catch (error) {
    console.error('[API conversaciones/log] Error:', error);
    return Response.json(
      { status: 'error', detalle: String(error) },
      { status: 500 }
    );
  }
}
