/**
 * API Proxy para n8n - Enviar Cupones PDF
 *
 * Este endpoint actúa como proxy entre el frontend y n8n para evitar problemas de CORS.
 *
 * POST /api/enviar-cupon
 *
 * Response:
 * {
 *   "status": "ok",
 *   "mensaje": "Proceso de envío de cupones ejecutado correctamente",
 *   "enviados": 2,
 *   "errores": 0
 * }
 */

export async function POST(request: Request) {
  console.log('[API enviar-cupon] Endpoint proxy activo - recibiendo request');
  try {
    console.log('[API enviar-cupon] Iniciando llamada a n8n webhook...');

    const response = await fetch('https://nahuelalejandrogomez.app.n8n.cloud/webhook/envio_cupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[API enviar-cupon] Error de n8n:', response.status, response.statusText);
      return Response.json(
        {
          status: 'error',
          mensaje: `Error del servidor n8n: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API enviar-cupon] Respuesta de n8n:', data);

    return Response.json(data);

  } catch (error) {
    console.error('[API enviar-cupon] Error:', error);
    return Response.json(
      {
        status: 'error',
        mensaje: 'Error al conectar con el servicio de envío de cupones',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
