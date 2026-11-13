// Panel · "Pegar desde la app Biblia": convierte lo que se copia de la app (texto, referencia y link)
// en la referencia y los versículos de un pasaje, para no tener que llenarlos uno por uno.
//
// Ejemplo de lo que llega al pegar:
//   “pues Juan bautizó con agua, pero vosotros seréis bautizados con el Espíritu Santo dentro de pocos días.”
//   Hechos 1:5 LBLA
//   https://bible.com/bible/89/act.1.5.LBLA

// Una línea de referencia: libro (con número opcional), capítulo:versículos y la sigla de la versión
const LINEA_REFERENCIA = /^(?:[1-3]\s?)?[A-Za-zÀ-ÿ]+(?:\s[A-Za-zÀ-ÿ]+)*\s\d+:\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–]\s*\d+)?)*\s+[A-Z]{2,6}\d*$/;

function leerPasajeCopiado(texto) {
  const lineas = texto.replace(INVISIBLES, "").replace(/\r/g, "").split("\n")
    .map(l => l.trim()).filter(l => l && !/^https?:\/\//i.test(l));

  const iRef = lineas.findIndex(l => LINEA_REFERENCIA.test(l));
  const referencia = iRef < 0 ? "" : lineas[iRef].replace(/^([1-3])(?=\D)/, "$1 ").replace(/\s+/g, " ");
  const cuerpo = lineas.filter((_, i) => i !== iRef).join(" ")
    .replace(/^\d+:\d+\s*/, "")          // a veces viene "12:13" delante del texto
    .replace(/\s+/g, " ").trim()
    .replace(/^[“”"«»\s]+|[“”"«»\s]+$/g, "");
  if (!cuerpo) return null;

  const m = /(\d+):(\d+)(?:\s*[-–]\s*(\d+))?/.exec(referencia);
  const [inicio, fin] = m ? [Number(m[2]), m[3] ? Number(m[3]) : Number(m[2])] : numerosSeguidos(cuerpo);
  return { referencia, versiculos: separarVersiculos(cuerpo, inicio, fin).map(([numero, t]) => ({ numero, texto: versalitas(t) })) };
}

// Sin referencia (por ejemplo, texto copiado de una foto con Texto en vivo): si empieza con un número
// y después vienen los siguientes en orden ("1 … 2 … 3 …"), esos son los versículos.
function numerosSeguidos(texto) {
  const primero = /^(\d{1,3})\s/.exec(texto);
  if (!primero) return [1, 1];
  const inicio = Number(primero[1]);
  let fin = inicio;
  while (new RegExp(`\\s${fin + 1}\\s+\\S`).test(texto)) fin++;
  return [inicio, fin];
}

// Si el texto trae los números ("1 Toda la tierra… 2 Y aconteció…"), se separa versículo por versículo.
// Si no los trae (la app no los pone al compartir), queda en un solo recuadro con el rango, ej. "22-23".
function separarVersiculos(texto, inicio, fin) {
  if (fin > inicio && new RegExp(`^${inicio}\\s`).test(texto)) {
    const partes = [];
    let resto = texto.replace(new RegExp(`^${inicio}\\s+`), "");
    for (let n = inicio; n < fin; n++) {
      const siguiente = new RegExp(`\\s${n + 1}\\s+(?=\\S)`);
      const k = resto.search(siguiente);
      if (k < 0) return [[`${inicio}-${fin}`, texto]];
      partes.push([String(n), resto.slice(0, k).trim()]);
      resto = resto.slice(k).replace(siguiente, "");
    }
    partes.push([String(fin), resto.trim()]);
    return partes;
  }
  const sinNumero = fin === inicio ? texto.replace(new RegExp(`^${inicio}\\s+`), "") : texto;
  return [[fin > inicio ? `${inicio}-${fin}` : String(inicio), sinNumero]];
}

// La app escribe SEÑOR / SENHOR en mayúsculas; en el estudio va en versalitas, como en la Biblia impresa.
// No se toca si el versículo es una cita toda en mayúsculas (como 1 Corintios 14:21).
function versalitas(texto) {
  const letras = texto.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const mayusculas = letras.replace(/[^A-ZÀ-Þ]/g, "").length;
  if (letras && mayusculas / letras.length > 0.5) return texto;
  return texto.replace(/\bSEÑOR\b/g, "<span class=\"sc\">Señor</span>").replace(/\bSENHOR\b/g, "<span class=\"sc\">Senhor</span>");
}
