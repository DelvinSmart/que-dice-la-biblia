// Panel · vista previa en vivo: el cuadro de la derecha (o el botón "Vista previa" en el teléfono)
// es la página real del estudio (estudio.html?vista=1). Cada cambio se le manda y muestra el punto que se edita.
const vistaFrame = $("vistaFrame");
let pasoEditado = 0;
let esperaVista = null;

function enviarVista() {
  clearTimeout(esperaVista);
  esperaVista = setTimeout(() => {
    if (!estudio || !vistaFrame.contentWindow) return;
    vistaFrame.contentWindow.postMessage({ tipo: "estudio", estudio, paso: pasoEditado, imagenes: window.IMAGENES_LOCALES || {} }, location.origin);
  }, 250);
}

// Número del punto (contando todos los temas) a partir de una ruta como "temas.2.puntos.1..."
function pasoDeRuta(ruta) {
  const m = /^temas\.(\d+)(?:\.puntos\.(\d+))?/.exec(ruta || "");
  if (!m || !estudio) return null;
  const t = Number(m[1]), p = m[2] ? Number(m[2]) : 0;
  return (estudio.temas || []).slice(0, t).reduce((n, tema) => n + (tema.puntos || []).length, 0) + p;
}

$("editor").addEventListener("focusin", e => {
  const d = e.target.dataset;
  const paso = pasoDeRuta(d.campo || d.rico || d.verso || d.ruta);
  if (paso !== null && paso !== pasoEditado) { pasoEditado = paso; enviarVista(); }
});
$("editor").addEventListener("input", enviarVista);
new MutationObserver(enviarVista).observe($("editor"), { childList: true });
window.addEventListener("message", e => {
  if (e.origin === location.origin && e.data?.tipo === "vista-lista") enviarVista();
});

$("btnVista").addEventListener("click", () => {
  const ver = $("pEditor").classList.toggle("ver-vista");
  $("btnVista").textContent = ver ? "Editar" : "Vista previa";
  if (ver) enviarVista();
  window.scrollTo(0, 0);
});
