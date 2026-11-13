// Panel · imágenes y videos: bloque "+ Imagen", imagen dentro de un pasaje y video subido desde el aparato.
// Las fotos se achican en el aparato (máximo 1600 px, JPG) para que la página no pese; los videos se suben tal cual
// (máximo 25 MB; para videos más largos es mejor un link de YouTube). Se ven enseguida en el editor y en la
// vista previa, y se suben a imagenes/ o videos/ al tocar Publicar.
window.IMAGENES_LOCALES = {};      // ruta en imagenes/ → copia en el aparato (para verla antes de publicar)
const archivosPendientes = {};      // ruta en imagenes/ o videos/ → contenido en base64, todavía sin subir
const VIDEO_MAXIMO = 25 * 1024 * 1024;

const LADO_MAXIMO = 1600;

function achicarImagen(archivo) {
  return new Promise((ok, falla) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, LADO_MAXIMO / Math.max(img.width, img.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(img.width * escala);
      lienzo.height = Math.round(img.height * escala);
      lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
      URL.revokeObjectURL(img.src);
      lienzo.toBlob(b => (b ? ok(b) : falla(new Error("No se pudo preparar la imagen"))), "image/jpeg", 0.85);
    };
    img.onerror = () => falla(new Error("No se pudo abrir la imagen"));
    img.src = URL.createObjectURL(archivo);
  });
}

const blobABase64 = blob => new Promise(ok => {
  const lector = new FileReader();
  lector.onload = () => ok(String(lector.result).split(",")[1]);
  lector.readAsDataURL(blob);
});

// Al escoger una imagen: data-imagen dice el campo donde va (ej. "temas.0.puntos.1.bloques.2.src")
$("editor").addEventListener("change", async e => {
  const input = e.target.closest("input[data-imagen]");
  if (!input || !input.files[0]) return;
  const aviso = input.closest(".bloque-contenido").querySelector(".ayuda-imagen");
  aviso.textContent = "Preparando la imagen…";
  try {
    const blob = await achicarImagen(input.files[0]);
    guardarPendiente(input.dataset.imagen, `imagenes/${nombreBase()}.jpg`, blob, await blobABase64(blob));
  } catch (err) {
    aviso.textContent = "No se pudo usar esa imagen. Prueba con otra.";
  } finally {
    input.value = "";
  }
});

// Al escoger un video: se sube tal cual si no pasa de 25 MB
$("editor").addEventListener("change", async e => {
  const input = e.target.closest("input[data-video]");
  if (!input || !input.files[0]) return;
  const archivo = input.files[0];
  const aviso = input.closest(".bloque-contenido").querySelector(".ayuda-imagen");
  if (archivo.size > VIDEO_MAXIMO) {
    aviso.textContent = "Ese video pesa más de 25 MB. Súbelo a YouTube y pega aquí el link.";
    input.value = "";
    return;
  }
  aviso.textContent = "Preparando el video…";
  const extension = (archivo.name.split(".").pop() || "mp4").toLowerCase();
  guardarPendiente(input.dataset.video, `videos/${nombreBase()}.${extension}`, archivo, await blobABase64(archivo));
  input.value = "";
});

const nombreBase = () => `${slug || slugDe(estudio.titulo || "estudio")}-${Date.now()}`;

function guardarPendiente(campo, src, blob, base64) {
  archivosPendientes[src] = base64;
  window.IMAGENES_LOCALES[src] = URL.createObjectURL(blob);
  asignar(campo, src);
  marcarCambio();
  dibujar();
}

// Antes de publicar el estudio: sube las imágenes y videos nuevos que el estudio usa
async function subirArchivosPendientes() {
  const usados = new Set();
  (estudio.temas || []).forEach(t => (t.puntos || []).forEach(p =>
    (p.bloques || []).forEach(b => [b.src, b.imagen].forEach(src => { if (src) usados.add(src); }))));
  for (const src of Object.keys(archivosPendientes)) {
    if (usados.has(src)) await Github.subirArchivo(src, archivosPendientes[src], `Archivo para el estudio: ${estudio.titulo}`);
    delete archivosPendientes[src];
  }
}
