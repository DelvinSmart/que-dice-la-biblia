// Reina-Valera 1960 en un recuadro, sin guardar el texto en la página: Reftagger de Logos (gratis, con licencia).
// Cada pasaje trae un <span class="rvr">Acts 20:17, 28</span> (js/estudios.js → botonRVR). Aquí Reftagger lo
// convierte en botoncitos: en la computadora el recuadro sale al pasar el mouse; en el teléfono y el iPad,
// al tocarlo, y se cierra al tocar fuera. El texto lo trae Logos en ese momento.
var refTagger = {
  settings: {
    bibleVersion: "RVR60",
    language: "es",
    roundCorners: true,
    socialSharing: [],
    noSearchTagNames: ["body"], // no busca referencias solo: solo en los botoncitos que le damos
    tooltipStyle: (typeof temaActual === "function" && temaActual() === "dark") ? "dark" : "light"
  }
};
(() => {
  const s = document.createElement("script");
  s.src = "https://api.reftagger.com/v2/RefTagger.js";
  s.async = true;
  s.onload = () => etiquetarRVR(document);
  document.head.appendChild(s);
})();

// Convierte los <span class="rvr"> todavía sin convertir en botoncitos "RVR 1960"
function etiquetarRVR(dentro) {
  if (!window.refTagger || typeof refTagger.tag !== "function") return;
  (dentro || document).querySelectorAll(".rvr:not(.rvr-listo)").forEach(span => {
    refTagger.tag(span);
    const botones = span.querySelectorAll("a.rtBibleRef");
    if (!botones.length) return;
    botones.forEach((a, k) => {
      // Varios tramos ("17, 28"): el primero dice "RVR 1960" y los otros solo su versículo
      a.textContent = k === 0 ? "RVR 1960" : (a.dataset.reference || "").split(".").pop();
      a.classList.add("boton-rvr");
      a.removeAttribute("target");
    });
    [...span.childNodes].forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.textContent = " "; });
    span.classList.add("rvr-listo");
  });
}

// El botoncito no abre otra página: solo muestra el recuadro (en el recuadro está "more »" para ir a Logos).
// Se escucha en "window", que recibe el toque al final, para que Reftagger (que escucha en el documento)
// lo reciba primero y abra su recuadro.
// En el teléfono y el iPad no hay mouse: el toque abre el recuadro (como si pasara el mouse) y al tocar
// fuera se cierra.
const sinMouse = () => window.matchMedia("(hover: none)").matches;
let botonAbierto = null;
window.addEventListener("click", e => {
  const boton = e.target.closest(".rvr a.rtBibleRef");
  if (boton) e.preventDefault();
  if (!sinMouse() || e.target.closest(".rtTooltip")) return;
  if (botonAbierto && botonAbierto !== boton) botonAbierto.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  botonAbierto = boton;
  if (boton) boton.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
});
