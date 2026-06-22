(function () {
  "use strict";

  const CARRERAS = {
    ISC: "Ing. en Sistemas Computacionales",
    LCD: "Lic. en Ciencia de Datos",
    IIA: "Ing. en Inteligencia Artificial",
  };

  let alumnos = [];

  let panelLogin, panelAdmin, tbody;
  let modalCreate, modalEdit, modalDelete;
  let deleteTargetIndex = null;

  document.addEventListener("DOMContentLoaded", () => {
    panelLogin = document.getElementById("panelLoginAdmin");
    panelAdmin = document.getElementById("panelAdmin");
    tbody = document.getElementById("tablaAlumnosBody");
    if (!panelAdmin || !tbody) return;

    modalCreate = new bootstrap.Modal(document.getElementById("modalAlumnoCreate"));
    modalEdit   = new bootstrap.Modal(document.getElementById("modalAlumnoEdit"));
    modalDelete = new bootstrap.Modal(document.getElementById("modalAlumnoDelete"));

    bindLoginEvents();
    bindCreateForm();
    bindEditForm();
    bindDeleteModal();
  });

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

  function renderTabla() {
    tbody.innerHTML = "";

    if (alumnos.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted py-3">Sin alumnos registrados.</td></tr>';
      return;
    }

    alumnos.forEach((alumno, idx) => {
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

      const nuevo = {
        boleta:      document.getElementById("createBoleta").value.trim().toUpperCase(),
        nombre:      document.getElementById("createNombre").value.trim(),
        carrera:     document.getElementById("createCarrera").value,
        laboratorio: document.getElementById("createLab").value,
        horario:     document.getElementById("createHorario").value,
      };

      if (!nuevo.boleta || !nuevo.nombre || !nuevo.carrera || !nuevo.laboratorio || !nuevo.horario) {
        alert("Completa todos los campos obligatorios.");
        return;
      }

      fetch("api/admin/crear_alumno.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo),
      })
        .then((res) => res.json().then((body) => ({ status: res.status, body })))
        .then(({ status, body }) => {
          if (status !== 200 || !body.ok) {
            throw new Error(body.mensaje || "No se pudo registrar al alumno.");
          }
          modalCreate.hide();
          form.reset();
          alert("¡Alumno registrado correctamente!");
          cargarAlumnos();
        })
        .catch((err) => alert("Error: " + err.message));
    });
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
            throw new Error(body.mensaje || "No se pudo actualizar.");
          }
          modalEdit.hide();
          alert("¡Cambios guardados correctamente!");
          cargarAlumnos();
        })
        .catch((err) => alert("Error: " + err.message));
    });
  }

  function abrirEliminacion(idx) {
    const a = alumnos[idx];
    if (!a) return;
    deleteTargetIndex = idx;
    document.getElementById("deleteBoletaTxt").textContent = a.boleta || "(sin boleta)";
    modalDelete.show();
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
