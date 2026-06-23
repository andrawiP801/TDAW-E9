<?php
declare(strict_types=1);

$DB_HOST = 'localhost';
$DB_NAME = 'Escuela';
$DB_USER = 'root';
$DB_PASS = '';
$DB_PORT = 3306;

$dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => true,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
];

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok'      => false,
        'mensaje' => 'Error de conexión a la base de datos.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

return $pdo;
