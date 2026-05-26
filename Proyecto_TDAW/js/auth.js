document.addEventListener("DOMContentLoaded", () => {
  const REGEX_BOLETA = /^(\d{10}|(PE|PP)\d{8})$/;
  const REGEX_CORREO = /^[A-Za-z0-9._%+-]+@(?:alumno\.)?ipn\.mx$/;

  const formAdmin = document.getElementById("formAdmin");
  if (formAdmin) {
    formAdmin.addEventListener("submit", (e) => {
      e.preventDefault();
      const usuario = formAdmin.querySelector('input[type="text"]').value.trim();
      alert(`Credenciales recibidas para "${usuario}". `);
    });
  }

  const formCuenta = document.getElementById("formCuenta");
  if (formCuenta) {
    const inputUser = document.getElementById("cuentaUser");

    const validarUsuario = () => {
      const valor = inputUser.value.trim().toUpperCase();
      const valido = REGEX_BOLETA.test(valor) || REGEX_CORREO.test(inputUser.value.trim());
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
      if (!validarUsuario()) {
        inputUser.focus();
        return;
      }
      const usuario = inputUser.value.trim();
      alert(`Credenciales recibidas para "${usuario}" (demo). ` +
            "Aquí se autenticaría contra el backend.");
    });
  }
});
