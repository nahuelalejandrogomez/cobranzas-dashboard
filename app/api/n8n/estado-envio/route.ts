import { executeQuery } from '@/lib/db';

// Obtener fecha/hora en Argentina (UTC-3)
function getArgentinaDateTime(): string {
  const now = new Date();
  const argentinaOffset = -3 * 60; // UTC-3 en minutos
  const argentinaTime = new Date(now.getTime() + (argentinaOffset - now.getTimezoneOffset()) * 60000);
  return argentinaTime.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * API para n8n - Registrar Estado de Envío de Liquidación
 *
 * POST /api/n8n/estado-envio
 *
 * Body:
 * {
 *   "liquidacion_id": 12345,
 *   "estado": "ENVIO_INICIAL" | "RECLAMO" | "INFORMA_CUPON",
 *   "resultado_envio": "OK" | "ERROR" | "PENDIENTE",
 *   "metadata": { ... } (opcional)
 * }
 *
 * Response exitoso:
 * {
 *   "success": true,
 *   "id": 789,
 *   "liquidacion_id": 12345,
 *   "estado": "ENVIO_INICIAL",
 *   "resultado_envio": "OK"
 * }
 *
 * Response error:
 * {
 *   "error": "mensaje de error",
 *   "details": "..."
 * }
 */

type EstadoEnvio = 'ENVIO_INICIAL' | 'RECLAMO' | 'INFORMA_CUPON';
type ResultadoEnvio = 'OK' | 'ERROR' | 'PENDIENTE';

interface RequestBody {
  liquidacion_id: number;
  estado: EstadoEnvio;
  resultado_envio: ResultadoEnvio;
  metadata?: Record<string, any>;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();

    // Validar campos requeridos
    if (!body.liquidacion_id) {
      return Response.json(
        { error: 'Campo requerido: liquidacion_id' },
        { status: 400 }
      );
    }

    if (!body.estado) {
      return Response.json(
        { error: 'Campo requerido: estado' },
        { status: 400 }
      );
    }

    if (!body.resultado_envio) {
      return Response.json(
        { error: 'Campo requerido: resultado_envio' },
        { status: 400 }
      );
    }

    // Validar valores de enum
    const estadosValidos: EstadoEnvio[] = ['ENVIO_INICIAL', 'RECLAMO', 'INFORMA_CUPON'];
    if (!estadosValidos.includes(body.estado)) {
      return Response.json(
        {
          error: 'Valor inválido para estado',
          valores_permitidos: estadosValidos
        },
        { status: 400 }
      );
    }

    const resultadosValidos: ResultadoEnvio[] = ['OK', 'ERROR', 'PENDIENTE'];
    if (!resultadosValidos.includes(body.resultado_envio)) {
      return Response.json(
        {
          error: 'Valor inválido para resultado_envio',
          valores_permitidos: resultadosValidos
        },
        { status: 400 }
      );
    }

    // Verificar que la liquidacion_id existe en la tabla Liquidaciones
    const checkQuery = `
      SELECT id FROM Liquidaciones WHERE id = ? LIMIT 1
    `;
    const checkResult = (await executeQuery(checkQuery, [body.liquidacion_id])) as any[];

    if (checkResult.length === 0) {
      return Response.json(
        {
          error: 'La liquidacion_id no existe en la tabla Liquidaciones',
          liquidacion_id: body.liquidacion_id
        },
        { status: 404 }
      );
    }

    // Insertar el registro en EstadoEnvioLiquidaciones
    // 🔥 FIX: Guardar en UTC para que MySQL interprete correctamente las fechas
    // La conversión a Argentina se hace en los queries de lectura
    const fechaUTC = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const insertQuery = `
      INSERT INTO EstadoEnvioLiquidaciones
      (liquidacion_id, estado, resultado_envio, metadata, fecha_evento)
      VALUES (?, ?, ?, ?, ?)
    `;

    const metadataJson = body.metadata ? JSON.stringify(body.metadata) : null;

    const result = (await executeQuery(insertQuery, [
      body.liquidacion_id,
      body.estado,
      body.resultado_envio,
      metadataJson,
      fechaUTC
    ])) as any;

    console.log(`[API n8n/estado-envio] Registro creado:`, {
      id: result.insertId,
      liquidacion_id: body.liquidacion_id,
      estado: body.estado,
      resultado_envio: body.resultado_envio
    });

    return Response.json({
      success: true,
      id: result.insertId,
      liquidacion_id: body.liquidacion_id,
      estado: body.estado,
      resultado_envio: body.resultado_envio,
      fecha_evento: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('[API n8n/estado-envio] Error:', error);

    // Detectar error de foreign key constraint
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return Response.json(
        {
          error: 'La liquidacion_id no existe en la tabla Liquidaciones',
          details: error.message
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        error: 'Error al registrar estado de envío',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
