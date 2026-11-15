// Panel · versículos ya copiados: si un versículo ya está en algún estudio (en la misma versión),
// se reutiliza en vez de copiarlo otra vez de la app. Se busca en el estudio abierto y en los publicados.
// Solo se usan textos que el autor ya pegó; nunca se inventa ni se trae de internet.

let estudiosPublicados = null; // se cargan una vez, la primera vez que se buscan versículos

async function cargarPublicados() {
  if (!estudiosPublicados) {
    const leidos = await Promise.all(slugsExistentes.filter(s => s !== slug).map(s => cargarEstudio(s).catch(() => null)));
    estudiosPublicados = leidos.filter(Boolean);
  }
  return estudiosPublicados;
}

// Llave de un versículo: libro, capítulo, número y versión ("ACT.20.17.LBLA"). Un recuadro con rango ("11-14") se guarda con su rango.
const versionDe = (r, idioma) => r.version || VERSION_POR_IDIOMA[idioma] || "LBLA";
const llaveVerso = (r, numero, idioma) => `${r.libro.codigo}.${r.capitulo}.${numero}.${versionDe(r, idioma)}`;

function guardadosEn(estudios) {
  const banco = new Map();
  for (const e of estudios)
    for (const t of e.temas || []) for (const p of t.puntos || []) for (const b of p.bloques || []) {
      const r = b.tipo === "pasaje" && leerReferencia(b.referencia);
      if (!r) continue;
      for (const v of b.versiculos || []) {
        const numero = String(v.numero || "").replace(/\s/g, "").replace(/–/g, "-");
        if (v.texto && numero && !banco.has(llaveVerso(r, numero, e.idioma))) banco.set(llaveVerso(r, numero, e.idioma), v.texto);
      }
    }
  return banco;
}

// Llena los versículos de un pasaje con los que ya están copiados. Devuelve cuántos encontró y cuáles faltan.
async function reusarVersiculos(ruta) {
  const pasaje = obtener(ruta);
  const r = leerReferencia(pasaje.referencia);
  if (!r) return null;
  const banco = guardadosEn([estudio, ...(await cargarPublicados())]);
  const versiculos = [], faltan = [];
  for (const [a, b] of r.tramos) {
    const rango = banco.get(llaveVerso(r, `${a}-${b}`, estudio.idioma));
    if (a < b && rango) { versiculos.push({ numero: `${a}-${b}`, texto: rango }); continue; }
    for (let n = a; n <= b; n++) {
      const texto = banco.get(llaveVerso(r, n, estudio.idioma));
      versiculos.push({ numero: String(n), texto: texto || "" });
      if (!texto) faltan.push(n);
    }
  }
  const encontrados = versiculos.filter(v => v.texto).length;
  if (encontrados) pasaje.versiculos = versiculos;
  return { encontrados, faltan };
}

// El último mensaje del buscador de cada pasaje (se muestra aunque el editor se vuelva a dibujar)
const avisosPasaje = new WeakMap();

const pasajeVacio = b => !(b.versiculos || []).some(v => v.texto) && !b.imagen;

function mensajeReuso(res) {
  if (!res) return "";
  if (!res.encontrados) return "Estos versículos todavía no están copiados en ningún estudio: ábrelos en la Biblia y pégalos.";
  if (!res.faltan.length) return "✓ Ya estaban copiados en tus estudios: no hace falta copiarlos otra vez.";
  return `Ya tenías algunos copiados. Faltan: ${res.faltan.join(", ")}. Ábrelos en la Biblia y pégalos en su recuadro.`;
}
