/* ============================================================================
   registro.js — Validación del formulario de Registro de Nuevo Ingreso
   Aplica expresiones regulares, feedback visual con clases Bootstrap
   (.is-valid / .is-invalid) y muestra un modal de confirmación al enviar.
   ============================================================================ */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Catálogos
  // ---------------------------------------------------------------------------
  const ESTADOS_MX = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
    "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
    "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
    "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
    "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
    "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
  ];

  // CECyT 1 a 19 + CET 1 + "Otro".
  const ESCUELAS_PROCEDENCIA = [
    ...Array.from({ length: 19 }, (_, i) => `CECyT ${i + 1}`),
    "CET 1",
    "Otro"
  ];

  // ---------------------------------------------------------------------------
  // Expresiones regulares (con comentario breve de la regla que codifican)
  // ---------------------------------------------------------------------------
  const REGEX = {
    // Boleta: 10 dígitos (\d{10}) o PE/PP + 8 dígitos.
    boleta:   /^(\d{10}|(PE|PP)\d{8})$/,

    // Nombre: letras (con acentos y ñ) y espacios; mínimo 3 caracteres.
    nombre:   /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{3,}$/,

    // CURP: 4 letras + 6 dígitos (fecha) + 6 letras (sexo + estado + consonantes)
    //       + 2 alfanuméricos (homoclave). Total: 18.
    curp:     /^[A-Z]{4}\d{6}[A-Z]{6}[A-Z0-9]{2}$/,

    // Teléfono: solo dígitos, hasta 10 caracteres.
    telefono: /^\d{1,10}$/,

    // Promedio: 6.x a 9.x, o 10 / 10.0(+).
    promedio: /^(?:10(?:\.0+)?|[6-9](?:\.\d+)?)$/,

    // Correo institucional: usuario@alumno.ipn.mx o usuario@ipn.mx.
    correo:   /^[A-Za-z0-9._%+-]+@(?:alumno\.)?ipn\.mx$/,

    // Contraseña: ≥6 chars, ≥1 mayúscula, ≥1 dígito, ≥1 carácter especial.
    password: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/
  };

  // Etiquetas legibles para el desglose en el modal.
  const LABELS = {
    boleta:        "Número de boleta",
    nombre:        "Nombre completo",
    fechaNac:      "Fecha de nacimiento",
    genero:        "Género",
    curp:          "CURP",
    estado:        "Entidad federativa",
    telefono:      "Teléfono",
    escuela:       "Escuela de procedencia",
    nombreEscuela: "Nombre de la escuela",
    promedio:      "Promedio",
    correo:        "Correo institucional",
    password:      "Contraseña"
  };

  // ---------------------------------------------------------------------------
  // Inicialización
  // ---------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    poblarSelect("estado", ESTADOS_MX);
    poblarSelect("escuela", ESCUELAS_PROCEDENCIA);
    bindEscuelaToggle();
    bindReset();
    bindPasswordToggle();
    bindValidacionEnVivo();
    document
      .getElementById("formRegistro")
      .addEventListener("submit", onSubmit);
  });

  // ---------------------------------------------------------------------------
  // Llena dinámicamente un <select> con un arreglo de strings
  // ---------------------------------------------------------------------------
  function poblarSelect(id, opciones) {
    const select = document.getElementById(id);
    opciones.forEach((valor) => {
      const opt = document.createElement("option");
      opt.value = valor;
      opt.textContent = valor;
      select.appendChild(opt);
    });
  }

  // ---------------------------------------------------------------------------
  // Habilita / deshabilita el campo "Nombre de la escuela" cuando se elige "Otro"
  // ---------------------------------------------------------------------------
  function bindEscuelaToggle() {
    const escuela = document.getElementById("escuela");
    const nombreEsc = document.getElementById("nombreEscuela");

    escuela.addEventListener("change", () => {
      if (escuela.value === "Otro") {
        nombreEsc.disabled = false;
        nombreEsc.required = true;
        nombreEsc.focus();
      } else {
        nombreEsc.disabled = true;
        nombreEsc.required = false;
        nombreEsc.value = "";
        nombreEsc.classList.remove("is-invalid", "is-valid");
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Botón "Limpiar": resetea estados visuales además del reset nativo
  // ---------------------------------------------------------------------------
  function bindReset() {
    const form = document.getElementById("formRegistro");
    form.addEventListener("reset", () => {
      // El reset es síncrono pero las clases se quitan después
      setTimeout(() => {
        form.querySelectorAll(".is-invalid, .is-valid").forEach((el) =>
          el.classList.remove("is-invalid", "is-valid")
        );
        const nombreEsc = document.getElementById("nombreEscuela");
        nombreEsc.disabled = true;
        nombreEsc.required = false;
      }, 0);
    });
  }

  // ---------------------------------------------------------------------------
  // Toggle de visibilidad de la contraseña
  // ---------------------------------------------------------------------------
  function bindPasswordToggle() {
    const btn = document.getElementById("togglePassword");
    const input = document.getElementById("password");
    btn.addEventListener("click", () => {
      const isPwd = input.type === "password";
      input.type = isPwd ? "text" : "password";
      btn.querySelector("i").className = isPwd ? "bi bi-eye-slash" : "bi bi-eye";
    });
  }

  // ---------------------------------------------------------------------------
  // Validación en vivo: al perder el foco de cada campo
  // ---------------------------------------------------------------------------
  function bindValidacionEnVivo() {
    Object.keys(LABELS).forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("blur", () => validarCampo(id));
    });
  }

  // ---------------------------------------------------------------------------
  // Valida un campo y aplica clases Bootstrap. Devuelve true si es válido.
  // ---------------------------------------------------------------------------
  function validarCampo(id) {
    const el = document.getElementById(id);
    if (!el) return true;
    if (el.disabled) return true; // no se evalúa si está deshabilitado

    // Normaliza a mayúsculas algunos campos.
    if (id === "boleta" || id === "curp") {
      el.value = el.value.toUpperCase().trim();
    }

    const valor = (el.value || "").trim();
    let valido = true;

    // Campo vacío
    if (!valor) {
      valido = !el.required;
    } else if (id in REGEX) {
      valido = REGEX[id].test(valor);

      // El promedio además debe estar en el rango exacto [6.0, 10.0].
      if (id === "promedio" && valido) {
        const n = parseFloat(valor);
        valido = n >= 6.0 && n <= 10.0;
      }
    }

    el.classList.toggle("is-invalid", !valido);
    el.classList.toggle("is-valid", valido && valor.length > 0);
    return valido;
  }

  // ---------------------------------------------------------------------------
  // Manejo del envío del formulario
  // ---------------------------------------------------------------------------
  function onSubmit(e) {
    e.preventDefault();

    const campos = Object.keys(LABELS);
    let todoValido = true;

    campos.forEach((id) => {
      if (!validarCampo(id)) todoValido = false;
    });

    if (!todoValido) {
      const primero = document.querySelector(".is-invalid");
      if (primero) primero.focus();
      return;
    }

    mostrarModalRevision();
  }

  // ---------------------------------------------------------------------------
  // Construye y muestra el modal con todos los datos capturados
  // ---------------------------------------------------------------------------
  function mostrarModalRevision() {
    const datos = recolectarDatos();
    const saludo = document.getElementById("modalSaludo");
    const lista = document.getElementById("modalDatos");

    saludo.textContent =
      `Hola ${datos.nombre}, verifica que los datos que ingresaste sean correctos:`;

    lista.innerHTML = "";
    Object.entries(datos).forEach(([key, valor]) => {
      const dt = document.createElement("dt");
      dt.className = "col-sm-5";
      dt.textContent = LABELS[key] || key;

      const dd = document.createElement("dd");
      dd.className = "col-sm-7";
      dd.textContent = valor || "—";

      lista.appendChild(dt);
      lista.appendChild(dd);
    });

    const modal = new bootstrap.Modal(document.getElementById("modalRevision"));
    modal.show();

    document.getElementById("btnConfirmar").onclick = () => {
      modal.hide();
      // En una versión con backend, aquí se enviarían los datos al servidor.
      alert("¡Registro confirmado correctamente!");
      const form = document.getElementById("formRegistro");
      form.reset();
    };
  }

  // ---------------------------------------------------------------------------
  // Recolecta los valores actuales del formulario en un objeto plano
  // ---------------------------------------------------------------------------
  function recolectarDatos() {
    const get = (id) => document.getElementById(id).value.trim();
    return {
      boleta:        get("boleta"),
      nombre:        get("nombre"),
      fechaNac:      get("fechaNac"),
      genero:        get("genero"),
      curp:          get("curp"),
      estado:        get("estado"),
      telefono:      get("telefono"),
      escuela:       get("escuela"),
      nombreEscuela: document.getElementById("nombreEscuela").disabled
                      ? "(no aplica)"
                      : get("nombreEscuela"),
      promedio:      get("promedio"),
      correo:        get("correo"),
      password:      get("password")
    };
  }
})();
