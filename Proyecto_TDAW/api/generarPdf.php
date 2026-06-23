<?php
declare(strict_types=1);

error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', '0');

require_once __DIR__ . '/../librerias/fpdf19/fpdf.php';

$pdo = require __DIR__ . '/conexion.php';

if (!isset($_GET['curp']) || trim($_GET['curp']) === '') {
    die('Falta enviar la CURP.');
}

$curp = trim($_GET['curp']);

$stmt = $pdo->prepare("
    SELECT *
    FROM vista_pdf_alumno
    WHERE curp = ?
");

$stmt->execute([$curp]);
$data = $stmt->fetch();

if (!$data) {
    die('No se encontro un alumno con esa CURP.');
}

function pdfText($texto): string
{
    return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', (string)$texto);
}

function fechaTexto($fecha): string
{
    if (empty($fecha)) {
        return '';
    }

    $meses = [
        1 => 'enero',
        2 => 'febrero',
        3 => 'marzo',
        4 => 'abril',
        5 => 'mayo',
        6 => 'junio',
        7 => 'julio',
        8 => 'agosto',
        9 => 'septiembre',
        10 => 'octubre',
        11 => 'noviembre',
        12 => 'diciembre',
    ];

    $ts = strtotime((string)$fecha);

    if ($ts === false) {
        return (string)$fecha;
    }

    return date('j', $ts) . ' de ' . $meses[(int)date('n', $ts)] . ' de ' . date('Y', $ts);
}

class PDF extends FPDF
{
    function Header()
    {
        $this->Image(__DIR__ . '/../assets/Escudo_ipn.png', 10, 5, 25);
        $this->Image(__DIR__ . '/../assets/escudoESCOM.png', 175, 5, 20);

        $this->SetFont('Arial', 'B', 16);
        $this->Ln(8);
        $this->Cell(0, 10, 'COMPROBANTE DE REGISTRO DE NUEVO INGRESO', 0, 1, 'C');

        $this->Line(10, 35, 200, 35);
        $this->Ln(15);
    }

    function Footer()
    {
        $this->SetY(-18);
        $this->SetFont('Arial', 'I', 8);

        $this->Cell(0, 5, 'Proceso de Nuevo Ingreso ESCOM - Periodo 2026-2', 0, 1, 'C');

        $this->Cell(
            0,
            5,
            'Fecha de emision: ' . date('d/m/Y') .
            ' | Pagina ' . $this->PageNo() . '/{nb}',
            0,
            0,
            'C'
        );
    }
}

$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();

/* DATOS PERSONALES */
$pdf->SetFont('Arial', 'B', 13);
$pdf->Cell(0, 10, 'DATOS PERSONALES', 0, 1);

$pdf->SetFont('Arial', '', 11);

$pdf->Cell(50, 8, 'Nombre Completo:', 1);
$pdf->Cell(0, 8, pdfText($data['nombre_completo'] ?? ''), 1, 1);

$pdf->Cell(50, 8, 'CURP:', 1);
$pdf->Cell(0, 8, pdfText($data['curp'] ?? ''), 1, 1);

$pdf->Cell(50, 8, 'Boleta:', 1);
$pdf->Cell(0, 8, pdfText($data['boleta'] ?? ''), 1, 1);

$pdf->Cell(50, 8, 'Fecha de Nacimiento:', 1);
$pdf->Cell(0, 8, pdfText($data['fecha_nacimiento'] ?? ''), 1, 1);

$pdf->Cell(50, 8, 'Genero:', 1);
$pdf->Cell(0, 8, pdfText($data['genero'] ?? ''), 1, 1);

$pdf->Cell(50, 8, 'Telefono:', 1);
$pdf->Cell(0, 8, pdfText($data['telefono'] ?? ''), 1, 1);

$pdf->Cell(50, 8, 'Correo:', 1);
$pdf->Cell(0, 8, pdfText($data['correo'] ?? ''), 1, 1);

$pdf->Ln(5);

/* DATOS ACADEMICOS */
$pdf->SetFont('Arial', 'B', 13);
$pdf->Cell(0, 10, 'DATOS ACADEMICOS', 0, 1);

$pdf->SetFont('Arial', '', 11);

$pdf->Cell(50, 8, 'Carrera:', 1);
$pdf->Cell(0, 8, pdfText($data['carrera'] ?? ''), 1, 1);

$pdf->Cell(50, 8, 'Escuela Procedencia:', 1);
$pdf->Cell(0, 8, pdfText($data['escuela_procedencia'] ?? ''), 1, 1);

$pdf->Cell(50, 8, 'Promedio:', 1);
$pdf->Cell(0, 8, pdfText($data['promedio'] ?? ''), 1, 1);

$pdf->Ln(5);

/* DATOS DE UBICACION */
$pdf->SetFont('Arial', 'B', 13);
$pdf->Cell(0, 10, 'DATOS DE UBICACION', 0, 1);

$pdf->SetFont('Arial', '', 11);

$pdf->Cell(50, 8, 'Entidad Federativa:', 1);
$pdf->Cell(0, 8, pdfText($data['entidad_federativa'] ?? ''), 1, 1);

$alcaldia = !empty($data['alcaldia']) ? $data['alcaldia'] : 'No aplica';

$pdf->Cell(50, 8, 'Alcaldia:', 1);
$pdf->Cell(0, 8, pdfText($alcaldia), 1, 1);

$pdf->Ln(8);

/* ASIGNACION */
$pdf->SetFont('Arial', 'B', 12);

$pdf->SetFillColor(255, 204, 0);
$pdf->SetTextColor(0, 0, 0);
$pdf->Cell(45, 10, 'GRUPO', 1, 0, 'C', true);
$pdf->Cell(0, 10, pdfText($data['grupo'] ?? ''), 1, 1, 'C', true);

$pdf->Ln(4);

$horario = '';
if (!empty($data['hora_inicio']) && !empty($data['hora_fin'])) {
    $horario = substr($data['hora_inicio'], 0, 5) . ' - ' . substr($data['hora_fin'], 0, 5);
}

$pdf->SetFillColor(0, 102, 204);
$pdf->SetTextColor(255, 255, 255);
$pdf->Cell(45, 10, 'HORARIO', 1, 0, 'C', true);
$pdf->Cell(0, 10, pdfText($horario), 1, 1, 'C', true);

$pdf->Ln(4);

$pdf->SetFillColor(153, 102, 204);
$pdf->SetTextColor(255, 255, 255);
$pdf->Cell(45, 10, 'FECHA EXAMEN', 1, 0, 'C', true);
$pdf->Cell(0, 10, pdfText(fechaTexto($data['fecha'] ?? '')), 1, 1, 'C', true);

$pdf->Ln(4);

$pdf->SetFillColor(0, 153, 0);
$pdf->SetTextColor(255, 255, 255);
$pdf->Cell(45, 10, 'LABORATORIO', 1, 0, 'C', true);
$pdf->Cell(0, 10, pdfText($data['salon'] ?? ''), 1, 1, 'C', true);

$pdf->SetTextColor(0, 0, 0);

$pdf->Ln(10);

$pdf->SetFont('Arial', 'I', 10);
$pdf->MultiCell(
    0,
    7,
    pdfText('Este documento no cuenta con validez oficial'),
    0,
    'C'
);

while (ob_get_level() > 0) {
    ob_end_clean();
}

$pdf->Output('I', 'Comprobante_' . $data['curp'] . '.pdf');
exit;