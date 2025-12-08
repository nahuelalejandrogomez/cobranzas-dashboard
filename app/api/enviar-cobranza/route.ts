/**
 * API Proxy para n8n - Enviar Cobranza Inicial
 *
 * Este endpoint actúa como proxy entre el frontend y n8n para evitar problemas de CORS.
 *
 * POST /api/enviar-cobranza
 *
 * Response:
 * {
 *   "status": "ok",
 *   "mensaje": "Proceso de cobranza ejecutado correctamente",
 *   "enviados": 2,
 *   "errores": 0
 * }
 */

export async function POST(request: Request) {
  console.log('[API enviar-cobranza] Endpoint proxy activo - recibiendo request');
  try {
    console.log('[API enviar-cobranza] Iniciando llamada a n8n webhook...');

    const response = await fetch('https://nahuelalejandrogomez.app.n8n.cloud/webhook/enviar-cobranza', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[API enviar-cobranza] Error de n8n:', response.status, response.statusText);
      return Response.json(
        {
          status: 'error',
          mensaje: `Error del servidor n8n: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    // Verificar que la respuesta tenga contenido
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      console.error('[API enviar-cobranza] Respuesta vacía de n8n');
      return Response.json(
        {
          status: 'error',
          mensaje: 'El webhook de n8n devolvió una respuesta vacía. Verificá que el workflow esté activo.',
        },
        { status: 500 }
      );
    }

    let data = await response.json();
    console.log('[API enviar-cobranza] Respuesta de n8n (raw):', data);

    // n8n devuelve un array anidado [[{enviados, errores}]]
    // Necesitamos desanidar y agregar campos faltantes
    if (Array.isArray(data) && data.length > 0) {
      // Desanidar: [[objeto]] -> [objeto] -> objeto
      while (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }
    }

    // Normalizar respuesta al formato esperado
    const normalizedData = {
      status: 'ok',
      mensaje: 'Proceso de envío de cupones ejecutado correctamente',
      enviados: data?.enviados || 0,
      errores: data?.errores || 0
    };

    console.log('[API enviar-cobranza] Respuesta normalizada:', normalizedData);

    return Response.json(normalizedData);

  } catch (error) {
    console.error('[API enviar-cobranza] Error:', error);
    return Response.json(
      {
        status: 'error',
        mensaje: 'Error al conectar con el servicio de cobranza',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
