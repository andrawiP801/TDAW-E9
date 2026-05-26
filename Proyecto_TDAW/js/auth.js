document.addEventListener("DOMContentLoaded", () => {
  ["formAdmin", "formCuenta"].forEach((id) => {
    const form = document.getElementById(id);
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const usuario = form.querySelector('input[type="text"]').value.trim();
      alert(`Credenciales recibidas para "${usuario}" (demo). ` +
            "Aquí se autenticaría contra el backend.");
    });
  });
});
