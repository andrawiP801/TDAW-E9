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

  // Las 16 alcaldías de la Ciudad de México.
  const ALCALDIAS_CDMX = [
    "Álvaro Obregón", "Azcapotzalco", "Benito Juárez", "Coyoacán",
    "Cuajimalpa de Morelos", "Cuauhtémoc", "Gustavo A. Madero", "Iztacalco",
    "Iztapalapa", "La Magdalena Contreras", "Miguel Hidalgo", "Milpa Alta",
    "Tláhuac", "Tlalpan", "Venustiano Carranza", "Xochimilco"
  ];

  // Catálogo de escuelas de procedencia: el value del <select> es la clave
  // corta (CECyT 1, CET 1, Otro) y el label es el nombre oficial completo.
  // Al elegir una opción específica se autocompleta nombreEscuela con el
  // nombre completo (incluyendo el patronímico).
  const ESCUELAS_PROCEDENCIA = [
    { value: "CECyT 1",  nombre: 'CECyT 1 "Gonzalo Vázquez Vela"' },
    { value: "CECyT 2",  nombre: 'CECyT 2 "Miguel Bernard"' },
    { value: "CECyT 3",  nombre: 'CECyT 3 "Estanislao Ramírez Ruiz"' },
    { value: "CECyT 4",  nombre: 'CECyT 4 "Lázaro Cárdenas"' },
    { value: "CECyT 5",  nombre: 'CECyT 5 "Benito Juárez"' },
    { value: "CECyT 6",  nombre: 'CECyT 6 "Miguel Othón de Mendizábal"' },
    { value: "CECyT 7",  nombre: 'CECyT 7 "Cuauhtémoc"' },
    { value: "CECyT 8",  nombre: 'CECyT 8 "Narciso Bassols García"' },
    { value: "CECyT 9",  nombre: 'CECyT 9 "Juan de Dios Bátiz"' },
    { value: "CECyT 10", nombre: 'CECyT 10 "Carlos Vallejo Márquez"' },
    { value: "CECyT 11", nombre: 'CECyT 11 "Wilfrido Massieu Pérez"' },
    { value: "CECyT 12", nombre: 'CECyT 12 "José María Morelos y Pavón"' },
    { value: "CECyT 13", nombre: 'CECyT 13 "Ricardo Flores Magón"' },
    { value: "CECyT 14", nombre: 'CECyT 14 "Luis Enrique Erro"' },
    { value: "CECyT 15", nombre: 'CECyT 15 "Diódoro Antúnez Echegaray"' },
    { value: "CECyT 16", nombre: 'CECyT 16 "Hidalgo"' },
    { value: "CECyT 17", nombre: 'CECyT 17 "León, Guanajuato"' },
    { value: "CECyT 18", nombre: 'CECyT 18 "Zacatecas"' },
    { value: "CECyT 19", nombre: 'CECyT 19 "Leona Vicario"' },
    { value: "CET 1",    nombre: 'CET 1 "Walter Cross Buchanan"' },
    { value: "Otro",     nombre: "Otro" }
  ];

  // Rango de edad aceptado para ingreso a nivel superior.
  const EDAD_MIN = 16;
  const EDAD_MAX = 50;

  // Promedio mínimo requerido (los reglamentos del IPN piden 7.0).
  const PROMEDIO_MIN = 7.0;
  const PROMEDIO_MAX = 10.0;

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

    // Promedio: 7.x a 9.x, o 10 / 10.0(+). El rango exacto se valida con
    // PROMEDIO_MIN / PROMEDIO_MAX después de pasar este regex.
    promedio: /^(?:10(?:\.0+)?|[7-9](?:\.\d+)?)$/,

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
    alcaldia:      "Alcaldía",
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
    poblarSelect("alcaldia", ALCALDIAS_CDMX);
    poblarSelect("escuela", ESCUELAS_PROCEDENCIA);
    aplicarLimitesFechaNac();
    bindEscuelaToggle();
    bindEstadoAlcaldia();
    bindReset();
    bindPasswordToggle();
    bindValidacionEnVivo();
    document
      .getElementById("formRegistro")
      .addEventListener("submit", onSubmit);
  });

  // ---------------------------------------------------------------------------
  // Llena dinámicamente un <select>.
  // Acepta arreglo de strings o de objetos {value, nombre}.
  // ---------------------------------------------------------------------------
  function poblarSelect(id, opciones) {
    const select = document.getElementById(id);
    opciones.forEach((item) => {
      const opt = document.createElement("option");
      if (typeof item === "string") {
        opt.value = item;
        opt.textContent = item;
      } else {
        opt.value = item.value;
        opt.textContent = item.nombre;
      }
      select.appendChild(opt);
    });
  }

  // ---------------------------------------------------------------------------
  // Calcula los atributos min/max del <input type="date"> de fecha de
  // nacimiento a partir del rango de edad permitido. Así el navegador
  // bloquea la selección de fechas fuera de rango además del JS.
  // ---------------------------------------------------------------------------
  function aplicarLimitesFechaNac() {
    const input = document.getElementById("fechaNac");
    const hoy = new Date();
    const max = new Date(hoy.getFullYear() - EDAD_MIN, hoy.getMonth(), hoy.getDate());
    const min = new Date(hoy.getFullYear() - EDAD_MAX, hoy.getMonth(), hoy.getDate());
    input.max = max.toISOString().slice(0, 10);
    input.min = min.toISOString().slice(0, 10);
  }

  // ---------------------------------------------------------------------------
  // Devuelve la edad (años cumplidos) a partir de una cadena yyyy-mm-dd.
  // ---------------------------------------------------------------------------
  function calcularEdad(fechaISO) {
    const nac = new Date(fechaISO);
    if (isNaN(nac.getTime())) return NaN;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  // ---------------------------------------------------------------------------
  // Habilita el combobox de alcaldía solo cuando el estado es CDMX.
  // ---------------------------------------------------------------------------
  function bindEstadoAlcaldia() {
    const estado = document.getElementById("estado");
    const alcaldia = document.getElementById("alcaldia");

    estado.addEventListener("change", () => {
      if (estado.value === "Ciudad de México") {
        alcaldia.disabled = false;
        alcaldia.required = true;
      } else {
        alcaldia.disabled = true;
        alcaldia.required = false;
        alcaldia.value = "";
        alcaldia.classList.remove("is-invalid", "is-valid");
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Habilita / deshabilita el campo "Nombre de la escuela" cuando se elige "Otro"
  // ---------------------------------------------------------------------------
  function bindEscuelaToggle() {
    const escuela = document.getElementById("escuela");
    const nombreEsc = document.getElementById("nombreEscuela");

    escuela.addEventListener("change", () => {
      const v = escuela.value;

      if (v === "Otro") {
        // Habilita y vacía el campo para que el usuario teclee.
        nombreEsc.disabled = false;
        nombreEsc.required = true;
        nombreEsc.value = "";
        nombreEsc.classList.remove("is-invalid", "is-valid");
        nombreEsc.focus();
      } else if (v) {
        // CECyT/CET específico: autocompleta con el nombre oficial completo
        // y deja el campo deshabilitado (informativo).
        const item = ESCUELAS_PROCEDENCIA.find((e) => e.value === v);
        nombreEsc.value = item ? item.nombre : "";
        nombreEsc.disabled = true;
        nombreEsc.required = false;
        nombreEsc.classList.remove("is-invalid", "is-valid");
      } else {
        // Sin selección.
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
        const alcaldia = document.getElementById("alcaldia");
        alcaldia.disabled = true;
        alcaldia.required = false;
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

      // El promedio además debe estar en el rango [PROMEDIO_MIN, PROMEDIO_MAX].
      if (id === "promedio" && valido) {
        const n = parseFloat(valor);
        valido = n >= PROMEDIO_MIN && n <= PROMEDIO_MAX;
      }
    } else if (id === "fechaNac") {
      // Coherencia para ingreso a nivel superior: edad en [EDAD_MIN, EDAD_MAX]
      // y la fecha no puede ser futura.
      const nac = new Date(valor);
      if (isNaN(nac.getTime()) || nac > new Date()) {
        valido = false;
      } else {
        const edad = calcularEdad(valor);
        valido = edad >= EDAD_MIN && edad <= EDAD_MAX;
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
    const nombreEsc = document.getElementById("nombreEscuela");
    const alcaldia = document.getElementById("alcaldia");
    return {
      boleta:        get("boleta"),
      nombre:        get("nombre"),
      fechaNac:      get("fechaNac"),
      genero:        get("genero"),
      curp:          get("curp"),
      estado:        get("estado"),
      alcaldia:      alcaldia.disabled ? "(no aplica)" : get("alcaldia"),
      telefono:      get("telefono"),
      escuela:       get("escuela"),
      // Cuando es Otro el usuario lo escribe; cuando es CECyT/CET el campo
      // está deshabilitado pero contiene el nombre oficial autocompletado.
      nombreEscuela: nombreEsc.value.trim() || "(no aplica)",
      promedio:      get("promedio"),
      correo:        get("correo"),
      password:      get("password")
    };
  }
})();
