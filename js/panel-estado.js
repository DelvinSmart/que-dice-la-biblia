// Panel · estado compartido: el estudio que se edita, cambio de pantallas, avisos,
// lectura/escritura por rutas ("temas.0.puntos.1.titulo"), borrador automático y limpieza de lo que se pega.
const $ = id => document.getElementById(id);

let estudio = null;     // el estudio que se está editando
let slug = "";          // nombre del archivo (sin .json); vacío si todavía no se publicó
let sha = null;         // versión del archivo en GitHub
let cambios = false;    // hay cambios sin publicar
let slugsExistentes = [];
const abiertos = new WeakSet(); // temas y puntos desplegados en el editor

// ---------- Pantallas y avisos ----------

function mostrar(id) {
  ["pLlave", "pLista", "pEditor"].forEach(p => { $(p).hidden = p !== id; });
  window.scrollTo(0, 0);
}

function aviso(id, texto) { $(id).textContent = texto || ""; }

function mensajeError(e) {
  if (e.status === 401) return "La llave no es válida o ya venció. Sal y pega una llave nueva.";
  if (e.status === 403 || e.status === 404) return "La llave no tiene permiso para editar que-dice-la-biblia. Revisa que tenga “Contents: Read and write”.";
  if (e.status === 409 || e.status === 422) return "El estudio cambió en GitHub mientras lo editabas. Vuelve a la lista y ábrelo de nuevo.";
  return "No se pudo conectar con GitHub. Revisa tu internet e inténtalo otra vez.";
}

// Pide un segundo toque antes de algo que no se puede deshacer
function pedirConfirmacion(boton, texto) {
  const original = boton.textContent;
  boton.dataset.seguro = "1";
  boton.textContent = texto;
  setTimeout(() => { boton.dataset.seguro = ""; boton.textContent = original; }, 3000);
}

// ---------- Rutas dentro del estudio ----------

function obtener(ruta) { return ruta.split(".").reduce((o, k) => o?.[k], estudio); }
function asignar(ruta, valor) {
  const partes = ruta.split(".");
  const ultimo = partes.pop();
  partes.reduce((o, k) => o[k], estudio)[ultimo] = valor;
}
function lista(ruta) { return ruta.split(".").slice(0, -1).join("."); }
function indice(ruta) { return Number(ruta.split(".").pop()); }

// ---------- Borrador automático en este aparato ----------

const claveBorrador = () => "estudios-biblicos-borrador-" + (slug || "nuevo");
function guardarBorrador() { try { localStorage.setItem(claveBorrador(), JSON.stringify(estudio)); } catch (e) {} }
function leerBorrador() { try { return localStorage.getItem(claveBorrador()); } catch (e) { return null; } }
function borrarBorrador() { try { localStorage.removeItem(claveBorrador()); } catch (e) {} }

function marcarCambio() {
  cambios = true;
  $("estado").textContent = "Cambios sin publicar";
  guardarBorrador();
}

// ---------- Limpieza de lo que se escribe o se pega ----------

// Caracteres invisibles que trae la app Biblia al copiar (marcas de dirección del texto)
const INVISIBLES = /[‎‏‪-‮⁦-⁩]/g;

// Texto con formato: deja negrita, cursiva, listas, párrafos y los estilos del estudio (.g griego, .sc versalitas)
function limpiarHTML(html) {
  const t = html
    .replace(INVISIBLES, "")
    .replace(/<(\/?)div\b[^>]*>/g, "<$1p>")
    .replace(/<\/?font\b[^>]*>/g, "")
    .replace(/\sstyle="[^"]*"/g, "")
    .replace(/\sclass="(?!(?:g|sc)")[^"]*"/g, "")
    .replace(/<span>([\s\S]*?)<\/span>/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/<p>\s+/g, "<p>")
    .replace(/ {2,}/g, " ")
    .trim();
  return t === "<p><br></p>" || t === "<br>" || t === "<p></p>" ? "" : t;
}

// Un versículo: una sola línea, sin las comillas que pone la app Biblia al copiar
function limpiarVerso(html) {
  return limpiarHTML(html)
    .replace(/<\/?p>|<br>/g, " ")
    .replace(/ {2,}/g, " ")
    .trim()
    .replace(/^[“”"«»\s]+|[“”"«»\s]+$/g, "")
    .trim();
}

const limpiarReferencia = texto => texto.replace(INVISIBLES, "").replace(/\s+/g, " ");
