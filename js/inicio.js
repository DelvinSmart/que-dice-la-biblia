// Página de inicio: muestra los estudios de estudios/indice.json (lo genera scripts/construir.mjs).
// Un estudio y su traducción (campo otro_idioma) se muestran en una sola tarjeta con un botón por idioma.
const lista = document.getElementById("lista");
document.getElementById("intro").textContent = TEXTOS.es.intro;
document.getElementById("intro-pt").textContent = TEXTOS.pt.intro;
lista.textContent = TEXTOS.es.cargando;
revelar(document.querySelectorAll(".inicio-head > *, .pie"), 70);

// Junta cada estudio con su traducción; el español va primero
function agrupar(estudios) {
  const porSlug = new Map(estudios.map(e => [e.slug, e]));
  const vistos = new Set();
  const grupos = [];
  estudios.forEach(e => {
    if (vistos.has(e.slug)) return;
    const otro = porSlug.get(e.otro_idioma);
    const versiones = [e, otro].filter(Boolean).sort((a, b) => (a.idioma === "es" ? -1 : b.idioma === "es" ? 1 : 0));
    versiones.forEach(v => vistos.add(v.slug));
    grupos.push(versiones);
  });
  return grupos;
}

function tarjeta(versiones) {
  const [e, otro] = versiones;
  const t = TEXTOS[e.idioma] || TEXTOS.es;
  const enlace = v => `<a href="estudio.html?e=${encodeURIComponent(v.slug)}"${v === e ? ' class="principal"' : ""}>${v.idioma === "pt" ? "Português" : "Español"}</a>`;
  return `<div class="tarjeta" style="--c:var(${COLORES[e.color] || "--b1"})">
    <h2>${esc(e.titulo)}</h2>
    ${otro ? `<span class="otro">${esc(otro.titulo)}</span>` : ""}
    ${e.descripcion ? `<p>${esc(e.descripcion)}</p>` : ""}
    <span class="cuenta">${e.temas} ${t.temas} · ${e.puntos} ${t.puntos}</span>
    <div class="idiomas-tarjeta">${versiones.map(enlace).join("")}</div>
  </div>`;
}

(async () => {
  try {
    lista.innerHTML = agrupar(await cargarIndice()).map(tarjeta).join("");
    revelar(lista.children, 80, 220);
  } catch (e) {
    lista.textContent = "";
  }
})();
