(function () {
  "use strict";

  const CARRERAS = {
    ISC: "Ing. en Sistemas Computacionales",
    LCD: "Lic. en Ciencia de Datos",
    IIA: "Ing. en Inteligencia Artificial",
  };

  const alumnos = [
    {
      boleta: "2026630101",
      nombre: "María Fernanda López Ruiz",
      carrera: "ISC",
      laboratorio: "Lab 1",
      horario: "11:00 - 12:30",
    },
    {
      boleta: "2026630102",
      nombre: "Carlos Andrés Hernández Soto",
      carrera: "LCD",
      laboratorio: "Lab 3",
      horario: "12:45 - 14:15",
    },
    {
      boleta: "2026630103",
      nombre: "Ana Sofía Ramírez Vega",
      carrera: "IIA",
      laboratorio: "Lab 5",
      horario: "11:00 - 12:30",
    },
    {
      boleta: "2026630104",
      nombre: "Diego Emiliano Torres Mendoza",
      carrera: "ISC",
      laboratorio: "Lab 2",
      horario: "12:45 - 14:15",
    },
  ];

  let panelLogin, panelAdmin, tbody;
  let modalCreate, modalEdit, modalDelete;
  let deleteTargetIndex = null;

  document.addEventListener("DOMContentLoaded", () => {
    panelLogin = document.getElementById("panelLoginAdmin");
    panelAdmin = document.getElementById("panelAdmin");
    tbody = document.getElementById("tablaAlumnosBody");
    if (!panelAdmin || !tbody) return;

    modalCreate = new bootstrap.Modal(document.getElementById("modalAlumnoCreate"));
    modalEdit = new bootstrap.Modal(document.getElementById("modalAlumnoEdit"));
    modalDelete = new bootstrap.Modal(document.getElementById("modalAlumnoDelete"));

    bindLoginEvents();
    bindCreateForm();
    bindEditForm();
    bindDeleteModal();
    renderTabla();
  });

  function bindLoginEvents() {
    document.addEventListener("admin:login-success", () => {
      panelLogin.classList.add("d-none");
      panelAdmin.classList.remove("d-none");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const btnLogout = document.getElementById("btnLogoutAdmin");
    btnLogout.addEventListener("click", () => {
      panelAdmin.classList.add("d-none");
      panelLogin.classList.remove("d-none");
      document.dispatchEvent(new CustomEvent("admin:logout"));
    });
  }

  function renderTabla() {
    tbody.innerHTML = "";
    alumnos.forEach((alumno, idx) => {
      const tr = document.createElement("tr");
      tr.dataset.index = idx;
      tr.innerHTML = `
        <td><code>${alumno.boleta}</code></td>
        <td>${alumno.nombre}</td>
        <td>${CARRERAS[alumno.carrera] || alumno.carrera}</td>
        <td><span class="badge text-bg-light border">${alumno.laboratorio}</span></td>
        <td>${alumno.horario}</td>
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
        boleta: document.getElementById("createBoleta").value.trim().toUpperCase(),
        nombre: document.getElementById("createNombre").value.trim(),
        carrera: document.getElementById("createCarrera").value,
        laboratorio: document.getElementById("createLab").value,
        horario: document.getElementById("createHorario").value,
      };

      if (!nuevo.boleta || !nuevo.nombre || !nuevo.carrera || !nuevo.laboratorio || !nuevo.horario) {
        alert("Completa todos los campos obligatorios.");
        return;
      }
      if (alumnos.some((a) => a.boleta === nuevo.boleta)) {
        alert("Ya existe un alumno con esa boleta.");
        return;
      }

      // ============================================================
      // BLOQUE FETCH REAL — descomentar cuando el backend PHP esté listo
      // ============================================================
      // fetch("api/registrar_alumno.php", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(nuevo),
      // })
      //   .then((res) => res.json())
      //   .then((data) => {
      //     if (data.ok) {
      //       alumnos.push(nuevo);
      //       renderTabla();
      //       modalCreate.hide();
      //       form.reset();
      //       alert("¡Alumno registrado correctamente!");
      //     } else {
      //       alert("Error del servidor: " + (data.mensaje || "desconocido"));
      //     }
      //   })
      //   .catch((err) => alert("Error de red: " + err.message));

      // ===== Simulación AJAX (mock local, sin tocar red) =====
      Promise.resolve({ ok: true, mensaje: "Alumno registrado (simulación)" })
        .then((data) => {
          if (!data.ok) throw new Error(data.mensaje);
          alumnos.push(nuevo);
          renderTabla();
          modalCreate.hide();
          form.reset();
          alert("¡Alumno registrado correctamente!");
        })
        .catch((err) => alert("Error: " + err.message));
    });
  }

  function abrirEdicion(idx) {
    const a = alumnos[idx];
    if (!a) return;
    document.getElementById("editIndex").value = idx;
    document.getElementById("editBoleta").value = a.boleta;
    document.getElementById("editNombre").value = a.nombre;
    document.getElementById("editCarrera").value = a.carrera;
    document.getElementById("editLab").value = a.laboratorio;
    document.getElementById("editHorario").value = a.horario;
    modalEdit.show();
  }

  function bindEditForm() {
    const form = document.getElementById("formAlumnoEdit");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const idx = parseInt(document.getElementById("editIndex").value, 10);
      if (Number.isNaN(idx) || !alumnos[idx]) return;

      const actualizado = {
        boleta: document.getElementById("editBoleta").value.trim().toUpperCase(),
        nombre: document.getElementById("editNombre").value.trim(),
        carrera: document.getElementById("editCarrera").value,
        laboratorio: document.getElementById("editLab").value,
        horario: document.getElementById("editHorario").value,
      };

      if (!actualizado.nombre || !actualizado.carrera || !actualizado.laboratorio || !actualizado.horario) {
        alert("Completa todos los campos obligatorios.");
        return;
      }

      if (!confirm(`¿Guardar cambios para la boleta ${actualizado.boleta}?`)) return;

      // ============================================================
      // BLOQUE FETCH REAL — descomentar cuando el backend PHP esté listo
      // ============================================================
      // fetch("api/actualizar_alumno.php", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(actualizado),
      // })
      //   .then((res) => res.json())
      //   .then((data) => {
      //     if (data.ok) {
      //       alumnos[idx] = actualizado;
      //       renderTabla();
      //       modalEdit.hide();
      //       alert("¡Cambios guardados correctamente!");
      //     } else {
      //       alert("Error del servidor: " + (data.mensaje || "desconocido"));
      //     }
      //   })
      //   .catch((err) => alert("Error de red: " + err.message));

      // ===== Simulación AJAX (mock local, sin tocar red) =====
      Promise.resolve({ ok: true, mensaje: "Alumno actualizado (simulación)" })
        .then((data) => {
          if (!data.ok) throw new Error(data.mensaje);
          alumnos[idx] = actualizado;
          renderTabla();
          modalEdit.hide();
          alert("¡Cambios guardados correctamente!");
        })
        .catch((err) => alert("Error: " + err.message));
    });
  }

  function abrirEliminacion(idx) {
    const a = alumnos[idx];
    if (!a) return;
    deleteTargetIndex = idx;
    document.getElementById("deleteBoletaTxt").textContent = a.boleta;
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

      // ============================================================
      // BLOQUE FETCH REAL — descomentar cuando el backend PHP esté listo
      // ============================================================
      // fetch("api/eliminar_alumno.php", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ boleta: a.boleta }),
      // })
      //   .then((res) => res.json())
      //   .then((data) => {
      //     if (data.ok) {
      //       alumnos.splice(deleteTargetIndex, 1);
      //       renderTabla();
      //       modalDelete.hide();
      //       deleteTargetIndex = null;
      //       alert("Alumno eliminado correctamente.");
      //     } else {
      //       alert("Error del servidor: " + (data.mensaje || "desconocido"));
      //     }
      //   })
      //   .catch((err) => alert("Error de red: " + err.message));

      // ===== Simulación AJAX (mock local, sin tocar red) =====
      Promise.resolve({ ok: true, mensaje: "Alumno eliminado (simulación)" })
        .then((data) => {
          if (!data.ok) throw new Error(data.mensaje);
          alumnos.splice(deleteTargetIndex, 1);
          renderTabla();
          modalDelete.hide();
          deleteTargetIndex = null;
          alert("Alumno eliminado correctamente.");
        })
        .catch((err) => alert("Error: " + err.message));
    });
  }
})();
