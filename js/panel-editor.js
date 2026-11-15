// Panel · editor de un estudio: dibuja la portada, los temas, los puntos y sus bloques,
// y responde a los botones (+ Tema, + Punto, ↑ ↓ ✕…) y a lo que se escribe.

const COLORES_NOMBRES = {
  morado: "Morado", verde: "Verde", amarillo: "Amarillo", naranja: "Naranja", rosado: "Rosado", azul: "Azul",
  rojo: "Rojo", celeste: "Celeste", lima: "Lima", cobre: "Cobre", pizarra: "Pizarra"
};
const TIPOS = { texto: "Texto", pasaje: "Pasaje bíblico", subtitulo: "Subtítulo", imagen: "Imagen", video: "Video", fuente: "Fuente", griego: "Griego (SBLGNT)" };

const nuevoTema = () => ({ titulo: "", subtitulo: "", color: "morado", puntos: [nuevoPunto()] });
const nuevoPunto = () => ({ titulo: "", nuevo: false, bloques: [] });
const nuevoBloque = tipo =>
  tipo === "pasaje" ? { tipo, referencia: "", versiculos: [{ numero: "1", texto: "" }] }
  : tipo === "imagen" ? { tipo, src: "", pie: "" }
  : tipo === "video" ? { tipo, url: "", src: "", pie: "" }
  : tipo === "fuente" ? { tipo, titulo: "", texto: "", url: "" }
  : tipo === "griego" ? { tipo, referencia: "", versiculos: [] }
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
      ${campo("titulo", "Tema del estudio", { ayuda: "Ej: ¿Lenguas extrañas?" })}
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
      <button type="button" class="btn agregar grande" data-accion="agregar-tema">+ Punto</button>
    </section>

    ${dibujarFuentes()}

    ${slug ? `<section class="bloque-ed zona-peligro">
      <button type="button" class="btn peligro" data-accion="eliminar-estudio">Eliminar este estudio</button>
    </section>` : ""}`;
  actualizarMedidor();
}

// ---------- Fuentes del estudio: aparte del texto, cada subpunto con las suyas ----------
// Se guardan en cada subpunto ("fuentes"), así no se pierden si se cambia el orden de los puntos.
let fuentesAbiertas = false;
const subpuntosConFuentesAbiertos = new WeakSet();

function dibujarFuentes() {
  const total = (estudio.temas || []).reduce((n, t) => n + (t.puntos || []).reduce((m, p) => m + fuentesDePunto(p).length, 0), 0);
  return `
  <article class="tema-ed fuentes-ed${fuentesAbiertas ? " abierto" : ""}" style="--c:var(--b11)">
    <header class="cab">
      <span class="bnum">≡</span>
      <span class="titulo-fijo">Fuentes del estudio <small>${total}</small></span>
      <button type="button" class="mini" data-accion="abrir-fuentes" aria-label="${fuentesAbiertas ? "Cerrar" : "Abrir"}">${fuentesAbiertas ? "▾" : "▸"}</button>
    </header>
    ${fuentesAbiertas ? `
    <div class="cuerpo">
      <p class="ayuda-fuente">De dónde sacaste la información de cada subpunto: el nombre, un resumen corto y el link. En la página salen como botoncitos al final del subpunto, y todas juntas en el último paso del mapa. El griego también va aquí.</p>
      ${(estudio.temas || []).map((t, i) => (t.puntos || []).map((p, j) => dibujarFuentesDe(p, i, j)).join("")).join("")}
    </div>` : ""}
  </article>`;
}

function dibujarFuentesDe(p, i, j) {
  const ruta = `temas.${i}.puntos.${j}`;
  const abierto = subpuntosConFuentesAbiertos.has(p);
  const n = (p.fuentes || []).length;
  return `
  <div class="punto-ed${abierto ? " abierto" : ""}">
    <header class="cab">
      <span class="n">${i + 1}.${j + 1}</span>
      <span class="titulo-fijo">${esc(p.titulo || "Sin título")}</span>
      <span class="cuenta-fuentes">${n || ""}</span>
      <button type="button" class="mini" data-accion="abrir-fuentes-de" data-ruta="${ruta}" aria-label="${abierto ? "Cerrar" : "Abrir"}">${abierto ? "▾" : "▸"}</button>
    </header>
    ${abierto ? `
    <div class="cuerpo">
      ${(p.fuentes || []).map((f, k) => dibujarBloque(f, `${ruta}.fuentes.${k}`)).join("")}
      <div class="agregar-bloques">
        <button type="button" class="btn agregar" data-accion="agregar-fuente" data-ruta="${ruta}" data-valor="fuente">+ Fuente</button>
        <button type="button" class="btn agregar" data-accion="agregar-fuente" data-ruta="${ruta}" data-valor="griego">+ Griego</button>
      </div>
    </div>` : ""}
  </div>`;
}

function dibujarTema(t, i) {
  const ruta = `temas.${i}`;
  const abierto = abiertos.has(t);
  return `
  <article class="tema-ed${abierto ? " abierto" : ""}" style="--c:var(${colorDe(t)})">
    <header class="cab">
      <span class="bnum">${i + 1}</span>
      <input class="titulo-input" data-campo="${ruta}.titulo" value="${esc(t.titulo)}" placeholder="Título del punto">
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
      <button type="button" class="btn agregar" data-accion="agregar-punto" data-ruta="${ruta}">+ Subpunto ${i + 1}.${(t.puntos || []).length + 1}</button>
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
      <input class="titulo-input" data-campo="${ruta}.titulo" value="${esc(p.titulo)}" placeholder="Título del subpunto">
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
        <button type="button" class="btn agregar" data-accion="agregar-bloque" data-ruta="${ruta}" data-valor="imagen">+ Imagen</button>
        <button type="button" class="btn agregar" data-accion="agregar-bloque" data-ruta="${ruta}" data-valor="video">+ Video</button>
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
  } else if (b.tipo === "imagen") {
    cuerpo = `
      ${b.src ? `<figure class="imagen"><img src="${esc(rutaImagen(b.src))}" alt=""></figure>` : ""}
      <label class="btn${b.src ? "" : " principal"} foto">${b.src ? "Cambiar imagen" : "Tomar foto o escoger imagen"}<input type="file" accept="image/*" data-imagen="${ruta}.src" hidden></label>
      <p class="ayuda-pegar ayuda-imagen" role="status"></p>
      <input data-campo="${ruta}.pie" value="${esc(b.pie)}" placeholder="Pie de foto (opcional), ej: Mapa de las naciones en Hechos 2">`;
  } else if (b.tipo === "video") {
    cuerpo = `
      ${videoHTML(b)}
      <input data-campo="${ruta}.url" value="${esc(b.url)}" placeholder="Link del video (YouTube u otra página)" inputmode="url">
      <label class="btn foto">${b.src ? "Cambiar video" : "O subir un video corto (máx. 25 MB)"}<input type="file" accept="video/*" data-video="${ruta}.src" hidden></label>
      <p class="ayuda-pegar ayuda-imagen" role="status"></p>
      <input data-campo="${ruta}.pie" value="${esc(b.pie)}" placeholder="Pie del video (opcional)">`;
  } else if (b.tipo === "griego") {
    cuerpo = `
      ${buscadorHTML(b, ruta, true)}
      <p class="ayuda-fuente">El griego se llena solo desde el SBLGNT (Nuevo Testamento). No cuenta en el límite de la LBLA.</p>
      ${(b.versiculos || []).length ? `<div class="griego-lista">${b.versiculos.map(v =>
        `<p${v.texto ? ' lang="grc"' : ' class="falta"'}><b>${esc(v.numero)}</b> ${v.texto ? esc(v.texto) : "No está en el texto griego crítico."}</p>`).join("")}</div>` : ""}`;
  } else if (b.tipo === "fuente") {
    const linkMalo = b.url && !linkSeguro(b.url);
    cuerpo = `
      <input data-campo="${ruta}.titulo" value="${esc(b.titulo)}" placeholder="Nombre de la fuente, ej: Léxico Strong · G1100 glōssa">
      <textarea data-campo="${ruta}.texto" rows="3" placeholder="Qué dice o qué se sacó de ahí, con tus palabras">${esc(b.texto)}</textarea>
      <input data-campo="${ruta}.url" value="${esc(b.url)}" placeholder="Link, ej: https://…" inputmode="url">
      ${linkMalo ? `<p class="ayuda-pegar">El link tiene que empezar con https:// para que se pueda abrir.</p>` : ""}`;
  } else if (b.tipo === "subtitulo") {
    cuerpo = `<input data-campo="${ruta}.texto" value="${esc(b.texto)}" placeholder="Subtítulo">`;
  } else if (b.tipo === "pasaje") {
    const vacio = !b.referencia && (b.versiculos || []).every(v => !v.texto);
    cuerpo = `
      ${buscadorHTML(b, ruta)}
      <details class="pegar"${vacio ? " open" : ""}>
        <summary>Pegar desde la app Biblia, o leer una foto</summary>
        <label class="btn foto">Foto o captura<input type="file" accept="image/*" data-foto="${ruta}" hidden></label>
        <textarea rows="4" placeholder="Copia el pasaje en tu app Biblia (con “Copiar” o “Compartir”) y pégalo aquí: texto, referencia y link."></textarea>
        <button type="button" class="btn principal" data-accion="llenar-pasaje" data-ruta="${ruta}">Llenar referencia y versículos</button>
        <p class="ayuda-pegar" role="status"></p>
        <div class="seleccion"></div>
      </details>
      <div class="fila-referencia">
        <input data-campo="${ruta}.referencia" data-limpiar="referencia" value="${esc(b.referencia)}" placeholder="Referencia y versión, ej: Juan 3:16 LBLA">
        ${botonAbrirBiblia(b.referencia)}
        ${pasajeVacio(b) && leerReferencia(b.referencia) ? `<button type="button" class="btn" data-accion="reusar" data-ruta="${ruta}">Buscar en mis estudios</button>` : ""}
      </div>
      ${b.imagen ? `<img class="pasaje-img" src="${esc(rutaImagen(b.imagen))}" alt="">` : ""}
      <div class="fila-botones">
        <label class="btn foto">${b.imagen ? "Cambiar imagen" : "Imagen en vez de versículos"}<input type="file" accept="image/*" data-imagen="${ruta}.imagen" hidden></label>
        ${b.imagen ? `<button type="button" class="btn" data-accion="quitar-imagen" data-ruta="${ruta}">Quitar imagen</button>` : ""}
      </div>
      <p class="ayuda-pegar ayuda-imagen" role="status"></p>
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

// ---------- Buscador de versículos (js/biblia.js) ----------
// Escoges libro, capítulo y versículos; arma la referencia y abre ese pasaje en Bible.com o en la app YouVersion
// para copiarlo. El texto no se trae solo: YouVersion no ofrece la LBLA para traerla automáticamente.

const versionesDelIdioma = () => (estudio.idioma === "pt" ? ["ARA", "ARC"] : ["LBLA", "RVR1960", "NVI"]);

function buscadorHTML(b, ruta, griego = false) {
  const r = leerReferencia(b.referencia);
  const idioma = estudio.idioma === "pt" ? "pt" : "es";
  const versiones = versionesDelIdioma();
  const version = r && versiones.includes(r.version) ? r.version : versiones[0];
  const num = (clase, etiqueta, valor, max) =>
    `<label><span>${etiqueta}</span><input class="${clase}" type="number" inputmode="numeric" min="1"${max ? ` max="${max}"` : ""} value="${valor ?? ""}"></label>`;
  return `
      <div class="buscador" data-ruta="${ruta}">
        <label class="b-libro-campo"><span>Libro</span><select class="b-libro">
          <option value="">— Escoge —</option>
          ${LIBROS.map(l => `<option value="${l.codigo}"${r && r.libro === l ? " selected" : ""}>${esc(l[idioma])}</option>`).join("")}
        </select></label>
        ${num("b-cap", "Capítulo", r?.capitulo, r?.libro.capitulos)}
        ${num("b-desde", "Desde", r?.tramos[0][0])}
        ${num("b-hasta", "Hasta", r?.tramos[0][1])}
        ${griego ? "" : `<label class="b-version-campo"><span>Versión</span><select class="b-version">${versiones.map(v => `<option${v === version ? " selected" : ""}>${v}</option>`).join("")}</select></label>`}
        <button type="button" class="btn${griego ? " principal" : ""}" data-accion="${griego ? "traer-griego" : "poner-referencia"}" data-ruta="${ruta}">${griego ? "Traer el griego" : "Poner"}</button>
        <p class="ayuda-pegar b-aviso" role="status">${avisosPasaje.get(b) || (r && r.tramos.length > 1 ? "Esta referencia tiene versículos salteados: el buscador muestra el primero. Para cambiarla completa, escríbela abajo." : "")}</p>
      </div>`;
}

const botonAbrirBiblia = ref => {
  const url = enlaceBiblia(ref, estudio.idioma);
  return `<a class="btn abrir-biblia" href="${esc(url)}" target="_blank" rel="noopener"${url ? "" : " hidden"}>Abrir en la Biblia ↗</a>`;
};

function leerBuscador(boton) {
  const caja = boton.closest(".buscador");
  const libro = LIBROS.find(l => l.codigo === caja.querySelector(".b-libro").value);
  const cap = parseInt(caja.querySelector(".b-cap").value, 10);
  const desde = parseInt(caja.querySelector(".b-desde").value, 10);
  const hasta = parseInt(caja.querySelector(".b-hasta").value, 10) || desde;
  const error = !libro ? "Escoge el libro."
    : !(cap >= 1 && cap <= libro.capitulos) ? `${libro[estudio.idioma === "pt" ? "pt" : "es"]} tiene ${libro.capitulos} capítulo${libro.capitulos > 1 ? "s" : ""}.`
    : !(desde >= 1) ? "Escribe desde qué versículo."
    : hasta < desde ? "“Hasta” no puede ser menor que “Desde”." : "";
  if (error) caja.querySelector(".b-aviso").textContent = error;
  return error ? null : { caja, libro, cap, desde, hasta };
}

function ponerReferencia(boton, ruta) {
  const r = leerBuscador(boton);
  if (!r) return;
  const { caja, libro, cap, desde, hasta } = r;
  asignar(`${ruta}.referencia`, escribirReferencia(estudio.idioma, libro, cap, desde, hasta, caja.querySelector(".b-version").value));
  if (pasajeVacio(obtener(ruta))) return reusar(ruta);
  marcarCambio();
  dibujar();
}

// Griego: trae los versículos del SBLGNT (griego/sblgnt/<libro>.json, licencia CC BY 4.0)
async function traerGriego(boton, ruta) {
  const r = leerBuscador(boton);
  if (!r) return;
  const { libro, cap, desde, hasta } = r;
  const bloque = obtener(ruta);
  if (LIBROS.indexOf(libro) < LIBROS.findIndex(l => l.codigo === "MAT")) {
    avisosPasaje.set(bloque, "El griego es solo del Nuevo Testamento. El Antiguo Testamento se escribió en hebreo.");
    return dibujar();
  }
  try {
    const capitulo = (await cargarJSON(`griego/sblgnt/${libro.codigo}.json`))[cap];
    if (!capitulo) throw new Error("capítulo");
    bloque.referencia = escribirReferencia(estudio.idioma, libro, cap, desde, hasta, "");
    bloque.versiculos = [];
    for (let n = desde; n <= hasta; n++) bloque.versiculos.push({ numero: String(n), texto: capitulo[n] || "" });
    const faltan = bloque.versiculos.filter(v => !v.texto).map(v => v.numero);
    avisosPasaje.set(bloque, faltan.length ? `No están en el texto griego crítico: ${faltan.join(", ")}.` : "");
    marcarCambio();
  } catch (err) {
    avisosPasaje.set(bloque, "No se encontró ese capítulo en el griego.");
  }
  dibujar();
}

// Usa los versículos que ya están copiados en algún estudio (js/panel-reusar.js)
async function reusar(ruta) {
  const pasaje = obtener(ruta);
  avisosPasaje.set(pasaje, "Buscando en tus estudios…");
  dibujar();
  try {
    avisosPasaje.set(pasaje, mensajeReuso(await reusarVersiculos(ruta)));
  } catch (err) {
    avisosPasaje.set(pasaje, "No se pudieron revisar los otros estudios. Prueba de nuevo.");
  }
  marcarCambio();
  dibujar();
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
  if (accion === "poner-referencia") return ponerReferencia(b, ruta);
  if (accion === "reusar") return reusar(ruta);
  if (accion === "traer-griego") return traerGriego(b, ruta);
  if (accion === "abrir-fuentes") { fuentesAbiertas = !fuentesAbiertas; return dibujar(); }
  if (accion === "abrir-fuentes-de") {
    const p = obtener(ruta);
    subpuntosConFuentesAbiertos.has(p) ? subpuntosConFuentesAbiertos.delete(p) : subpuntosConFuentesAbiertos.add(p);
    return dibujar();
  }
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
  if (accion === "agregar-fuente") (obtener(ruta).fuentes ||= []).push(nuevoBloque(valor));
  if (accion === "agregar-versiculo") {
    const vs = obtener(ruta).versiculos;
    const ultimo = parseInt(vs[vs.length - 1]?.numero, 10);
    vs.push({ numero: Number.isFinite(ultimo) ? String(ultimo + 1) : "", texto: "" });
  }
  if (accion === "color") asignar(`${ruta}.color`, valor);
  if (accion === "quitar-imagen") asignar(`${ruta}.imagen`, "");
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
  if (el.dataset.limpiar === "referencia") {
    const fila = el.closest(".fila-referencia");
    fila.querySelector(".abrir-biblia").outerHTML = botonAbrirBiblia(el.value);
  }
});

$("editor").addEventListener("change", e => {
  if (e.target.matches("select[data-campo='idioma'], input[type=checkbox][data-campo], input[data-campo$='.url']")) dibujar();
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
