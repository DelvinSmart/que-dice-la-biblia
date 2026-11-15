// Tema claro u oscuro. Por defecto, el del aparato de la persona (css/colores.css lo sigue solo).
// Si la persona escoge uno en el pie de la página de inicio, se recuerda en su aparato y se usa en todas
// las páginas. Este archivo va en el <head>, antes de dibujar, para que no parpadee el color.
(() => {
  try {
    const t = localStorage.getItem("tema");
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  } catch (e) {}
})();

const temaActual = () => document.documentElement.dataset.theme
  || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function ponerTema(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("tema", t); } catch (e) {}
  document.querySelectorAll("[data-tema]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tema === t)));
}

// Los botones "Claro · Oscuro" (si la página los tiene)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-tema]").forEach(b => {
    b.setAttribute("aria-pressed", String(b.dataset.tema === temaActual()));
    b.addEventListener("click", () => ponerTema(b.dataset.tema));
  });
});
