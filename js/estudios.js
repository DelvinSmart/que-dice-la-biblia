// Carga los estudios (archivos JSON de la carpeta estudios/) y convierte sus bloques en HTML.
// Cada estudio: titulo, idioma, otro_idioma, descripcion, preguntas[], cierre, temas[].
// Cada elemento de temas[] es un PUNTO del mapa (1, 2, 3…): titulo, subtitulo, color, puntos[].
// Cada elemento de puntos[] es un SUBPUNTO (1.1, 1.2…): titulo, nuevo, bloques[].
// Cada bloque tiene "tipo": texto (HTML), subtitulo, pasaje (referencia + versiculos[{numero, texto}])
// o imagen (src = ruta en imagenes/, pie = texto debajo).

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
        (b.versiculos || []).map(v => `<p>${v.numero ? `<b>${esc(v.numero)}</b>` : ""}${v.texto || ""}</p>`).join("")
      }</div>`;
    case "imagen":
      return b.src ? `<figure class="imagen"><img src="${esc(rutaImagen(b.src))}" alt="${esc(b.pie)}" loading="lazy">${
        b.pie ? `<figcaption>${esc(b.pie)}</figcaption>` : ""}</figure>` : "";
    default:
      return "";
  }
}

// En el panel, una imagen recién escogida todavía no está publicada: se muestra la copia del aparato
const rutaImagen = src => (window.IMAGENES_LOCALES && window.IMAGENES_LOCALES[src]) || src;

const puntoHTML = p => (p.bloques || []).map(bloqueHTML).join("\n");
const colorDe = tema => COLORES[tema.color] || "--b1";
