-- Agregar campos adicionales para WhatsApp Business API
ALTER TABLE Conversaciones
ADD COLUMN mensaje_id VARCHAR(255) NULL AFTER conversacion_id,
ADD COLUMN tipo_mensaje ENUM('text', 'image', 'audio', 'video', 'document', 'location', 'sticker', 'reaction') DEFAULT 'text' AFTER mensaje,
ADD COLUMN metadata JSON NULL AFTER raw_json,
ADD COLUMN leido BOOLEAN DEFAULT FALSE AFTER metadata,
ADD COLUMN entregado BOOLEAN DEFAULT FALSE AFTER leido,
ADD INDEX idx_mensaje_id (mensaje_id);
