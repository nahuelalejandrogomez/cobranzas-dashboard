import { executeQuery } from '@/lib/db';

// Obtener fecha/hora en Argentina (UTC-3)
function getArgentinaDateTime(): string {
  const now = new Date();
  const argentinaOffset = -3 * 60; // UTC-3 en minutos
  const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * API para n8n - Guardar Mensaje de Conversación
 *
 * POST /api/n8n/conversacion
 *
 * Body:
 * {
 *   "telefono": "5491112345678",
 *   "socio_id": "B2449",                          // Opcional
 *   "rol": "bot" | "usuario" | "agente",
 *   "mensaje": "Texto del mensaje",
 *   "tipo_mensaje": "text" | "image" | "audio" | "video" | "document" | "location" | "sticker" | "reaction",  // Opcional, default: "text"
 *   "canal": "whatsapp" | "telegram",             // Opcional, default: "whatsapp"
 *   "workflow_id": "envio_cupon_nuevo",           // Opcional
 *   "conversacion_id": "conv_12345",              // Opcional - Para agrupar mensajes
 *   "mensaje_id": "wamid.ABC123...",              // Opcional - ID único de WhatsApp
 *   "metadata": { ... },                          // Opcional - Datos adicionales (URLs, coordenadas, etc.)
 *   "raw_json": { ... },                          // Opcional - Payload completo de la API
 *   "leido": true,                                // Opcional, default: false
 *   "entregado": true                             // Opcional, default: false
 * }
 *
 * Response exitoso:
 * {
 *   "success": true,
 *   "id": 123,
 *   "telefono": "5491112345678",
 *   "fecha": "2024-11-30 14:30:00"
 * }
 */

type Rol = 'usuario' | 'bot' | 'agente';
type TipoMensaje = 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'sticker' | 'reaction';
type Canal = 'whatsapp' | 'telegram';

interface RequestBody {
  telefono: string;
  socio_id?: string;
  rol: Rol;
  mensaje: string;
  tipo_mensaje?: TipoMensaje;
  canal?: Canal;
  workflow_id?: string;
  conversacion_id?: string;
  mensaje_id?: string;
  metadata?: Record<string, any>;
  raw_json?: Record<string, any>;
  leido?: boolean;
  entregado?: boolean;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();

    // Validar campos requeridos
    if (!body.telefono) {
      return Response.json(
        { error: 'Campo requerido: telefono' },
        { status: 400 }
      );
    }

    if (!body.rol) {
      return Response.json(
        { error: 'Campo requerido: rol' },
        { status: 400 }
      );
    }

    if (!body.mensaje || body.mensaje.trim() === '') {
      return Response.json(
        { error: 'Campo requerido: mensaje' },
        { status: 400 }
      );
    }

    // Validar valores de enum
    const rolesValidos: Rol[] = ['usuario', 'bot', 'agente'];
    if (!rolesValidos.includes(body.rol)) {
      return Response.json(
        {
          error: 'Valor inválido para rol',
          valores_permitidos: rolesValidos
        },
        { status: 400 }
      );
    }

    const tiposMensajeValidos: TipoMensaje[] = ['text', 'image', 'audio', 'video', 'document', 'location', 'sticker', 'reaction'];
    if (body.tipo_mensaje && !tiposMensajeValidos.includes(body.tipo_mensaje)) {
      return Response.json(
        {
          error: 'Valor inválido para tipo_mensaje',
          valores_permitidos: tiposMensajeValidos
        },
        { status: 400 }
      );
    }

    const canalesValidos: Canal[] = ['whatsapp', 'telegram'];
    if (body.canal && !canalesValidos.includes(body.canal)) {
      return Response.json(
        {
          error: 'Valor inválido para canal',
          valores_permitidos: canalesValidos
        },
        { status: 400 }
      );
    }

    // Insertar el mensaje en Conversaciones
    const fechaArgentina = getArgentinaDateTime();

    const insertQuery = `
      INSERT INTO Conversaciones
      (telefono, socio_id, rol, mensaje, tipo_mensaje, canal, workflow_id, conversacion_id, mensaje_id, raw_json, metadata, leido, entregado, fecha)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const metadataJson = body.metadata ? JSON.stringify(body.metadata) : null;
    const rawJson = body.raw_json ? JSON.stringify(body.raw_json) : null;

    const result = (await executeQuery(insertQuery, [
      body.telefono,
      body.socio_id || null,
      body.rol,
      body.mensaje,
      body.tipo_mensaje || 'text',
      body.canal || 'whatsapp',
      body.workflow_id || null,
      body.conversacion_id || null,
      body.mensaje_id || null,
      rawJson,
      metadataJson,
      body.leido || false,
      body.entregado || false,
      fechaArgentina
    ])) as any;

    console.log(`[API n8n/conversacion] Mensaje guardado:`, {
      id: result.insertId,
      telefono: body.telefono,
      socio_id: body.socio_id,
      rol: body.rol,
      tipo_mensaje: body.tipo_mensaje || 'text',
      canal: body.canal || 'whatsapp'
    });

    return Response.json({
      success: true,
      id: result.insertId,
      telefono: body.telefono,
      fecha: fechaArgentina
    }, { status: 201 });

  } catch (error) {
    console.error('[API n8n/conversacion] Error:', error);

    return Response.json(
      {
        error: 'Error al guardar mensaje de conversación',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
