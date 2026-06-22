<?php
declare(strict_types=1);

require __DIR__ . '/sesion.php';
exigir_metodo('POST');

$pdo  = require __DIR__ . '/conexion.php';
$data = leer_json_body();

$usuarioLogin = trim((string)($data['usuario_login'] ?? ''));
$contrasena   =       (string)($data['contrasena']    ?? '');

$captchaA   = isset($data['captcha_a']) ? (int)$data['captcha_a'] : -1;
$captchaB   = isset($data['captcha_b']) ? (int)$data['captcha_b'] : -1;
$captchaRsp = isset($data['captcha'])   ? (int)$data['captcha']   : -2;

if ($usuarioLogin === '' || $contrasena === '') {
    json_response(400, ['ok' => false, 'mensaje' => 'Usuario y contraseña son obligatorios.']);
}

if ($captchaA < 1 || $captchaA > 9 || $captchaB < 1 || $captchaB > 9
    || $captchaRsp !== ($captchaA + $captchaB)) {
    json_response(400, ['ok' => false, 'mensaje' => 'CAPTCHA incorrecto.']);
}

try {
    $sql = "
        SELECT u.id_usuario, u.usuario_login, u.contrasena, u.tipo_usuario, u.curp
        FROM USUARIO u
        LEFT JOIN ALUMNO a ON a.curp = u.curp
        WHERE u.usuario_login = :login
           OR a.boleta        = :login
        LIMIT 1
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':login' => $usuarioLogin]);
    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($contrasena, $usuario['contrasena'])) {
        json_response(401, ['ok' => false, 'mensaje' => 'Credenciales inválidas.']);
    }

    session_regenerate_id(true);
    $_SESSION['id_usuario']    = (int) $usuario['id_usuario'];
    $_SESSION['usuario_login'] = $usuario['usuario_login'];
    $_SESSION['tipo_usuario']  = strtolower($usuario['tipo_usuario']);
    $_SESSION['curp']          = $usuario['curp'];

    json_response(200, [
        'ok'           => true,
        'mensaje'      => 'Sesión iniciada correctamente.',
        'tipo_usuario' => strtoupper($usuario['tipo_usuario']),
    ]);
} catch (PDOException $e) {
    json_response(500, ['ok' => false, 'mensaje' => 'Error interno al validar credenciales.']);
}
