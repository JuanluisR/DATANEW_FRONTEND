-- Tabla para almacenar las API Keys de las estaciones
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    id_estacion VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_api_key (api_key),
    INDEX idx_username (username),
    INDEX idx_id_estacion (id_estacion)
);
