<?php
declare(strict_types=1);

require __DIR__ . '/sesion.php';
exigir_sesion('alumno');

$pdo = require __DIR__ . '/conexion.php';

$curp = (string) ($_SESSION['curp'] ?? '');
if ($curp === '') {
    json_response(400, ['ok' => false, 'mensaje' => 'La sesión no tiene CURP asociada.']);
}

try {
    $sql = "
        SELECT
            a.curp,
            a.boleta,
            a.nombre_completo,
            h.fecha,
            DATE_FORMAT(h.hora_inicio, '%H:%i') AS hora_inicio,
            DATE_FORMAT(h.hora_fin,    '%H:%i') AS hora_fin,
            s.id_salon,
            s.nombre AS laboratorio
        FROM ALUMNO a
        LEFT JOIN HORARIO_ALUMNO ha ON ha.curp       = a.curp
        LEFT JOIN HORARIO        h  ON h.id_horario  = ha.id_horario
        LEFT JOIN SALON          s  ON s.id_salon    = ha.id_salon
        WHERE a.curp = :curp
        LIMIT 1
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':curp' => $curp]);
    $row = $stmt->fetch();

    if (!$row) {
        json_response(404, ['ok' => false, 'mensaje' => 'No se encontró información del alumno.']);
    }

    $tieneAsignacion = !empty($row['fecha']) && !empty($row['laboratorio']);
    $fechaLegible    = null;

    if ($tieneAsignacion) {
        $meses = [1=>'enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
        $ts = strtotime($row['fecha']);
        if ($ts !== false) {
            $fechaLegible = (int)date('j', $ts) . ' de ' . $meses[(int)date('n', $ts)] . ' de ' . date('Y', $ts);
        }
    }

    json_response(200, [
        'ok' => true,
        'alumno' => [
            'curp'   => $row['curp'],
            'boleta' => $row['boleta'],
            'nombre' => $row['nombre_completo'],
        ],
        'asignacion' => $tieneAsignacion ? [
            'fecha'        => $fechaLegible,
            'fecha_iso'    => $row['fecha'],
            'hora_inicio'  => $row['hora_inicio'],
            'hora_fin'     => $row['hora_fin'],
            'horario'      => $row['hora_inicio'] . ' — ' . $row['hora_fin'] . ' hrs',
            'laboratorio'  => $row['laboratorio'],
        ] : null,
    ]);
} catch (PDOException $e) {
    json_response(500, ['ok' => false, 'mensaje' => 'Error al consultar el examen.']);
}
