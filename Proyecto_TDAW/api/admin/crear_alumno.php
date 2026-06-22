<?php
declare(strict_types=1);

require __DIR__ . '/../sesion.php';
exigir_metodo('POST');
exigir_sesion('admin');

$pdo  = require __DIR__ . '/../conexion.php';
$data = leer_json_body();

$boleta      = strtoupper(trim((string)($data['boleta']      ?? '')));
$nombre      =          trim((string)($data['nombre']         ?? ''));
$carrera     =          trim((string)($data['carrera']        ?? ''));
$laboratorio =          trim((string)($data['laboratorio']    ?? ''));
$horario     =          trim((string)($data['horario']        ?? ''));

if ($boleta === '' || $nombre === '' || $carrera === '') {
    json_response(400, ['ok' => false, 'mensaje' => 'boleta, nombre y carrera son obligatorios.']);
}

// CURP placeholder para altas administrativas (el alumno no tiene cuenta de login).
$curpAdmin = 'ADM' . str_pad($boleta, 15, '0', STR_PAD_LEFT);
if (strlen($curpAdmin) > 18) {
    $curpAdmin = substr($curpAdmin, 0, 18);
}

try {
    $idSalon = null;
    if ($laboratorio !== '' && preg_match('/(\d+)/', $laboratorio, $m)) {
        $idSalon = (int) $m[1];
        if ($idSalon < 1 || $idSalon > 5) {
            json_response(400, ['ok' => false, 'mensaje' => 'Laboratorio fuera de rango (1-5).']);
        }
    }

    $idHorario = null;
    if ($horario !== '') {
        $inicio = trim(explode('-', $horario)[0] ?? '');
        $stmt = $pdo->prepare("SELECT id_horario FROM HORARIO WHERE TIME_FORMAT(hora_inicio,'%H:%i') = ? LIMIT 1");
        $stmt->execute([$inicio]);
        $idHorario = $stmt->fetchColumn();
        if (!$idHorario) {
            json_response(400, ['ok' => false, 'mensaje' => 'Horario no registrado en la base.']);
        }
        $idHorario = (int) $idHorario;
    }

    $pdo->beginTransaction();

    $insAlumno = $pdo->prepare(
        "INSERT INTO ALUMNO (curp, boleta, nombre_completo, carrera) VALUES (?, ?, ?, ?)"
    );
    $insAlumno->execute([$curpAdmin, $boleta, $nombre, $carrera]);

    if ($idSalon !== null && $idHorario !== null) {
        $insAsig = $pdo->prepare(
            "INSERT INTO HORARIO_ALUMNO (curp, id_salon, id_horario) VALUES (?, ?, ?)"
        );
        $insAsig->execute([$curpAdmin, $idSalon, $idHorario]);
    }

    $pdo->commit();

    json_response(200, [
        'ok'      => true,
        'mensaje' => 'Alumno registrado correctamente.',
        'curp'    => $curpAdmin,
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();

    $sqlState = $e->getCode();
    $mensaje  = $e->getMessage();
    $status   = 500;

    if ($sqlState === '23000') {
        $status  = 409;
        $mensaje = 'Ya existe un alumno con esa boleta.';
    } elseif ($sqlState === '45000') {
        $status = 409;
    }

    json_response($status, ['ok' => false, 'mensaje' => $mensaje]);
}
