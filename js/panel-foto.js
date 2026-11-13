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

// Separa el texto de la foto en versículos. Tolera números mal leídos: acepta un número como
// versículo si es mayor que el anterior y a lo más 3 más (si se saltó uno, ese texto queda en el anterior).
function separarFoto(texto) {
  const plano = texto.replace(/\s+/g, " ").trim();
  const marcas = [];
  for (const m of plano.matchAll(/(?:^|\s)(\d{1,3})\s(?=\S)/g)) {
    const n = Number(m[1]);
    const anterior = marcas.length ? marcas[marcas.length - 1].n : null;
    if (anterior === null ? m.index === 0 : n > anterior && n <= anterior + 3) {
      marcas.push({ n, desde: m.index + m[0].length, hasta: m.index });
    }
  }
  if (!marcas.length) return [{ numero: "", texto: plano }];
  return marcas.map((m, i) => ({
    numero: String(m.n),
    texto: plano.slice(m.desde, i + 1 < marcas.length ? marcas[i + 1].hasta : plano.length).trim()
  }));
}

// Versículos escogidos → "1-3, 5, 30" (seguidos se juntan con guion, sueltos con coma)
function rangos(numeros) {
  const ns = [...new Set(numeros.map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
  const grupos = [];
  ns.forEach(n => {
    const g = grupos[grupos.length - 1];
    if (g && n === g[1] + 1) g[1] = n; else grupos.push([n, n]);
  });
  return grupos.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(", ");
}

// "Jeremías 1 LBLA" o "Jeremías 1:4 LBLA" + versículos escogidos → "Jeremías 1:1-3, 5 LBLA"
function referenciaCon(base, numeros) {
  const m = /^(.*?\S)\s+(\d{1,3})(?::[\d\s,\-–]*)?\s+([A-Z]{2,6}\d*)\s*$/.exec(base.trim());
  return m ? `${m[1]} ${m[2]}:${rangos(numeros)} ${m[3]}` : "";
}

function dibujarSeleccion(caja, versos) {
  caja.querySelector(".seleccion").innerHTML = `
    <p class="ayuda-sel">Marca los versículos que quieres. Si un número o una palabra salió mal, corrígelo aquí.</p>
    ${versos.map(v => `
      <div class="verso-sel">
        <input type="checkbox" aria-label="Usar este versículo">
        <input class="num" value="${esc(v.numero)}" inputmode="numeric" aria-label="Número">
        <textarea rows="2" aria-label="Texto del versículo">${esc(v.texto)}</textarea>
      </div>`).join("")}
    <div class="acciones-sel">
      <button type="button" class="btn" data-foto-accion="todos">Marcar todos</button>
      <button type="button" class="btn principal" data-foto-accion="usar">Usar los seleccionados</button>
    </div>`;
}

// Al escoger la foto: la lee y muestra la lista de versículos para marcar
$("editor").addEventListener("change", async e => {
  const input = e.target.closest("input[data-foto]");
  if (!input || !input.files[0]) return;
  const caja = input.closest(".pegar");
  const aviso = caja.querySelector(".ayuda-pegar");
  aviso.textContent = "Leyendo la foto…";
  try {
    const { texto, referencia } = await leerFoto(input.files[0], n => { aviso.textContent = `Leyendo la foto… ${n}%`; });
    if (!texto) { aviso.textContent = "No se encontró texto en la foto. Prueba con una captura más clara."; return; }
    caja.dataset.encabezado = referencia;
    dibujarSeleccion(caja, separarFoto(texto));
    aviso.textContent = referencia ? `Encontré ${referencia}.` : "No encontré el libro y el capítulo en la foto: escríbelos en la referencia (ej. Jeremías 1 LBLA).";
  } catch (err) {
    aviso.textContent = "No se pudo leer la foto. Revisa tu internet e inténtalo otra vez.";
  } finally {
    input.value = "";
  }
});

// Botones de la lista ("Marcar todos" y "Usar los seleccionados")
$("editor").addEventListener("click", e => {
  const b = e.target.closest("[data-foto-accion]");
  if (!b) return;
  const caja = b.closest(".pegar");
  const filas = [...caja.querySelectorAll(".verso-sel")];
  if (b.dataset.fotoAccion === "todos") {
    const todos = filas.every(f => f.querySelector("input[type=checkbox]").checked);
    filas.forEach(f => { f.querySelector("input[type=checkbox]").checked = !todos; });
    return;
  }
  const escogidos = filas.filter(f => f.querySelector("input[type=checkbox]").checked)
    .map(f => ({ numero: f.querySelector(".num").value.trim(), texto: versalitas(f.querySelector("textarea").value.trim()) }));
  const aviso = caja.querySelector(".ayuda-pegar");
  if (!escogidos.length) { aviso.textContent = "Marca al menos un versículo."; return; }

  const ruta = caja.querySelector("input[data-foto]").dataset.foto;
  const pasaje = obtener(ruta);
  const base = pasaje.referencia || caja.dataset.encabezado || "";
  pasaje.versiculos = escogidos;
  pasaje.referencia = referenciaCon(base, escogidos.map(v => v.numero)) || base;
  marcarCambio();
  dibujar();
});
