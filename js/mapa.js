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
  // Se adelanta la Reina-Valera de los pasajes de este subpunto, para que al tocar el botón ya esté
  if (s.p && LANG !== "pt" && typeof adelantarRVR === "function")
    adelantarRVR((s.p.bloques || []).filter(b => b.tipo === "pasaje").map(b => b.referencia));
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
// Lo que dura el efecto de cierre, de css/motor.css (--dur-200)
const duracionCierre = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-200")) * 1000 || 0;

// Cerrar con efecto: se desvanece y sube un poquito; después se esconde
function cerrarPasaje(caja) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { caja.hidden = true; return; }
  caja.classList.add("cerrando");
  setTimeout(() => { caja.hidden = true; caja.classList.remove("cerrando"); }, duracionCierre());
}

// Abre un recuadro (el pasaje o su LBLA) debajo de la fila; cierra lo que estuviera abierto en el subpunto.
// Si ese botón ya estaba abierto, solo lo cierra.
// Todo en orden: si había otro recuadro abierto, primero se va con su efecto y recién después entra el nuevo,
// así nunca hay dos a la vez ni saltos. "preparar" llena el recuadro la primera vez (antes de que se vea).
const RECUADROS = ".pasaje-abierto, .lbla-abierto, .rvr-abierto";
let relojRecuadro = null;
function abrirRecuadro(boton, caja, preparar) {
  const abierto = boton.getAttribute("aria-expanded") === "true";
  clearTimeout(relojRecuadro);
  $("rbody").querySelectorAll(".chip-pasaje, .boton-version").forEach(c => c.setAttribute("aria-expanded", "false"));
  const abiertos = [...$("rbody").querySelectorAll(RECUADROS)].filter(c => !c.hidden && !c.classList.contains("cerrando"));
  abiertos.forEach(cerrarPasaje);
  if (abierto) return;
  boton.setAttribute("aria-expanded", "true");
  if (preparar && !caja.firstChild) preparar();
  const mostrar = () => {
    caja.hidden = false;
    revelar([caja], 0);
    caja.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  if (abiertos.length) relojRecuadro = setTimeout(mostrar, duracionCierre()); else mostrar();
}

const posicionDe = boton => [...boton.closest(".pasajes").querySelectorAll(".pasaje-y-rvr")].indexOf(boton.closest(".pasaje-y-rvr"));

function abrirPasaje(chip) {
  abrirRecuadro(chip, chip.closest(".pasajes").querySelectorAll(".pasaje-abierto")[posicionDe(chip)]);
}

// LBLA: el versículo en la página de Lockman, en el mismo espacio que el pasaje. Se muestra solo su recuadro:
// la página se arma siempre en su diseño angosto (hasta --lbla-ancho-max), reducida a --lbla-escala, y se corre
// hacia arriba lo que mide su encabezado. El navegador no deja leer ni medir la página de Lockman, así que el alto
// se CALCULA: el recuadro del versículo mide --lbla-tarjeta (bordes y título) más --lbla-linea por cada línea, y las
// líneas salen del largo del versículo: el de la LBLA si el autor ya lo pegó, o si no el de la Reina-Valera 1960
// (Logos), contado un poco más largo porque la LBLA suele tener más palabras. Debajo, a
// --lbla-hueco, empieza "in context": el corte queda antes. Si una línea no entra, "Ver más" agrega una.
// Medido en bible.lockman.org el 15 nov 2026 (css/motor.css).
function medidasLBLA(anchoReal) {
  const motor = getComputedStyle(document.documentElement);
  const px = nombre => parseFloat(motor.getPropertyValue(nombre)) || 0;
  const escala = px("--lbla-escala") || 1;
  const ancho = Math.min(anchoReal / escala, px("--lbla-ancho-max"));
  return {
    escala, ancho,
    encabezado: px("--lbla-encabezado"),
    tarjeta: px("--lbla-tarjeta"),
    linea: px("--lbla-linea"),
    margen: px("--lbla-margen"),
    tarjetaIzquierda: px("--lbla-tarjeta-izquierda"),
    tarjetaAncho: ancho - 2 * px("--lbla-tarjeta-izquierda") - px("--lbla-tarjeta-resta"),
    sobra: px("--lbla-sobra"),
    letrasPorLinea: Math.max(10, Math.floor((ancho - px("--lbla-columna-resta")) / px("--lbla-ancho-letra"))),
    letrasNotas: px("--lbla-letras-notas"),
    proporcionRVR: px("--lbla-proporcion-rvr") || 1
  };
}

// El texto de la LBLA que el autor ya pegó en este pasaje, por número de versículo (su recuadro va justo antes)
function textosPegadosLBLA(caja) {
  const pasaje = caja.previousElementSibling;
  const textos = new Map();
  if (!pasaje || !pasaje.matches(".pasaje-abierto")) return textos;
  pasaje.querySelectorAll(".passage > p:not(.pasaje-pendiente)").forEach(p => {
    const numero = p.querySelector("b")?.textContent.trim();
    if (numero && /^\d+$/.test(numero)) textos.set(numero, p.textContent.slice(p.querySelector("b").textContent.length).trim());
  });
  return textos;
}

function abrirLBLA(boton) {
  const caja = boton.closest(".pasajes").querySelectorAll(".lbla-abierto")[posicionDe(boton)];
  abrirRecuadro(boton, caja, () => prepararLBLA(boton, caja));
}

function prepararLBLA(boton, caja) {
  const ref = boton.dataset.referencia;
  const r = leerReferencia(ref);
  const versos = versiculosDeReferencia(ref);
  const m = medidasLBLA(boton.closest(".pasajes").clientWidth);
  let extra = 0;
  // Todos los versículos del pasaje, uno debajo del otro: cada uno es la página de Lockman de ese versículo,
  // recortada justo a su recuadro (sin el fondo de alrededor). Una tapa transparente encima no deja moverla
  // ni tocarla por dentro (Safari la deja mover aunque se le diga que no con CSS).
  caja.innerHTML = `
    <div class="lbla-versos">${versos.map(n => `
      <div class="lbla-recorte" data-versiculo="${n}">
        <p class="ventana-cargando">${T.cargandoLBLA}</p>
        <iframe class="lbla-marco" title="La Biblia de las Américas en bible.lockman.org" src="${esc(enlaceLockman(ref, n))}" scrolling="no" tabindex="-1"></iframe>
        <span class="lbla-tapa" aria-hidden="true"></span>
      </div>`).join("")}
    </div>
    <div class="lbla-pie">
      <a class="lbla-link" href="${esc(enlaceLockman(ref, versos[0]))}" target="_blank" rel="noopener">${esc(r ? `${r.libro[LANG === "pt" ? "pt" : "es"]} ${ref.replace(/^.*?(\d+:)/, "$1").replace(/\s+[A-Z]{2,6}\d*$/, "")}` : "")} · bible.lockman.org ↗</a>
      <button type="button" class="lbla-mas">${T.verMas}</button>
    </div>`;
  const recortes = [...caja.querySelectorAll(".lbla-recorte")];
  const lineas = new Map(versos.map(n => [String(n), 2]));
  const lineasDe = letras => Math.max(1, Math.ceil((letras + m.letrasNotas) / m.letrasPorLinea));
  const pegados = textosPegadosLBLA(caja);
  const medir = recorte => {
    const marco = recorte.querySelector("iframe");
    const alto = m.tarjeta + m.linea * (lineas.get(recorte.dataset.versiculo) + extra);   // el recuadro del versículo
    recorte.style.width = `${(m.tarjetaAncho + 2 * m.margen) * m.escala}px`;
    recorte.style.height = `${(alto + 2 * m.margen) * m.escala}px`;
    marco.style.width = `${m.ancho}px`;
    marco.style.height = `${m.encabezado + alto + m.sobra}px`;           // más alto: su botón "Ask" queda abajo, fuera
    marco.style.top = `-${(m.encabezado - m.margen) * m.escala}px`;
    marco.style.left = `-${(m.tarjetaIzquierda - m.margen) * m.escala}px`;
    marco.style.transform = `scale(${m.escala})`;
  };
  recortes.forEach(recorte => {
    const marco = recorte.querySelector("iframe"), n = recorte.dataset.versiculo;
    marco.addEventListener("load", () => { marco.classList.add("listo"); recorte.querySelector(".ventana-cargando").hidden = true; });
    // El largo del versículo: el de la LBLA si ya está pegado en el estudio (exacto); si no, el de la
    // Reina-Valera 1960, contado un poco más largo (--lbla-proporcion-rvr)
    if (pegados.get(n)) lineas.set(n, lineasDe(pegados.get(n).length));
    medir(recorte);
    if (!pegados.get(n) && r && typeof versiculoRVR === "function") versiculoRVR(r.libro, r.capitulo, n).then(texto => {
      lineas.set(n, lineasDe(texto.length * m.proporcionRVR));
      medir(recorte);
    }).catch(() => {});
  });
  caja.querySelector(".lbla-mas").addEventListener("click", () => { extra += 1; recortes.forEach(medir); });
}

// RVR 1960: el pasaje en la Reina-Valera, en el mismo lugar y con el mismo formato de nuestros pasajes. El texto
// lo entrega Logos versículo por versículo (js/rvr.js); se va mostrando a medida que llega.
function abrirRVR(boton) {
  const caja = boton.closest(".pasajes").querySelectorAll(".rvr-abierto")[posicionDe(boton)];
  abrirRecuadro(boton, caja, () => {
    const ref = boton.dataset.referencia;
    const r = leerReferencia(ref);
    const titulo = r ? `${r.libro.es} ${r.capitulo}:${ref.replace(/^.*?:\s*/, "").replace(/\s+[A-Z]{2,6}\d*$/, "")} · RVR 1960` : "RVR 1960";
    caja.innerHTML = `<div class="passage rvr-texto"><div class="ref">${esc(titulo)}</div>
      <div class="rvr-versos"><p class="rvr-cargando">${T.cargandoRVR}</p></div>
      <div class="credito">Reina-Valera 1960 · texto de <a href="https://www.logos.com/" target="_blank" rel="noopener">Logos</a></div></div>`;
    const versos = caja.querySelector(".rvr-versos");
    pasajeRVR(ref, v => {
      versos.querySelector(".rvr-cargando")?.remove();
      const p = document.createElement("p");
      p.innerHTML = `<b>${esc(v.numero)}</b>${esc(v.texto)}`;
      versos.appendChild(p);
      revelar([p], 0);
    }).catch(() => { versos.innerHTML = `<p class="rvr-cargando">${T.sinRVR}</p>`; });
  });
}

function controles() {
  $("rbody").addEventListener("click", e => {
    const chip = e.target.closest(".chip-fuente");
    if (chip && STEPS[cur]?.p) abrirFuente(chip);
    const pasaje = e.target.closest(".chip-pasaje");
    if (pasaje) abrirPasaje(pasaje);
    const lbla = e.target.closest(".boton-lbla");
    if (lbla) abrirLBLA(lbla);
    const rvr = e.target.closest(".boton-rvr");
    if (rvr) abrirRVR(rvr);
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
