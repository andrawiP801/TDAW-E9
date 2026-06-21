
(function () {
  "use strict";

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
