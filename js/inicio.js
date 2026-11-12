// Página de inicio: muestra todos los estudios de estudios/indice.json (lo genera scripts/construir.mjs).
const lista = document.getElementById("lista");
document.getElementById("intro").textContent = TEXTOS.es.intro;
lista.textContent = TEXTOS.es.cargando;

(async () => {
  let estudios = [];
  try {
    estudios = await cargarIndice();
  } catch (e) {
    lista.textContent = "";
    return;
  }
  lista.innerHTML = estudios.map(e => {
    const t = TEXTOS[e.idioma] || TEXTOS.es;
    return `<a class="tarjeta" href="estudio.html?e=${encodeURIComponent(e.slug)}" style="--c:var(${COLORES[e.color] || "--b1"})">
      <span class="idioma">${e.idioma === "pt" ? "Português" : "Español"}</span>
      <h2>${esc(e.titulo)}</h2>
      ${e.descripcion ? `<p>${esc(e.descripcion)}</p>` : ""}
      <span class="cuenta">${e.temas} ${t.temas} · ${e.puntos} ${t.puntos}</span>
    </a>`;
  }).join("");
})();
