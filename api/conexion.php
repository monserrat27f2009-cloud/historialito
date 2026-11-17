<?php
// ===== DATOS DE TU BASE DE DATOS =====
// En XAMPP (tu computador) déjalo así.
// En InfinityFree cámbialos por los que te muestra el panel en "MySQL Databases".
$servidor = "localhost";      // InfinityFree: "MySQL Hostname", ej: sql123.infinityfree.com
$usuario  = "root";           // InfinityFree: "MySQL Username", ej: if0_12345678
$clave    = "";               // InfinityFree: "MySQL Password" (la contraseña de tu cuenta de hosting)
$base     = "historialito";   // InfinityFree: "MySQL DB Name", ej: if0_12345678_historialito

// ===== PRIMER DOCTOR (ADMINISTRADOR) =====
// Se crea solo si la tabla doctores está vacía.
// En InfinityFree cambia el correo y la contraseña ANTES de abrir la página por primera vez.
$admin_nombre = "Administrador";
$admin_correo = "admin@historialito.cl";
$admin_clave  = "cambiame";

$db = new PDO("mysql:host=$servidor;dbname=$base;charset=utf8mb4", $usuario, $clave);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// Crea las tablas automáticamente si todavía no existen
$db->exec("CREATE TABLE IF NOT EXISTS pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  rut VARCHAR(20) NOT NULL,
  nacimiento DATE,
  grupo VARCHAR(5),
  telefono VARCHAR(30),
  alergias TEXT,
  medicamentos TEXT,
  antecedentes TEXT
)");

$db->exec("CREATE TABLE IF NOT EXISTS atenciones (
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
)");

// Tabla de doctores (los que pueden iniciar sesión)
$db->exec("CREATE TABLE IF NOT EXISTS doctores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  clave VARCHAR(255) NOT NULL
)");

// Si no hay ningún doctor, crea el administrador para poder entrar
if ($db->query("SELECT COUNT(*) FROM doctores")->fetchColumn() == 0) {
  $db->prepare("INSERT INTO doctores (nombre, correo, clave) VALUES (?, ?, ?)")
     ->execute([$admin_nombre, $admin_correo, password_hash($admin_clave, PASSWORD_DEFAULT)]);
}
