// Los libros de la Biblia y las referencias: entender "Hechos 20:17, 28 LBLA", contar sus versículos
// y armar el enlace que abre ese pasaje exacto en Bible.com (o en la app YouVersion, en el teléfono).
// Aquí no se guarda ningún texto bíblico: solo los nombres de los libros y cuántos capítulos tienen.

// [nombre en español, nombre en portugués, código de Bible.com, capítulos, otros nombres]
const LIBROS = [
  ["Génesis", "Gênesis", "GEN", 50], ["Éxodo", "Êxodo", "EXO", 40], ["Levítico", "Levítico", "LEV", 27],
  ["Números", "Números", "NUM", 36], ["Deuteronomio", "Deuteronômio", "DEU", 34], ["Josué", "Josué", "JOS", 24],
  ["Jueces", "Juízes", "JDG", 21], ["Rut", "Rute", "RUT", 4], ["1 Samuel", "1 Samuel", "1SA", 31],
  ["2 Samuel", "2 Samuel", "2SA", 24], ["1 Reyes", "1 Reis", "1KI", 22], ["2 Reyes", "2 Reis", "2KI", 25],
  ["1 Crónicas", "1 Crônicas", "1CH", 29], ["2 Crónicas", "2 Crônicas", "2CH", 36], ["Esdras", "Esdras", "EZR", 10],
  ["Nehemías", "Neemias", "NEH", 13], ["Ester", "Ester", "EST", 10], ["Job", "Jó", "JOB", 42],
  ["Salmos", "Salmos", "PSA", 150, ["Salmo"]], ["Proverbios", "Provérbios", "PRO", 31],
  ["Eclesiastés", "Eclesiastes", "ECC", 12], ["Cantares", "Cânticos", "SNG", 8, ["Cantar de los Cantares", "Cantares de Salomón", "Cântico dos Cânticos"]],
  ["Isaías", "Isaías", "ISA", 66], ["Jeremías", "Jeremias", "JER", 52], ["Lamentaciones", "Lamentações", "LAM", 5],
  ["Ezequiel", "Ezequiel", "EZK", 48], ["Daniel", "Daniel", "DAN", 12], ["Oseas", "Oséias", "HOS", 14, ["Oseias"]],
  ["Joel", "Joel", "JOL", 3], ["Amós", "Amós", "AMO", 9], ["Abdías", "Obadias", "OBA", 1],
  ["Jonás", "Jonas", "JON", 4], ["Miqueas", "Miquéias", "MIC", 7, ["Miqueias"]], ["Nahúm", "Naum", "NAM", 3],
  ["Habacuc", "Habacuque", "HAB", 3], ["Sofonías", "Sofonias", "ZEP", 3], ["Hageo", "Ageu", "HAG", 2],
  ["Zacarías", "Zacarias", "ZEC", 14], ["Malaquías", "Malaquias", "MAL", 4],
  ["Mateo", "Mateus", "MAT", 28], ["Marcos", "Marcos", "MRK", 16], ["Lucas", "Lucas", "LUK", 24],
  ["Juan", "João", "JHN", 21], ["Hechos", "Atos", "ACT", 28], ["Romanos", "Romanos", "ROM", 16],
  ["1 Corintios", "1 Coríntios", "1CO", 16], ["2 Corintios", "2 Coríntios", "2CO", 13], ["Gálatas", "Gálatas", "GAL", 6],
  ["Efesios", "Efésios", "EPH", 6], ["Filipenses", "Filipenses", "PHP", 4], ["Colosenses", "Colossenses", "COL", 4],
  ["1 Tesalonicenses", "1 Tessalonicenses", "1TH", 5], ["2 Tesalonicenses", "2 Tessalonicenses", "2TH", 3],
  ["1 Timoteo", "1 Timóteo", "1TI", 6], ["2 Timoteo", "2 Timóteo", "2TI", 4], ["Tito", "Tito", "TIT", 3],
  ["Filemón", "Filemom", "PHM", 1], ["Hebreos", "Hebreus", "HEB", 13], ["Santiago", "Tiago", "JAS", 5],
  ["1 Pedro", "1 Pedro", "1PE", 5], ["2 Pedro", "2 Pedro", "2PE", 3], ["1 Juan", "1 João", "1JN", 5],
  ["2 Juan", "2 João", "2JN", 1], ["3 Juan", "3 João", "3JN", 1], ["Judas", "Judas", "JUD", 1],
  ["Apocalipsis", "Apocalipse", "REV", 22]
].map(([es, pt, codigo, capitulos, otros = []]) => ({ es, pt, codigo, capitulos, otros }));

// Versiones que se pueden abrir en Bible.com (número de la versión en Bible.com, comprobado el 15 nov 2026)
const VERSIONES = { LBLA: 89, RVR1960: 149, NVI: 128, ARA: 1608, ARC: 212 };
const VERSION_POR_IDIOMA = { es: "LBLA", pt: "ARA" };

// Las mismas letras sin tildes ni mayúsculas, para comparar nombres de libros
const sinTildes = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const LIBRO_POR_NOMBRE = new Map(LIBROS.flatMap(l => [l.es, l.pt, ...l.otros].map(n => [sinTildes(n), l])));

// "Hechos 20:17, 28 LBLA" → { libro, capitulo: 20, tramos: [[17,17],[28,28]], version: "LBLA" }
function leerReferencia(ref) {
  // "1 Corintios 14:5, 18 y 39" (o "e" en portugués) es lo mismo que "14:5, 18, 39"
  ref = String(ref || "").replace(/\s+(?:y|e)\s+(?=\d)/g, ", ");
  const m = /^\s*((?:[1-3]\s*)?[^\d:]+?)\s+(\d+)\s*:\s*([\d\s,\-–]+?)\s*(?:\b([A-Z]{2,6}\d*))?\s*$/.exec(ref);
  if (!m) return null;
  const libro = LIBRO_POR_NOMBRE.get(sinTildes(m[1].replace(/^([1-3])(?=\S)/, "$1 ")));
  if (!libro) return null;
  const tramos = m[3].split(",").map(t => t.trim()).filter(Boolean).map(t => {
    const [a, b] = t.split(/[-–]/).map(n => parseInt(n, 10));
    return [a, Number.isFinite(b) ? b : a];
  });
  if (!tramos.length || tramos.some(([a, b]) => !(a > 0) || b < a)) return null;
  return { libro, capitulo: parseInt(m[2], 10), tramos, version: m[4] || "" };
}

const contarTramos = tramos => tramos.reduce((n, [a, b]) => n + b - a + 1, 0);

// El enlace que abre el pasaje en Bible.com; en el iPhone o Android lo abre la app YouVersion si está instalada
function enlaceBiblia(ref, idioma = "es") {
  const r = leerReferencia(ref);
  if (!r) return "";
  const version = VERSIONES[r.version] ? r.version : VERSION_POR_IDIOMA[idioma] || "LBLA";
  const versos = r.tramos.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(",");
  return `https://www.bible.com/bible/${VERSIONES[version]}/${r.libro.codigo}.${r.capitulo}.${versos}.${version}`;
}

// Arma la referencia escrita: ("es", libro, 2, 18, 20, "LBLA") → "Génesis 2:18-20 LBLA"
const escribirReferencia = (idioma, libro, capitulo, desde, hasta, version) =>
  `${idioma === "pt" ? libro.pt : libro.es} ${capitulo}:${hasta > desde ? `${desde}-${hasta}` : desde} ${version}`.trim();
