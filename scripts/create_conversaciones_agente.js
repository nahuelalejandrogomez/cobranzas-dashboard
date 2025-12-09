// Script para crear tabla conversaciones_agente en Railway MySQL
const mysql = require('mysql2/promise');

async function createTable() {
  const connection = await mysql.createConnection({
    host: 'autorack.proxy.rlwy.net',
    port: 17545,
    user: 'root',
    password: 'jVOfiAvlOowQCPOPMlGLhKxSEqiQWqBq',
    database: 'railway'
  });

  try {
    console.log('🔌 Conectado a Railway MySQL');

    const createTableSQL = `
      CREATE TABLE conversaciones_agente (
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
      );
    `;

    await connection.execute(createTableSQL);
    console.log('✅ Tabla "conversaciones_agente" creada exitosamente');

    // Verificar estructura
    const [rows] = await connection.execute('DESCRIBE conversaciones_agente');
    console.log('\n📋 Estructura de la tabla:');
    rows.forEach(row => {
      console.log(`  ${row.Field.padEnd(25)} ${row.Type.padEnd(20)} ${row.Null} ${row.Key}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

createTable();
