/**
 * Endpoint de prueba para verificar acceso al API de usage de OpenAI
 *
 * IMPORTANTE: Agregar en .env de Railway:
 * OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
 * OPENAI_ORG_ID=org-X3i0jrf4dpBuWlwohkFw5ebn
 */

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const orgId = process.env.OPENAI_ORG_ID;

    if (!apiKey) {
      return Response.json({
        status: 'error',
        message: 'OPENAI_API_KEY no configurada en variables de entorno'
      }, { status: 400 });
    }

    // Intentar obtener usage del día actual
    const today = new Date().toISOString().slice(0, 10);

    // Endpoint de usage de OpenAI (requiere permisos de organización)
    const response = await fetch(`https://api.openai.com/v1/usage?date=${today}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Organization': orgId || '',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({
        status: 'error',
        message: 'OpenAI API rechazó la solicitud',
        http_status: response.status,
        openai_error: data.error || data,
        tip: response.status === 401
          ? 'API Key inválida o sin permisos de usage'
          : response.status === 403
            ? 'Tu cuenta no tiene acceso al endpoint de usage. Usaremos log desde n8n.'
            : 'Error desconocido'
      }, { status: response.status });
    }

    return Response.json({
      status: 'ok',
      message: 'Acceso al API de usage confirmado!',
      sample_data: data
    });

  } catch (error) {
    console.error('[API test-openai-usage] Error:', error);
    return Response.json({
      status: 'error',
      message: String(error)
    }, { status: 500 });
  }
}
