(function () {
  "use strict";

  const REGEX_BOLETA = /^(\d{10}|(PE|PP)\d{8})$/;
  const REGEX_CORREO = /^[A-Za-z0-9._%+-]+@(?:alumno\.)?ipn\.mx$/;
  const REGEX_NUMERICO = /^\d+$/;

  const CaptchaController = {
    create(preguntaEl, inputEl, refreshBtn) {
      const state = { resultado: 0 };

      const generar = () => {
        const a = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        state.resultado = a + b;
        preguntaEl.textContent = `${a} + ${b} = ?`;
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

      refreshBtn.addEventListener("click", generar);
      inputEl.addEventListener("input", () => {
        if (inputEl.classList.contains("is-invalid")) {
          inputEl.classList.remove("is-invalid");
        }
      });

      generar();
      return { generar, validar };
    },
  };

  function initCuenta() {
    const formCuenta = document.getElementById("formCuenta");
    if (!formCuenta) return;

    const inputUser = document.getElementById("cuentaUser");
    const panelLogin = document.getElementById("panelLoginCuenta");
    const vistaExamen = document.getElementById("vistaExamen");
    const examenNombre = document.getElementById("examenNombre");
    const examenBoleta = document.getElementById("examenBoleta");
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
        REGEX_BOLETA.test(valor) || REGEX_CORREO.test(inputUser.value.trim());
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

      const usuario = inputUser.value.trim();
      examenNombre.textContent = usuario;
      examenBoleta.textContent = REGEX_BOLETA.test(usuario.toUpperCase())
        ? usuario.toUpperCase()
        : "(consulta tu boleta en el correo de confirmación)";

      panelLogin.classList.add("d-none");
      vistaExamen.classList.remove("d-none");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    btnImprimir.addEventListener("click", () => {
      window.print();
    });

    btnCerrar.addEventListener("click", () => {
      vistaExamen.classList.add("d-none");
      panelLogin.classList.remove("d-none");
      formCuenta.reset();
      formCuenta
        .querySelectorAll(".is-invalid, .is-valid")
        .forEach((el) => el.classList.remove("is-invalid", "is-valid"));
      captcha.generar();
    });
  }

  function initAdmin() {
    const formAdmin = document.getElementById("formAdmin");
    if (!formAdmin) return;

    const captcha = CaptchaController.create(
      document.getElementById("captchaPreguntaAdmin"),
      document.getElementById("captchaInputAdmin"),
      document.getElementById("btnRefreshCaptchaAdmin")
    );

    formAdmin.addEventListener("submit", (e) => {
      e.preventDefault();
      const usuario = document.getElementById("adminUser").value.trim();
      if (!usuario) {
        document.getElementById("adminUser").focus();
        return;
      }
      if (!captcha.validar()) {
        captcha.generar();
        alert("CAPTCHA incorrecto. Se generó una nueva operación, inténtalo de nuevo.");
        return;
      }

      document.dispatchEvent(
        new CustomEvent("admin:login-success", { detail: { usuario } })
      );
    });

    document.addEventListener("admin:logout", () => {
      formAdmin.reset();
      formAdmin
        .querySelectorAll(".is-invalid, .is-valid")
        .forEach((el) => el.classList.remove("is-invalid", "is-valid"));
      captcha.generar();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCuenta();
    initAdmin();
  });
})();
