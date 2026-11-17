-- Importa este archivo en phpMyAdmin (pestaña "Importar") dentro de tu base de datos.

CREATE TABLE IF NOT EXISTS pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  rut VARCHAR(20) NOT NULL,
  nacimiento DATE,
  grupo VARCHAR(5),
  telefono VARCHAR(30),
  alergias TEXT,
  medicamentos TEXT,
  antecedentes TEXT
);

CREATE TABLE IF NOT EXISTS atenciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  fecha DATE,
  profesional VARCHAR(100),
  motivo VARCHAR(200),
  sintomas TEXT,
  presion VARCHAR(20),
  temperatura VARCHAR(10),
  peso VARCHAR(10),
  diagnostico TEXT,
  indicaciones TEXT,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- Paciente de ejemplo
INSERT INTO pacientes (nombre, rut, nacimiento, grupo, telefono, alergias, medicamentos, antecedentes)
VALUES ('Sofía Pérez', '21.345.678-9', '2010-04-18', 'O+', '+56 9 5555 1234',
        'Polen, penicilina', 'Loratadina 10 mg', 'Rinitis alérgica, sin cirugías previas');

INSERT INTO atenciones (paciente_id, fecha, profesional, motivo, sintomas, presion, temperatura, peso, diagnostico, indicaciones)
VALUES (1, '2026-08-12', 'Dra. Valentina Rojas', 'Control general', 'Cansancio', '110/70', '36.4', '54',
        'Estado general saludable', 'Hidratación, descanso y control en seis meses');

-- Doctores que pueden iniciar sesión.
-- El primer doctor (administrador) lo crea api/conexion.php cuando la tabla está vacía.
CREATE TABLE IF NOT EXISTS doctores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  clave VARCHAR(255) NOT NULL
);
