// Carga los estudios (archivos JSON de la carpeta estudios/) y convierte sus bloques en HTML.
// Cada estudio: titulo, idioma, otro_idioma, descripcion, preguntas[], cierre, temas[].
// Cada elemento de temas[] es un PUNTO del mapa (1, 2, 3…): titulo, subtitulo, color, puntos[].
// Cada elemento de puntos[] es un SUBPUNTO (1.1, 1.2…): titulo, nuevo, bloques[].
// Cada bloque tiene "tipo": texto (HTML), subtitulo, pasaje (referencia + versiculos[{numero, texto}])
// imagen (src = ruta en imagenes/, pie) o video (url de YouTube u otra página, o src = archivo en videos/, pie).
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
      return `<div class="passage"><div class="ref">${esc(b.referencia)}</div>${
        b.imagen ? `<img class="pasaje-img" src="${esc(rutaImagen(b.imagen))}" alt="${esc(b.referencia)}" loading="lazy">` : ""}${
        (b.versiculos || []).filter(v => v.texto).map(v => `<p>${v.numero ? `<b>${esc(v.numero)}</b>` : ""}${v.texto}</p>`).join("")
      }</div>`;
    case "video":
      return videoHTML(b);
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

const puntoHTML = p => (p.bloques || []).map(bloqueHTML).join("\n");
const colorDe = tema => COLORES[tema.color] || "--b1";
