// Carga los estudios (archivos JSON de la carpeta estudios/) y convierte sus bloques en HTML.
// Cada estudio: titulo, idioma, otro_idioma, descripcion, preguntas[], cierre, temas[].
// Cada elemento de temas[] es un PUNTO del mapa (1, 2, 3…): titulo, subtitulo, color, puntos[].
// Cada elemento de puntos[] es un SUBPUNTO (1.1, 1.2…): titulo, nuevo, bloques[].
// Cada bloque tiene "tipo": texto (HTML), subtitulo, pasaje (referencia + versiculos[{numero, texto}])
// imagen (src = ruta en imagenes/, pie), video (url de YouTube u otra página, o src = archivo en videos/, pie)
// o fuente (titulo, texto y url): de dónde se sacó la información, con su explicación y su link.
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
        b.imagen ? `<img class="pasaje-img" src="${esc(rutaImagen(b.imagen))}" alt="${esc(b.referencia)}" loading="lazy">` : ""}${
        (b.versiculos || []).filter(v => v.texto).map(v => `<p>${v.numero ? `<b>${esc(v.numero)}</b>` : ""}${v.texto}</p>`).join("")
      }${esLBLA(b.referencia) ? CREDITO_LBLA : ""}</div>`;
    case "video":
      return videoHTML(b);
    case "fuente":
      return fuenteHTML(b);
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

// ---------- Fuentes: de dónde se sacó la información ----------
// Cada fuente sale en su subpunto, y todas juntas en una lista debajo del mapa y en el PDF (fuentesHTML).

const ETIQUETAS_FUENTE = {
  es: { fuente: "Fuente", ver: "Ver la fuente ↗", todas: "Fuentes de este estudio", sinLink: "Sin link" },
  pt: { fuente: "Fonte", ver: "Ver a fonte ↗", todas: "Fontes deste estudo", sinLink: "Sem link" }
};
const etiquetasFuente = () => ETIQUETAS_FUENTE[(document.documentElement.lang || "").startsWith("pt") ? "pt" : "es"];
// Solo links web (http o https): nunca otro tipo de link que pudiera ejecutar algo
const linkSeguro = url => (/^https?:\/\//i.test(String(url || "").trim()) ? String(url).trim() : "");
const dominio = url => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };

function fuenteHTML(b) {
  if (!b.titulo && !b.texto && !b.url) return "";
  const E = etiquetasFuente();
  const url = linkSeguro(b.url);
  return `<aside class="fuente"><div class="fuente-tag">${E.fuente}</div>${b.titulo ? `<div class="fuente-titulo">${esc(b.titulo)}</div>` : ""}${
    b.texto ? `<p>${esc(b.texto)}</p>` : ""}${
    url ? `<a class="fuente-link" href="${esc(url)}" target="_blank" rel="noopener">${E.ver} <span>${esc(dominio(url))}</span></a><p class="solo-pdf fuente-url">${esc(url)}</p>` : ""}</aside>`;
}

// Todas las fuentes del estudio, con el número del subpunto donde están ("3.2")
function fuentesDe(e) {
  const lista = [];
  (e.temas || []).forEach((t, i) => (t.puntos || []).forEach((p, j) => (p.bloques || []).forEach(b => {
    if (b.tipo === "fuente" && (b.titulo || b.texto || b.url)) lista.push({ n: `${i + 1}.${j + 1}`, ...b });
  })));
  return lista;
}

function fuentesHTML(e) {
  const lista = fuentesDe(e);
  if (!lista.length) return "";
  const E = etiquetasFuente();
  return `<section class="fuentes"><h2>${E.todas} <span>${lista.length}</span></h2><ol>${lista.map(f => {
    const url = linkSeguro(f.url);
    return `<li><b>${f.n}</b><div>${f.titulo ? `<strong>${esc(f.titulo)}</strong>` : ""}${f.texto ? `<p>${esc(f.texto)}</p>` : ""}${
      url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>` : ""}</div></li>`;
  }).join("")}</ol></section>`;
}

const puntoHTML = p => (p.bloques || []).map(bloqueHTML).join("\n");
const colorDe = tema => COLORES[tema.color] || "--b1";
