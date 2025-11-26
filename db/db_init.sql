-- Crear base de datos
CREATE DATABASE IF NOT EXISTS logsdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE logsdb;

-- Crear usuario (ajusta según tu entorno)
CREATE USER IF NOT EXISTS 'logsuser'@'%' IDENTIFIED BY 'logspass';
GRANT ALL PRIVILEGES ON logsdb.* TO 'logsuser'@'%';
FLUSH PRIVILEGES;

-- Crear tabla de logs
DROP TABLE IF EXISTS event_logs;

CREATE TABLE event_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_time DATETIME NOT NULL,
    level VARCHAR(10) NOT NULL,
    source VARCHAR(100) NOT NULL,
    message TEXT NOT NULL
);

-- Datos simulados de log
INSERT INTO event_logs (event_time, level, source, message) VALUES
(NOW() - INTERVAL 5 MINUTE,  'INFO',  'node',       'Petición GET /index.php desde 192.168.0.10'),
(NOW() - INTERVAL 4 MINUTE,  'WARN',  'app-backend','Tiempo de respuesta alto en /api/logs'),
(NOW() - INTERVAL 3 MINUTE,  'ERROR', 'mariadb',    'Conexión rechazada al intentar abrir pool'),
(NOW() - INTERVAL 2 MINUTE,  'INFO',  'node',       'Respuesta 200 a /health'),
(NOW() - INTERVAL 1 MINUTE,  'INFO',  'scheduler',  'Tarea de limpieza de logs ejecutada correctamente');
