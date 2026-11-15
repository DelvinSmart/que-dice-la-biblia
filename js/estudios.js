// Carga los estudios (archivos JSON de la carpeta estudios/) y convierte sus bloques en HTML.
// Cada estudio: titulo, idioma, otro_idioma, descripcion, preguntas[], cierre, temas[].
// Cada elemento de temas[] es un PUNTO del mapa (1, 2, 3…): titulo, subtitulo, color, puntos[].
// Cada elemento de puntos[] es un SUBPUNTO (1.1, 1.2…): titulo, nuevo, bloques[].
// Cada bloque tiene "tipo": texto (HTML), subtitulo, pasaje (referencia + versiculos[{numero, texto}])
// imagen (src = ruta en imagenes/, pie), video (url de YouTube u otra página, o src = archivo en videos/, pie)
// fuente (titulo, texto y url): de dónde se sacó la información, con su explicación y su link,
// o griego (referencia + versiculos[{numero, texto}]): el texto griego del SBLGNT, que el panel llena solo.
// Un pasaje puede llevar además "imagen": una foto de los versículos en lugar del texto.

const COLORES = {
  azul: "--b1", morado: "--b2", verde: "--b3", naranja: "--b4", rosado: "--b5", amarillo: "--b6",
  rojo: "--b7", celeste: "--b8", lima: "--b9", cobre: "--b10", pizarra: "--b11"
};

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

async function cargarJSON(ruta) {
  const r = await fetch(ruta, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${ruta}: ${r.status}`);
  return r.json();
}

const cargarEstudio = slug => cargarJSON(`estudios/${encodeURIComponent(slug)}.json`);
const cargarIndice = () => cargarJSON("estudios/indice.json");

function bloqueHTML(b) {
  switch (b.tipo) {
    case "texto":
      return b.texto || "";
    case "subtitulo":
      return `<h3>${esc(b.texto)}</h3>`;
    case "pasaje":
      return `<div class="passage"><div class="ref">${refHTML(b.referencia)}</div>${
        !(b.versiculos || []).some(v => v.texto) && !b.imagen && botonRVR(b) ? `<p class="pasaje-pendiente">${etiquetasFuente().pendiente}</p>` : ""}${
        b.imagen ? `<img class="pasaje-img" src="${esc(rutaImagen(b.imagen))}" alt="${esc(b.referencia)}" loading="lazy">` : ""}${
        (b.versiculos || []).filter(v => v.texto).map(v => `<p>${v.numero ? `<b>${esc(v.numero)}</b>` : ""}${v.texto}</p>`).join("")
      }${esLBLA(b.referencia) ? CREDITO_LBLA : ""}</div>`;
    case "video":
      return videoHTML(b);
    case "fuente":
    case "griego":
      return ""; // las fuentes no van en el texto: salen como botoncitos al final del subpunto
    case "imagen":
      return b.src ? `<figure class="imagen"><img src="${esc(rutaImagen(b.src))}" alt="${esc(b.pie)}" loading="lazy">${
        b.pie ? `<figcaption>${esc(b.pie)}</figcaption>` : ""}</figure>` : "";
    default:
      return "";
  }
}

// En el panel, una imagen recién escogida todavía no está publicada: se muestra la copia del aparato
const rutaImagen = src => (window.IMAGENES_LOCALES && window.IMAGENES_LOCALES[src]) || src;

// Video: de YouTube se muestra el reproductor; de un archivo, el reproductor del navegador.
// En el PDF no se puede ver un video: ahí salen la miniatura y el link (clases .solo-pdf).
const idYoutube = url => (/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/.exec(url || "") || [])[1];

function videoHTML(b) {
  const pie = b.pie ? `<figcaption>${esc(b.pie)}</figcaption>` : "";
  const yt = idYoutube(b.url);
  if (yt) return `<figure class="imagen video"><div class="marco-video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="${esc(b.pie || "Video")}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div><img class="solo-pdf" src="https://img.youtube.com/vi/${yt}/hqdefault.jpg" alt=""><p class="solo-pdf">Video: https://youtu.be/${yt}</p>${pie}</figure>`;
  if (b.src) return `<figure class="imagen video"><video src="${esc(rutaImagen(b.src))}" controls playsinline preload="metadata"></video><p class="solo-pdf">Video disponible en la página del estudio</p>${pie}</figure>`;
  if (b.url) return `<figure class="imagen video"><p class="enlace-video"><a href="${esc(b.url)}" target="_blank" rel="noopener">Ver el video</a></p><p class="solo-pdf">Video: ${esc(b.url)}</p>${pie}</figure>`;
  return "";
}

// La LBLA (The Lockman Foundation) permite citar hasta 500 versículos, sin un libro completo y sin pasar
// del 25% de la obra, si la página muestra el aviso completo con un enlace a www.LBLA.com
// (https://www.lockman.org/espanol/permiso-para-citar/). Cada pasaje LBLA lleva un crédito corto
// y la página del estudio y el PDF llevan el aviso completo (avisoLBLA).
const URL_LBLA = "https://www.lbla.com/";
const esLBLA = ref => /\bLBLA\b/.test(ref || "");
const enlaceLBLA = texto => `<a href="${URL_LBLA}" target="_blank" rel="noopener">${texto}</a>`;
const CREDITO_LBLA = `<div class="credito">La Biblia de las Américas · © The Lockman Foundation · ${enlaceLBLA("LBLA.com")}</div>`;
const AVISO_LBLA = `Escrituras tomadas de La Biblia de las Américas (LBLA), Copyright © 1986, 1995, 1997 por The Lockman Foundation. Usadas con permiso. ${enlaceLBLA("www.LBLA.com")}`;

// La referencia con la versión LBLA como enlace: "Génesis 2:18 LBLA"
const refHTML = ref => esLBLA(ref) ? esc(ref).replace(/\bLBLA\b/, enlaceLBLA("LBLA")) : esc(ref);

// ¿El estudio cita la LBLA? Entonces lleva el aviso completo
const usaLBLA = e => (e.temas || []).some(t => (t.puntos || []).some(p => (p.bloques || []).some(b => b.tipo === "pasaje" && esLBLA(b.referencia))));
const avisoLBLA = e => usaLBLA(e) ? `<p class="aviso-lbla">${AVISO_LBLA}</p>` : "";

// ---------- Reina-Valera 1960 al lado de cada pasaje (Reftagger de Logos) ----------
// Un botoncito "RVR 1960" en la referencia: al pasar el mouse (o tocarlo en el teléfono) Logos muestra el
// pasaje en esa versión en un recuadro. El texto NO se guarda en la página: lo trae Logos en ese momento,
// con su licencia. Lo activa js/rvr.js en la página del estudio; en el PDF y en el panel queda escondido.
// Solo en español: Logos no tiene las versiones en portugués que usamos.
function botonRVR(b) {
  if ((document.documentElement.lang || "").startsWith("pt") || typeof referenciaEnIngles !== "function") return "";
  const en = referenciaEnIngles(b.referencia);
  return en ? `<span class="rvr">${esc(en)}</span>` : "";
}

// Botón "LBLA": abre debajo, en el mismo lugar donde se abre el pasaje, el versículo en la Biblia en línea de
// Lockman (el dueño de la LBLA), recortado para que se vea solo su recuadro (js/mapa.js → abrirLBLA). El texto
// no se copia: es la página de Lockman, con su nombre y su link.
function botonLBLA(b) {
  if (typeof enlaceLockman !== "function" || !esLBLA(b.referencia)) return "";
  const url = enlaceLockman(b.referencia);
  return url ? `<button type="button" class="boton-lbla" data-lockman="${esc(url)}" aria-expanded="false">LBLA</button>` : "";
}

// ---------- Texto griego (SBLGNT, licencia CC BY 4.0: se puede publicar con el crédito) ----------

const URL_SBLGNT = "https://sblgnt.com/";
const LICENCIA_SBLGNT = "https://creativecommons.org/licenses/by/4.0/deed.es";
const ETIQUETAS_GRIEGO = {
  es: { falta: "Este versículo no está en el texto griego crítico." },
  pt: { falta: "Este versículo não está no texto grego crítico." }
};
const CREDITO_SBLGNT = `<div class="credito">SBL Greek New Testament · © 2010 SBL y Logos Bible Software · <a href="${LICENCIA_SBLGNT}" target="_blank" rel="noopener">CC BY 4.0</a></div>`;

function griegoHTML(b) {
  if (!b.referencia && !(b.versiculos || []).length) return "";
  const falta = ETIQUETAS_GRIEGO[(document.documentElement.lang || "").startsWith("pt") ? "pt" : "es"].falta;
  return `<div class="passage griego"><div class="ref">${esc(b.referencia)} · <a href="${URL_SBLGNT}" target="_blank" rel="noopener">SBLGNT</a></div>${
    (b.versiculos || []).map(v => `<p${v.texto ? ' lang="grc"' : ' class="falta"'}><b>${esc(v.numero)}</b>${v.texto ? esc(v.texto) : falta}</p>`).join("")
  }${CREDITO_SBLGNT}</div>`;
}

const usaGriego = e => (e.temas || []).some(t => (t.puntos || []).some(p => (p.bloques || []).some(b => b.tipo === "griego")));
const AVISO_SBLGNT = `Texto griego: SBL Greek New Testament (SBLGNT), Copyright © 2010 Society of Biblical Literature y Logos Bible Software, con licencia ${
  ""}<a href="${LICENCIA_SBLGNT}" target="_blank" rel="noopener">Creative Commons Atribución 4.0</a>. Sin los signos del aparato crítico. ${
  ""}<a href="${URL_SBLGNT}" target="_blank" rel="noopener">sblgnt.com</a>`;

// Los avisos de derechos que el estudio necesita: LBLA y/o SBLGNT
const avisosDerechos = e => avisoLBLA(e) + (usaGriego(e) ? `<p class="aviso-lbla">${AVISO_SBLGNT}</p>` : "");

// ---------- Fuentes: de dónde se sacó la información ----------
// Cada subpunto guarda sus fuentes en "fuentes" (fuera del texto del estudio): {tipo: "fuente", titulo, texto, url}
// o {tipo: "griego", referencia, versiculos}. Al leer el subpunto salen como botoncitos; al tocar uno se abre
// un recuadro con el resumen y el link. Todas juntas están en el último paso del mapa, "Fuentes del estudio",
// y al final del PDF. (Los estudios viejos podían tenerlas como bloques: también se leen.)

const ETIQUETAS_FUENTE = {
  es: { fuentes: "Fuentes", ver: "Ver la fuente ↗", todas: "Fuentes del estudio", griego: "Griego", cerrar: "Cerrar",
        pendiente: "El texto de este pasaje todavía no se copió. Mientras tanto puedes leerlo en la LBLA (botón “LBLA”) o en la Reina-Valera 1960 (botón “RVR 1960”)." },
  pt: { fuentes: "Fontes", ver: "Ver a fonte ↗", todas: "Fontes do estudo", griego: "Grego", cerrar: "Fechar", pendiente: "" }
};
const etiquetasFuente = () => ETIQUETAS_FUENTE[(document.documentElement.lang || "").startsWith("pt") ? "pt" : "es"];
// Solo links web (http o https): nunca otro tipo de link que pudiera ejecutar algo
const linkSeguro = url => (/^https?:\/\//i.test(String(url || "").trim()) ? String(url).trim() : "");
const dominio = url => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };

const esFuente = b => (b.tipo === "fuente" && (b.titulo || b.texto || b.url)) || (b.tipo === "griego" && (b.referencia || (b.versiculos || []).length));
const fuentesDePunto = p => [...(p.fuentes || []), ...(p.bloques || [])].filter(esFuente);
const nombreFuente = f => (f.tipo === "griego" ? `${etiquetasFuente().griego} · ${f.referencia}` : f.titulo || dominio(f.url) || "—");

// El recuadro de una fuente: nombre, resumen, el griego (si es griego) y el link
function fichaFuenteHTML(f) {
  const E = etiquetasFuente();
  if (f.tipo === "griego") return `<div class="ficha-fuente">${griegoHTML(f)}</div>`;
  const url = linkSeguro(f.url);
  return `<div class="ficha-fuente"><div class="ficha-titulo">${esc(nombreFuente(f))}</div>${f.texto ? `<p>${esc(f.texto)}</p>` : ""}${
    url ? `<a class="fuente-link" href="${esc(url)}" target="_blank" rel="noopener">${E.ver} <span>${esc(dominio(url))}</span></a><p class="solo-pdf fuente-url">${esc(url)}</p>` : ""}</div>`;
}

// Al final de cada subpunto: los botoncitos de sus fuentes y el lugar del recuadro
function botonesFuentesHTML(p) {
  const lista = fuentesDePunto(p);
  if (!lista.length) return "";
  return `<div class="fuentes-punto"><span class="fuentes-tag">${etiquetasFuente().fuentes}</span>${
    lista.map((f, k) => `<button type="button" class="chip-fuente" data-fuente="${k}" aria-expanded="false">${esc(nombreFuente(f))}</button>`).join("")
  }<div class="pop-fuente" hidden></div></div>`;
}

// Todas las fuentes del estudio, por subpunto ("3.2")
function fuentesDe(e) {
  const lista = [];
  (e.temas || []).forEach((t, i) => (t.puntos || []).forEach((p, j) => {
    const f = fuentesDePunto(p);
    if (f.length) lista.push({ n: `${i + 1}.${j + 1}`, titulo: p.titulo, fuentes: f });
  }));
  return lista;
}
const contarFuentes = e => fuentesDe(e).reduce((n, g) => n + g.fuentes.length, 0);

function paginaFuentesHTML(e) {
  const grupos = fuentesDe(e);
  if (!grupos.length) return "";
  return `<section class="fuentes"><h2 class="solo-pdf">${etiquetasFuente().todas}</h2>${grupos.map(g =>
    `<div class="grupo-fuentes"><h3><b>${g.n}</b> ${esc(g.titulo)}</h3>${g.fuentes.map(fichaFuenteHTML).join("")}</div>`).join("")}</section>`;
}

// Un subpunto. En la página los pasajes salen cerrados, como botoncitos con su referencia: los que van
// seguidos quedan en una misma fila y, al tocar uno, se abre debajo (js/mapa.js). Con "completo"
// (PDF y "Ver cómo queda" del panel) salen abiertos.
function puntoHTML(p, completo = false) {
  const bloques = p.bloques || [];
  if (completo) return bloques.map(bloqueHTML).join("\n") + botonesFuentesHTML(p);
  const partes = [];
  for (let k = 0; k < bloques.length; k++) {
    if (bloques[k].tipo !== "pasaje") { partes.push(bloqueHTML(bloques[k])); continue; }
    const grupo = [];
    while (k < bloques.length && bloques[k].tipo === "pasaje") grupo.push(bloques[k++]);
    k--;
    partes.push(`<div class="pasajes">${grupo.map(b =>
      `<span class="pasaje-y-rvr"><button type="button" class="chip-pasaje" aria-expanded="false">${esc(b.referencia || "—")}</button>${botonLBLA(b)}${botonRVR(b)}</span>`).join("")
    }${grupo.map(b => `<div class="pasaje-abierto" hidden>${bloqueHTML(b)}</div><div class="lbla-abierto" hidden></div>`).join("")}</div>`);
  }
  return partes.join("\n") + botonesFuentesHTML(p);
}
const colorDe = tema => COLORES[tema.color] || "--b1";
