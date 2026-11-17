// Los datos se guardan en MySQL a través de api/api.php
const API = "api/api.php";
let doctorActual = null;

// Le pide algo a la API. Si mandas "datos", se envían (POST); si no, solo se lee (GET).
async function pedirAPI(accion, datos) {
  const opciones = datos
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) }
    : {};
  const respuesta = await fetch(API + "?accion=" + accion, opciones);
  const resultado = await respuesta.json();

  // Si no hay sesión iniciada, mandar al login
  if (respuesta.status === 401 && !document.getElementById("form-login")) {
    location.href = "login.html";
  }
  if (!respuesta.ok) throw new Error(resultado.error || "Error con la base de datos");
  return resultado;
}

function leerPacientes() {
  return pedirAPI("listar");
}

async function enviar(accion, datos) {
  try {
    return await pedirAPI(accion, datos);
  } catch (error) {
    alert(error.message);
    throw error;
  }
}

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}

function calcularEdad(fecha) {
  if (!fecha) return "Sin dato";
  const hoy = new Date();
  const nacimiento = new Date(fecha + "T00:00:00");
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate())) edad--;
  return edad + " años";
}

async function mostrarInicio() {
  const tabla = document.getElementById("lista-pacientes");
  if (!tabla) return;

  const pacientes = await leerPacientes();
  document.getElementById("total-pacientes").textContent = pacientes.length;

  function dibujar(filtro) {
    const encontrados = pacientes.filter(function (paciente) {
      const texto = (paciente.nombre + paciente.rut).toLowerCase();
      return texto.includes(filtro.toLowerCase());
    });

    tabla.innerHTML = encontrados.map(function (paciente) {
      const ultima = paciente.atenciones[paciente.atenciones.length - 1];
      return `<tr>
        <td><strong>${escapar(paciente.nombre)}</strong></td>
        <td>${escapar(paciente.rut)}</td>
        <td>${calcularEdad(paciente.nacimiento)}</td>
        <td>${ultima ? escapar(ultima.fecha) : "Sin controles"}</td>
        <td><span class="new badge blue lighten-2 black-text" data-badge-caption="">Registrado</span></td>
        <td><a class="indigo-text text-darken-4" href="historial.html?id=${paciente.id}">Ver historial</a></td>
      </tr>`;
    }).join("");

    if (!encontrados.length) {
      tabla.innerHTML = '<tr><td colspan="6">No se encontraron pacientes.</td></tr>';
    }
  }

  dibujar("");
  document.getElementById("form-buscar").addEventListener("submit", function (evento) {
    evento.preventDefault();
    dibujar(document.getElementById("buscar").value);
  });
}

async function mostrarHistorial() {
  if (!document.getElementById("nombre-paciente")) return;

  const pacientes = await leerPacientes();
  const id = new URLSearchParams(location.search).get("id");
  const paciente = pacientes.find(function (item) { return String(item.id) === id; }) || pacientes[0];

  if (!paciente) {
    document.querySelector("main").innerHTML = "<h4>No hay pacientes registrados.</h4>";
    return;
  }

  document.getElementById("numero-ficha").textContent = "FICHA CLÍNICA N.º " + paciente.id;
  document.getElementById("nombre-paciente").textContent = paciente.nombre;
  document.getElementById("rut-paciente").textContent = paciente.rut;
  document.getElementById("edad-paciente").textContent = calcularEdad(paciente.nacimiento);
  document.getElementById("grupo-paciente").textContent = paciente.grupo || "Sin dato";
  document.getElementById("telefono-paciente").textContent = paciente.telefono || "Sin dato";
  document.getElementById("alergias-paciente").textContent = paciente.alergias || "Sin información";
  document.getElementById("medicamentos-paciente").textContent = paciente.medicamentos || "Sin información";
  document.getElementById("antecedentes-paciente").textContent = paciente.antecedentes || "Sin información";
  document.getElementById("actualizar-paciente").href = "registro.html?id=" + paciente.id;
  document.getElementById("agregar-atencion").href = "atencion.html?id=" + paciente.id;

  const lista = document.getElementById("lista-atenciones");
  lista.innerHTML = paciente.atenciones.slice().reverse().map(function (atencion) {
    return `<ul class="collection with-header">
      <li class="collection-header blue lighten-2"><h5>${escapar(atencion.fecha)} — ${escapar(atencion.motivo)}</h5></li>
      <li class="collection-item">
        <p><strong>Síntomas:</strong> ${escapar(atencion.sintomas) || "Sin información"}</p>
        <p><strong>Signos vitales:</strong> presión ${escapar(atencion.presion) || "-"}, temperatura ${escapar(atencion.temperatura) || "-"} °C, peso ${escapar(atencion.peso) || "-"} kg.</p>
        <p><strong>Diagnóstico:</strong> ${escapar(atencion.diagnostico) || "Sin información"}</p>
        <p><strong>Indicaciones:</strong> ${escapar(atencion.indicaciones) || "Sin información"}</p>
        <div class="chip blue lighten-5 black-text">${escapar(atencion.profesional)}</div>
      </li>
    </ul>`;
  }).join("") || '<div class="card-panel white">Este paciente todavía no tiene atenciones.</div>';
}

async function prepararPaciente() {
  const formulario = document.getElementById("form-paciente");
  if (!formulario) return;

  const id = new URLSearchParams(location.search).get("id");
  const pacientes = await leerPacientes();
  const paciente = pacientes.find(function (item) { return String(item.id) === id; });

  if (paciente) {
    document.getElementById("paciente").value = paciente.nombre;
    document.getElementById("rut").value = paciente.rut;
    document.getElementById("nacimiento").value = paciente.nacimiento;
    document.getElementById("grupo").value = paciente.grupo;
    document.getElementById("telefono").value = paciente.telefono;
    document.getElementById("alergias").value = paciente.alergias;
    document.getElementById("medicamentos").value = paciente.medicamentos;
    document.getElementById("antecedentes").value = paciente.antecedentes;
    document.getElementById("cancelar-paciente").href = "historial.html?id=" + paciente.id;
    M.updateTextFields();
  }

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const actual = { id: paciente ? paciente.id : null };

    actual.nombre = document.getElementById("paciente").value;
    actual.rut = document.getElementById("rut").value;
    actual.nacimiento = document.getElementById("nacimiento").value;
    actual.grupo = document.getElementById("grupo").value;
    actual.telefono = document.getElementById("telefono").value;
    actual.alergias = document.getElementById("alergias").value;
    actual.medicamentos = document.getElementById("medicamentos").value;
    actual.antecedentes = document.getElementById("antecedentes").value;

    const resultado = await enviar("guardar_paciente", actual);
    location.href = "historial.html?id=" + resultado.id;
  });
}

async function prepararAtencion() {
  const formulario = document.getElementById("form-atencion");
  if (!formulario) return;

  const id = new URLSearchParams(location.search).get("id");
  const pacientes = await leerPacientes();
  const paciente = pacientes.find(function (item) { return String(item.id) === id; });

  if (!paciente) {
    document.querySelector("main").innerHTML = "<h4>Primero debes seleccionar un paciente.</h4>";
    return;
  }

  document.getElementById("paciente-atencion").textContent = paciente.nombre;
  document.getElementById("profesional").value = doctorActual.nombre;
  document.getElementById("volver-historial").href = "historial.html?id=" + paciente.id;
  document.getElementById("cancelar-atencion").href = "historial.html?id=" + paciente.id;

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    await enviar("agregar_atencion", {
      paciente_id: paciente.id,
      fecha: document.getElementById("fecha").value,
      motivo: document.getElementById("motivo").value,
      sintomas: document.getElementById("sintomas").value,
      presion: document.getElementById("presion").value,
      temperatura: document.getElementById("temperatura").value,
      peso: document.getElementById("peso").value,
      diagnostico: document.getElementById("diagnostico").value,
      indicaciones: document.getElementById("indicaciones").value
    });

    location.href = "historial.html?id=" + paciente.id;
  });
}

function prepararLogin() {
  const formulario = document.getElementById("form-login");

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    try {
      await pedirAPI("login", {
        correo: document.getElementById("correo").value,
        clave: document.getElementById("clave").value
      });
      location.href = "index.html";
    } catch (error) {
      document.getElementById("error-login").textContent = error.message;
    }
  });
}

async function prepararDoctores() {
  const formulario = document.getElementById("form-doctor");
  if (!formulario) return;

  const doctores = await pedirAPI("listar_doctores");
  document.getElementById("lista-doctores").innerHTML = doctores.map(function (doctor) {
    return `<tr><td>${escapar(doctor.nombre)}</td><td>${escapar(doctor.correo)}</td></tr>`;
  }).join("");

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    await enviar("crear_doctor", {
      nombre: document.getElementById("nombre-nuevo").value,
      correo: document.getElementById("correo-nuevo").value,
      clave: document.getElementById("clave-nueva").value
    });
    location.reload();
  });
}

function prepararMenu() {
  document.querySelectorAll(".nombre-doctor").forEach(function (elemento) {
    elemento.textContent = doctorActual.nombre;
  });

  document.querySelectorAll(".cerrar-sesion").forEach(function (enlace) {
    enlace.addEventListener("click", async function (evento) {
      evento.preventDefault();
      await pedirAPI("logout", {});
      location.href = "login.html";
    });
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  M.Sidenav.init(document.querySelectorAll(".sidenav"));

  // En la página de login no se necesita sesión
  if (document.getElementById("form-login")) {
    prepararLogin();
    return;
  }

  try {
    doctorActual = await pedirAPI("yo");   // si no hay sesión, te manda a login.html
    prepararMenu();
    await Promise.all([mostrarInicio(), mostrarHistorial(), prepararPaciente(), prepararAtencion(), prepararDoctores()]);
  } catch (error) {
    if (doctorActual) alert("Error con la base de datos: " + error.message);
  }
});
