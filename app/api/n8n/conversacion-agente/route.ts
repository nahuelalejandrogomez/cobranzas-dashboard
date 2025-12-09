import { executeQuery } from '@/lib/db';

/**
 * API para n8n - Guardar conversaciones del agente de cobranza
 *
 * Endpoint: POST /api/n8n/conversacion-agente
 *
 * Guarda mensajes en la tabla conversaciones_agente para tracking de
 * conversaciones con IA, operadoras y socios.
 */

// Normalizar teléfono (quitar +, espacios, guiones)
function normalizarTelefono(telefono: string | undefined): string {
  if (!telefono) return '';
  return telefono.replace(/[\s\-\+]/g, '');
}

interface ConversacionRequest {
  message_id_whatsapp?: string;
  telefono: string;
  direccion: 'entrante' | 'saliente';
  origen: 'socio' | 'operadora' | 'bot';
  contenido: string;
  propuesta_ia?: string;
  estado?: 'pendiente' | 'resuelto';
  message_id_referencia?: string;
}

export async function POST(request: Request) {
  try {
    const body: ConversacionRequest = await request.json();

    console.log('[API n8n/conversacion-agente] Nueva conversación recibida');
    console.log(`  - Teléfono: ${body.telefono}`);
    console.log(`  - Dirección: ${body.direccion}`);
    console.log(`  - Origen: ${body.origen}`);

    // Validar campos requeridos
    if (!body.telefono || !body.direccion || !body.origen || !body.contenido) {
      console.log('[API n8n/conversacion-agente] ❌ Campos requeridos faltantes');
      return Response.json(
        { error: 'Campos requeridos: telefono, direccion, origen, contenido' },
        { status: 400 }
      );
    }

    // Validar valores de ENUM
    if (!['entrante', 'saliente'].includes(body.direccion)) {
      return Response.json(
        { error: 'direccion debe ser "entrante" o "saliente"' },
        { status: 400 }
      );
    }

    if (!['socio', 'operadora', 'bot'].includes(body.origen)) {
      return Response.json(
        { error: 'origen debe ser "socio", "operadora" o "bot"' },
        { status: 400 }
      );
    }

    if (body.estado && !['pendiente', 'resuelto'].includes(body.estado)) {
      return Response.json(
        { error: 'estado debe ser "pendiente" o "resuelto"' },
        { status: 400 }
      );
    }

    // Normalizar teléfono
    const telefonoNormalizado = normalizarTelefono(body.telefono);

    // Insertar en base de datos
    const insertQuery = `
      INSERT INTO conversaciones_agente (
        message_id_whatsapp,
        telefono,
        direccion,
        origen,
        contenido,
        propuesta_ia,
        estado,
        message_id_referencia
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      body.message_id_whatsapp || null,
      telefonoNormalizado,
      body.direccion,
      body.origen,
      body.contenido,
      body.propuesta_ia || null,
      body.estado || 'pendiente',
      body.message_id_referencia || null
    ];

    const result = await executeQuery(insertQuery, params) as any;

    console.log(`[API n8n/conversacion-agente] ✅ Conversación guardada con ID: ${result.insertId}`);

    return Response.json(
      {
        success: true,
        id: result.insertId
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[API n8n/conversacion-agente] Error:', error);
    return Response.json(
      {
        error: 'Error al guardar conversación',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
