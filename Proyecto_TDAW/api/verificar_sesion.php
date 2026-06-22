<?php
declare(strict_types=1);

require __DIR__ . '/sesion.php';

$autenticado = !empty($_SESSION['id_usuario']);
$tipo = $autenticado ? strtoupper((string)($_SESSION['tipo_usuario'] ?? '')) : null;

json_response(200, [
    'ok'           => true,
    'autenticado'  => $autenticado,
    'tipo_usuario' => $tipo,
]);
