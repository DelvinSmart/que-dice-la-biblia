// Página de un estudio: carga estudios/<e>.json (e viene en el link: estudio.html?e=lenguas-extranas)
// y dibuja el mapa de temas y puntos y el panel de lectura.
// Con ?vista=1 es la vista previa del panel: no carga ningún archivo, recibe el estudio desde el panel
// (postMessage) cada vez que cambia y se vuelve a dibujar.
const $ = id => document.getElementById(id);
const PARAMS = new URLSearchParams(location.search);
const SLUG = PARAMS.get("e") || "";
const VISTA = PARAMS.has("vista");
let ESTUDIO = null, LANG = "es", T = TEXTOS.es;
let STEPS = [], chips = [], cur = 0;

function textosFijos() {
  document.documentElement.lang = LANG === "pt" ? "pt-BR" : "es";
  document.title = ESTUDIO.titulo || TEXTOS.es.volver;
  $("volver").textContent = T.volver;
  $("titulo").textContent = ESTUDIO.titulo;
  $("preguntas").innerHTML = "";
  (ESTUDIO.preguntas || []).forEach(q => { const li = document.createElement("li"); li.textContent = q; $("preguntas").appendChild(li); });
  $("ybien").textContent = ESTUDIO.cierre || "";
  $("prev").textContent = T.anterior;
  $("next").textContent = T.siguiente;
  $("tomap").textContent = T.mapa;
  $("ayuda").textContent = T.ayuda;
  $("pdf").textContent = T.pdf;
  $("pdfClaro").textContent = T.pdfClaro;
  $("pdfClaro").href = `descargas/${SLUG}-claro.pdf`;
  $("pdfOscuro").textContent = T.pdfOscuro;
  $("pdfOscuro").href = `descargas/${SLUG}.pdf`;
}

// Botones ES | PT: aparecen si el estudio tiene su versión en el otro idioma
function selectorIdioma() {
  $("idiomas").hidden = !ESTUDIO.otro_idioma;
  if (!ESTUDIO.otro_idioma) return;
  const otro = LANG === "pt" ? "es" : "pt";
  $("lang-" + LANG).classList.add("on");
  $("lang-" + otro).classList.remove("on");
  $("lang-" + LANG).href = `estudio.html?e=${encodeURIComponent(SLUG)}`;
  $("lang-" + otro).href = `estudio.html?e=${encodeURIComponent(ESTUDIO.otro_idioma)}`;
}

// "Nuevo": sale hasta que la persona abre ese subpunto. Lo abierto se recuerda en este aparato
// (localStorage, por estudio y por título del subpunto); en otro aparato vuelve a salir hasta que lo abra.
const claveVistos = () => "vistos-" + SLUG;
function leerVistos() {
  try { return new Set(JSON.parse(localStorage.getItem(claveVistos()) || "[]")); } catch (e) { return new Set(); }
}
const esNuevo = p => p.nuevo && (VISTA || !leerVistos().has(p.titulo));
function marcarVisto(p, chip) {
  if (VISTA || !p.nuevo) return;
  const vistos = leerVistos();
  if (!vistos.has(p.titulo)) {
    vistos.add(p.titulo);
    try { localStorage.setItem(claveVistos(), JSON.stringify([...vistos])); } catch (e) {}
  }
  chip?.querySelector(".new")?.remove();
}

function dibujarMapa() {
  STEPS = []; chips = [];
  $("tree").innerHTML = "";
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
      c.innerHTML = `<span class="n">${bi + 1}.${li + 1}</span>${esc(p.titulo)}${esNuevo(p) ? `<span class="new">${T.nuevo}</span>` : ""}`;
      c.addEventListener("click", () => show(idx, true));
      leaves.appendChild(c); chips[idx] = c;
    });
    const primero = STEPS.findIndex(s => s.bi === bi);
    if (primero >= 0) el.querySelector(".bhead").addEventListener("click", () => show(primero, true));
    $("tree").appendChild(el);
  });
  // Al final del mapa, el último paso: todas las fuentes del estudio
  const total = contarFuentes(ESTUDIO);
  if (total) {
    const idx = STEPS.push({ fuentes: true }) - 1;
    const el = document.createElement("div");
    el.className = "branch rama-fuentes";
    el.style.setProperty("--c", "var(--b11)");
    el.innerHTML = `<button class="bhead" type="button"><span class="bnum">≡</span><span class="btitle"><small>${total} ${T.fuentesCuenta}</small>${T.fuentesTitulo}</span></button>`;
    const boton = el.querySelector(".bhead");
    boton.addEventListener("click", () => show(idx, true));
    chips[idx] = boton;
    $("tree").appendChild(el);
  }
}

// Muestra el punto i en el panel de lectura. "animar" en false lo cambia sin el efecto de entrada.
function show(i, fromMap, animar = true, marcar = true) {
  $("reader").hidden = !STEPS.length;
  if (!STEPS.length) return;
  cur = Math.max(0, Math.min(STEPS.length - 1, i));
  const s = STEPS[cur];
  $("reader").style.setProperty("--c", s.fuentes ? "var(--b11)" : `var(${colorDe(s.tema)})`);
  $("rtag").textContent = s.fuentes ? `${contarFuentes(ESTUDIO)} ${T.fuentesCuenta}` : `${s.bi + 1} · ${s.tema.titulo}`;
  $("rlabel").textContent = s.fuentes ? T.fuentesTitulo : s.p.titulo;
  $("rbody").innerHTML = s.fuentes ? paginaFuentesHTML(ESTUDIO) : puntoHTML(s.p);
  if (s.p && marcar) marcarVisto(s.p, chips[cur]);
  if (typeof etiquetarRVR === "function") etiquetarRVR($("rbody"));
  if (animar) {
    revelar([$("rtag"), $("rlabel")], 40);
    revelar($("rbody").children, 50, 60);
    $("rbody").scrollTop = 0;
  }
  $("pos").textContent = `${cur + 1} / ${STEPS.length}`;
  $("prev").disabled = cur === 0;
  $("next").disabled = cur === STEPS.length - 1;
  chips.forEach((c, k) => c.classList.toggle("on", k === cur));
  if (fromMap && window.matchMedia("(max-width:920px)").matches) $("reader").scrollIntoView({ behavior: "smooth", block: "start" });
  if (!VISTA) { try { localStorage.setItem("paso-" + SLUG, String(cur)); } catch (e) {} }
}

// Botoncitos de fuentes: al tocar uno se abre su recuadro debajo; al tocarlo otra vez se cierra
function abrirFuente(chip) {
  const caja = chip.closest(".fuentes-punto");
  const pop = caja.querySelector(".pop-fuente");
  const abierto = chip.getAttribute("aria-expanded") === "true";
  caja.querySelectorAll(".chip-fuente").forEach(c => c.setAttribute("aria-expanded", "false"));
  if (abierto) { pop.hidden = true; return; }
  pop.innerHTML = fichaFuenteHTML(fuentesDePunto(STEPS[cur].p)[Number(chip.dataset.fuente)]);
  pop.hidden = false;
  chip.setAttribute("aria-expanded", "true");
  revelar([pop], 0);
  pop.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Pasajes: al tocar un botoncito se abre su pasaje debajo de la fila, con efecto. Al tocarlo otra vez se
// cierra; al tocar otro pasaje del subpunto, el anterior se cierra.
// Cerrar con efecto: se desvanece y sube un poquito; después se esconde
function cerrarPasaje(caja) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { caja.hidden = true; return; }
  caja.classList.add("cerrando");
  // Espera lo mismo que dura el efecto en css/motor.css (--dur-200)
  const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-200")) * 1000 || 0;
  setTimeout(() => { caja.hidden = true; caja.classList.remove("cerrando"); }, ms);
}

// Abre un recuadro (el pasaje o su LBLA) debajo de la fila; cierra lo que estuviera abierto en el subpunto.
// Si ese botón ya estaba abierto, solo lo cierra.
function abrirRecuadro(boton, caja) {
  const abierto = boton.getAttribute("aria-expanded") === "true";
  $("rbody").querySelectorAll(".chip-pasaje, .boton-lbla").forEach(c => c.setAttribute("aria-expanded", "false"));
  $("rbody").querySelectorAll(".pasaje-abierto:not([hidden]), .lbla-abierto:not([hidden])").forEach(cerrarPasaje);
  if (abierto) return false;
  boton.setAttribute("aria-expanded", "true");
  caja.hidden = false;
  revelar([caja], 0);
  caja.scrollIntoView({ behavior: "smooth", block: "nearest" });
  return true;
}

const posicionDe = boton => [...boton.closest(".pasajes").querySelectorAll(".pasaje-y-rvr")].indexOf(boton.closest(".pasaje-y-rvr"));

function abrirPasaje(chip) {
  abrirRecuadro(chip, chip.closest(".pasajes").querySelectorAll(".pasaje-abierto")[posicionDe(chip)]);
}

// LBLA: el versículo en la página de Lockman, en el mismo espacio que el pasaje. Se muestra solo su recuadro:
// la página se corre hacia arriba lo que mide su encabezado. El navegador no deja medir la página de Lockman, así
// que el alto se calcula por el ancho (en un teléfono el versículo ocupa más líneas) para que quepa un versículo
// largo; si no cabe, "Ver más" lo agranda. Con varios versículos, las flechas ‹ › pasan de uno a otro.
// Todas las medidas están en css/motor.css (medidas en bible.lockman.org el 15 nov 2026).
// La página de Lockman se muestra reducida (--lbla-escala) para que su letra (20px) quede del tamaño de la
// nuestra: se arma como si tuviera el ancho del recuadro dividido por la escala, y se achica.
function medidasLBLA(anchoReal) {
  const motor = getComputedStyle(document.documentElement);
  const px = nombre => parseFloat(motor.getPropertyValue(nombre)) || 0;
  const escala = px("--lbla-escala") || 1;
  const ancho = anchoReal / escala; // el ancho con que Lockman arma su página
  const banda = [1, 2, 3, 4].find(n => ancho <= px(`--lbla-ancho-${n}`)) || 5;
  return {
    escala, ancho,
    encabezado: ancho <= px("--lbla-corte") ? px("--lbla-encabezado-angosto") : px("--lbla-encabezado-ancho"),
    alto: px(`--lbla-alto-${banda}`),
    mas: px("--lbla-mas")
  };
}

function abrirLBLA(boton) {
  const caja = boton.closest(".pasajes").querySelectorAll(".lbla-abierto")[posicionDe(boton)];
  if (!abrirRecuadro(boton, caja) || caja.firstChild) return;
  const ref = boton.dataset.referencia;
  const versos = versiculosDeReferencia(ref);
  const m = medidasLBLA(caja.clientWidth);
  let alto = m.alto, k = 0;
  caja.innerHTML = `
    <div class="lbla-recorte">
      <p class="ventana-cargando">${T.cargandoLBLA}</p>
      <iframe class="lbla-marco" title="La Biblia de las Américas en bible.lockman.org"></iframe>
    </div>
    <div class="lbla-pie">
      ${versos.length > 1 ? `<button type="button" class="lbla-flecha" data-paso="-1" aria-label="Versículo anterior">‹</button>` : ""}
      <a class="lbla-link" target="_blank" rel="noopener"></a>
      <button type="button" class="lbla-mas">${T.verMas}</button>
      ${versos.length > 1 ? `<button type="button" class="lbla-flecha" data-paso="1" aria-label="Versículo siguiente">›</button>` : ""}
    </div>`;
  const recorte = caja.querySelector(".lbla-recorte"), marco = caja.querySelector("iframe");
  const cargando = caja.querySelector(".ventana-cargando"), link = caja.querySelector(".lbla-link");
  const medir = () => {
    recorte.style.height = `${alto * m.escala}px`;
    marco.style.width = `${m.ancho}px`;
    marco.style.height = `${alto + m.encabezado}px`;
    marco.style.top = `-${m.encabezado * m.escala}px`;
    marco.style.transform = `scale(${m.escala})`;
  };
  const ir = nuevo => {
    k = Math.max(0, Math.min(versos.length - 1, nuevo));
    const url = enlaceLockman(ref, versos[k]);
    cargando.hidden = false;
    marco.classList.remove("listo");
    marco.src = url;
    link.href = url;
    const r = leerReferencia(ref);
    link.textContent = `${r ? `${r.libro[LANG === "pt" ? "pt" : "es"]} ${r.capitulo}:${versos[k]}` : ""}${versos.length > 1 ? ` · ${k + 1}/${versos.length}` : ""} · bible.lockman.org ↗`;
    caja.querySelectorAll(".lbla-flecha").forEach(f => { f.disabled = (f.dataset.paso === "-1" && k === 0) || (f.dataset.paso === "1" && k === versos.length - 1); });
  };
  marco.addEventListener("load", () => { if (marco.src) { marco.classList.add("listo"); cargando.hidden = true; } });
  caja.querySelector(".lbla-pie").addEventListener("click", e => {
    const flecha = e.target.closest(".lbla-flecha");
    if (flecha) ir(k + Number(flecha.dataset.paso));
    if (e.target.closest(".lbla-mas")) { alto += m.mas; medir(); }
  });
  medir();
  ir(0);
}

function controles() {
  $("rbody").addEventListener("click", e => {
    const chip = e.target.closest(".chip-fuente");
    if (chip && STEPS[cur]?.p) abrirFuente(chip);
    const pasaje = e.target.closest(".chip-pasaje");
    if (pasaje) abrirPasaje(pasaje);
    const lbla = e.target.closest(".boton-lbla");
    if (lbla) abrirLBLA(lbla);
  });
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

// Dibuja todo el estudio a partir de sus datos
function pintar(datos) {
  ESTUDIO = datos;
  LANG = ESTUDIO.idioma === "pt" ? "pt" : "es";
  T = TEXTOS[LANG];
  textosFijos();
  selectorIdioma();
  dibujarMapa();
  $("aviso").innerHTML = avisosDerechos(ESTUDIO);
}

controles();

if (VISTA) {
  // Vista previa del panel: sin enlaces para salir y sin descargar PDF
  document.body.classList.add("modo-vista");
  let pasoMostrado = -1;
  window.addEventListener("message", e => {
    if (e.origin !== location.origin || e.data?.tipo !== "estudio") return;
    window.IMAGENES_LOCALES = e.data.imagenes || {};
    pintar(e.data.estudio);
    const paso = Number.isInteger(e.data.paso) ? e.data.paso : cur;
    show(paso, false, paso !== pasoMostrado);
    pasoMostrado = cur;
  });
  window.parent.postMessage({ tipo: "vista-lista" }, location.origin);
} else {
  (async () => {
    try {
      pintar(await cargarEstudio(SLUG));
    } catch (e) {
      $("titulo").textContent = TEXTOS.es.noEncontrado;
      $("volver").textContent = TEXTOS.es.volver;
      $("reader").hidden = true;
      return;
    }
    revelar([$("volver"), document.querySelector(".root"), $("reader")], 80);
    revelar(document.querySelectorAll(".branch"), 70, 160);
    let start = 0;
    try { start = parseInt(localStorage.getItem("paso-" + SLUG) || "0", 10) || 0; } catch (e) {}
    // Al entrar se muestra solo el último subpunto leído. En el teléfono queda debajo del mapa y todavía
    // no se ve, así que no cuenta como abierto; en la computadora sale al lado y sí se ve.
    show(start, false, true, window.matchMedia("(min-width:921px)").matches);
  })();
}
