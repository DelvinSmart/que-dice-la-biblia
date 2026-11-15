// Panel · "Leer capturas": el autor escoge VARIAS capturas de su app de la Biblia de una vez y el panel las lee
// (Tesseract.js, dentro del navegador: las fotos no se suben a ningún servidor), reconoce el libro y el capítulo
// de cada una (el encabezado de la app, ej. "Efesios 5 LBLA") y pone cada versículo en los pasajes del estudio que
// todavía no tienen texto. Al final muestra qué se llenó, qué falta y pide revisar antes de publicar.
// El texto lo trae el autor en sus capturas: el panel no entra a ninguna página a buscarlo.

let resultadoCapturas = null; // lo último que se leyó: se muestra en el recuadro hasta que se lean otras

// Pasajes del estudio con referencia y sin texto (los que se pueden llenar con capturas)
function pasajesSinTexto() {
  const lista = [];
  (estudio.temas || []).forEach((t, i) => (t.puntos || []).forEach((p, j) => (p.bloques || []).forEach((b, k) => {
    const r = b.tipo === "pasaje" && !b.imagen && !(b.versiculos || []).some(v => v.texto) && leerReferencia(b.referencia);
    if (r) lista.push({ b, r, n: `${i + 1}.${j + 1}`, ruta: `temas.${i}.puntos.${j}.bloques.${k}` });
  })));
  return lista;
}

function dibujarCapturas() {
  const faltan = pasajesSinTexto();
  if (!faltan.length && !resultadoCapturas) return "";
  return `
    <section class="bloque-ed capturas-ed">
      <div class="capturas-cab">
        <h2>Pasajes sin texto <small>${faltan.length}</small></h2>
        <label class="btn principal foto">Leer capturas<input type="file" accept="image/*" multiple data-capturas hidden></label>
      </div>
      <p class="ayuda-fuente">Toma en tu app de la Biblia una captura de cada pasaje (que se vean el libro, el capítulo y los números de versículo) y escógelas todas juntas: el panel las lee y pone cada versículo en su pasaje. Revisa el texto antes de publicar.</p>
      <p class="ayuda-pegar" id="avisoCapturas" role="status"></p>
      ${resultadoCapturas ? `<ul class="lista-capturas">${resultadoCapturas.map(x =>
        `<li class="${x.estado}"><b>${esc(x.n)}</b> ${esc(x.ref)} — ${esc(x.nota)}</li>`).join("")}</ul>` : ""}
    </section>`;
}

// Los nombres de los libros (español, portugués y otros), del más largo al más corto, para encontrarlos en la foto
const NOMBRES_LIBROS = [...LIBRO_POR_NOMBRE.keys()].sort((a, b) => b.length - a.length);

// El libro y el capítulo de la captura: la primera línea de arriba que empiece con un libro y un número
function libroYCapitulo(texto) {
  for (const linea of texto.split("\n").slice(0, 10)) {
    const plana = sinTildes(linea).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    for (const nombre of NOMBRES_LIBROS) {
      const m = new RegExp(`^${nombre.replace(/ /g, "\\s?")}\\s+(\\d{1,3})\\b`).exec(plana);
      if (m) return { libro: LIBRO_POR_NOMBRE.get(nombre), capitulo: Number(m[1]) };
    }
  }
  return null;
}

async function leerCapturas(archivos) {
  const aviso = () => document.getElementById("avisoCapturas");
  const escribir = t => { const a = aviso(); if (a) a.textContent = t; };
  escribir("Preparando el lector…");
  await cargarLector();
  const lector = await Tesseract.createWorker(estudio?.idioma === "pt" ? "por" : "spa", 1);
  // Versículos leídos por capítulo: "EPH.5" → { "22": "…", "23": "…" }
  const leidos = new Map();
  const sinEncabezado = [];
  try {
    for (const [k, archivo] of [...archivos].entries()) {
      escribir(`Leyendo captura ${k + 1} de ${archivos.length}…`);
      const { data } = await lector.recognize(archivo);
      const donde = libroYCapitulo(data.text);
      if (!donde) { sinEncabezado.push(archivo.name || `captura ${k + 1}`); continue; }
      const clave = `${donde.libro.codigo}.${donde.capitulo}`;
      const versos = leidos.get(clave) || {};
      for (const v of separarFoto(limpiarTextoFoto(data.text))) if (v.numero && v.texto && !versos[v.numero]) versos[v.numero] = v.texto;
      leidos.set(clave, versos);
    }
  } finally {
    await lector.terminate();
  }

  // Repartir: cada pasaje sin texto toma sus versículos del capítulo que le corresponde
  resultadoCapturas = [];
  for (const { b, r, n } of pasajesSinTexto()) {
    const versos = leidos.get(`${r.libro.codigo}.${r.capitulo}`);
    if (!versos) { resultadoCapturas.push({ n, ref: b.referencia, estado: "falta", nota: "no había captura de este capítulo" }); continue; }
    const nuevos = [], faltan = [];
    for (const [a, z] of r.tramos) for (let v = a; v <= z; v++) {
      nuevos.push({ numero: String(v), texto: versos[v] ? versalitas(versos[v]) : "" });
      if (!versos[v]) faltan.push(v);
    }
    if (faltan.length === nuevos.length) { resultadoCapturas.push({ n, ref: b.referencia, estado: "falta", nota: "la captura no tenía estos versículos" }); continue; }
    b.versiculos = nuevos;
    resultadoCapturas.push(faltan.length
      ? { n, ref: b.referencia, estado: "parcial", nota: `faltan ${faltan.join(", ")}` }
      : { n, ref: b.referencia, estado: "listo", nota: "listo · revisa el texto" });
  }
  if (sinEncabezado.length) resultadoCapturas.push({ n: "", ref: sinEncabezado.join(", "), estado: "falta", nota: "no se vio el libro y el capítulo arriba de la captura" });
  if (resultadoCapturas.some(x => x.estado !== "falta")) marcarCambio();
  dibujar();
  escribir(`Listo: ${resultadoCapturas.filter(x => x.estado === "listo").length} pasajes llenos. Revisa cada uno antes de publicar.`);
}

$("editor").addEventListener("change", e => {
  const input = e.target.closest("input[data-capturas]");
  if (!input || !input.files.length) return;
  const archivos = [...input.files];
  input.value = "";
  leerCapturas(archivos).catch(() => {
    const a = document.getElementById("avisoCapturas");
    if (a) a.textContent = "No se pudieron leer las capturas. Revisa tu internet e inténtalo otra vez.";
  });
});
