import { getLiquidacionById } from '@/lib/cuponData';
import { generatePDF } from '@/lib/pdfGenerator';

/**
 * API Endpoint para generar cupones de pago en PDF
 * GET /api/cupon/[id]?download=true
 *
 * @param id - ID de la liquidación
 * @param download - (opcional) Si es 'true', fuerza descarga. Por defecto muestra inline.
 *
 * Respuestas:
 * - 200: PDF generado correctamente (application/pdf)
 * - 404: Liquidación no encontrada
 * - 500: Error interno del servidor
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get('download') === 'true';

    // Validar ID
    const liquidacionId = parseInt(id, 10);
    if (isNaN(liquidacionId)) {
      return Response.json(
        { error: 'ID de liquidación inválido' },
        { status: 400 }
      );
    }

    console.log(`[API /cupon/${id}] Generando cupón para liquidación ID: ${liquidacionId}`);

    // Obtener datos de la liquidación
    const cuponData = await getLiquidacionById(liquidacionId);

    if (!cuponData) {
      console.warn(`[API /cupon/${id}] Liquidación no encontrada`);
      return Response.json(
        { error: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }

    // Generar PDF directamente con PDFKit
    const pdfBuffer = await generatePDF(cuponData);

    console.log(`[API /cupon/${id}] PDF generado exitosamente (${pdfBuffer.length} bytes)`);

    // Configurar headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', pdfBuffer.length.toString());

    if (forceDownload) {
      headers.set(
        'Content-Disposition',
        `attachment; filename="cupon_${cuponData.numeroComprobante}.pdf"`
      );
    } else {
      headers.set(
        'Content-Disposition',
        `inline; filename="cupon_${cuponData.numeroComprobante}.pdf"`
      );
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('[API /cupon] Error generando cupón:', error);
    return Response.json(
      {
        error: 'Error generando cupón de pago',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
