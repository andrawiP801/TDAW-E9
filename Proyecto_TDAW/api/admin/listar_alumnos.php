<?php
declare(strict_types=1);

require __DIR__ . '/../sesion.php';
exigir_sesion('admin');

$pdo = require __DIR__ . '/../conexion.php';

try {
    $sql = "
        SELECT
            a.curp,
            a.boleta,
            a.nombre_completo,
            a.fecha_nacimiento,
            a.genero,
            a.telefono,
            a.carrera,
            p.escuela_procedencia,
            p.promedio,
            alc.nombre AS alcaldia,
            ent.nombre AS entidad_federativa,
            ha.id_horario,
            ha.id_salon,
            s.nombre AS laboratorio,
            h.fecha AS fecha_examen,
            DATE_FORMAT(h.hora_inicio, '%H:%i') AS hora_inicio,
            DATE_FORMAT(h.hora_fin,    '%H:%i') AS hora_fin
        FROM ALUMNO a
        LEFT JOIN PROCEDENCIA         p   ON p.curp        = a.curp
        LEFT JOIN ALCALDIA            alc ON alc.id_alcaldia = p.id_alcaldia
        LEFT JOIN ENTIDAD_FEDERATIVA  ent ON ent.id_entidad  = alc.id_entidad
        LEFT JOIN HORARIO_ALUMNO      ha  ON ha.curp        = a.curp
        LEFT JOIN HORARIO             h   ON h.id_horario   = ha.id_horario
        LEFT JOIN SALON               s   ON s.id_salon     = ha.id_salon
        ORDER BY a.nombre_completo ASC
    ";
    $rows = $pdo->query($sql)->fetchAll();

    $alumnos = array_map(static function (array $r): array {
        $horarioStr = null;
        if (!empty($r['hora_inicio']) && !empty($r['hora_fin'])) {
            $horarioStr = $r['hora_inicio'] . ' - ' . $r['hora_fin'];
        }
        return [
            'curp'        => $r['curp'],
            'boleta'      => $r['boleta'],
            'nombre'      => $r['nombre_completo'],
            'fechaNac'    => $r['fecha_nacimiento'],
            'genero'      => $r['genero'],
            'telefono'    => $r['telefono'],
            'carrera'     => $r['carrera'],
            'escuela'     => $r['escuela_procedencia'],
            'promedio'    => $r['promedio'],
            'alcaldia'    => $r['alcaldia'],
            'entidad'     => $r['entidad_federativa'],
            'id_horario'  => $r['id_horario'] !== null ? (int)$r['id_horario'] : null,
            'id_salon'    => $r['id_salon']   !== null ? (int)$r['id_salon']   : null,
            'laboratorio' => $r['laboratorio'],
            'horario'     => $horarioStr,
            'fechaExamen' => $r['fecha_examen'],
        ];
    }, $rows);

    json_response(200, [
        'ok'      => true,
        'total'   => count($alumnos),
        'alumnos' => $alumnos,
    ]);
} catch (PDOException $e) {
    json_response(500, ['ok' => false, 'mensaje' => 'Error al listar alumnos.']);
}
