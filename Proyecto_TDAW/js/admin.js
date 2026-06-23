(function () {
  "use strict";

  const CARRERAS = {
    ISC: "Ing. en Sistemas Computacionales",
    LCD: "Lic. en Ciencia de Datos",
    IIA: "Ing. en Inteligencia Artificial",
  };

  const ESTADOS_MX = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
    "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
    "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
    "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
    "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
    "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
  ];

  const ALCALDIAS_CDMX = [
    "Álvaro Obregón", "Azcapotzalco", "Benito Juárez", "Coyoacán",
    "Cuajimalpa de Morelos", "Cuauhtémoc", "Gustavo A. Madero", "Iztacalco",
    "Iztapalapa", "La Magdalena Contreras", "Miguel Hidalgo", "Milpa Alta",
    "Tláhuac", "Tlalpan", "Venustiano Carranza", "Xochimilco",
  ];

  // Cada entrada tiene "value" (lo que se manda al backend) y "nombre" (lo que ve el admin).
  // "Otro" abre el campo de texto libre createOtraEscuela.
  const ESCUELAS_PROCEDENCIA = [
    { value: 'CECyT 1 "Gonzalo Vázquez Vela"',         nombre: 'CECyT 1 "Gonzalo Vázquez Vela"' },
    { value: 'CECyT 2 "Miguel Bernard"',               nombre: 'CECyT 2 "Miguel Bernard"' },
    { value: 'CECyT 3 "Estanislao Ramírez Ruiz"',      nombre: 'CECyT 3 "Estanislao Ramírez Ruiz"' },
    { value: 'CECyT 4 "Lázaro Cárdenas"',              nombre: 'CECyT 4 "Lázaro Cárdenas"' },
    { value: 'CECyT 5 "Benito Juárez"',                nombre: 'CECyT 5 "Benito Juárez"' },
    { value: 'CECyT 6 "Miguel Othón de Mendizábal"',   nombre: 'CECyT 6 "Miguel Othón de Mendizábal"' },
    { value: 'CECyT 7 "Cuauhtémoc"',                   nombre: 'CECyT 7 "Cuauhtémoc"' },
    { value: 'CECyT 8 "Narciso Bassols García"',       nombre: 'CECyT 8 "Narciso Bassols García"' },
    { value: 'CECyT 9 "Juan de Dios Bátiz"',           nombre: 'CECyT 9 "Juan de Dios Bátiz"' },
    { value: 'CECyT 10 "Carlos Vallejo Márquez"',      nombre: 'CECyT 10 "Carlos Vallejo Márquez"' },
    { value: 'CECyT 11 "Wilfrido Massieu Pérez"',      nombre: 'CECyT 11 "Wilfrido Massieu Pérez"' },
    { value: 'CECyT 12 "José María Morelos y Pavón"',  nombre: 'CECyT 12 "José María Morelos y Pavón"' },
    { value: 'CECyT 13 "Ricardo Flores Magón"',        nombre: 'CECyT 13 "Ricardo Flores Magón"' },
    { value: 'CECyT 14 "Luis Enrique Erro"',           nombre: 'CECyT 14 "Luis Enrique Erro"' },
    { value: 'CECyT 15 "Diódoro Antúnez Echegaray"',   nombre: 'CECyT 15 "Diódoro Antúnez Echegaray"' },
    { value: 'CECyT 16 "Hidalgo"',                     nombre: 'CECyT 16 "Hidalgo"' },
    { value: 'CET 1 "Walter Cross Buchanan"',          nombre: 'CET 1 "Walter Cross Buchanan"' },
    { value: 'Otro',                                   nombre: 'Otro (especificar)' },
  ];

  const CARRERAS_LIST = [
    { value: "ISC", nombre: "Ing. en Sistemas Computacionales" },
    { value: "LCD", nombre: "Lic. en Ciencia de Datos" },
    { value: "IIA", nombre: "Ing. en Inteligencia Artificial" },
  ];

  const LABORATORIOS_LIST = ["Lab 1", "Lab 2", "Lab 3", "Lab 4", "Lab 5"];

  const HORARIOS_LIST = [
    { value: "11:00 - 12:30", nombre: "Turno 1 (11:00 - 12:30)" },
    { value: "12:45 - 14:15", nombre: "Turno 2 (12:45 - 14:15)" },
    { value: "14:30 - 16:00", nombre: "Turno 3 (14:30 - 16:00)" },
  ];

  const MSG_CUPO_LLENO =
    "Error: El laboratorio o el horario seleccionado ya se encuentra al límite de su capacidad (30 por salón / 150 por turno). Elige otra combinación.";

  // Etiquetas legibles que se muestran en el modal de revisión del admin.
  // El orden de las claves dicta el orden visual en el <dl>.
  const ADMIN_REVIEW_LABELS = {
    curp:          "CURP",
    boleta:        "Boleta",
    nombre:        "Nombre completo",
    fechaNac:      "Fecha de nacimiento",
    genero:        "Género",
    telefono:      "Teléfono",
    estado:        "Entidad federativa",
    alcaldia:      "Alcaldía",
    carrera:       "Carrera",
    nombreEscuela: "Escuela de procedencia",
    promedio:      "Promedio",
    correo:        "Correo institucional",
    laboratorio:   "Laboratorio",
    horario:       "Horario",
  };

  // El trigger SQL devuelve SIGNAL 45000 con texto "Cupo lleno en laboratorio"
  // o "Cupo lleno en horario". El backend traduce el SQLSTATE a HTTP 409.
  function esErrorDeCupo(status, mensaje) {
    if (status === 409 && typeof mensaje === "string" && /cupo/i.test(mensaje)) {
      return true;
    }
    return false;
  }

  let alumnos = [];

  let panelLogin, panelAdmin, tbody;
  let modalCreate, modalEdit, modalDelete, modalRevision;
  let deleteTargetIndex = null;

  // Datos validados que esperan confirmación final del admin en #modalAdminRevision.
  let datosPendientes = null;
  // Bandera para no resetear los contenedores condicionales (alcaldía / otra escuela)
  // cuando ocultamos #modalAlumnoCreate solo de manera temporal para mostrar la revisión.
  let isReviewing = false;

  document.addEventListener("DOMContentLoaded", () => {
    panelLogin = document.getElementById("panelLoginAdmin");
    panelAdmin = document.getElementById("panelAdmin");
    tbody = document.getElementById("tablaAlumnosBody");
    if (!panelAdmin || !tbody) return;

    modalCreate   = new bootstrap.Modal(document.getElementById("modalAlumnoCreate"));
    modalEdit     = new bootstrap.Modal(document.getElementById("modalAlumnoEdit"));
    modalDelete   = new bootstrap.Modal(document.getElementById("modalAlumnoDelete"));
    modalRevision = new bootstrap.Modal(document.getElementById("modalAdminRevision"));

    poblarSelectsCreate();
    bindCreateEstadoAlcaldia();
    bindCreateEscuelaOtro();
    bindCreateModalReset();
    bindLoginEvents();
    bindCreateForm();
    bindAdminRevisionForm();
    bindEditForm();
    bindDeleteModal();
    bindBuscador();
  });

  // Cuando el modal de creación se cierra, devolvemos los contenedores condicionales
  // a su estado inicial (ocultos) para que el siguiente "Registrar alumno" arranque limpio.
  // Si solo lo estamos ocultando para mostrar la revisión, conservamos el estado del formulario.
  function bindCreateModalReset() {
    const modalEl = document.getElementById("modalAlumnoCreate");
    if (!modalEl) return;
    modalEl.addEventListener("hidden.bs.modal", () => {
      if (isReviewing) return;
      resetCreateUI();
    });
  }

  function resetCreateUI() {
    const alcContainer = document.getElementById("createAlcaldiaContainer");
    const escContainer = document.getElementById("createOtraEscuelaContainer");
    const alcaldia     = document.getElementById("createAlcaldia");
    const otra         = document.getElementById("createOtraEscuela");

    if (alcContainer) alcContainer.classList.add("d-none");
    if (escContainer) escContainer.classList.add("d-none");
    if (alcaldia) { alcaldia.disabled = true; alcaldia.required = false; alcaldia.value = ""; }
    if (otra)     { otra.disabled = true;     otra.required = false;     otra.value = ""; }
  }

  function poblarSelectsCreate() {
    appendOptions("createEstado",   ESTADOS_MX);
    appendOptions("createAlcaldia", ALCALDIAS_CDMX);
    appendOptions("createEscuela",  ESCUELAS_PROCEDENCIA);
    appendOptions("createCarrera",  CARRERAS_LIST);
    appendOptions("createLab",      LABORATORIOS_LIST);
    appendOptions("createHorario",  HORARIOS_LIST);
  }

  // Acepta arreglos de strings o de objetos {value, nombre}. Idempotente:
  // conserva el primer <option> (placeholder) ya escrito en el HTML.
  function appendOptions(selectId, items) {
    const select = document.getElementById(selectId);
    if (!select) return;
    items.forEach((item) => {
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

  function bindCreateEstadoAlcaldia() {
    const estado     = document.getElementById("createEstado");
    const alcaldia   = document.getElementById("createAlcaldia");
    const contenedor = document.getElementById("createAlcaldiaContainer");
    if (!estado || !alcaldia || !contenedor) return;

    estado.addEventListener("change", () => {
      if (estado.value === "Ciudad de México") {
        contenedor.classList.remove("d-none");
        alcaldia.disabled = false;
        alcaldia.required = true;
      } else {
        contenedor.classList.add("d-none");
        alcaldia.disabled = true;
        alcaldia.required = false;
        alcaldia.value = "";
      }
    });
  }

  function bindCreateEscuelaOtro() {
    const escuela    = document.getElementById("createEscuela");
    const otra       = document.getElementById("createOtraEscuela");
    const contenedor = document.getElementById("createOtraEscuelaContainer");
    if (!escuela || !otra || !contenedor) return;

    escuela.addEventListener("change", () => {
      if (escuela.value === "Otro") {
        contenedor.classList.remove("d-none");
        otra.disabled = false;
        otra.required = true;
        otra.value = "";
        otra.focus();
      } else {
        contenedor.classList.add("d-none");
        otra.disabled = true;
        otra.required = false;
        otra.value = "";
      }
    });
  }

  function bindLoginEvents() {
    document.addEventListener("admin:login-success", () => {
      panelLogin.classList.add("d-none");
      panelAdmin.classList.remove("d-none");
      window.scrollTo({ top: 0, behavior: "smooth" });
      cargarAlumnos();
    });

    const btnLogout = document.getElementById("btnLogoutAdmin");
    btnLogout.addEventListener("click", () => {
      panelAdmin.classList.add("d-none");
      panelLogin.classList.remove("d-none");
      alumnos = [];
      tbody.innerHTML = "";
      document.dispatchEvent(new CustomEvent("admin:logout"));
    });
  }

  function cargarAlumnos() {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-3">Cargando alumnos…</td></tr>';

    fetch("api/admin/listar_alumnos.php", { credentials: "include" })
      .then((res) => res.json().then((body) => ({ status: res.status, body })))
      .then(({ status, body }) => {
        if (status !== 200 || !body.ok) {
          throw new Error(body.mensaje || "No se pudo cargar el listado.");
        }
        alumnos = Array.isArray(body.alumnos) ? body.alumnos : [];
        renderTabla();
      })
      .catch((err) => {
        tbody.innerHTML =
          `<tr><td colspan="6" class="text-center text-danger py-3">Error: ${err.message}</td></tr>`;
      });
  }

  function renderTabla(lista) {
    const filas = Array.isArray(lista) ? lista : alumnos;
    tbody.innerHTML = "";

    if (filas.length === 0) {
      const msg = alumnos.length === 0
        ? "Sin alumnos registrados."
        : "Ningún alumno coincide con la búsqueda.";
      tbody.innerHTML =
        `<tr><td colspan="6" class="text-center text-muted py-3">${msg}</td></tr>`;
      return;
    }

    filas.forEach((alumno) => {
      const idx = alumnos.indexOf(alumno);
      const tr = document.createElement("tr");
      tr.dataset.index = idx;
      tr.innerHTML = `
        <td><code>${alumno.boleta || "—"}</code></td>
        <td>${alumno.nombre || "—"}</td>
        <td>${CARRERAS[alumno.carrera] || alumno.carrera || "—"}</td>
        <td><span class="badge text-bg-light border">${alumno.laboratorio || "—"}</span></td>
        <td>${alumno.horario || "—"}</td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-index="${idx}">
            <i class="bi bi-pencil-square"></i>
            <span class="d-none d-md-inline ms-1">Editar</span>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-index="${idx}">
            <i class="bi bi-trash3"></i>
            <span class="d-none d-md-inline ms-1">Eliminar</span>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('button[data-action="edit"]').forEach((btn) => {
      btn.addEventListener("click", () => abrirEdicion(parseInt(btn.dataset.index, 10)));
    });
    tbody.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
      btn.addEventListener("click", () => abrirEliminacion(parseInt(btn.dataset.index, 10)));
    });
  }

  function bindCreateForm() {
    const form = document.getElementById("formAlumnoCreate");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const get = (id) => (document.getElementById(id).value || "").trim();
      const generoSel = document.querySelector('input[name="createGenero"]:checked');

      // Si la escuela elegida es "Otro", el nombre real lo escribe el admin en
      // #createOtraEscuela. En cualquier otro caso, mandamos el valor del catálogo.
      const escuelaSel = get("createEscuela");
      const nombreEscuela =
        escuelaSel === "Otro" ? get("createOtraEscuela") : escuelaSel;

      // La alcaldía solo aplica si el estado es CDMX. Cualquier otra cosa va vacía.
      const estadoSel = get("createEstado");
      const alcaldia  = estadoSel === "Ciudad de México" ? get("createAlcaldia") : "";

      const nuevo = {
        curp:          get("createCurp").toUpperCase(),
        boleta:        get("createBoleta").toUpperCase(),
        nombre:        get("createNombre"),
        fechaNac:      get("createFechaNac"),
        genero:        generoSel ? generoSel.value : "",
        telefono:      get("createTelefono"),
        estado:        estadoSel,
        alcaldia:      alcaldia,
        carrera:       get("createCarrera"),
        nombreEscuela: nombreEscuela,
        promedio:      get("createPromedio"),
        correo:        get("createCorreo"),
        laboratorio:   get("createLab"),
        horario:       get("createHorario"),
      };

      const obligatorios = [
        "curp", "boleta", "nombre", "fechaNac", "genero", "telefono",
        "estado", "carrera", "nombreEscuela", "promedio", "correo",
        "laboratorio", "horario",
      ];
      if (estadoSel === "Ciudad de México") obligatorios.push("alcaldia");
      const faltantes = obligatorios.filter((k) => !nuevo[k]);
      if (faltantes.length) {
        alert("Completa todos los campos obligatorios: " + faltantes.join(", "));
        return;
      }

      // El POST se aplaza: primero el admin debe confirmar en #modalAdminRevision.
      datosPendientes = nuevo;
      transicionarARevision();
    });
  }

  // Oculta el formulario de creación y, una vez que Bootstrap retiró el backdrop,
  // pinta los datos en el modal de revisión y lo muestra. Así evitamos que dos
  // backdrops se solapen y se quede uno "congelado" al cerrar el segundo.
  function transicionarARevision() {
    const createEl = document.getElementById("modalAlumnoCreate");
    isReviewing = true;

    const onHidden = () => {
      createEl.removeEventListener("hidden.bs.modal", onHidden);
      pintarRevisionAdmin(datosPendientes);
      modalRevision.show();
    };
    createEl.addEventListener("hidden.bs.modal", onHidden);
    modalCreate.hide();
  }

  // Espejo: oculta la revisión y reabre el formulario con los datos intactos.
  function transicionarACreate() {
    const revisionEl = document.getElementById("modalAdminRevision");

    const onHidden = () => {
      revisionEl.removeEventListener("hidden.bs.modal", onHidden);
      modalCreate.show();
      // El formulario ya está lleno; el flag deja de bloquear el reset normal.
      isReviewing = false;
    };
    revisionEl.addEventListener("hidden.bs.modal", onHidden);
    modalRevision.hide();
  }

  function pintarRevisionAdmin(datos) {
    const dl = document.getElementById("adminRevisionDatos");
    if (!dl) return;
    dl.innerHTML = "";

    Object.keys(ADMIN_REVIEW_LABELS).forEach((key) => {
      let valor = datos[key];
      if (key === "carrera" && CARRERAS[valor]) {
        valor = CARRERAS[valor];
      }
      if (key === "alcaldia" && !valor) {
        valor = "(no aplica)";
      }

      const dt = document.createElement("dt");
      dt.className = "col-sm-5";
      dt.textContent = ADMIN_REVIEW_LABELS[key];

      const dd = document.createElement("dd");
      dd.className = "col-sm-7";
      dd.textContent = valor || "—";

      dl.appendChild(dt);
      dl.appendChild(dd);
    });
  }

  function setConfirmarAltaLoading(loading) {
    const btnConfirmar = document.getElementById("btnAdminConfirmarAlta");
    const btnCorregir  = document.getElementById("btnAdminCorregir");
    const spinner      = document.getElementById("spinnerAdminConfirmar");
    const icon         = document.getElementById("iconAdminConfirmar");

    if (btnConfirmar) btnConfirmar.disabled = loading;
    if (btnCorregir)  btnCorregir.disabled  = loading;
    if (spinner) spinner.classList.toggle("d-none", !loading);
    if (icon)    icon.classList.toggle("d-none", loading);
  }

  // CURP que el botón "Imprimir Acuse Oficial" usará para descargar el PDF.
  // Se setea sólo cuando el backend responde 200 OK.
  let curpRegistradaAdmin = "";

  function bindAdminRevisionForm() {
    const btnCorregir  = document.getElementById("btnAdminCorregir");
    const btnConfirmar = document.getElementById("btnAdminConfirmarAlta");
    const btnImprimir  = document.getElementById("btnAdminImprimirAcuse");
    const modalEl      = document.getElementById("modalAdminRevision");
    if (!btnCorregir || !btnConfirmar || !btnImprimir || !modalEl) return;

    btnCorregir.addEventListener("click", () => {
      if (btnCorregir.disabled) return;
      transicionarACreate();
    });

    btnConfirmar.addEventListener("click", () => {
      if (!datosPendientes) return;
      setConfirmarAltaLoading(true);

      fetch("api/admin/crear_alumno.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosPendientes),
      })
        .then((res) => res.json().then((body) => ({ status: res.status, body })))
        .then(({ status, body }) => {
          if (status !== 200 || !body.ok) {
            const e = new Error(body.mensaje || "No se pudo registrar al alumno.");
            e.status = status;
            throw e;
          }

          // Éxito: el modal NO se cierra. Pintamos acuse, conmutamos botones
          // y refrescamos la tabla principal en silencio.
          setConfirmarAltaLoading(false);
          curpRegistradaAdmin = (body.curp || datosPendientes.curp || "").toUpperCase();

          pintarAcuseAsignacion(body.asignacion || null);

          btnConfirmar.classList.add("d-none");
          btnConfirmar.disabled = true;

          btnCorregir.classList.add("d-none");
          btnCorregir.disabled = true;

          btnImprimir.classList.remove("d-none");
          btnImprimir.disabled = false;
          btnImprimir.focus();

          alert(body.mensaje || "¡Alumno registrado correctamente!");

          cargarAlumnos();
        })
        .catch((err) => {
          setConfirmarAltaLoading(false);
          // En 409 dejamos abierta la revisión para que el admin pueda usar
          // "Corregir Datos" y reasignar laboratorio/horario con cupo.
          if (esErrorDeCupo(err.status, err.message)) {
            alert(MSG_CUPO_LLENO);
            return;
          }
          alert("Error: " + err.message);
        });
    });

    btnImprimir.addEventListener("click", () => {
      if (!curpRegistradaAdmin) {
        alert("No se encontró la CURP para generar el PDF.");
        return;
      }
      window.open(
        `api/generarPdf.php?curp=${encodeURIComponent(curpRegistradaAdmin)}`,
        "_blank"
      );
    });

    // Al cerrarse el modal de revisión, restauramos el footer y el cuerpo a su
    // estado inicial para que el siguiente alta arranque limpio. Si el cierre fue
    // post-éxito (btnConfirmar oculto), además limpiamos el formulario de creación.
    modalEl.addEventListener("hidden.bs.modal", () => {
      const exitoso = btnConfirmar.classList.contains("d-none");

      resetRevisionUI();

      if (exitoso) {
        const form = document.getElementById("formAlumnoCreate");
        if (form) form.reset();
        resetCreateUI();
        datosPendientes = null;
        curpRegistradaAdmin = "";
        isReviewing = false;
      }
    });
  }

  function pintarAcuseAsignacion(asignacion) {
    const acuse = document.getElementById("adminAcuseAsignacion");
    if (!acuse) return;

    if (!asignacion) {
      acuse.classList.add("d-none");
      acuse.innerHTML = "";
      return;
    }

    acuse.innerHTML =
      `<i class="bi bi-check-circle me-1 text-success"></i>` +
      `<strong>Asignación oficial:</strong> ` +
      `<span class="datos-examen-resaltados">${asignacion.laboratorio}</span>` +
      ` &middot; ${asignacion.fecha} &middot; ` +
      `<span class="datos-examen-resaltados">${asignacion.horario}</span>`;
    acuse.classList.remove("d-none");
  }

  function resetRevisionUI() {
    const btnCorregir  = document.getElementById("btnAdminCorregir");
    const btnConfirmar = document.getElementById("btnAdminConfirmarAlta");
    const btnImprimir  = document.getElementById("btnAdminImprimirAcuse");
    const acuse        = document.getElementById("adminAcuseAsignacion");

    if (btnConfirmar) {
      btnConfirmar.classList.remove("d-none");
      btnConfirmar.disabled = false;
    }
    if (btnCorregir) {
      btnCorregir.classList.remove("d-none");
      btnCorregir.disabled = false;
    }
    if (btnImprimir) {
      btnImprimir.classList.add("d-none");
      btnImprimir.disabled = true;
    }
    if (acuse) {
      acuse.classList.add("d-none");
      acuse.innerHTML = "";
    }
    setConfirmarAltaLoading(false);
  }

  function abrirEdicion(idx) {
    const a = alumnos[idx];
    if (!a) return;
    document.getElementById("editIndex").value   = idx;
    document.getElementById("editBoleta").value  = a.boleta  || "";
    document.getElementById("editNombre").value  = a.nombre  || "";
    document.getElementById("editCarrera").value = a.carrera || "ISC";
    document.getElementById("editLab").value     = a.laboratorio || "Lab 1";
    document.getElementById("editHorario").value = a.horario || "11:00 - 12:30";
    modalEdit.show();
  }

  function bindEditForm() {
    const form = document.getElementById("formAlumnoEdit");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const idx = parseInt(document.getElementById("editIndex").value, 10);
      if (Number.isNaN(idx) || !alumnos[idx]) return;

      const original = alumnos[idx];
      const actualizado = {
        curp:        original.curp,
        boleta:      document.getElementById("editBoleta").value.trim().toUpperCase(),
        nombre:      document.getElementById("editNombre").value.trim(),
        carrera:     document.getElementById("editCarrera").value,
        laboratorio: document.getElementById("editLab").value,
        horario:     document.getElementById("editHorario").value,
      };

      if (!actualizado.nombre || !actualizado.carrera || !actualizado.laboratorio || !actualizado.horario) {
        alert("Completa todos los campos obligatorios.");
        return;
      }

      if (!confirm(`¿Guardar cambios para la boleta ${actualizado.boleta}?`)) return;

      fetch("api/admin/actualizar_alumno.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actualizado),
      })
        .then((res) => res.json().then((body) => ({ status: res.status, body })))
        .then(({ status, body }) => {
          if (status !== 200 || !body.ok) {
            const e = new Error(body.mensaje || "No se pudo actualizar.");
            e.status = status;
            throw e;
          }
          modalEdit.hide();
          alert("¡Cambios guardados correctamente!");
          cargarAlumnos();
        })
        .catch((err) => {
          // Mantener el modal de edición abierto para que el admin
          // pueda reasignar a otro laboratorio/horario con cupo.
          if (esErrorDeCupo(err.status, err.message)) {
            alert(MSG_CUPO_LLENO);
            return;
          }
          alert("Error: " + err.message);
        });
    });
  }

  function abrirEliminacion(idx) {
    const a = alumnos[idx];
    if (!a) return;
    deleteTargetIndex = idx;
    document.getElementById("deleteBoletaTxt").textContent = a.boleta || "(sin boleta)";
    modalDelete.show();
  }

  function bindBuscador() {
    const input = document.getElementById("buscarAlumno");
    if (!input) return;

    input.addEventListener("input", () => {
      const term = (input.value || "").trim().toLowerCase();
      if (!term) {
        renderTabla(alumnos);
        return;
      }

      const filtrados = alumnos.filter((a) => {
        const carreraNombre = CARRERAS[a.carrera] || a.carrera || "";
        return (
          (a.nombre  || "").toLowerCase().includes(term) ||
          (a.boleta  || "").toLowerCase().includes(term) ||
          (a.carrera || "").toLowerCase().includes(term) ||
          carreraNombre.toLowerCase().includes(term)
        );
      });

      renderTabla(filtrados);
    });
  }

  function bindDeleteModal() {
    const btn = document.getElementById("btnConfirmDelete");
    btn.addEventListener("click", () => {
      if (deleteTargetIndex === null) return;
      const a = alumnos[deleteTargetIndex];
      if (!a) return;

      if (!confirm(`Confirma la eliminación definitiva de la boleta ${a.boleta}.`)) {
        return;
      }

      fetch("api/admin/eliminar_alumno.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curp: a.curp, boleta: a.boleta }),
      })
        .then((res) => res.json().then((body) => ({ status: res.status, body })))
        .then(({ status, body }) => {
          if (status !== 200 || !body.ok) {
            throw new Error(body.mensaje || "No se pudo eliminar.");
          }
          modalDelete.hide();
          deleteTargetIndex = null;
          alert("Alumno eliminado correctamente.");
          cargarAlumnos();
        })
        .catch((err) => alert("Error: " + err.message));
    });
  }
})();
