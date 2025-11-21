-- Tabla para registrar mensajes enviados desde n8n
-- Ejecutar una sola vez en la base de datos

CREATE TABLE IF NOT EXISTS MensajesEnviados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  NUMSOCIO VARCHAR(13) NOT NULL,
  telefono VARCHAR(30),
  mensaje TEXT NOT NULL,
  fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
  estado_envio VARCHAR(20) DEFAULT 'enviado',
  canal VARCHAR(20) DEFAULT 'whatsapp',
  workflow_id VARCHAR(50) DEFAULT 'cobranzas_n8n',
  hash_mensaje VARCHAR(64),
  respuesta_api TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_numsocio (NUMSOCIO),
  INDEX idx_fecha_envio (fecha_envio),
  INDEX idx_hash (hash_mensaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
