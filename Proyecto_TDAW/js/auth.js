(function () {
  "use strict";

  const REGEX_BOLETA = /^(\d{10}|(PE|PP)\d{8})$/;
  const REGEX_CORREO = /^[A-Za-z0-9._%+-]+@(?:alumno\.)?ipn\.mx$/;
  const REGEX_NUMERICO = /^\d+$/;

  window.curpAlumno = "";

  const CaptchaController = {
    create(preguntaEl, inputEl, refreshBtn) {
      const state = { a: 0, b: 0, resultado: 0 };

      const generar = () => {
        state.a = Math.floor(Math.random() * 9) + 1;
        state.b = Math.floor(Math.random() * 9) + 1;
        state.resultado = state.a + state.b;
        preguntaEl.textContent = `${state.a} + ${state.b} = ?`;
        inputEl.value = "";
        inputEl.classList.remove("is-invalid", "is-valid");
      };

      const validar = () => {
        const valor = (inputEl.value || "").trim();

        if (!REGEX_NUMERICO.test(valor)) {
          inputEl.classList.add("is-invalid");
          inputEl.classList.remove("is-valid");
          return false;
        }

        const ok = parseInt(valor, 10) === state.resultado;
        inputEl.classList.toggle("is-invalid", !ok);
        inputEl.classList.toggle("is-valid", ok);

        return ok;
      };

      const getOperandos = () => ({
        a: state.a,
        b: state.b,
        respuesta: parseInt((inputEl.value || "0").trim(), 10) || 0,
      });

      refreshBtn.addEventListener("click", generar);

      inputEl.addEventListener("input", () => {
        if (inputEl.classList.contains("is-invalid")) {
          inputEl.classList.remove("is-invalid");
        }
      });

      generar();

      return { generar, validar, getOperandos };
    },
  };

  function pintarAsignacion({ fecha, horario, laboratorio, boleta }) {
    const $ = (id) => document.getElementById(id);

    if ($("examenFecha") && fecha) $("examenFecha").textContent = fecha;
    if ($("examenHorario") && horario) $("examenHorario").textContent = horario;
    if ($("examenLab") && laboratorio) $("examenLab").textContent = laboratorio;
    if ($("examenBoleta") && boleta) $("examenBoleta").textContent = boleta;
  }

  function pintarVistaExamen(examen, fallbackNombre) {
    const panelLogin = document.getElementById("panelLoginCuenta");
    const vistaExamen = document.getElementById("vistaExamen");
    const examenNombre = document.getElementById("examenNombre");

    if (!panelLogin || !vistaExamen || !examenNombre) return;

    const nombre = examen.alumno?.nombre || fallbackNombre || "aspirante";
    examenNombre.textContent = nombre;

    window.curpAlumno = examen.alumno?.curp || "";

    if (examen.asignacion) {
      pintarAsignacion({
        fecha: examen.asignacion.fecha,
        horario: examen.asignacion.horario,
        laboratorio: examen.asignacion.laboratorio,
        boleta: examen.alumno?.boleta || "—",
      });
    } else {
      pintarAsignacion({
        fecha: "Pendiente de asignación",
        horario: "—",
        laboratorio: "—",
        boleta: examen.alumno?.boleta || "—",
      });
    }

    panelLogin.classList.add("d-none");
    vistaExamen.classList.remove("d-none");
  }

  function initCuenta() {
    const formCuenta = document.getElementById("formCuenta");
    if (!formCuenta) return;

    const inputUser = document.getElementById("cuentaUser");
    const inputPass = document.getElementById("cuentaPass");
    const panelLogin = document.getElementById("panelLoginCuenta");
    const vistaExamen = document.getElementById("vistaExamen");
    const btnImprimir = document.getElementById("btnImprimirAcuse");
    const btnCerrar = document.getElementById("btnCerrarSesion");

    const captcha = CaptchaController.create(
      document.getElementById("captchaPreguntaCuenta"),
      document.getElementById("captchaInputCuenta"),
      document.getElementById("btnRefreshCaptchaCuenta")
    );

    const validarUsuario = () => {
      const valor = inputUser.value.trim().toUpperCase();

      const valido =
        REGEX_BOLETA.test(valor) ||
        REGEX_CORREO.test(inputUser.value.trim());

      inputUser.classList.toggle("is-invalid", valor.length > 0 && !valido);
      inputUser.classList.toggle("is-valid", valor.length > 0 && valido);

      return valido;
    };

    inputUser.addEventListener("blur", validarUsuario);

    inputUser.addEventListener("input", () => {
      if (inputUser.classList.contains("is-invalid")) validarUsuario();
    });

    formCuenta.addEventListener("submit", (e) => {
      e.preventDefault();

      const userOk = validarUsuario();
      const captchaOk = captcha.validar();

      if (!userOk) {
        inputUser.focus();
        return;
      }

      if (!captchaOk) {
        captcha.generar();
        alert("CAPTCHA incorrecto. Se generó una nueva operación, inténtalo de nuevo.");
        return;
      }

      const operandos = captcha.getOperandos();

      const payload = {
        usuario_login: inputUser.value.trim(),
        contrasena: inputPass.value,
        captcha_a: operandos.a,
        captcha_b: operandos.b,
        captcha: operandos.respuesta,
      };

      fetch("api/login.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json().then((body) => ({ status: res.status, body })))
        .then(({ status, body }) => {
          if (status !== 200 || !body.ok) {
            throw new Error(body.mensaje || "No se pudo iniciar sesión.");
          }

          if ((body.tipo_usuario || "").toUpperCase() !== "ALUMNO") {
            throw new Error("Esta cuenta no es de alumno. Usa el panel de Admin.");
          }

          return fetch("api/obtener_examen.php", {
            credentials: "include",
          }).then((r) => r.json());
        })
        .then((examen) => {
          if (!examen.ok) {
            throw new Error(examen.mensaje || "No se pudo cargar el examen.");
          }

          pintarVistaExamen(examen, inputUser.value.trim());

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        })
        .catch((err) => {
          captcha.generar();
          alert("Error: " + err.message);
        });
    });

    btnImprimir.addEventListener("click", () => {
      if (!window.curpAlumno) {
        alert("No se encontró la CURP del alumno.");
        return;
      }

      window.open(
        `api/generarPdf.php?curp=${encodeURIComponent(window.curpAlumno)}`,
        "_blank"
      );
    });

    btnCerrar.addEventListener("click", () => {
      fetch("api/logout.php", {
        method: "POST",
        credentials: "include",
      })
        .catch(() => {})
        .finally(() => {
          window.curpAlumno = "";

          vistaExamen.classList.add("d-none");
          panelLogin.classList.remove("d-none");

          formCuenta.reset();

          formCuenta
            .querySelectorAll(".is-invalid, .is-valid")
            .forEach((el) => el.classList.remove("is-invalid", "is-valid"));

          captcha.generar();
        });
    });
  }

  function initAdmin() {
    const formAdmin = document.getElementById("formAdmin");
    if (!formAdmin) return;

    const inputUser = document.getElementById("adminUser");
    const inputPass = document.getElementById("adminPass");

    const captcha = CaptchaController.create(
      document.getElementById("captchaPreguntaAdmin"),
      document.getElementById("captchaInputAdmin"),
      document.getElementById("btnRefreshCaptchaAdmin")
    );

    formAdmin.addEventListener("submit", (e) => {
      e.preventDefault();

      const usuario = inputUser.value.trim();

      if (!usuario) {
        inputUser.focus();
        return;
      }

      if (!captcha.validar()) {
        captcha.generar();
        alert("CAPTCHA incorrecto. Se generó una nueva operación, inténtalo de nuevo.");
        return;
      }

      const operandos = captcha.getOperandos();

      const payload = {
        usuario_login: usuario,
        contrasena: inputPass.value,
        captcha_a: operandos.a,
        captcha_b: operandos.b,
        captcha: operandos.respuesta,
      };

      fetch("api/login.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json().then((body) => ({ status: res.status, body })))
        .then(({ status, body }) => {
          if (status !== 200 || !body.ok) {
            throw new Error(body.mensaje || "No se pudo iniciar sesión.");
          }

          if ((body.tipo_usuario || "").toUpperCase() !== "ADMIN") {
            throw new Error("Esta cuenta no tiene permisos de administrador.");
          }

          document.dispatchEvent(
            new CustomEvent("admin:login-success", {
              detail: { usuario },
            })
          );
        })
        .catch((err) => {
          captcha.generar();
          alert("Error: " + err.message);
        });
    });

    document.addEventListener("admin:logout", () => {
      fetch("api/logout.php", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});

      formAdmin.reset();

      formAdmin
        .querySelectorAll(".is-invalid, .is-valid")
        .forEach((el) => el.classList.remove("is-invalid", "is-valid"));

      captcha.generar();
    });
  }

  function restaurarSesion() {
    const page = (document.body.dataset.page || "").toLowerCase();

    if (page !== "cuenta" && page !== "admin") return;

    fetch("api/verificar_sesion.php", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((body) => {
        if (!body || !body.ok || !body.autenticado) return;

        const tipo = (body.tipo_usuario || "").toUpperCase();

        if (page === "cuenta" && tipo === "ALUMNO") {
          fetch("api/obtener_examen.php", {
            credentials: "include",
          })
            .then((r) => r.json())
            .then((examen) => {
              if (!examen || !examen.ok) return;

              pintarVistaExamen(examen, "");
            })
            .catch(() => {});
        } else if (page === "admin" && tipo === "ADMIN") {
          document.dispatchEvent(
            new CustomEvent("admin:login-success", {
              detail: {
                usuario: "(sesión activa)",
                restaurada: true,
              },
            })
          );
        }
      })
      .catch(() => {});
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCuenta();
    initAdmin();
    restaurarSesion();
  });
})();