/**
 * Endpoint para consultar uso de OpenAI directamente desde su API
 * Trae datos del día actual y de los últimos días
 */

export async function GET(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const orgId = process.env.OPENAI_ORG_ID;

    if (!apiKey) {
      return Response.json({
        error: 'OPENAI_API_KEY no configurada'
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const dias = Number(searchParams.get('dias')) || 30;

    // Calcular fechas
    const hoy = new Date();
    const fechas: string[] = [];
    for (let i = 0; i < dias; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      fechas.push(fecha.toISOString().slice(0, 10));
    }

    // Obtener uso de cada día (OpenAI API limita a 1 día por request)
    const usagePromises = fechas.slice(0, 7).map(async (fecha) => {
      try {
        const response = await fetch(`https://api.openai.com/v1/usage?date=${fecha}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Organization': orgId || '',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return { fecha, error: response.status, data: null };
        }

        const data = await response.json();
        return { fecha, error: null, data };
      } catch (err) {
        return { fecha, error: String(err), data: null };
      }
    });

    const results = await Promise.all(usagePromises);

    // Procesar datos
    let totalTokens = 0;
    let totalRequests = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const porDia: { fecha: string; tokens: number; requests: number }[] = [];
    const porModelo: Record<string, { requests: number; tokens: number }> = {};

    for (const result of results) {
      if (result.data && result.data.data) {
        let diaTokens = 0;
        let diaRequests = 0;

        for (const item of result.data.data) {
          const tokens = (item.n_context_tokens_total || 0) + (item.n_generated_tokens_total || 0);
          const requests = item.n_requests || 0;
          const inputTok = item.n_context_tokens_total || 0;
          const outputTok = item.n_generated_tokens_total || 0;

          diaTokens += tokens;
          diaRequests += requests;
          totalInputTokens += inputTok;
          totalOutputTokens += outputTok;

          // Agrupar por modelo
          const modelo = item.snapshot_id || item.model_id || 'unknown';
          if (!porModelo[modelo]) {
            porModelo[modelo] = { requests: 0, tokens: 0 };
          }
          porModelo[modelo].requests += requests;
          porModelo[modelo].tokens += tokens;
        }

        totalTokens += diaTokens;
        totalRequests += diaRequests;
        porDia.push({ fecha: result.fecha, tokens: diaTokens, requests: diaRequests });
      }
    }

    // Ordenar por fecha
    porDia.sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Convertir porModelo a array
    const modelosArray = Object.entries(porModelo)
      .map(([modelo, data]) => ({ modelo, ...data }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10);

    return Response.json({
      total_requests: totalRequests,
      total_tokens: totalTokens,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      por_dia: porDia,
      por_modelo: modelosArray,
      dias_consultados: results.length,
      errores: results.filter(r => r.error).map(r => ({ fecha: r.fecha, error: r.error }))
    });

  } catch (error) {
    console.error('[API observabilidad-ia/openai-usage] Error:', error);
    return Response.json(
      { error: 'Error al consultar OpenAI API', detalle: String(error) },
      { status: 500 }
    );
  }
}
