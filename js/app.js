const CLAVE = "pacientes";

function leerPacientes() {
  return JSON.parse(localStorage.getItem(CLAVE)) || [];
}

function guardarPacientes(pacientes) {
  localStorage.setItem(CLAVE, JSON.stringify(pacientes));
}

function crearEjemplo() {
  if (localStorage.getItem(CLAVE)) return;

  guardarPacientes([{
    id: "1",
    nombre: "Sofía Pérez",
    rut: "21.345.678-9",
    nacimiento: "2010-04-18",
    grupo: "O+",
    telefono: "+56 9 5555 1234",
    alergias: "Polen, penicilina",
    medicamentos: "Loratadina 10 mg",
    antecedentes: "Rinitis alérgica, sin cirugías previas",
    atenciones: [{
      fecha: "2026-08-12",
      profesional: "Dra. Valentina Rojas",
      motivo: "Control general",
      sintomas: "Cansancio",
      presion: "110/70",
      temperatura: "36.4",
      peso: "54",
      diagnostico: "Estado general saludable",
      indicaciones: "Hidratación, descanso y control en seis meses"
    }]
  }]);
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

function mostrarInicio() {
  const tabla = document.getElementById("lista-pacientes");
  if (!tabla) return;

  const pacientes = leerPacientes();
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

function mostrarHistorial() {
  if (!document.getElementById("nombre-paciente")) return;

  const pacientes = leerPacientes();
  const id = new URLSearchParams(location.search).get("id");
  const paciente = pacientes.find(function (item) { return item.id === id; }) || pacientes[0];

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

function prepararPaciente() {
  const formulario = document.getElementById("form-paciente");
  if (!formulario) return;

  const id = new URLSearchParams(location.search).get("id");
  const pacientes = leerPacientes();
  const paciente = pacientes.find(function (item) { return item.id === id; });

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

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    let actual = paciente;

    if (!actual) {
      actual = { id: Date.now().toString(), atenciones: [] };
      pacientes.push(actual);
    }

    actual.nombre = document.getElementById("paciente").value;
    actual.rut = document.getElementById("rut").value;
    actual.nacimiento = document.getElementById("nacimiento").value;
    actual.grupo = document.getElementById("grupo").value;
    actual.telefono = document.getElementById("telefono").value;
    actual.alergias = document.getElementById("alergias").value;
    actual.medicamentos = document.getElementById("medicamentos").value;
    actual.antecedentes = document.getElementById("antecedentes").value;

    guardarPacientes(pacientes);
    location.href = "historial.html?id=" + actual.id;
  });
}

function prepararAtencion() {
  const formulario = document.getElementById("form-atencion");
  if (!formulario) return;

  const id = new URLSearchParams(location.search).get("id");
  const pacientes = leerPacientes();
  const paciente = pacientes.find(function (item) { return item.id === id; });

  if (!paciente) {
    document.querySelector("main").innerHTML = "<h4>Primero debes seleccionar un paciente.</h4>";
    return;
  }

  document.getElementById("paciente-atencion").textContent = paciente.nombre;
  document.getElementById("volver-historial").href = "historial.html?id=" + paciente.id;
  document.getElementById("cancelar-atencion").href = "historial.html?id=" + paciente.id;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    paciente.atenciones.push({
      fecha: document.getElementById("fecha").value,
      profesional: document.getElementById("profesional").value,
      motivo: document.getElementById("motivo").value,
      sintomas: document.getElementById("sintomas").value,
      presion: document.getElementById("presion").value,
      temperatura: document.getElementById("temperatura").value,
      peso: document.getElementById("peso").value,
      diagnostico: document.getElementById("diagnostico").value,
      indicaciones: document.getElementById("indicaciones").value
    });

    guardarPacientes(pacientes);
    location.href = "historial.html?id=" + paciente.id;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  M.Sidenav.init(document.querySelectorAll(".sidenav"));
  crearEjemplo();
  mostrarInicio();
  mostrarHistorial();
  prepararPaciente();
  prepararAtencion();
});
