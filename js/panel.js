// Panel para crear y editar estudios con el mismo diseño de la página.
// Pantallas: llave → lista de estudios → editor. Guarda en GitHub con js/github.js.
const $ = id => document.getElementById(id);

const COLORES_NOMBRES = { morado: "Morado", verde: "Verde", amarillo: "Amarillo", naranja: "Naranja", rosado: "Rosado", azul: "Azul" };
const TIPOS = { texto: "Texto", pasaje: "Pasaje bíblico", subtitulo: "Subtítulo" };

let estudio = null;     // el estudio que se está editando
let slug = "";          // nombre del archivo (sin .json); vacío si todavía no se publicó
let sha = null;         // versión del archivo en GitHub
let cambios = false;    // hay cambios sin publicar
let slugsExistentes = [];
const abiertos = new WeakSet(); // temas y puntos desplegados en el editor

// ---------- Pantallas ----------

function mostrar(id) {
  ["pLlave", "pLista", "pEditor"].forEach(p => { $(p).hidden = p !== id; });
  window.scrollTo(0, 0);
}

function aviso(id, texto) { $(id).textContent = texto || ""; }

function mensajeError(e) {
  if (e.status === 401) return "La llave no es válida o ya venció. Sal y pega una llave nueva.";
  if (e.status === 403 || e.status === 404) return "La llave no tiene permiso para editar estudios-biblicos. Revisa que tenga “Contents: Read and write”.";
  if (e.status === 409 || e.status === 422) return "El estudio cambió en GitHub mientras lo editabas. Vuelve a la lista y ábrelo de nuevo.";
  return "No se pudo conectar con GitHub. Revisa tu internet e inténtalo otra vez.";
}

// ---------- 1. Llave ----------

$("formLlave").addEventListener("submit", async e => {
  e.preventDefault();
  const llave = $("campoLlave").value.trim();
  if (!llave) return aviso("avisoLlave", "Pega tu llave primero.");
  Github.guardarLlave(llave);
  aviso("avisoLlave", "Comprobando…");
  try {
    await Github.listar();
    $("campoLlave").value = "";
    aviso("avisoLlave", "");
    abrirLista();
  } catch (err) {
    Github.borrarLlave();
    aviso("avisoLlave", mensajeError(err));
  }
});

$("btnSalir").addEventListener("click", () => {
  Github.borrarLlave();
  mostrar("pLlave");
});

// ---------- 2. Lista de estudios ----------

async function abrirLista() {
  mostrar("pLista");
  aviso("avisoLista", "");
  $("listaEstudios").textContent = "Cargando…";
  try {
    slugsExistentes = await Github.listar();
    const estudios = await Promise.all(slugsExistentes.map(async s => ({ slug: s, ...(await Github.leer(s)).datos })));
    $("listaEstudios").innerHTML = estudios.map(e => {
      const puntos = (e.temas || []).reduce((n, t) => n + (t.puntos || []).length, 0);
      return `<button type="button" class="tarjeta tarjeta-panel" data-slug="${esc(e.slug)}" style="--c:var(${COLORES[e.temas?.[0]?.color] || "--b1"})">
        <span class="etiqueta">${e.idioma === "pt" ? "Português" : "Español"}</span>
        <h2>${esc(e.titulo)}</h2>
        <span class="cuenta">${(e.temas || []).length} temas · ${puntos} puntos</span>
      </button>`;
    }).join("") || "<p>Todavía no hay estudios.</p>";
    revelar($("listaEstudios").children, 70);
  } catch (err) {
    $("listaEstudios").textContent = "";
    if (err.status === 401) { Github.borrarLlave(); mostrar("pLlave"); aviso("avisoLlave", mensajeError(err)); return; }
    aviso("avisoLista", mensajeError(err));
  }
}

$("listaEstudios").addEventListener("click", async e => {
  const t = e.target.closest("[data-slug]");
  if (!t) return;
  try {
    const { sha: s, datos } = await Github.leer(t.dataset.slug);
    abrirEditor(t.dataset.slug, s, datos);
  } catch (err) {
    aviso("avisoLista", mensajeError(err));
  }
});

$("btnNuevo").addEventListener("click", () => {
  abrirEditor("", null, {
    titulo: "", idioma: "es", otro_idioma: "", descripcion: "", preguntas: [], cierre: "",
    temas: [nuevoTema()]
  });
});

// ---------- 3. Editor ----------

const nuevoTema = () => ({ titulo: "", subtitulo: "", color: "morado", puntos: [nuevoPunto()] });
const nuevoPunto = () => ({ titulo: "", nuevo: false, bloques: [] });
const nuevoBloque = tipo => tipo === "pasaje"
  ? { tipo, referencia: "", versiculos: [{ numero: "1", texto: "" }] }
  : { tipo, texto: "" };

function abrirEditor(s, version, datos) {
  slug = s; sha = version; estudio = datos; cambios = false;
  (estudio.temas || []).forEach((t, i) => { if (i === 0) abiertos.add(t); });
  const guardado = leerBorrador();
  $("borrador").hidden = !guardado || guardado === JSON.stringify(estudio);
  mostrar("pEditor");
  dibujar();
  revelar(document.querySelectorAll("#editor > *"), 60);
}

$("btnVolver").addEventListener("click", () => {
  if (cambios && $("btnVolver").dataset.seguro !== "1") {
    pedirConfirmacion($("btnVolver"), "¿Salir sin publicar? Toca otra vez");
    return;
  }
  abrirLista();
});

// --- Borrador automático en este aparato, para no perder lo escrito ---
const claveBorrador = () => "estudios-biblicos-borrador-" + (slug || "nuevo");
function guardarBorrador() { try { localStorage.setItem(claveBorrador(), JSON.stringify(estudio)); } catch (e) {} }
function leerBorrador() { try { return localStorage.getItem(claveBorrador()); } catch (e) { return null; } }
function borrarBorrador() { try { localStorage.removeItem(claveBorrador()); } catch (e) {} }

$("borrador").addEventListener("click", e => {
  const accion = e.target.dataset.accion;
  if (accion === "recuperar") { estudio = JSON.parse(leerBorrador()); marcarCambio(); dibujar(); }
  if (accion === "descartar") borrarBorrador();
  if (accion) $("borrador").hidden = true;
});

function marcarCambio() {
  cambios = true;
  $("estado").textContent = "Cambios sin publicar";
  guardarBorrador();
}

window.addEventListener("beforeunload", e => { if (cambios) e.preventDefault(); });

// --- Leer y escribir en el estudio con una ruta como "temas.0.puntos.1.titulo" ---
function obtener(ruta) { return ruta.split(".").reduce((o, k) => o?.[k], estudio); }
function asignar(ruta, valor) {
  const partes = ruta.split(".");
  const ultimo = partes.pop();
  partes.reduce((o, k) => o[k], estudio)[ultimo] = valor;
}
function lista(ruta) { return ruta.split(".").slice(0, -1).join("."); }
function indice(ruta) { return Number(ruta.split(".").pop()); }

// ---------- Dibujo del editor ----------

const campo = (ruta, etiqueta, opciones = {}) => `
  <label class="campo">
    <span>${etiqueta}</span>
    ${opciones.largo
      ? `<textarea data-campo="${ruta}" rows="${opciones.filas || 2}" placeholder="${esc(opciones.ayuda || "")}">${esc(obtener(ruta))}</textarea>`
      : `<input data-campo="${ruta}" value="${esc(obtener(ruta))}" placeholder="${esc(opciones.ayuda || "")}">`}
  </label>`;

const botonesOrden = ruta => `
  <span class="orden">
    <button type="button" class="mini" data-accion="subir" data-ruta="${ruta}" aria-label="Subir">↑</button>
    <button type="button" class="mini" data-accion="bajar" data-ruta="${ruta}" aria-label="Bajar">↓</button>
    <button type="button" class="mini peligro" data-accion="borrar" data-ruta="${ruta}" aria-label="Borrar">✕</button>
  </span>`;

function dibujar() {
  const e = estudio;
  $("estado").textContent = cambios ? "Cambios sin publicar" : (slug ? "Publicado" : "Nuevo");
  $("editor").innerHTML = `
    <section class="bloque-ed datos">
      <h2>Portada</h2>
      ${campo("titulo", "Título del estudio", { ayuda: "Ej: Lenguas extrañas?" })}
      <div class="fila">
        <label class="campo"><span>Idioma</span>
          <select data-campo="idioma">
            <option value="es"${e.idioma !== "pt" ? " selected" : ""}>Español</option>
            <option value="pt"${e.idioma === "pt" ? " selected" : ""}>Português</option>
          </select>
        </label>
        <label class="campo"><span>El mismo estudio en el otro idioma</span>
          <select data-campo="otro_idioma">
            <option value="">— Ninguno —</option>
            ${slugsExistentes.filter(s => s !== slug).map(s => `<option value="${esc(s)}"${e.otro_idioma === s ? " selected" : ""}>${esc(s)}</option>`).join("")}
          </select>
        </label>
      </div>
      ${campo("descripcion", "Descripción corta (sale en la página de inicio)", { largo: true })}
      <div class="campo"><span>Preguntas de la portada</span>
        ${(e.preguntas || []).map((q, i) => `<div class="fila-item"><input data-campo="preguntas.${i}" value="${esc(q)}">${botonesOrden("preguntas." + i)}</div>`).join("")}
        <button type="button" class="btn agregar" data-accion="agregar-pregunta">+ Pregunta</button>
      </div>
      ${campo("cierre", "Frase después de las preguntas", { ayuda: "Ej: Y bien!" })}
    </section>

    <section class="temas-ed">
      ${(e.temas || []).map(dibujarTema).join("")}
      <button type="button" class="btn agregar grande" data-accion="agregar-tema">+ Tema</button>
    </section>

    ${slug ? `<section class="bloque-ed zona-peligro">
      <button type="button" class="btn peligro" data-accion="eliminar-estudio">Eliminar este estudio</button>
    </section>` : ""}`;
}

function dibujarTema(t, i) {
  const ruta = `temas.${i}`;
  const abierto = abiertos.has(t);
  return `
  <article class="tema-ed${abierto ? " abierto" : ""}" style="--c:var(${colorDe(t)})">
    <header class="cab">
      <span class="bnum">${i + 1}</span>
      <input class="titulo-input" data-campo="${ruta}.titulo" value="${esc(t.titulo)}" placeholder="Título del tema">
      ${botonesOrden(ruta)}
      <button type="button" class="mini" data-accion="abrir" data-ruta="${ruta}" aria-label="${abierto ? "Cerrar" : "Abrir"}">${abierto ? "▾" : "▸"}</button>
    </header>
    ${abierto ? `
    <div class="cuerpo">
      ${campo(`${ruta}.subtitulo`, "Subtítulo (pequeño, encima del título)")}
      <div class="campo"><span>Color</span>
        <div class="colores">${Object.entries(COLORES_NOMBRES).map(([c, n]) =>
          `<button type="button" class="color${t.color === c ? " on" : ""}" style="--c:var(${COLORES[c]})" data-accion="color" data-ruta="${ruta}" data-valor="${c}" aria-label="${n}" title="${n}"></button>`).join("")}</div>
      </div>
      <div class="puntos-ed">
        ${(t.puntos || []).map((p, j) => dibujarPunto(p, i, j)).join("")}
      </div>
      <button type="button" class="btn agregar" data-accion="agregar-punto" data-ruta="${ruta}">+ Punto ${i + 1}.${(t.puntos || []).length + 1}</button>
    </div>` : ""}
  </article>`;
}

function dibujarPunto(p, i, j) {
  const ruta = `temas.${i}.puntos.${j}`;
  const abierto = abiertos.has(p);
  return `
  <div class="punto-ed${abierto ? " abierto" : ""}">
    <header class="cab">
      <span class="n">${i + 1}.${j + 1}</span>
      <input class="titulo-input" data-campo="${ruta}.titulo" value="${esc(p.titulo)}" placeholder="Título del punto">
      ${botonesOrden(ruta)}
      <button type="button" class="mini" data-accion="abrir" data-ruta="${ruta}" aria-label="${abierto ? "Cerrar" : "Abrir"}">${abierto ? "▾" : "▸"}</button>
    </header>
    ${abierto ? `
    <div class="cuerpo">
      <label class="check"><input type="checkbox" data-campo="${ruta}.nuevo"${p.nuevo ? " checked" : ""}> Marcar como “nuevo”</label>
      ${(p.bloques || []).map((b, k) => dibujarBloque(b, `${ruta}.bloques.${k}`)).join("")}
      <div class="agregar-bloques">
        <button type="button" class="btn agregar" data-accion="agregar-bloque" data-ruta="${ruta}" data-valor="texto">+ Texto</button>
        <button type="button" class="btn agregar" data-accion="agregar-bloque" data-ruta="${ruta}" data-valor="pasaje">+ Pasaje bíblico</button>
        <button type="button" class="btn agregar" data-accion="agregar-bloque" data-ruta="${ruta}" data-valor="subtitulo">+ Subtítulo</button>
      </div>
      <details class="vista">
        <summary>Ver cómo queda</summary>
        <div class="rbody vista-previa" data-vista="${ruta}">${puntoHTML(p)}</div>
      </details>
    </div>` : ""}
  </div>`;
}

function dibujarBloque(b, ruta) {
  let cuerpo = "";
  if (b.tipo === "texto") {
    cuerpo = `
      <div class="herramientas">
        <button type="button" class="mini" data-formato="bold"><b>N</b></button>
        <button type="button" class="mini" data-formato="italic"><i>C</i></button>
        <button type="button" class="mini" data-formato="insertUnorderedList">• Lista</button>
        <button type="button" class="mini" data-formato="insertOrderedList">1. Lista</button>
      </div>
      <div class="rico" contenteditable="true" data-rico="${ruta}.texto">${b.texto || "<p><br></p>"}</div>`;
  } else if (b.tipo === "subtitulo") {
    cuerpo = `<input data-campo="${ruta}.texto" value="${esc(b.texto)}" placeholder="Subtítulo">`;
  } else if (b.tipo === "pasaje") {
    cuerpo = `
      <input data-campo="${ruta}.referencia" value="${esc(b.referencia)}" placeholder="Referencia y versión, ej: Juan 3:16 LBLA">
      ${(b.versiculos || []).map((v, n) => `
        <div class="versiculo">
          <input class="num" data-campo="${ruta}.versiculos.${n}.numero" value="${esc(v.numero)}" inputmode="numeric" aria-label="Número">
          <textarea data-campo="${ruta}.versiculos.${n}.texto" rows="2" placeholder="Texto del versículo">${esc(v.texto)}</textarea>
          ${botonesOrden(`${ruta}.versiculos.${n}`)}
        </div>`).join("")}
      <button type="button" class="btn agregar" data-accion="agregar-versiculo" data-ruta="${ruta}">+ Versículo</button>`;
  }
  return `
  <div class="bloque-contenido">
    <div class="cab-bloque"><span class="tipo">${TIPOS[b.tipo] || b.tipo}</span>${botonesOrden(ruta)}</div>
    ${cuerpo}
  </div>`;
}

// ---------- Acciones del editor ----------

function pedirConfirmacion(boton, texto) {
  const original = boton.textContent;
  boton.dataset.seguro = "1";
  boton.textContent = texto;
  setTimeout(() => { boton.dataset.seguro = ""; boton.textContent = original; }, 3000);
}

function mover(accion, ruta) {
  const arr = obtener(lista(ruta));
  const i = indice(ruta);
  if (accion === "subir" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
  if (accion === "bajar" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
  if (accion === "borrar") arr.splice(i, 1);
}

$("editor").addEventListener("click", e => {
  const b = e.target.closest("[data-accion]");
  if (!b) return;
  const { accion, ruta, valor } = b.dataset;

  if (accion === "borrar" && b.dataset.seguro !== "1") return pedirConfirmacion(b, "¿Borrar?");
  if (accion === "eliminar-estudio") return eliminarEstudio(b);

  if (accion === "abrir") {
    const obj = obtener(ruta);
    abiertos.has(obj) ? abiertos.delete(obj) : abiertos.add(obj);
    return dibujar();
  }
  if (["subir", "bajar", "borrar"].includes(accion)) mover(accion, ruta);
  if (accion === "agregar-pregunta") (estudio.preguntas ||= []).push("");
  if (accion === "agregar-tema") { const t = nuevoTema(); abiertos.add(t); estudio.temas.push(t); }
  if (accion === "agregar-punto") { const p = nuevoPunto(); abiertos.add(p); obtener(ruta).puntos.push(p); }
  if (accion === "agregar-bloque") (obtener(ruta).bloques ||= []).push(nuevoBloque(valor));
  if (accion === "agregar-versiculo") {
    const vs = obtener(ruta).versiculos;
    const ultimo = parseInt(vs[vs.length - 1]?.numero, 10);
    vs.push({ numero: Number.isFinite(ultimo) ? String(ultimo + 1) : "", texto: "" });
  }
  if (accion === "color") asignar(`${ruta}.color`, valor);
  marcarCambio();
  dibujar();
});

// Escribir en los campos: se guarda en el estudio sin redibujar, para no perder el cursor
$("editor").addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.campo) asignar(el.dataset.campo, el.type === "checkbox" ? el.checked : el.value);
  else if (el.dataset.rico) asignar(el.dataset.rico, limpiarHTML(el.innerHTML));
  else return;
  marcarCambio();
  actualizarVista(el);
});
$("editor").addEventListener("change", e => {
  if (e.target.matches("select[data-campo='idioma'], input[type=checkbox]")) dibujar();
});

// Negrita, cursiva y listas en los bloques de texto
$("editor").addEventListener("mousedown", e => { if (e.target.closest("[data-formato]")) e.preventDefault(); });
$("editor").addEventListener("click", e => {
  const f = e.target.closest("[data-formato]");
  if (!f) return;
  f.closest(".bloque-contenido").querySelector(".rico").focus();
  document.execCommand(f.dataset.formato);
});

// Al pegar texto de otra app, se pega sin colores ni letras raras
$("editor").addEventListener("paste", e => {
  if (!e.target.closest(".rico")) return;
  e.preventDefault();
  document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
});

function limpiarHTML(html) {
  const t = html.replace(/<(\/?)(div)\b[^>]*>/g, "<$1p>").replace(/\s(style|class)="[^"]*"/g, "").replace(/<span>|<\/span>/g, "").trim();
  return t === "<p><br></p>" || t === "<br>" ? "" : t;
}

function actualizarVista(el) {
  const punto = el.closest(".punto-ed");
  const vista = punto && punto.querySelector("[data-vista]");
  if (vista) vista.innerHTML = puntoHTML(obtener(vista.dataset.vista));
}

// ---------- Publicar y eliminar ----------

function slugDe(titulo) {
  return titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "estudio";
}

$("btnPublicar").addEventListener("click", async () => {
  if (!estudio.titulo.trim()) { $("estado").textContent = "Ponle un título al estudio"; return; }
  const boton = $("btnPublicar");
  boton.disabled = true;
  $("estado").textContent = "Publicando…";
  try {
    const nuevo = !slug;
    let archivo = slug;
    if (nuevo) {
      const base = slugDe(estudio.titulo);
      archivo = base;
      for (let n = 2; slugsExistentes.includes(archivo); n++) archivo = `${base}-${n}`;
    }
    const borradorViejo = claveBorrador();
    sha = await Github.guardar(archivo, estudio, sha, `${nuevo ? "Nuevo estudio" : "Actualizar estudio"}: ${estudio.titulo}`);
    try { localStorage.removeItem(borradorViejo); } catch (e) {}
    slug = archivo;
    if (nuevo) slugsExistentes.push(archivo);
    cambios = false;
    $("estado").innerHTML = `Publicado ✓ · en 1 o 2 minutos se ve en <a href="estudio.html?e=${encodeURIComponent(slug)}" target="_blank" rel="noopener">la página</a>`;
    if (nuevo) dibujar();
  } catch (err) {
    $("estado").textContent = mensajeError(err);
  } finally {
    boton.disabled = false;
  }
});

async function eliminarEstudio(boton) {
  if (boton.dataset.seguro !== "1") return pedirConfirmacion(boton, "¿Seguro? Se borra de la página. Toca otra vez");
  try {
    await Github.borrar(slug, sha);
    borrarBorrador();
    cambios = false;
    abrirLista();
  } catch (err) {
    $("estado").textContent = mensajeError(err);
  }
}

// ---------- Inicio ----------
if (Github.llave()) abrirLista();
else mostrar("pLlave");

// ---------- Vista previa en vivo ----------
// El cuadro de la derecha (o el botón "Vista previa" en el teléfono) es la página real del estudio
// (estudio.html?vista=1). Cada cambio se le manda, y muestra el punto que se está editando.
const vistaFrame = $("vistaFrame");
let pasoEditado = 0;
let esperaVista = null;

function enviarVista() {
  clearTimeout(esperaVista);
  esperaVista = setTimeout(() => {
    if (!estudio || !vistaFrame.contentWindow) return;
    vistaFrame.contentWindow.postMessage({ tipo: "estudio", estudio, paso: pasoEditado }, location.origin);
  }, 250);
}

// Número del punto (contando todos los temas) a partir de una ruta como "temas.2.puntos.1..."
function pasoDeRuta(ruta) {
  const m = /^temas\.(\d+)(?:\.puntos\.(\d+))?/.exec(ruta || "");
  if (!m || !estudio) return null;
  const t = Number(m[1]), p = m[2] ? Number(m[2]) : 0;
  return (estudio.temas || []).slice(0, t).reduce((n, tema) => n + (tema.puntos || []).length, 0) + p;
}

$("editor").addEventListener("focusin", e => {
  const ruta = e.target.dataset.campo || e.target.dataset.rico || e.target.dataset.ruta;
  const paso = pasoDeRuta(ruta);
  if (paso !== null && paso !== pasoEditado) { pasoEditado = paso; enviarVista(); }
});
$("editor").addEventListener("input", enviarVista);
new MutationObserver(enviarVista).observe($("editor"), { childList: true });
window.addEventListener("message", e => {
  if (e.origin === location.origin && e.data?.tipo === "vista-lista") enviarVista();
});

$("btnVista").addEventListener("click", () => {
  const ver = $("pEditor").classList.toggle("ver-vista");
  $("btnVista").textContent = ver ? "Editar" : "Vista previa";
  if (ver) enviarVista();
  window.scrollTo(0, 0);
});
