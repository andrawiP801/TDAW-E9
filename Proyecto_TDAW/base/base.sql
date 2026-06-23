-- =====================================================
-- BASE DE DATOS · Escuela (Registro Nuevo Ingreso ESCOM)
-- Motor: InnoDB · Charset: utf8mb4
-- =====================================================

DROP DATABASE IF EXISTS Escuela;

CREATE DATABASE Escuela
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE Escuela;

-- =====================================================
-- ENTIDAD FEDERATIVA
-- =====================================================
CREATE TABLE ENTIDAD_FEDERATIVA (
    id_entidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- =====================================================
-- ALCALDIA
-- =====================================================
CREATE TABLE ALCALDIA (
    id_alcaldia INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_entidad INT NOT NULL,

    UNIQUE(nombre, id_entidad),

    FOREIGN KEY (id_entidad)
        REFERENCES ENTIDAD_FEDERATIVA(id_entidad)
) ENGINE=InnoDB;

-- =====================================================
-- ALUMNO
-- =====================================================
CREATE TABLE ALUMNO (
    curp VARCHAR(18) PRIMARY KEY,
    boleta VARCHAR(20) UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    fecha_nacimiento DATE NULL,
    genero VARCHAR(25) NULL,
    telefono VARCHAR(15) NULL,
    carrera VARCHAR(10) NULL
) ENGINE=InnoDB;

-- =====================================================
-- USUARIO
-- =====================================================
CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    usuario_login VARCHAR(120) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('ADMIN','ALUMNO') NOT NULL DEFAULT 'ALUMNO',
    curp VARCHAR(18) UNIQUE,

    FOREIGN KEY (curp)
        REFERENCES ALUMNO(curp)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- PROCEDENCIA
-- =====================================================
CREATE TABLE PROCEDENCIA (
    curp VARCHAR(18) PRIMARY KEY,
    id_entidad INT NULL,
    id_alcaldia INT NULL,
    escuela_procedencia VARCHAR(150) NULL,
    promedio DECIMAL(4,2) NULL,

    FOREIGN KEY (curp)
        REFERENCES ALUMNO(curp)
        ON DELETE CASCADE,

    FOREIGN KEY (id_entidad)
        REFERENCES ENTIDAD_FEDERATIVA(id_entidad),

    FOREIGN KEY (id_alcaldia)
        REFERENCES ALCALDIA(id_alcaldia)
) ENGINE=InnoDB;

-- =====================================================
-- SALON
-- =====================================================
CREATE TABLE SALON (
    id_salon INT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL,
    cupo_max INT NOT NULL DEFAULT 30
) ENGINE=InnoDB;

INSERT INTO SALON (id_salon, nombre, cupo_max) VALUES
(1, 'Laboratorio 1', 30),
(2, 'Laboratorio 2', 30),
(3, 'Laboratorio 3', 30),
(4, 'Laboratorio 4', 30),
(5, 'Laboratorio 5', 30);

-- =====================================================
-- HORARIO
-- =====================================================
CREATE TABLE HORARIO (
    id_horario INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cupo_max INT NOT NULL DEFAULT 150,
    grupo VARCHAR(10) NOT NULL,

    UNIQUE(fecha, hora_inicio)
) ENGINE=InnoDB;

INSERT INTO HORARIO (id_horario, fecha, hora_inicio, hora_fin, cupo_max, grupo) VALUES
(1, '2026-08-24', '11:00:00', '12:30:00', 150, '1CM1'),
(2, '2026-08-24', '12:45:00', '14:15:00', 150, '1CM2'),
(3, '2026-08-24', '14:30:00', '16:00:00', 150, '1CM3');

-- =====================================================
-- HORARIO_ALUMNO
-- =====================================================
CREATE TABLE HORARIO_ALUMNO (
    id_horario_alumno INT AUTO_INCREMENT PRIMARY KEY,
    curp VARCHAR(18) NOT NULL,
    id_salon INT NOT NULL,
    id_horario INT NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(curp, id_horario),

    FOREIGN KEY (curp)
        REFERENCES ALUMNO(curp)
        ON DELETE CASCADE,

    FOREIGN KEY (id_salon)
        REFERENCES SALON(id_salon),

    FOREIGN KEY (id_horario)
        REFERENCES HORARIO(id_horario)
) ENGINE=InnoDB;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER $$

CREATE TRIGGER trg_horario_alumno_bi
BEFORE INSERT ON HORARIO_ALUMNO
FOR EACH ROW
BEGIN
    DECLARE v_lab INT;
    DECLARE v_horario INT;
    DECLARE v_cupo_lab INT;
    DECLARE v_cupo_horario INT;

    SELECT cupo_max INTO v_cupo_lab
    FROM SALON
    WHERE id_salon = NEW.id_salon;

    SELECT cupo_max INTO v_cupo_horario
    FROM HORARIO
    WHERE id_horario = NEW.id_horario;

    SELECT COUNT(*) INTO v_lab
    FROM HORARIO_ALUMNO
    WHERE id_horario = NEW.id_horario
      AND id_salon = NEW.id_salon;

    IF v_lab >= v_cupo_lab THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cupo lleno en laboratorio';
    END IF;

    SELECT COUNT(*) INTO v_horario
    FROM HORARIO_ALUMNO
    WHERE id_horario = NEW.id_horario;

    IF v_horario >= v_cupo_horario THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cupo lleno en horario';
    END IF;
END$$

CREATE TRIGGER trg_horario_alumno_bu
BEFORE UPDATE ON HORARIO_ALUMNO
FOR EACH ROW
BEGIN
    DECLARE v_lab INT;
    DECLARE v_horario INT;
    DECLARE v_cupo_lab INT;
    DECLARE v_cupo_horario INT;

    SELECT cupo_max INTO v_cupo_lab
    FROM SALON
    WHERE id_salon = NEW.id_salon;

    SELECT cupo_max INTO v_cupo_horario
    FROM HORARIO
    WHERE id_horario = NEW.id_horario;

    SELECT COUNT(*) INTO v_lab
    FROM HORARIO_ALUMNO
    WHERE id_horario = NEW.id_horario
      AND id_salon = NEW.id_salon
      AND id_horario_alumno <> OLD.id_horario_alumno;

    IF v_lab >= v_cupo_lab THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cupo lleno en laboratorio';
    END IF;

    SELECT COUNT(*) INTO v_horario
    FROM HORARIO_ALUMNO
    WHERE id_horario = NEW.id_horario
      AND id_horario_alumno <> OLD.id_horario_alumno;

    IF v_horario >= v_cupo_horario THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cupo lleno en horario';
    END IF;
END$$

-- =====================================================
-- PROCEDIMIENTO · sp_insert_alumno_completo
-- =====================================================

CREATE PROCEDURE sp_insert_alumno_completo (
    IN p_curp VARCHAR(18),
    IN p_boleta VARCHAR(20),
    IN p_nombre VARCHAR(150),
    IN p_fecha_nacimiento DATE,
    IN p_genero VARCHAR(25),
    IN p_telefono VARCHAR(15),
    IN p_entidad VARCHAR(100),
    IN p_alcaldia VARCHAR(100),
    IN p_escuela VARCHAR(150),
    IN p_promedio DECIMAL(4,2),
    IN p_usuario_login VARCHAR(120),
    IN p_contrasena VARCHAR(255),
    IN p_tipo_usuario VARCHAR(10)
)
BEGIN
    DECLARE v_id_entidad INT DEFAULT NULL;
    DECLARE v_id_alcaldia INT DEFAULT NULL;

    INSERT INTO ENTIDAD_FEDERATIVA(nombre)
    VALUES (p_entidad)
    ON DUPLICATE KEY UPDATE id_entidad = LAST_INSERT_ID(id_entidad);

    SET v_id_entidad = LAST_INSERT_ID();

    IF p_alcaldia IS NOT NULL
       AND TRIM(p_alcaldia) <> ''
       AND LOWER(TRIM(p_alcaldia)) <> '(no aplica)' THEN

        INSERT INTO ALCALDIA(nombre, id_entidad)
        VALUES (p_alcaldia, v_id_entidad)
        ON DUPLICATE KEY UPDATE id_alcaldia = LAST_INSERT_ID(id_alcaldia);

        SET v_id_alcaldia = LAST_INSERT_ID();
    END IF;

    INSERT INTO ALUMNO (
        curp,
        boleta,
        nombre_completo,
        fecha_nacimiento,
        genero,
        telefono,
        carrera
    )
    VALUES (
        p_curp,
        p_boleta,
        p_nombre,
        p_fecha_nacimiento,
        p_genero,
        p_telefono,
        'ISC'
    );

    INSERT INTO PROCEDENCIA (
        curp,
        id_entidad,
        id_alcaldia,
        escuela_procedencia,
        promedio
    )
    VALUES (
        p_curp,
        v_id_entidad,
        v_id_alcaldia,
        p_escuela,
        p_promedio
    );

    INSERT INTO USUARIO (
        usuario_login,
        contrasena,
        tipo_usuario,
        curp
    )
    VALUES (
        p_usuario_login,
        p_contrasena,
        UPPER(COALESCE(NULLIF(p_tipo_usuario, ''), 'ALUMNO')),
        p_curp
    );
END$$

DELIMITER ;

-- =====================================================
-- VISTA PARA PDF
-- =====================================================

CREATE OR REPLACE VIEW vista_pdf_alumno AS
SELECT
    a.curp,
    a.boleta,
    a.nombre_completo,
    a.fecha_nacimiento,
    a.genero,
    a.telefono,
    a.carrera,
    h.fecha,
    h.grupo AS grupo,
    u.usuario_login AS correo,
    p.escuela_procedencia,
    p.promedio,
    ef.nombre AS entidad_federativa,
    al.nombre AS alcaldia,
    h.hora_inicio,
    h.hora_fin,
    s.nombre AS salon,
    ha.fecha_registro
FROM ALUMNO a
LEFT JOIN USUARIO u
    ON u.curp = a.curp
LEFT JOIN PROCEDENCIA p
    ON p.curp = a.curp
LEFT JOIN ENTIDAD_FEDERATIVA ef
    ON ef.id_entidad = p.id_entidad
LEFT JOIN ALCALDIA al
    ON al.id_alcaldia = p.id_alcaldia
LEFT JOIN HORARIO_ALUMNO ha
    ON ha.curp = a.curp
LEFT JOIN HORARIO h
    ON h.id_horario = ha.id_horario
LEFT JOIN SALON s
    ON s.id_salon = ha.id_salon;