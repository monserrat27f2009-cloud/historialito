<?php
// Este archivo es el "puente" entre tu página (JavaScript) y MySQL.
session_start();
header("Content-Type: application/json; charset=utf-8");

function responder($datos, $codigo = 200) {
  http_response_code($codigo);
  echo json_encode($datos);
  exit;
}

try {
  require "conexion.php";

  $accion = $_GET["accion"] ?? "";
  $datos  = json_decode(file_get_contents("php://input"), true) ?? [];

  // ===== INICIAR SESIÓN =====
  if ($accion === "login") {
    $consulta = $db->prepare("SELECT * FROM doctores WHERE correo = ?");
    $consulta->execute([$datos["correo"]]);
    $doctor = $consulta->fetch();

    if (!$doctor || !password_verify($datos["clave"], $doctor["clave"])) {
      responder(["error" => "Correo o contraseña incorrectos"], 401);
    }

    $_SESSION["doctor"] = ["id" => $doctor["id"], "nombre" => $doctor["nombre"]];
    responder($_SESSION["doctor"]);
  }

  // ===== CERRAR SESIÓN =====
  if ($accion === "logout") {
    session_destroy();
    responder(["ok" => true]);
  }

  // ===== DE AQUÍ PARA ABAJO, SOLO DOCTORES CON SESIÓN INICIADA =====
  if (empty($_SESSION["doctor"])) {
    responder(["error" => "Debes iniciar sesión"], 401);
  }
  $doctor = $_SESSION["doctor"];

  // Quién soy (el doctor que inició sesión)
  if ($accion === "yo") {
    responder($doctor);
  }

  // Traer todos los pacientes con sus atenciones
  if ($accion === "listar") {
    $pacientes  = $db->query("SELECT * FROM pacientes ORDER BY nombre")->fetchAll();
    $atenciones = $db->query("SELECT * FROM atenciones ORDER BY fecha, id")->fetchAll();

    foreach ($pacientes as $i => $paciente) {
      $pacientes[$i]["atenciones"] = [];
      foreach ($atenciones as $atencion) {
        if ($atencion["paciente_id"] == $paciente["id"]) {
          $pacientes[$i]["atenciones"][] = $atencion;
        }
      }
    }
    responder($pacientes);
  }

  // Crear o actualizar un paciente
  if ($accion === "guardar_paciente") {
    $valores = [
      $datos["nombre"], $datos["rut"], $datos["nacimiento"], $datos["grupo"],
      $datos["telefono"], $datos["alergias"], $datos["medicamentos"], $datos["antecedentes"]
    ];

    if (!empty($datos["id"])) {
      $valores[] = $datos["id"];
      $db->prepare("UPDATE pacientes SET nombre=?, rut=?, nacimiento=?, grupo=?, telefono=?,
                    alergias=?, medicamentos=?, antecedentes=? WHERE id=?")->execute($valores);
      responder(["id" => $datos["id"]]);
    }

    $db->prepare("INSERT INTO pacientes (nombre, rut, nacimiento, grupo, telefono, alergias, medicamentos, antecedentes)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)")->execute($valores);
    responder(["id" => $db->lastInsertId()]);
  }

  // Agregar una atención (el profesional es el doctor que inició sesión)
  if ($accion === "agregar_atencion") {
    $db->prepare("INSERT INTO atenciones (paciente_id, fecha, profesional, motivo, sintomas, presion,
                  temperatura, peso, diagnostico, indicaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
       ->execute([
         $datos["paciente_id"], $datos["fecha"], $doctor["nombre"], $datos["motivo"], $datos["sintomas"],
         $datos["presion"], $datos["temperatura"], $datos["peso"], $datos["diagnostico"], $datos["indicaciones"]
       ]);
    responder(["ok" => true]);
  }

  // Ver la lista de doctores (sin las contraseñas)
  if ($accion === "listar_doctores") {
    responder($db->query("SELECT id, nombre, correo FROM doctores ORDER BY nombre")->fetchAll());
  }

  // Crear un doctor nuevo
  if ($accion === "crear_doctor") {
    $existe = $db->prepare("SELECT COUNT(*) FROM doctores WHERE correo = ?");
    $existe->execute([$datos["correo"]]);
    if ($existe->fetchColumn() > 0) {
      responder(["error" => "Ya existe un doctor con ese correo"], 400);
    }

    $db->prepare("INSERT INTO doctores (nombre, correo, clave) VALUES (?, ?, ?)")
       ->execute([$datos["nombre"], $datos["correo"], password_hash($datos["clave"], PASSWORD_DEFAULT)]);
    responder(["ok" => true]);
  }

  responder(["error" => "Acción desconocida"], 400);

} catch (Exception $e) {
  responder(["error" => $e->getMessage()], 500);
}
