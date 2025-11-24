import { executeQuery } from '@/lib/db';

// Obtener fecha/hora en Argentina (UTC-3)
function getArgentinaDateTime(): string {
  const now = new Date();
  const argentinaOffset = -3 * 60;
  const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 19).replace('T', ' ');
}

interface IALogRequest {
  workflow_id: string;
  socio_id?: string;
  telefono?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  latency_ms?: number;
  model_used?: string;
  status?: string;
  errormessage?: string;
}

export async function POST(request: Request) {
  try {
    const body: IALogRequest = await request.json();

    if (!body.workflow_id) {
      return Response.json(
        { status: 'error', detalle: 'campo faltante: workflow_id' },
        { status: 400 }
      );
    }

    const datos = {
      workflow_id: body.workflow_id,
      socio_id: body.socio_id || null,
      telefono: body.telefono || null,
      input_tokens: body.input_tokens || 0,
      output_tokens: body.output_tokens || 0,
      total_tokens: body.total_tokens || (body.input_tokens || 0) + (body.output_tokens || 0),
      latency_ms: body.latency_ms || 0,
      model_used: body.model_used || 'gpt-4',
      status: body.status || 'success',
      errormessage: body.errormessage || null
    };

    const fechaArgentina = getArgentinaDateTime();

    const query = `
      INSERT INTO IAUsageLogs
        (workflow_id, socio_id, telefono, input_tokens, output_tokens, total_tokens, latency_ms, model_used, status, errormessage, created_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(query, [
      datos.workflow_id,
      datos.socio_id,
      datos.telefono,
      datos.input_tokens,
      datos.output_tokens,
      datos.total_tokens,
      datos.latency_ms,
      datos.model_used,
      datos.status,
      datos.errormessage,
      fechaArgentina
    ]);

    return Response.json({ status: 'ok' });

  } catch (error) {
    console.error('[API observabilidad-ia/log] Error:', error);
    return Response.json(
      { status: 'error', detalle: String(error) },
      { status: 500 }
    );
  }
}
