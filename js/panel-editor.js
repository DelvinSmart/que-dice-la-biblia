// Panel · editor de un estudio: dibuja la portada, los temas, los puntos y sus bloques,
// y responde a los botones (+ Tema, + Punto, ↑ ↓ ✕…) y a lo que se escribe.

const COLORES_NOMBRES = { morado: "Morado", verde: "Verde", amarillo: "Amarillo", naranja: "Naranja", rosado: "Rosado", azul: "Azul" };
const TIPOS = { texto: "Texto", pasaje: "Pasaje bíblico", subtitulo: "Subtítulo" };

const nuevoTema = () => ({ titulo: "", subtitulo: "", color: "morado", puntos: [nuevoPunto()] });
const nuevoPunto = () => ({ titulo: "", nuevo: false, bloques: [] });
const nuevoBloque = tipo => tipo === "pasaje"
  ? { tipo, referencia: "", versiculos: [{ numero: "1", texto: "" }] }
  : { tipo, texto: "" };

// ---------- Piezas del formulario ----------

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

const botonAbrir = (ruta, abierto) =>
  `<button type="button" class="mini" data-accion="abrir" data-ruta="${ruta}" aria-label="${abierto ? "Cerrar" : "Abrir"}">${abierto ? "▾" : "▸"}</button>`;

// ---------- Dibujo ----------

function dibujar() {
  const e = estudio;
  $("estado").textContent = cambios ? "Cambios sin publicar" : (slug ? "Publicado" : "Nuevo");
  $("editor").innerHTML = `
    <section class="bloque-ed datos">
      <h2>Portada</h2>
      ${campo("titulo", "Título del estudio", { ayuda: "Ej: ¿Lenguas extrañas?" })}
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
      ${campo("cierre", "Frase después de las preguntas", { ayuda: "Ej: ¡Y bien!" })}
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
      ${botonesOrden(ruta)}${botonAbrir(ruta, abierto)}
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
      ${botonesOrden(ruta)}${botonAbrir(ruta, abierto)}
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
    const vacio = !b.referencia && (b.versiculos || []).every(v => !v.texto);
    cuerpo = `
      <details class="pegar"${vacio ? " open" : ""}>
        <summary>Pegar desde la app Biblia, o leer una foto</summary>
        <label class="btn foto">Foto o captura<input type="file" accept="image/*" data-foto="${ruta}" hidden></label>
        <textarea rows="4" placeholder="Copia el pasaje en tu app Biblia (con “Copiar” o “Compartir”) y pégalo aquí: texto, referencia y link."></textarea>
        <button type="button" class="btn principal" data-accion="llenar-pasaje" data-ruta="${ruta}">Llenar referencia y versículos</button>
        <p class="ayuda-pegar" role="status"></p>
        <div class="seleccion"></div>
      </details>
      <input data-campo="${ruta}.referencia" data-limpiar="referencia" value="${esc(b.referencia)}" placeholder="Referencia y versión, ej: Juan 3:16 LBLA">
      ${(b.versiculos || []).map((v, n) => `
        <div class="versiculo">
          <input class="num" data-campo="${ruta}.versiculos.${n}.numero" value="${esc(v.numero)}" inputmode="numeric" aria-label="Número">
          <div class="rico rico-verso" contenteditable="true" data-verso="${ruta}.versiculos.${n}.texto" data-placeholder="Texto del versículo">${v.texto || ""}</div>
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

function actualizarVista(el) {
  const punto = el.closest(".punto-ed");
  const vista = punto && punto.querySelector("[data-vista]");
  if (vista) vista.innerHTML = puntoHTML(obtener(vista.dataset.vista));
}

// ---------- Botones ----------

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
  if (accion === "llenar-pasaje") return llenarPasaje(b, ruta);
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

// ---------- Lo que se escribe (se guarda sin redibujar, para no perder el cursor) ----------

$("editor").addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.campo) {
    const valor = el.type === "checkbox" ? el.checked
      : el.dataset.limpiar === "referencia" ? limpiarReferencia(el.value) : el.value;
    asignar(el.dataset.campo, valor);
  } else if (el.dataset.rico) asignar(el.dataset.rico, limpiarHTML(el.innerHTML));
  else if (el.dataset.verso) asignar(el.dataset.verso, limpiarVerso(el.innerHTML));
  else return;
  marcarCambio();
  actualizarVista(el);
});

$("editor").addEventListener("change", e => {
  if (e.target.matches("select[data-campo='idioma'], input[type=checkbox][data-campo]")) dibujar();
});

// Negrita, cursiva y listas en los bloques de texto
$("editor").addEventListener("mousedown", e => { if (e.target.closest("[data-formato]")) e.preventDefault(); });
$("editor").addEventListener("click", e => {
  const f = e.target.closest("[data-formato]");
  if (!f) return;
  f.closest(".bloque-contenido").querySelector(".rico").focus();
  document.execCommand(f.dataset.formato);
});

// Al pegar desde otra app: solo el texto, sin colores, letras raras ni comillas de la app Biblia
$("editor").addEventListener("paste", e => {
  const rico = e.target.closest(".rico");
  if (!rico) return;
  e.preventDefault();
  let texto = e.clipboardData.getData("text/plain").replace(INVISIBLES, "");
  if (rico.dataset.verso) texto = texto.replace(/\s+/g, " ").trim().replace(/^[“”"«»\s]+|[“”"«»\s]+$/g, "");
  document.execCommand("insertText", false, texto);
});

// "Pegar desde la app Biblia": llena la referencia y los versículos con lo pegado (js/panel-pegar.js)
function llenarPasaje(boton, ruta) {
  const caja = boton.closest(".pegar");
  const leido = leerPasajeCopiado(caja.querySelector("textarea").value);
  if (!leido) {
    caja.querySelector(".ayuda-pegar").textContent = "Primero pega aquí el pasaje que copiaste de la app.";
    return;
  }
  const pasaje = obtener(ruta);
  if (leido.referencia) pasaje.referencia = leido.referencia;
  pasaje.versiculos = leido.versiculos;
  marcarCambio();
  dibujar();
}
