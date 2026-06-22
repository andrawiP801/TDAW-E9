<?php
declare(strict_types=1);

/**
 * Helper de un solo uso: crea (o re-hashea) el usuario administrador.
 *
 *   Uso:    http://localhost/Proyecto_TDAW/api/seed_admin.php
 *
 * Una vez ejecutado, ELIMINAR este archivo del servidor en producción.
 *
 *   Credenciales iniciales:
 *     usuario:    admin
 *     contraseña: admin123
 */

header('Content-Type: text/plain; charset=utf-8');

$pdo = require __DIR__ . '/conexion.php';

$usuario    = 'admin';
$plain      = 'admin123';
$hash       = password_hash($plain, PASSWORD_BCRYPT);
$tipo       = 'admin';

try {
    $sql = "
        INSERT INTO USUARIO (usuario_login, contrasena, tipo_usuario, curp)
        VALUES (:login, :hash, :tipo, NULL)
        ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena),
                                tipo_usuario = VALUES(tipo_usuario)
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':login' => $usuario,
        ':hash'  => $hash,
        ':tipo'  => $tipo,
    ]);

    echo "OK. Usuario administrador listo:\n";
    echo "  usuario_login : {$usuario}\n";
    echo "  contraseña    : {$plain}\n\n";
    echo "Recuerda eliminar este archivo (api/seed_admin.php) después de usarlo.\n";
} catch (PDOException $e) {
    http_response_code(500);
    echo "Error al crear/actualizar admin: " . $e->getMessage() . "\n";
}
