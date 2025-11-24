<?php
// config.php: conexión PDO a MariaDB

$DB_HOST = getenv('DB_HOST') ?: 'mariadb';  // nombre del servicio en docker-compose o 'localhost'
$DB_NAME = getenv('DB_NAME') ?: 'logsdb';
$DB_USER = getenv('DB_USER') ?: 'logsuser';
$DB_PASS = getenv('DB_PASS') ?: 'logspass';

$dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo "<h1>Error de conexión a la base de datos</h1>\r\n";
    echo "<pre>" . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . "</pre>\r\n";
    exit;
}
?>