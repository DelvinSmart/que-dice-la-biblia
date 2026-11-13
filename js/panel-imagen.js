// Panel · imágenes dentro de un subpunto (bloque "+ Imagen").
// Al escoger la foto se achica en el aparato (máximo 1600 px, JPG) para que la página no pese,
// se muestra enseguida en el editor y en la vista previa, y se sube a imagenes/ al tocar Publicar.
window.IMAGENES_LOCALES = {};      // ruta en imagenes/ → copia en el aparato (para verla antes de publicar)
const imagenesPendientes = {};     // ruta en imagenes/ → contenido en base64, todavía sin subir

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

// Al escoger la imagen en un bloque
$("editor").addEventListener("change", async e => {
  const input = e.target.closest("input[data-imagen]");
  if (!input || !input.files[0]) return;
  const ruta = input.dataset.imagen;
  const aviso = input.closest(".bloque-contenido").querySelector(".ayuda-imagen");
  aviso.textContent = "Preparando la imagen…";
  try {
    const blob = await achicarImagen(input.files[0]);
    const src = `imagenes/${slug || slugDe(estudio.titulo || "estudio")}-${Date.now()}.jpg`;
    imagenesPendientes[src] = await blobABase64(blob);
    window.IMAGENES_LOCALES[src] = URL.createObjectURL(blob);
    asignar(`${ruta}.src`, src);
    marcarCambio();
    dibujar();
  } catch (err) {
    aviso.textContent = "No se pudo usar esa imagen. Prueba con otra.";
  } finally {
    input.value = "";
  }
});

// Antes de publicar el estudio: sube las imágenes nuevas que el estudio usa
async function subirImagenesPendientes() {
  const usadas = new Set();
  (estudio.temas || []).forEach(t => (t.puntos || []).forEach(p =>
    (p.bloques || []).forEach(b => { if (b.tipo === "imagen" && b.src) usadas.add(b.src); })));
  for (const src of Object.keys(imagenesPendientes)) {
    if (usadas.has(src)) await Github.subirArchivo(src, imagenesPendientes[src], `Imagen para el estudio: ${estudio.titulo}`);
    delete imagenesPendientes[src];
  }
}
