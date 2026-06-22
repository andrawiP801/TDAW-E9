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
    nombre     VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ALCALDIA
-- =====================================================
CREATE TABLE ALCALDIA (
    id_alcaldia INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    id_entidad  INT NOT NULL,
    UNIQUE KEY uk_alcaldia_entidad (nombre, id_entidad),
    FOREIGN KEY (id_entidad) REFERENCES ENTIDAD_FEDERATIVA(id_entidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ALUMNO
--   fecha_nacimiento y genero NULL-ables para permitir
--   altas delgadas desde el panel admin (boleta + nombre + carrera).
-- =====================================================
CREATE TABLE ALUMNO (
    curp             VARCHAR(18)  PRIMARY KEY,
    boleta           VARCHAR(20)  UNIQUE,
    nombre_completo  VARCHAR(150) NOT NULL,
    fecha_nacimiento DATE         NULL,
    genero           VARCHAR(25)  NULL,
    telefono         VARCHAR(15)  NULL,
    carrera          VARCHAR(10)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USUARIO  (CASCADE: si se borra el alumno, se borra su cuenta)
-- =====================================================
CREATE TABLE USUARIO (
    id_usuario    INT AUTO_INCREMENT PRIMARY KEY,
    usuario_login VARCHAR(120) NOT NULL UNIQUE,
    contrasena    VARCHAR(255) NOT NULL,
    tipo_usuario  VARCHAR(10)  NOT NULL DEFAULT 'alumno',
    curp          VARCHAR(18)  UNIQUE,
    FOREIGN KEY (curp) REFERENCES ALUMNO(curp) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PROCEDENCIA  (CASCADE)
-- =====================================================
CREATE TABLE PROCEDENCIA (
    curp                 VARCHAR(18)  PRIMARY KEY,
    id_alcaldia          INT          NULL,
    escuela_procedencia  VARCHAR(150) NULL,
    promedio             DECIMAL(4,2) NULL,
    FOREIGN KEY (curp)        REFERENCES ALUMNO(curp)    ON DELETE CASCADE,
    FOREIGN KEY (id_alcaldia) REFERENCES ALCALDIA(id_alcaldia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SALON · 5 laboratorios oficiales
-- =====================================================
CREATE TABLE SALON (
    id_salon INT PRIMARY KEY,
    nombre   VARCHAR(30) NOT NULL,
    cupo_max INT NOT NULL DEFAULT 30
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO SALON (id_salon, nombre, cupo_max) VALUES
    (1, 'Laboratorio 1', 30),
    (2, 'Laboratorio 2', 30),
    (3, 'Laboratorio 3', 30),
    (4, 'Laboratorio 4', 30),
    (5, 'Laboratorio 5', 30);

-- =====================================================
-- HORARIO · 3 bloques 24-AGO-2026 con desfase de 15 min
-- =====================================================
CREATE TABLE HORARIO (
    id_horario  INT AUTO_INCREMENT PRIMARY KEY,
    fecha       DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin    TIME NOT NULL,
    cupo_max    INT  NOT NULL DEFAULT 150,
    UNIQUE KEY uk_horario_fecha_hora (fecha, hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO HORARIO (id_horario, fecha, hora_inicio, hora_fin, cupo_max) VALUES
    (1, '2026-08-24', '11:00:00', '12:30:00', 150),
    (2, '2026-08-24', '12:45:00', '14:15:00', 150),
    (3, '2026-08-24', '14:30:00', '16:00:00', 150);

-- =====================================================
-- HORARIO_ALUMNO · asignación (CASCADE para liberar cupo al borrar alumno)
-- =====================================================
CREATE TABLE HORARIO_ALUMNO (
    id_horario_alumno INT AUTO_INCREMENT PRIMARY KEY,
    curp              VARCHAR(18) NOT NULL,
    id_salon          INT         NOT NULL,
    id_horario        INT         NOT NULL,
    fecha_registro    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_alumno_horario (curp, id_horario),
    KEY ix_ha_horario_salon (id_horario, id_salon),
    FOREIGN KEY (curp)       REFERENCES ALUMNO(curp)     ON DELETE CASCADE,
    FOREIGN KEY (id_salon)   REFERENCES SALON(id_salon),
    FOREIGN KEY (id_horario) REFERENCES HORARIO(id_horario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TRIGGERS · validación estricta de cupos
-- =====================================================
DELIMITER $$

CREATE TRIGGER trg_horario_alumno_bi
BEFORE INSERT ON HORARIO_ALUMNO
FOR EACH ROW
BEGIN
    DECLARE v_count_lab    INT DEFAULT 0;
    DECLARE v_count_global INT DEFAULT 0;
    DECLARE v_cupo_lab     INT DEFAULT 30;
    DECLARE v_cupo_global  INT DEFAULT 150;

    SELECT cupo_max INTO v_cupo_lab    FROM SALON   WHERE id_salon   = NEW.id_salon;
    SELECT cupo_max INTO v_cupo_global FROM HORARIO WHERE id_horario = NEW.id_horario;

    SELECT COUNT(*) INTO v_count_lab
    FROM HORARIO_ALUMNO
    WHERE id_horario = NEW.id_horario AND id_salon = NEW.id_salon;

    IF v_count_lab >= v_cupo_lab THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Laboratorio lleno: ya hay 30 alumnos en este horario.';
    END IF;

    SELECT COUNT(*) INTO v_count_global
    FROM HORARIO_ALUMNO
    WHERE id_horario = NEW.id_horario;

    IF v_count_global >= v_cupo_global THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Turno lleno: ya hay 150 alumnos en este horario.';
    END IF;
END$$

-- Misma validación al re-asignar lab/horario desde el panel admin.
CREATE TRIGGER trg_horario_alumno_bu
BEFORE UPDATE ON HORARIO_ALUMNO
FOR EACH ROW
BEGIN
    DECLARE v_count_lab    INT DEFAULT 0;
    DECLARE v_count_global INT DEFAULT 0;
    DECLARE v_cupo_lab     INT DEFAULT 30;
    DECLARE v_cupo_global  INT DEFAULT 150;

    IF NEW.id_horario = OLD.id_horario AND NEW.id_salon = OLD.id_salon THEN
        -- Sin cambio de (horario, salón): no hay que revalidar cupos.
        SET v_count_lab = 0;
    ELSE
        SELECT cupo_max INTO v_cupo_lab    FROM SALON   WHERE id_salon   = NEW.id_salon;
        SELECT cupo_max INTO v_cupo_global FROM HORARIO WHERE id_horario = NEW.id_horario;

        SELECT COUNT(*) INTO v_count_lab
        FROM HORARIO_ALUMNO
        WHERE id_horario = NEW.id_horario
          AND id_salon   = NEW.id_salon
          AND id_horario_alumno <> OLD.id_horario_alumno;

        IF v_count_lab >= v_cupo_lab THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Laboratorio lleno: ya hay 30 alumnos en ese horario.';
        END IF;

        SELECT COUNT(*) INTO v_count_global
        FROM HORARIO_ALUMNO
        WHERE id_horario = NEW.id_horario
          AND id_horario_alumno <> OLD.id_horario_alumno;

        IF v_count_global >= v_cupo_global THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Turno lleno: ya hay 150 alumnos en ese horario.';
        END IF;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- PROCEDIMIENTO · sp_insert_alumno_completo
--   Inserta ALUMNO + PROCEDENCIA + USUARIO con upsert
--   sobre ENTIDAD_FEDERATIVA y ALCALDIA.
-- =====================================================
DELIMITER $$

CREATE PROCEDURE sp_insert_alumno_completo (
    IN p_curp             VARCHAR(18),
    IN p_boleta           VARCHAR(20),
    IN p_nombre_completo  VARCHAR(150),
    IN p_fecha_nacimiento DATE,
    IN p_genero           VARCHAR(25),
    IN p_telefono         VARCHAR(15),
    IN p_entidad          VARCHAR(100),
    IN p_alcaldia         VARCHAR(100),
    IN p_escuela          VARCHAR(150),
    IN p_promedio         DECIMAL(4,2),
    IN p_usuario_login    VARCHAR(120),
    IN p_contrasena       VARCHAR(255),
    IN p_tipo_usuario     VARCHAR(10)
)
BEGIN
    DECLARE v_id_entidad  INT DEFAULT NULL;
    DECLARE v_id_alcaldia INT DEFAULT NULL;

    INSERT INTO ENTIDAD_FEDERATIVA(nombre)
    VALUES (p_entidad)
    ON DUPLICATE KEY UPDATE id_entidad = LAST_INSERT_ID(id_entidad);
    SET v_id_entidad = LAST_INSERT_ID();

    IF p_alcaldia IS NOT NULL AND TRIM(p_alcaldia) <> '' THEN
        INSERT INTO ALCALDIA(nombre, id_entidad)
        VALUES (p_alcaldia, v_id_entidad)
        ON DUPLICATE KEY UPDATE id_alcaldia = LAST_INSERT_ID(id_alcaldia);
        SET v_id_alcaldia = LAST_INSERT_ID();
    END IF;

    INSERT INTO ALUMNO (curp, boleta, nombre_completo, fecha_nacimiento, genero, telefono)
    VALUES (p_curp, p_boleta, p_nombre_completo, p_fecha_nacimiento, p_genero, p_telefono);

    INSERT INTO PROCEDENCIA (curp, id_alcaldia, escuela_procedencia, promedio)
    VALUES (p_curp, v_id_alcaldia, p_escuela, p_promedio);

    INSERT INTO USUARIO (usuario_login, contrasena, tipo_usuario, curp)
    VALUES (p_usuario_login, p_contrasena, COALESCE(NULLIF(p_tipo_usuario, ''), 'alumno'), p_curp);
END$$

DELIMITER ;
