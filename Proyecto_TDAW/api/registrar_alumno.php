<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'mensaje' => 'Método no permitido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$pdo = require __DIR__ . '/conexion.php';

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'mensaje' => 'Payload JSON inválido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$curp     = strtoupper(trim((string)($data['curp']     ?? '')));
$boleta   = strtoupper(trim((string)($data['boleta']   ?? '')));
$nombre   =          trim((string)($data['nombre']        ?? ''));
$fechaNac =          trim((string)($data['fechaNac']      ?? ''));
$genero   =          trim((string)($data['genero']        ?? ''));
$telefono =          trim((string)($data['telefono']      ?? ''));
$estado   =          trim((string)($data['estado']        ?? ''));
$alcaldia =          trim((string)($data['alcaldia']      ?? ''));
$escuela  =          trim((string)($data['nombreEscuela'] ?? ($data['escuela'] ?? '')));
$promedio =          trim((string)($data['promedio']      ?? ''));
$correo   =          trim((string)($data['correo']        ?? ''));
$password =                 (string)($data['password']    ?? '');

$obligatorios = [
    'curp' => $curp, 'boleta' => $boleta, 'nombre' => $nombre,
    'fechaNac' => $fechaNac, 'genero' => $genero, 'telefono' => $telefono,
    'estado' => $estado, 'escuela' => $escuela, 'promedio' => $promedio,
    'correo' => $correo, 'password' => $password,
];
foreach ($obligatorios as $campo => $valor) {
    if ($valor === '') {
        http_response_code(400);
        echo json_encode([
            'ok'      => false,
            'mensaje' => "Falta el campo obligatorio: {$campo}.",
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if ($alcaldia === '' || stripos($alcaldia, 'no aplica') !== false) {
    $alcaldia = null;
}

$hashPassword = password_hash($password, PASSWORD_BCRYPT);

$HORARIOS_LABEL = [
    1 => '11:00 - 12:30',
    2 => '12:45 - 14:15',
    3 => '14:30 - 16:00',
];

try {
    $sqlAsignacion = "
        SELECT h.id_horario, s.id_salon
        FROM HORARIO h
        CROSS JOIN SALON s
        LEFT JOIN HORARIO_ALUMNO ha
               ON ha.id_horario = h.id_horario
              AND ha.id_salon   = s.id_salon
        WHERE h.id_horario BETWEEN 1 AND 3
          AND s.id_salon   BETWEEN 1 AND 5
        GROUP BY h.id_horario, s.id_salon
        HAVING COUNT(ha.id_horario_alumno) < 30
           AND (
                SELECT COUNT(*) FROM HORARIO_ALUMNO ha2
                WHERE ha2.id_horario = h.id_horario
           ) < 150
        ORDER BY h.id_horario ASC, s.id_salon ASC
        LIMIT 1
    ";

    $asign = $pdo->query($sqlAsignacion)->fetch();
    if (!$asign) {
        http_response_code(409);
        echo json_encode([
            'ok'      => false,
            'mensaje' => 'No hay cupo disponible en ningún laboratorio/horario.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $idHorario = (int) $asign['id_horario'];
    $idSalon   = (int) $asign['id_salon'];

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

    $insAsig = $pdo->prepare(
        "INSERT INTO HORARIO_ALUMNO (curp, id_salon, id_horario) VALUES (?, ?, ?)"
    );
    $insAsig->execute([$curp, $idSalon, $idHorario]);

    $pdo->commit();

    echo json_encode([
        'ok'         => true,
        'mensaje'    => '¡Datos guardados correctamente!',
        'asignacion' => [
            'fecha'       => '24 de Agosto de 2026',
            'horario'     => $HORARIOS_LABEL[$idHorario] ?? '—',
            'laboratorio' => 'Laboratorio ' . $idSalon,
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $sqlState = $e->getCode();
    $mensaje  = $e->getMessage();

    if ($sqlState === '23000') {
        $mensaje = 'Ya existe un registro con la misma CURP, boleta o correo.';
        http_response_code(409);
    } elseif ($sqlState === '45000') {
        http_response_code(409);
    } else {
        http_response_code(500);
    }

    echo json_encode([
        'ok'      => false,
        'mensaje' => $mensaje,
    ], JSON_UNESCAPED_UNICODE);
}
