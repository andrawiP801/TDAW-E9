<?php
declare(strict_types=1);

require __DIR__ . '/../sesion.php';
exigir_metodo('POST');
exigir_sesion('admin');

$pdo  = require __DIR__ . '/../conexion.php';
$data = leer_json_body();

$curp        = strtoupper(trim((string)($data['curp']        ?? '')));
$boleta      = strtoupper(trim((string)($data['boleta']      ?? '')));
$nombre      =          trim((string)($data['nombre']         ?? ''));
$carrera     =          trim((string)($data['carrera']        ?? ''));
$laboratorio =          trim((string)($data['laboratorio']    ?? ''));
$horario     =          trim((string)($data['horario']        ?? ''));

if ($curp === '' && $boleta === '') {
    json_response(400, ['ok' => false, 'mensaje' => 'Se requiere CURP o boleta para identificar al alumno.']);
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

    $idSalon = null;
    if ($laboratorio !== '') {
        if (preg_match('/(\d+)/', $laboratorio, $m)) {
            $idSalon = (int) $m[1];
            if ($idSalon < 1 || $idSalon > 5) {
                json_response(400, ['ok' => false, 'mensaje' => 'Laboratorio fuera de rango (1-5).']);
            }
        } else {
            json_response(400, ['ok' => false, 'mensaje' => 'Formato de laboratorio inválido.']);
        }
    }

    $idHorario = null;
    if ($horario !== '') {
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
    }

    $pdo->beginTransaction();

    if ($nombre !== '' || $carrera !== '') {
        $sets   = [];
        $params = [];
        if ($nombre !== '') {
            $sets[]   = 'nombre_completo = ?';
            $params[] = $nombre;
        }
        if ($carrera !== '') {
            $sets[]   = 'carrera = ?';
            $params[] = $carrera;
        }
        $params[] = $curp;
        $sql = 'UPDATE ALUMNO SET ' . implode(', ', $sets) . ' WHERE curp = ?';
        $pdo->prepare($sql)->execute($params);
    }

    if ($idSalon !== null && $idHorario !== null) {
        $stmt = $pdo->prepare("SELECT id_horario_alumno FROM HORARIO_ALUMNO WHERE curp = ? LIMIT 1");
        $stmt->execute([$curp]);
        $existe = $stmt->fetchColumn();

        if ($existe) {
            $upd = $pdo->prepare(
                "UPDATE HORARIO_ALUMNO SET id_salon = ?, id_horario = ? WHERE curp = ?"
            );
            $upd->execute([$idSalon, $idHorario, $curp]);
        } else {
            $ins = $pdo->prepare(
                "INSERT INTO HORARIO_ALUMNO (curp, id_salon, id_horario) VALUES (?, ?, ?)"
            );
            $ins->execute([$curp, $idSalon, $idHorario]);
        }
    }

    $pdo->commit();
    json_response(200, ['ok' => true, 'mensaje' => 'Alumno actualizado correctamente.']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();

    $sqlState = $e->getCode();
    $mensaje  = $e->getMessage();
    $status   = 500;

    if ($sqlState === '45000') {
        $status = 409;
    } elseif ($sqlState === '23000') {
        $status  = 409;
        $mensaje = 'Conflicto de integridad: el dato ya existe o referencia algo inválido.';
    }

    json_response($status, ['ok' => false, 'mensaje' => $mensaje]);
}
