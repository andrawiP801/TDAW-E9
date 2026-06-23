<?php
declare(strict_types=1);

require __DIR__ . '/../sesion.php';
exigir_metodo('POST');
exigir_sesion('admin');

$pdo  = require __DIR__ . '/../conexion.php';
$data = leer_json_body();

$curp     = strtoupper(trim((string)($data['curp']     ?? '')));
$boleta   = strtoupper(trim((string)($data['boleta']   ?? '')));
$nombre   =          trim((string)($data['nombre']        ?? ''));
$fechaNac =          trim((string)($data['fechaNac']      ?? ''));
$genero   =          trim((string)($data['genero']        ?? ''));
$telefono =          trim((string)($data['telefono']      ?? ''));
$estado   =          trim((string)($data['estado']        ?? ''));
$alcaldia =          trim((string)($data['alcaldia']      ?? ''));
$carrera  =          trim((string)($data['carrera']       ?? ''));
$escuela  =          trim((string)($data['nombreEscuela'] ?? ($data['escuela'] ?? '')));
$promedio =          trim((string)($data['promedio']      ?? ''));
$correo   =          trim((string)($data['correo']        ?? ''));
$laboratorio = trim((string)($data['laboratorio'] ?? ''));
$horario     = trim((string)($data['horario']     ?? ''));

// Política de creación desde el panel admin:
// la contraseña inicial del alumno es su propio número de boleta.
// El alumno puede cambiarla más adelante; aquí no se pide al administrador.
$password = $boleta;

$obligatorios = [
    'curp' => $curp, 'boleta' => $boleta, 'nombre' => $nombre,
    'fechaNac' => $fechaNac, 'genero' => $genero, 'telefono' => $telefono,
    'estado' => $estado, 'carrera' => $carrera, 'escuela' => $escuela,
    'promedio' => $promedio, 'correo' => $correo,
    'laboratorio' => $laboratorio, 'horario' => $horario,
];
foreach ($obligatorios as $campo => $valor) {
    if ($valor === '') {
        json_response(400, [
            'ok'      => false,
            'mensaje' => "Falta el campo obligatorio: {$campo}.",
        ]);
    }
}

if ($alcaldia === '' || stripos($alcaldia, 'no aplica') !== false) {
    $alcaldia = null;
}

$idSalon = null;
if (preg_match('/(\d+)/', $laboratorio, $m)) {
    $idSalon = (int) $m[1];
    if ($idSalon < 1 || $idSalon > 5) {
        json_response(400, ['ok' => false, 'mensaje' => 'Laboratorio fuera de rango (1-5).']);
    }
} else {
    json_response(400, ['ok' => false, 'mensaje' => 'Formato de laboratorio inválido.']);
}

$inicio = trim(explode('-', $horario)[0] ?? '');
if ($inicio === '') {
    json_response(400, ['ok' => false, 'mensaje' => 'Formato de horario inválido.']);
}
$stmt = $pdo->prepare("SELECT id_horario FROM HORARIO WHERE TIME_FORMAT(hora_inicio,'%H:%i') = ? LIMIT 1");
$stmt->execute([$inicio]);
$idHorario = $stmt->fetchColumn();
if (!$idHorario) {
    json_response(400, ['ok' => false, 'mensaje' => 'Horario no registrado en la base.']);
}
$idHorario = (int) $idHorario;

$hashPassword = password_hash($password, PASSWORD_BCRYPT);

try {
    $pdo->beginTransaction();

    $sp = $pdo->prepare("CALL sp_insert_alumno_completo(?,?,?,?,?,?,?,?,?,?,?,?,?)");
    $sp->execute([
        $curp,
        $boleta,
        $nombre,
        $fechaNac,
        $genero,
        $telefono,
        $estado,
        $alcaldia,
        $escuela,
        $promedio,
        $correo,
        $hashPassword,
        'alumno',
    ]);
    $sp->closeCursor();

    $updCarrera = $pdo->prepare("UPDATE ALUMNO SET carrera = ? WHERE curp = ?");
    $updCarrera->execute([$carrera, $curp]);

    $insAsig = $pdo->prepare(
        "INSERT INTO HORARIO_ALUMNO (curp, id_salon, id_horario) VALUES (?, ?, ?)"
    );
    $insAsig->execute([$curp, $idSalon, $idHorario]);

    $pdo->commit();

    json_response(200, [
        'ok'      => true,
        'mensaje' => 'Alumno registrado correctamente.',
        'curp'    => $curp,
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();

    $sqlState = $e->getCode();
    $mensaje  = $e->getMessage();
    $status   = 500;

    if ($sqlState === '23000') {
        $status  = 409;
        $mensaje = 'Ya existe un registro con la misma CURP, boleta o correo.';
    } elseif ($sqlState === '45000') {
        $status = 409;
    }

    json_response($status, ['ok' => false, 'mensaje' => $mensaje]);
}
