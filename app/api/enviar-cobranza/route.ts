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

    const data = await response.json();
    console.log('[API enviar-cobranza] Respuesta de n8n:', data);

    return Response.json(data);

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
