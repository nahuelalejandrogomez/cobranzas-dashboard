import { executeQuery } from '@/lib/db';

// Endpoint temporal para agregar columna errormessage
export async function GET() {
  try {
    // Agregar columna errormessage si no existe
    await executeQuery(`
      ALTER TABLE MensajesEnviados
      ADD COLUMN errormessage TEXT NULL
    `);

    // Verificar estructura de la tabla
    const columns = await executeQuery('DESCRIBE MensajesEnviados');

    return Response.json({
      status: 'ok',
      message: 'Columna errormessage agregada',
      columns
    });
  } catch (error: any) {
    // Si el error es que la columna ya existe, está OK
    if (error.message?.includes('Duplicate column')) {
      const columns = await executeQuery('DESCRIBE MensajesEnviados');
      return Response.json({
        status: 'ok',
        message: 'Columna errormessage ya existía',
        columns
      });
    }

    console.error('[API add-errormessage] Error:', error);
    return Response.json(
      { status: 'error', error: String(error) },
      { status: 500 }
    );
  }
}
