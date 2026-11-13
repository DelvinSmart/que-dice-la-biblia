// Panel · leer versículos de una foto o captura (botón "Foto o captura" dentro de cada pasaje).
// Usa Tesseract.js, que lee el texto dentro del navegador: la foto no se sube a ningún servidor.
// El texto leído va al recuadro de "Pegar desde la app Biblia" para revisarlo antes de llenar.
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
let cargaTesseract = null;

// Se carga solo la primera vez que se usa, para que el panel no se ponga lento
function cargarLector() {
  cargaTesseract ||= new Promise((ok, falla) => {
    const s = document.createElement("script");
    s.src = TESSERACT;
    s.onload = ok;
    s.onerror = () => { cargaTesseract = null; falla(new Error("No se pudo cargar el lector")); };
    document.head.appendChild(s);
  });
  return cargaTesseract;
}

async function leerFoto(archivo, alAvanzar) {
  await cargarLector();
  const idioma = estudio?.idioma === "pt" ? "por" : "spa";
  const lector = await Tesseract.createWorker(idioma, 1, {
    logger: m => { if (m.status === "recognizing text") alAvanzar(Math.round(m.progress * 100)); }
  });
  try {
    const { data } = await lector.recognize(archivo);
    return { texto: limpiarTextoFoto(data.text), referencia: encabezadoFoto(data.text) };
  } finally {
    await lector.terminate();
  }
}

// Ordena lo que sale de la foto: quita el encabezado de la app (todo lo de antes del primer versículo),
// los menús y la hora, y separa los numeritos de versículo que quedan pegados ("1Toda" → "1 Toda").
const SUPERINDICES = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
function limpiarTextoFoto(texto) {
  const lineas = texto.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => SUPERINDICES[c]).split("\n").map(l => l.trim());
  const primerVersiculo = lineas.findIndex(l => /^\d{1,3}\s?[A-Za-zÀ-ÿ¿¡“"]/.test(l));
  return lineas.slice(Math.max(primerVersiculo, 0))
    .filter(l => l.split(/\s+/).length > 2 || /^\d/.test(l))   // líneas muy cortas: menús de la app
    .filter(l => !/^\d{1,2}:\d{2}\b/.test(l))                  // la hora de la barra de estado
    .join("\n")
    .replace(/(^|\s)(\d{1,3})(?=[A-Za-zÀ-ÿ¿¡“"])/g, "$1$2 ");
}

// El encabezado de la app Biblia (ej. "Génesis 11 LBLA"): libro, capítulo y versión
function encabezadoFoto(texto) {
  for (const linea of texto.split("\n").slice(0, 6)) {
    const m = /^((?:[1-3]\s?)?[A-ZÀ-Þ][a-zà-ÿ]+(?:\s[a-zà-ÿ]+)?)\s+(\d{1,3})\s+([A-Z]{2,6})\b/.exec(linea.trim());
    if (m) return `${m[1]} ${m[2]} ${m[3]}`;
  }
  return "";
}

// Al escoger la foto: la lee, deja el texto en el recuadro para revisarlo y, si el pasaje
// no tiene referencia, pone la del encabezado (faltan los versículos, ej. ":1-9")
$("editor").addEventListener("change", async e => {
  const input = e.target.closest("input[data-foto]");
  if (!input || !input.files[0]) return;
  const caja = input.closest(".pegar");
  const aviso = caja.querySelector(".ayuda-pegar");
  aviso.textContent = "Leyendo la foto…";
  try {
    const { texto, referencia } = await leerFoto(input.files[0], n => { aviso.textContent = `Leyendo la foto… ${n}%`; });
    caja.querySelector("textarea").value = texto;
    const ruta = input.dataset.foto;
    const campoRef = caja.parentElement.querySelector(`[data-campo="${ruta}.referencia"]`);
    if (referencia && campoRef && !campoRef.value.trim()) {
      campoRef.value = referencia;
      asignar(`${ruta}.referencia`, referencia);
      marcarCambio();
    }
    aviso.textContent = texto
      ? "Listo. Revisa el texto: los números pequeños y las palabras en cursiva a veces salen mal. Completa la referencia (ej. :1-9) y toca “Llenar referencia y versículos”."
      : "No se encontró texto en la foto. Prueba con una captura más clara.";
  } catch (err) {
    aviso.textContent = "No se pudo leer la foto. Revisa tu internet e inténtalo otra vez.";
  } finally {
    input.value = "";
  }
});
