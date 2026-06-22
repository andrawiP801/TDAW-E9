-- =====================================================
-- BASE DE DATOS
-- =====================================================
CREATE DATABASE IF NOT EXISTS Escuela;
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
    FOREIGN KEY (id_entidad) REFERENCES ENTIDAD_FEDERATIVA(id_entidad)
) ENGINE=InnoDB;

-- =====================================================
-- ALUMNO
-- =====================================================
CREATE TABLE ALUMNO (
    curp VARCHAR(18) PRIMARY KEY,
    boleta VARCHAR(20) UNIQUE,
    nombre_completo VARCHAR(150),
    fecha_nacimiento DATE,
    genero CHAR(1),
    telefono VARCHAR(15)
) ENGINE=InnoDB;

-- =====================================================
-- USUARIO
-- =====================================================
CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    usuario_login VARCHAR(120) UNIQUE,
    contrasena VARCHAR(255),
    tipo_usuario VARCHAR(10),
    curp VARCHAR(18) UNIQUE,
    FOREIGN KEY (curp) REFERENCES ALUMNO(curp)
) ENGINE=InnoDB;

-- =====================================================
-- PROCEDENCIA
-- =====================================================
CREATE TABLE PROCEDENCIA (
    curp VARCHAR(18) PRIMARY KEY,
    id_alcaldia INT,
    escuela_procedencia VARCHAR(150),
    promedio DECIMAL(4,2),
    FOREIGN KEY (curp) REFERENCES ALUMNO(curp),
    FOREIGN KEY (id_alcaldia) REFERENCES ALCALDIA(id_alcaldia)
) ENGINE=InnoDB;

-- =====================================================
-- SALON
-- =====================================================
CREATE TABLE SALON (
    id_salon INT PRIMARY KEY,
    edificio INT NOT NULL,
    piso INT
) ENGINE=InnoDB;

-- =====================================================
-- HORARIO (3 HORAS FIJAS, 150 ALUMNOS)
-- =====================================================
CREATE TABLE HORARIO (
    id_horario INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,

    cupo_max INT DEFAULT 150,
    cupo_actual INT DEFAULT 0
) ENGINE=InnoDB;

-- =====================================================
-- HORARIO_ALUMNO
-- =====================================================
CREATE TABLE HORARIO_ALUMNO (
    id_horario_alumno INT AUTO_INCREMENT PRIMARY KEY,
    curp VARCHAR(18) NOT NULL,
    id_salon INT NOT NULL,
    id_horario INT NOT NULL,

    UNIQUE(curp, id_horario),

    FOREIGN KEY (curp) REFERENCES ALUMNO(curp),
    FOREIGN KEY (id_salon) REFERENCES SALON(id_salon),
    FOREIGN KEY (id_horario) REFERENCES HORARIO(id_horario)
) ENGINE=InnoDB;

-- =====================================================
-- SALONES (20 REGISTROS)
-- =====================================================
INSERT INTO SALON VALUES
(1101,1,1),(1102,1,1),(1103,1,1),(1104,1,1),(1105,1,1),
(1201,1,2),(1202,1,2),(1203,1,2),(1204,1,2),(1205,1,2),
(2101,2,1),(2102,2,1),(2103,2,1),(2104,2,1),(2105,2,1),
(2201,2,2),(2202,2,2),(2203,2,2),(2204,2,2),(2205,2,2);

-- =====================================================
-- HORARIOS (SOLO 3 BLOQUES)
-- =====================================================
INSERT INTO HORARIO (fecha, hora) VALUES
('2026-06-24','11:00:00'),
('2026-06-24','12:30:00'),
('2026-06-24','14:00:00');

-- =====================================================
-- TRIGGER: CONTROL 150 ALUMNOS
-- =====================================================
DELIMITER $$

CREATE TRIGGER trg_horario_insert
AFTER INSERT ON HORARIO_ALUMNO
FOR EACH ROW
BEGIN
    UPDATE HORARIO
    SET cupo_actual = cupo_actual + 1
    WHERE id_horario = NEW.id_horario;

    IF (SELECT cupo_actual FROM HORARIO WHERE id_horario = NEW.id_horario) > 150 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Máximo 150 alumnos por horario';
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- TRIGGER DELETE
-- =====================================================
DELIMITER $$

CREATE TRIGGER trg_horario_delete
AFTER DELETE ON HORARIO_ALUMNO
FOR EACH ROW
BEGIN
    UPDATE HORARIO
    SET cupo_actual = cupo_actual - 1
    WHERE id_horario = OLD.id_horario;
END$$

DELIMITER ;

-- =====================================================
-- PROCEDIMIENTO COMPLETO
-- =====================================================
DELIMITER $$

CREATE PROCEDURE sp_insert_alumno_completo (
    IN p_curp VARCHAR(18),
    IN p_boleta VARCHAR(20),
    IN p_nombre_completo VARCHAR(150),
    IN p_fecha_nacimiento DATE,
    IN p_genero CHAR(1),
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
    DECLARE v_id_entidad INT;
    DECLARE v_id_alcaldia INT;

    IF NOT EXISTS (SELECT 1 FROM ENTIDAD_FEDERATIVA WHERE nombre = p_entidad) THEN
        INSERT INTO ENTIDAD_FEDERATIVA(nombre) VALUES(p_entidad);
    END IF;

    SELECT id_entidad INTO v_id_entidad
    FROM ENTIDAD_FEDERATIVA
    WHERE nombre = p_entidad
    LIMIT 1;

    IF NOT EXISTS (
        SELECT 1 FROM ALCALDIA
        WHERE nombre = p_alcaldia AND id_entidad = v_id_entidad
    ) THEN
        INSERT INTO ALCALDIA(nombre,id_entidad)
        VALUES(p_alcaldia,v_id_entidad);
    END IF;

    SELECT id_alcaldia INTO v_id_alcaldia
    FROM ALCALDIA
    WHERE nombre = p_alcaldia AND id_entidad = v_id_entidad
    LIMIT 1;

    INSERT INTO ALUMNO VALUES
    (p_curp,p_boleta,p_nombre_completo,p_fecha_nacimiento,p_genero,p_telefono);

    INSERT INTO PROCEDENCIA VALUES
    (p_curp,v_id_alcaldia,p_escuela,p_promedio);

    INSERT INTO USUARIO(usuario_login,contrasena,tipo_usuario,curp)
    VALUES(p_usuario_login,p_contrasena,p_tipo_usuario,p_curp);

END$$

DELIMITER ;