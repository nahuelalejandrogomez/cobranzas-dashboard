import { executeQuery } from '@/lib/db';

/**
 * API Admin - Crear tabla conversaciones_agente
 *
 * Endpoint temporal para crear la tabla desde Railway
 */

export async function POST(request: Request) {
  try {
    console.log('[API admin/create-table] Creando tabla conversaciones_agente...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS conversaciones_agente (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id_whatsapp VARCHAR(255),
        telefono VARCHAR(50),
        direccion ENUM('entrante', 'saliente'),
        origen ENUM('socio', 'operadora', 'bot'),
        contenido TEXT,
        propuesta_ia TEXT NULL,
        estado ENUM('pendiente', 'resuelto') DEFAULT 'pendiente',
        message_id_referencia VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_telefono (telefono),
        INDEX idx_estado (estado),
        INDEX idx_created_at (created_at)
      )
    `;

    await executeQuery(createTableSQL, []);
    console.log('[API admin/create-table] ✅ Tabla creada');

    // Verificar estructura
    const describe = await executeQuery('DESCRIBE conversaciones_agente', []);
    console.log('[API admin/create-table] Estructura:', describe);

    return Response.json({
      success: true,
      message: 'Tabla conversaciones_agente creada exitosamente',
      estructura: describe
    });

  } catch (error: any) {
    console.error('[API admin/create-table] Error:', error);

    // Si el error es "tabla ya existe", no es un error crítico
    if (error.message?.includes('already exists')) {
      const describe = await executeQuery('DESCRIBE conversaciones_agente', []);
      return Response.json({
        success: true,
        message: 'Tabla conversaciones_agente ya existía',
        estructura: describe
      });
    }

    return Response.json(
      {
        success: false,
        error: 'Error al crear tabla conversaciones_agente',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
