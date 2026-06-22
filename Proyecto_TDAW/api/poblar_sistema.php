<?php
declare(strict_types=1);

/**
 * SEEDER NATIVO · pobla la base 'Escuela' con datos de prueba.
 *
 *   Uso (UNA sola vez):
 *     http://localhost/Proyecto_TDAW/api/poblar_sistema.php
 *
 *   Idempotente:
 *     - Borra los alumnos previos sembrados (curp LIKE 'TEST%').
 *       Por ON DELETE CASCADE, esto limpia USUARIO/PROCEDENCIA/HORARIO_ALUMNO.
 *     - Re-upserta catálogos (CDMX / Gustavo A. Madero) y al admin.
 *
 *   Tras la entrega, eliminar este archivo del servidor.
 */

header('Content-Type: text/html; charset=utf-8');

$pdo = require_once __DIR__ . '/conexion.php';

$nombres = [
    'María Fernanda López Ruiz',        'Carlos Andrés Hernández Soto',
    'Ana Sofía Ramírez Vega',           'Diego Emiliano Torres Mendoza',
    'Valeria Itzel Pérez Castillo',     'José Manuel García Ortiz',
    'Lucía Renata Sánchez Reyes',       'Andrés Felipe Domínguez Cruz',
    'Camila Regina Flores Aguilar',     'Sebastián Iván Romero Vargas',
    'Daniela Isabel Mendoza Solís',     'Ricardo Alejandro Núñez Cabrera',
    'Mariana Paola Estrada Ibarra',     'Fernando Eduardo Salinas Ortega',
    'Paulina Yolanda Valencia Maldonado','Joaquín Bruno Carrillo Espinoza',
    'Renata Verónica Quintero Lara',    'Emilio Santiago Bautista Galván',
    'Ximena Aurora Velasco Cisneros',   'Mauricio Fabián Acosta Zamora',
    'Sara Elena Treviño Montoya',       'Iván Damián Lozano Peña',
    'Regina Sofía Cárdenas Beltrán',    'Adrián Tomás Robles Vázquez',
    'Natalia Daniela Cervantes Olvera',
];

$carreras   = ['ISC', 'LCD', 'IIA'];
$escuelaPro = 'CECyT 9 "Juan de Dios Bátiz"';

try {
    $pdo->beginTransaction();

    // -----------------------------------------------------------------
    // 1) Limpieza idempotente de alumnos sembrados anteriormente
    // -----------------------------------------------------------------
    $pdo->exec("DELETE FROM ALUMNO WHERE curp LIKE 'TEST%'");

    // -----------------------------------------------------------------
    // 2) Catálogos · CDMX + Gustavo A. Madero (ON DUPLICATE KEY UPDATE)
    // -----------------------------------------------------------------
    $stmtEnt = $pdo->prepare("
        INSERT INTO ENTIDAD_FEDERATIVA (nombre)
        VALUES (:nombre)
        ON DUPLICATE KEY UPDATE id_entidad = LAST_INSERT_ID(id_entidad)
    ");
    $stmtEnt->execute([':nombre' => 'CDMX']);
    $idEntidad = (int) $pdo->lastInsertId();

    $stmtAlc = $pdo->prepare("
        INSERT INTO ALCALDIA (nombre, id_entidad)
        VALUES (:nombre, :id_entidad)
        ON DUPLICATE KEY UPDATE id_alcaldia = LAST_INSERT_ID(id_alcaldia)
    ");
    $stmtAlc->execute([':nombre' => 'Gustavo A. Madero', ':id_entidad' => $idEntidad]);
    $idAlcaldia = (int) $pdo->lastInsertId();

    // -----------------------------------------------------------------
    // 3) Administrador · password_hash("admin", PASSWORD_BCRYPT)
    // -----------------------------------------------------------------
    $hashAdmin = password_hash('admin', PASSWORD_BCRYPT);
    $stmtAdmin = $pdo->prepare("
        INSERT INTO USUARIO (usuario_login, contrasena, tipo_usuario, curp)
        VALUES (:login, :hash, 'ADMIN', NULL)
        ON DUPLICATE KEY UPDATE
            contrasena   = VALUES(contrasena),
            tipo_usuario = VALUES(tipo_usuario)
    ");
    $stmtAdmin->execute([':login' => 'admin', ':hash' => $hashAdmin]);

    // -----------------------------------------------------------------
    // 4) 25 alumnos de prueba
    // -----------------------------------------------------------------
    $stmtAlumno = $pdo->prepare("
        INSERT INTO ALUMNO
            (curp, boleta, nombre_completo, fecha_nacimiento, genero, telefono, carrera)
        VALUES
            (:curp, :boleta, :nombre, :fecha_nac, :genero, :telefono, :carrera)
    ");
    $stmtProc = $pdo->prepare("
        INSERT INTO PROCEDENCIA (curp, id_alcaldia, escuela_procedencia, promedio)
        VALUES (:curp, :id_alcaldia, :escuela, :promedio)
    ");
    $stmtUsr = $pdo->prepare("
        INSERT INTO USUARIO (usuario_login, contrasena, tipo_usuario, curp)
        VALUES (:login, :hash, 'alumno', :curp)
    ");
    $stmtAsig = $pdo->prepare("
        INSERT INTO HORARIO_ALUMNO (curp, id_salon, id_horario)
        VALUES (:curp, :id_salon, 1)
    ");

    $letras = 'ABC';

    for ($i = 1; $i <= 25; $i++) {
        $curp     = 'TEST080101HDFXXX' . $letras[intdiv($i - 1, 10)] . (($i - 1) % 10);
        $boleta   = '20266300' . str_pad((string) $i, 2, '0', STR_PAD_LEFT);
        $nombre   = $nombres[$i - 1];
        $fechaNac = (new DateTime('2008-01-01'))
                       ->modify('+' . ($i - 1) . ' days')
                       ->format('Y-m-d');
        $genero   = ($i % 2 === 0) ? 'Masculino' : 'Femenino';
        $telefono = '55' . str_pad((string) $i, 8, '0', STR_PAD_LEFT);
        $carrera  = $carreras[($i - 1) % 3];
        $promedio = round(min(10.0, 7.5 + ($i * 0.1)), 2);
        $idSalon  = intdiv($i - 1, 5) + 1; // 1..5, 5 alumnos por salón

        $stmtAlumno->execute([
            ':curp'      => $curp,
            ':boleta'    => $boleta,
            ':nombre'    => $nombre,
            ':fecha_nac' => $fechaNac,
            ':genero'    => $genero,
            ':telefono'  => $telefono,
            ':carrera'   => $carrera,
        ]);

        $stmtProc->execute([
            ':curp'        => $curp,
            ':id_alcaldia' => $idAlcaldia,
            ':escuela'     => $escuelaPro,
            ':promedio'    => $promedio,
        ]);

        $stmtUsr->execute([
            ':login' => $boleta,
            ':hash'  => password_hash('alumno123', PASSWORD_BCRYPT),
            ':curp'  => $curp,
        ]);

        $stmtAsig->execute([
            ':curp'     => $curp,
            ':id_salon' => $idSalon,
        ]);
    }

    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo "<!doctype html><meta charset='utf-8'>";
    echo "<h2 style='color:#b00020;font-family:sans-serif'>Error al poblar el sistema</h2>";
    echo "<pre style='background:#f8f8f8;padding:1rem'>" . htmlspecialchars($e->getMessage()) . "</pre>";
    exit;
}

// -----------------------------------------------------------------
// Reporte HTML
// -----------------------------------------------------------------
$resumen = $pdo->query("
    SELECT s.nombre AS laboratorio, COUNT(ha.id_horario_alumno) AS alumnos
    FROM SALON s
    LEFT JOIN HORARIO_ALUMNO ha
           ON ha.id_salon = s.id_salon AND ha.id_horario = 1
    GROUP BY s.id_salon, s.nombre
    ORDER BY s.id_salon
")->fetchAll();

?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Población nativa · Sistema Escuela</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 760px; margin: 2rem auto; padding: 0 1rem; color: #1f2937; }
  h1 { color: #047857; }
  table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
  th, td { border: 1px solid #e5e7eb; padding: .55rem .9rem; text-align: left; }
  th { background: #f3f4f6; }
  code { background: #f3f4f6; padding: 1px 6px; border-radius: 4px; }
  .ok { background:#ecfdf5; border-left:4px solid #047857; padding:.8rem 1rem; }
  .warn { background:#fffbeb; border-left:4px solid #b45309; padding:.8rem 1rem; margin-top:1rem; }
</style>
</head>
<body>
  <h1>✓ Sistema poblado de forma nativa</h1>
  <div class="ok">
    Hashes generados con <code>password_hash(..., PASSWORD_BCRYPT)</code> dentro de PHP,
    así que no hay desincronización entre lo que guarda la base y lo que <code>password_verify()</code> espera.
  </div>

  <h3>Credenciales sembradas</h3>
  <table>
    <tr><th>Rol</th><th>usuario_login</th><th>Contraseña en claro</th></tr>
    <tr><td>Administrador</td><td><code>admin</code></td><td><code>admin</code></td></tr>
    <tr><td>Alumnos (25)</td><td><code>2026630001</code> … <code>2026630025</code></td><td><code>alumno123</code></td></tr>
  </table>

  <h3>Distribución en Horario 1 (11:00 — 12:30)</h3>
  <table>
    <tr><th>Laboratorio</th><th>Alumnos asignados</th></tr>
    <?php foreach ($resumen as $row): ?>
      <tr>
        <td><?= htmlspecialchars($row['laboratorio']) ?></td>
        <td><?= (int) $row['alumnos'] ?></td>
      </tr>
    <?php endforeach; ?>
  </table>

  <div class="warn">
    <strong>Recordatorio de seguridad:</strong> elimina <code>api/poblar_sistema.php</code> y
    <code>api/seed_admin.php</code> antes de desplegar fuera del entorno local de XAMPP.
  </div>
</body>
</html>
