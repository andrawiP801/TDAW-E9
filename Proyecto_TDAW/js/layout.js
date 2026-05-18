/* ============================================================================
   layout.js — Inyecta los fragmentos compartidos (header/footer) en cada página.
   Requiere servir el proyecto desde un servidor HTTP (ej: Live Server, http-server)
   debido a la política CORS de fetch() con archivos locales (file://).
   ============================================================================ */

(function () {
  "use strict";

  // Carga un fragmento HTML y lo inyecta en el contenedor indicado.
  const inject = async (selector, file) => {
    const target = document.querySelector(selector);
    if (!target) return;
    try {
      const res = await fetch(file, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      target.innerHTML = await res.text();
    } catch (err) {
      console.error("No se pudo cargar " + file + ":", err);
      target.innerHTML =
        '<div class="alert alert-warning m-2">' +
        'No se pudo cargar <code>' + file + '</code>. ' +
        'Asegúrate de servir el proyecto vía HTTP (no file://).' +
        '</div>';
    }
  };

  // Marca el enlace de navegación activo según data-page del <body>.
  const markActiveLink = () => {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll('#site-header [data-nav]').forEach((a) => {
      if (a.dataset.nav === page) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });
  };

  // Inserta el año actual en el footer.
  const setYear = () => {
    const el = document.getElementById("footer-year");
    if (el) el.textContent = new Date().getFullYear();
  };

  document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
      inject("#site-header", "layout/header.html"),
      inject("#site-footer", "layout/footer.html"),
    ]);
    markActiveLink();
    setYear();
  });
})();
