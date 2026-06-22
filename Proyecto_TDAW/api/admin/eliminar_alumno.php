<?php
declare(strict_types=1);

require __DIR__ . '/../sesion.php';
exigir_metodo('POST');
exigir_sesion('admin');

$pdo  = require __DIR__ . '/../conexion.php';
$data = leer_json_body();

$curp   = strtoupper(trim((string)($data['curp']   ?? '')));
$boleta = strtoupper(trim((string)($data['boleta'] ?? '')));

if ($curp === '' && $boleta === '') {
    json_response(400, ['ok' => false, 'mensaje' => 'Se requiere CURP o boleta.']);
}

try {
    if ($curp === '') {
        $stmt = $pdo->prepare("SELECT curp FROM ALUMNO WHERE boleta = ? LIMIT 1");
        $stmt->execute([$boleta]);
        $curp = (string)($stmt->fetchColumn() ?: '');
        if ($curp === '') {
            json_response(404, ['ok' => false, 'mensaje' => 'Alumno no encontrado.']);
        }
    }

    $stmt = $pdo->prepare("DELETE FROM ALUMNO WHERE curp = ?");
    $stmt->execute([$curp]);

    if ($stmt->rowCount() === 0) {
        json_response(404, ['ok' => false, 'mensaje' => 'Alumno no encontrado o ya eliminado.']);
    }

    json_response(200, [
        'ok'       => true,
        'mensaje'  => 'Alumno eliminado correctamente.',
        'curp'     => $curp,
    ]);
} catch (PDOException $e) {
    json_response(500, ['ok' => false, 'mensaje' => 'Error al eliminar al alumno: ' . $e->getMessage()]);
}
