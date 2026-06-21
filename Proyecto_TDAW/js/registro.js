(function () {
  "use strict";

  const ESTADOS_MX = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
    "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
    "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
    "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
    "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
    "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
  ];

  const ALCALDIAS_CDMX = [
    "Álvaro Obregón", "Azcapotzalco", "Benito Juárez", "Coyoacán",
    "Cuajimalpa de Morelos", "Cuauhtémoc", "Gustavo A. Madero", "Iztacalco",
    "Iztapalapa", "La Magdalena Contreras", "Miguel Hidalgo", "Milpa Alta",
    "Tláhuac", "Tlalpan", "Venustiano Carranza", "Xochimilco"
  ];

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
    { value: "CETyT 20", nombre: 'CETyT 20 "Natalia Serdán Alatriste"' },
    { value: "CET 1",    nombre: 'CET 1 "Walter Cross Buchanan"' },
    { value: "Otro",     nombre: "Otro" }
  ];

  const EDAD_MIN = 16;
  const EDAD_MAX = 50;

  const PROMEDIO_MIN = 6.0;
  const PROMEDIO_MAX = 10.0;

  const REGEX = {
    boleta:   /^(\d{10}|(PE|PP)\d{8})$/,

    nombre:   /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{3,}$/,

    curp:     /^[A-Z]{4}\d{6}[A-Z]{6}[A-Z0-9]{1}[0-9]{1}$/,

    telefono: /^\d{10}$/,

    promedio: /^(?:10(?:\.0+)?|[6-9](?:\.\d+)?)$/,

    correo:   /^[A-Za-z0-9._%+-]+@(?:alumno\.)?ipn\.mx$/,

    password: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/
  };

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

  function aplicarLimitesFechaNac() {
    const input = document.getElementById("fechaNac");
    const hoy = new Date();
    const max = new Date(hoy.getFullYear() - EDAD_MIN, hoy.getMonth(), hoy.getDate());
    const min = new Date(hoy.getFullYear() - EDAD_MAX, hoy.getMonth(), hoy.getDate());
    input.max = max.toISOString().slice(0, 10);
    input.min = min.toISOString().slice(0, 10);
  }

  function calcularEdad(fechaISO) {
    const nac = new Date(fechaISO);
    if (isNaN(nac.getTime())) return NaN;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

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

  function bindEscuelaToggle() {
    const escuela = document.getElementById("escuela");
    const nombreEsc = document.getElementById("nombreEscuela");

    escuela.addEventListener("change", () => {
      const v = escuela.value;

      if (v === "Otro") {
        nombreEsc.disabled = false;
        nombreEsc.required = true;
        nombreEsc.value = "";
        nombreEsc.classList.remove("is-invalid", "is-valid");
        nombreEsc.focus();
      } else if (v) {
        const item = ESCUELAS_PROCEDENCIA.find((e) => e.value === v);
        nombreEsc.value = item ? item.nombre : "";
        nombreEsc.disabled = true;
        nombreEsc.required = false;
        nombreEsc.classList.remove("is-invalid", "is-valid");
      } else {
        nombreEsc.disabled = true;
        nombreEsc.required = false;
        nombreEsc.value = "";
        nombreEsc.classList.remove("is-invalid", "is-valid");
      }
    });
  }

  function bindReset() {
    const form = document.getElementById("formRegistro");
    form.addEventListener("reset", () => {
      setTimeout(() => {
        form.querySelectorAll(".is-invalid, .is-valid").forEach((el) =>
          el.classList.remove("is-invalid", "is-valid")
        );
        const generoFeedback = document.getElementById("generoFeedback");
        if (generoFeedback) generoFeedback.classList.remove("d-block");
        const nombreEsc = document.getElementById("nombreEscuela");
        nombreEsc.disabled = true;
        nombreEsc.required = false;
        const alcaldia = document.getElementById("alcaldia");
        alcaldia.disabled = true;
        alcaldia.required = false;
      }, 0);
    });
  }

  function bindPasswordToggle() {
    const btn = document.getElementById("togglePassword");
    const input = document.getElementById("password");
    btn.addEventListener("click", () => {
      const isPwd = input.type === "password";
      input.type = isPwd ? "text" : "password";
      btn.querySelector("i").className = isPwd ? "bi bi-eye-slash" : "bi bi-eye";
    });
  }

  function bindValidacionEnVivo() {
    Object.keys(LABELS).forEach((id) => {
      if (id === "genero") return;
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("blur", () => validarCampo(id));
    });
    document.querySelectorAll('input[name="genero"]').forEach((radio) => {
      radio.addEventListener("change", () => validarCampo("genero"));
    });
  }

  function validarCampo(id) {
    if (id === "genero") {
      const seleccionado = document.querySelector('input[name="genero"]:checked');
      const grupo = document.getElementById("generoGroup");
      const feedback = document.getElementById("generoFeedback");
      const valido = !!seleccionado;
      grupo.classList.toggle("is-invalid", !valido);
      grupo.classList.toggle("is-valid", valido);
      feedback.classList.toggle("d-block", !valido);
      return valido;
    }

    const el = document.getElementById(id);
    if (!el) return true;
    if (el.disabled) return true;

    if (id === "boleta" || id === "curp") {
      el.value = el.value.toUpperCase().trim();
    }

    const valor = (el.value || "").trim();
    let valido = true;

    if (!valor) {
      valido = !el.required;
    } else if (id in REGEX) {
      valido = REGEX[id].test(valor);

      if (id === "promedio" && valido) {
        const n = parseFloat(valor);
        valido = n >= PROMEDIO_MIN && n <= PROMEDIO_MAX;
      }
    } else if (id === "fechaNac") {
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

  function onSubmit(e) {
    e.preventDefault();

    const campos = Object.keys(LABELS);
    let todoValido = true;

    campos.forEach((id) => {
      if (!validarCampo(id)) todoValido = false;
    });

    if (!todoValido) {
      const primero = document.querySelector(".is-invalid");
      if (primero && typeof primero.focus === "function") {
        if (primero.id === "generoGroup") {
          const radio = primero.querySelector('input[type="radio"]');
          if (radio) radio.focus();
        } else {
          primero.focus();
        }
      }
      return;
    }

    mostrarModalRevision();
  }

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
    const btnConfirmar = document.getElementById("btnConfirmar");
    const btnImprimir = document.getElementById("btnImprimirAcuse");
    const btnCorregir = document.getElementById("btnCorregir");

    btnConfirmar.classList.remove("d-none");
    btnConfirmar.disabled = false;
    btnImprimir.classList.add("d-none");
    btnImprimir.disabled = true;

    modal.show();

    btnConfirmar.onclick = () => {
      btnConfirmar.disabled = true;

      // ============================================================
      // BLOQUE FETCH REAL — descomentar cuando el backend PHP esté listo
      // ============================================================
      // fetch("api/registrar_alumno.php", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(datos),
      // })
      //   .then((res) => res.json())
      //   .then((data) => {
      //     if (data.ok) {
      //       alert("¡Datos guardados correctamente!");
      //       btnConfirmar.classList.add("d-none");
      //       btnImprimir.classList.remove("d-none");
      //       btnImprimir.disabled = false;
      //       btnImprimir.focus();
      //     } else {
      //       alert("Error del servidor: " + (data.mensaje || "desconocido"));
      //       btnConfirmar.disabled = false;
      //     }
      //   })
      //   .catch((err) => {
      //     alert("Error de red: " + err.message);
      //     btnConfirmar.disabled = false;
      //   });

      // ===== Simulación AJAX (mock local, sin tocar red) =====
      Promise.resolve({
        ok: true,
        fecha: "2026-08-24",
        mensaje: "Registro recibido correctamente",
        payload: datos,
      })
        .then((data) => {
          if (!data.ok) throw new Error(data.mensaje);
          alert("¡Datos guardados correctamente!");
          btnConfirmar.classList.add("d-none");
          btnImprimir.classList.remove("d-none");
          btnImprimir.disabled = false;
          btnImprimir.focus();
        })
        .catch((err) => {
          alert("Error: " + err.message);
          btnConfirmar.disabled = false;
        });
    };

    btnImprimir.onclick = () => {
      window.print();
    };

    const modalEl = document.getElementById("modalRevision");
    const onHidden = () => {
      const exitoso = btnConfirmar.classList.contains("d-none");
      if (exitoso) {
        document.getElementById("formRegistro").reset();
      }
      btnImprimir.classList.add("d-none");
      btnImprimir.disabled = true;
      btnConfirmar.classList.remove("d-none");
      btnConfirmar.disabled = false;
      modalEl.removeEventListener("hidden.bs.modal", onHidden);
    };
    modalEl.addEventListener("hidden.bs.modal", onHidden);
  }

  function recolectarDatos() {
    const get = (id) => document.getElementById(id).value.trim();
    const nombreEsc = document.getElementById("nombreEscuela");
    const alcaldia = document.getElementById("alcaldia");
    const generoSel = document.querySelector('input[name="genero"]:checked');
    return {
      boleta:        get("boleta"),
      nombre:        get("nombre"),
      fechaNac:      get("fechaNac"),
      genero:        generoSel ? generoSel.value : "",
      curp:          get("curp"),
      estado:        get("estado"),
      alcaldia:      alcaldia.disabled ? "(no aplica)" : get("alcaldia"),
      telefono:      get("telefono"),
      escuela:       get("escuela"),
      nombreEscuela: nombreEsc.value.trim() || "(no aplica)",
      promedio:      get("promedio"),
      correo:        get("correo"),
      password:      get("password")
    };
  }
})();
