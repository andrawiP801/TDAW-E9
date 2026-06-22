<?php
declare(strict_types=1);

/**
 * Helpers de sesión + utilidades JSON compartidas entre endpoints.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function json_response(int $status, array $body): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function leer_json_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) {
        json_response(400, ['ok' => false, 'mensaje' => 'Payload JSON inválido.']);
    }
    return $data;
}

function exigir_metodo(string $metodo): void {
    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        json_response(405, ['ok' => false, 'mensaje' => 'Método no permitido.']);
    }
}

function exigir_sesion(?string $tipoRequerido = null): void {
    if (empty($_SESSION['id_usuario'])) {
        json_response(401, ['ok' => false, 'mensaje' => 'Sesión no iniciada.']);
    }
    if ($tipoRequerido !== null) {
        $actual = strtolower((string)($_SESSION['tipo_usuario'] ?? ''));
        if ($actual !== strtolower($tipoRequerido)) {
            json_response(403, ['ok' => false, 'mensaje' => 'Acceso no autorizado para este recurso.']);
        }
    }
}
