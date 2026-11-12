// Página de un estudio: carga estudios/<e>.json (e viene en el link: estudio.html?e=lenguas-extranas)
// y dibuja el mapa de temas y puntos y el panel de lectura.
const $ = id => document.getElementById(id);
const SLUG = new URLSearchParams(location.search).get("e") || "";
let ESTUDIO = null, LANG = "es", T = TEXTOS.es;
let STEPS = [], chips = [], cur = 0;

function textosFijos() {
  document.documentElement.lang = LANG === "pt" ? "pt-BR" : "es";
  document.title = ESTUDIO.titulo;
  $("volver").textContent = T.volver;
  $("titulo").textContent = ESTUDIO.titulo;
  (ESTUDIO.preguntas || []).forEach(q => { const li = document.createElement("li"); li.textContent = q; $("preguntas").appendChild(li); });
  $("ybien").textContent = ESTUDIO.cierre || "";
  $("prev").textContent = T.anterior;
  $("next").textContent = T.siguiente;
  $("tomap").textContent = T.mapa;
  $("ayuda").textContent = T.ayuda;
  $("pdf").textContent = T.pdf;
  $("pdf").href = `descargas/${SLUG}.pdf`;
}

// Botones ES | PT: aparecen si el estudio tiene su versión en el otro idioma
function selectorIdioma() {
  if (!ESTUDIO.otro_idioma) return;
  const otro = LANG === "pt" ? "es" : "pt";
  $("idiomas").hidden = false;
  $("lang-" + LANG).classList.add("on");
  $("lang-" + LANG).href = `estudio.html?e=${encodeURIComponent(SLUG)}`;
  $("lang-" + otro).href = `estudio.html?e=${encodeURIComponent(ESTUDIO.otro_idioma)}`;
}

function dibujarMapa() {
  (ESTUDIO.temas || []).forEach((tema, bi) => (tema.puntos || []).forEach((p, li) => STEPS.push({ tema, bi, p, li })));
  (ESTUDIO.temas || []).forEach((tema, bi) => {
    const el = document.createElement("div");
    el.className = "branch";
    el.style.setProperty("--c", `var(${colorDe(tema)})`);
    el.innerHTML = `<button class="bhead" type="button"><span class="bnum">${bi + 1}</span><span class="btitle"><small>${esc(tema.subtitulo)}</small>${esc(tema.titulo)}</span></button><div class="leaves"></div>`;
    const leaves = el.querySelector(".leaves");
    (tema.puntos || []).forEach((p, li) => {
      const idx = STEPS.findIndex(s => s.bi === bi && s.li === li);
      const c = document.createElement("button");
      c.type = "button"; c.className = "leaf";
      c.innerHTML = `<span class="n">${bi + 1}.${li + 1}</span>${esc(p.titulo)}${p.nuevo ? `<span class="new">${T.nuevo}</span>` : ""}`;
      c.addEventListener("click", () => show(idx, true));
      leaves.appendChild(c); chips[idx] = c;
    });
    const primero = STEPS.findIndex(s => s.bi === bi);
    if (primero >= 0) el.querySelector(".bhead").addEventListener("click", () => show(primero, true));
    $("tree").appendChild(el);
  });
}

function show(i, fromMap) {
  if (!STEPS.length) return;
  cur = Math.max(0, Math.min(STEPS.length - 1, i));
  const s = STEPS[cur];
  $("reader").style.setProperty("--c", `var(${colorDe(s.tema)})`);
  $("rtag").textContent = `${s.bi + 1} · ${s.tema.titulo}`;
  $("rlabel").textContent = s.p.titulo;
  $("rbody").innerHTML = puntoHTML(s.p);
  revelar([$("rtag"), $("rlabel")], 40);
  revelar($("rbody").children, 50, 60);
  $("rbody").scrollTop = 0;
  $("pos").textContent = `${cur + 1} / ${STEPS.length}`;
  $("prev").disabled = cur === 0;
  $("next").disabled = cur === STEPS.length - 1;
  chips.forEach((c, k) => c.classList.toggle("on", k === cur));
  if (fromMap && window.matchMedia("(max-width:920px)").matches) $("reader").scrollIntoView({ behavior: "smooth", block: "start" });
  try { localStorage.setItem("paso-" + SLUG, String(cur)); } catch (e) {}
}

function controles() {
  $("prev").addEventListener("click", () => show(cur - 1));
  $("next").addEventListener("click", () => show(cur + 1));
  $("tomap").addEventListener("click", () => {
    chips[cur].scrollIntoView({ behavior: "smooth", block: "center" });
    chips[cur].focus({ preventScroll: true });
  });
  document.addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("select")) return;
    if (e.key === "ArrowRight") show(cur + 1);
    if (e.key === "ArrowLeft") show(cur - 1);
  });
}

(async () => {
  try {
    ESTUDIO = await cargarEstudio(SLUG);
  } catch (e) {
    $("titulo").textContent = TEXTOS.es.noEncontrado;
    $("volver").textContent = TEXTOS.es.volver;
    $("reader").hidden = true;
    return;
  }
  LANG = ESTUDIO.idioma === "pt" ? "pt" : "es";
  T = TEXTOS[LANG];
  textosFijos();
  selectorIdioma();
  dibujarMapa();
  revelar([$("volver"), document.querySelector(".root"), $("reader")], 80);
  revelar(document.querySelectorAll(".branch"), 70, 160);
  controles();
  let start = 0;
  try { start = parseInt(localStorage.getItem("paso-" + SLUG) || "0", 10) || 0; } catch (e) {}
  show(start);
})();
