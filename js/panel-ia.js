// Panel · "Pegar estudio de la IA": el autor pega el JSON que le dio una IA (Gemini, ChatGPT, Claude) siguiendo
// ia/instrucciones.md. El panel lo revisa con las reglas del autor antes de abrirlo en el editor:
// - la IA nunca escribe versículos: si trae texto, se borra; los que ya están copiados en algún estudio se ponen solos;
// - nunca se quita Biblia: si reemplaza un estudio y falta un versículo que ya estaba, no deja seguir;
// - el griego sale solo del SBLGNT; las fuentes van en su lista; todo dato de idioma o fecha debe tener fuente.
// Nada se publica aquí: se abre en el editor y el autor revisa, pega lo que falte y publica.

const TIPOS_BLOQUE_IA = ["texto", "pasaje", "subtitulo"];
const ETIQUETAS_IA = new Set(["DIV", "P", "B", "STRONG", "I", "EM", "UL", "OL", "LI", "BR", "SPAN"]);
let revisionIA = null; // { estudio, destino, sha, errores, avisos, buenas }

// Quita todo lo que no sea el formato de los estudios (párrafos, negrita, cursiva, listas y <span class="g|sc">)
function limpiarTextoIA(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
  const caja = doc.body.firstChild;
  let cambiado = false;
  const recorrer = nodo => {
    for (const hijo of [...nodo.children]) {
      recorrer(hijo);
      if (!ETIQUETAS_IA.has(hijo.tagName)) { hijo.replaceWith(...hijo.childNodes); cambiado = true; continue; }
      for (const a of [...hijo.attributes]) {
        if (hijo.tagName === "SPAN" && a.name === "class" && /^(g|sc)$/.test(a.value)) continue;
        hijo.removeAttribute(a.name); cambiado = true;
      }
    }
  };
  ["script", "style", "iframe", "object"].forEach(t => caja.querySelectorAll(t).forEach(n => { n.remove(); cambiado = true; }));
  recorrer(caja);
  return { html: limpiarHTML(caja.innerHTML), cambiado };
}

// La IA a veces pone el JSON dentro de ```json … ``` o con texto antes y después: se toma del primer { al último }
function leerJSONdeIA(texto) {
  const t = String(texto || "").replace(/^﻿/, "");
  const a = t.indexOf("{"), z = t.lastIndexOf("}");
  if (a < 0 || z <= a) throw new Error("No encontré un estudio en lo que pegaste. Copia el bloque de código completo que te dio la IA.");
  try { return JSON.parse(t.slice(a, z + 1)); }
  catch (e) { throw new Error("El JSON está roto (le falta o le sobra algo). Pídele a la IA: “dame el JSON completo y válido otra vez”."); }
}

// Los versículos de un estudio como llaves "GEN.2.18.LBLA", con dónde están ("2.2 Génesis 2:18 LBLA")
function versiculosDelEstudio(e) {
  const mapa = new Map();
  (e.temas || []).forEach((t, i) => (t.puntos || []).forEach((p, j) => (p.bloques || []).forEach(b => {
    const r = b.tipo === "pasaje" && leerReferencia(b.referencia);
    if (r) versiculosDeReferencia(b.referencia).forEach(n => {
      const llave = llaveVerso(r, n, e.idioma);
      if (!mapa.has(llave)) mapa.set(llave, `${i + 1}.${j + 1} ${b.referencia}`);
    });
  })));
  return mapa;
}

const DATO_CON_FUENTE = /<span class="g">|\b(1[0-9]{3}|20[0-9]{2})\b|\bsiglo\b|\bséculo\b/i;

async function revisarEstudioIA(texto, destino) {
  const errores = [], avisos = [], buenas = [];
  const e = leerJSONdeIA(texto);
  if (!e || typeof e !== "object" || Array.isArray(e)) throw new Error("Lo que pegaste no es un estudio.");
  if (!String(e.titulo || "").trim()) errores.push("El estudio no tiene título.");
  if (!Array.isArray(e.temas) || !e.temas.length) throw new Error("El estudio no tiene puntos (“temas”). Pídele a la IA el JSON con el formato de las instrucciones.");
  if (!["es", "pt"].includes(e.idioma)) { avisos.push(`El idioma “${e.idioma || ""}” no existe: se puso español.`); e.idioma = "es"; }
  e.otro_idioma ||= ""; e.descripcion ||= ""; e.cierre ||= "";
  e.preguntas = Array.isArray(e.preguntas) ? e.preguntas.map(String) : [];

  // El estudio que se reemplaza (para no perder versículos ni sus textos ya pegados)
  let anterior = null, version = null;
  if (destino) ({ sha: version, datos: anterior } = await Github.leer(destino));
  const banco = guardadosEn([...(anterior ? [anterior] : []), ...(await cargarPublicados())]);

  let llenos = 0, porPegar = 0, borrados = [], etiquetas = 0;
  const griegos = [];
  e.temas.forEach((t, i) => {
    const n1 = i + 1;
    if (!String(t.titulo || "").trim()) errores.push(`El punto ${n1} no tiene título.`);
    t.subtitulo ||= "";
    if (!COLORES[t.color]) { avisos.push(`${n1}: el color “${t.color || ""}” no existe, se puso morado.`); t.color = "morado"; }
    if (!Array.isArray(t.puntos) || !t.puntos.length) { errores.push(`El punto ${n1} no tiene subpuntos.`); t.puntos = []; }
    t.puntos.forEach((p, j) => {
      const n = `${n1}.${j + 1}`;
      if (!String(p.titulo || "").trim()) errores.push(`El subpunto ${n} no tiene título.`);
      p.nuevo = !!p.nuevo;
      p.fuentes = Array.isArray(p.fuentes) ? p.fuentes : [];
      const bloques = [];
      for (const b of Array.isArray(p.bloques) ? p.bloques : []) {
        if (b && (b.tipo === "fuente" || b.tipo === "griego")) { p.fuentes.push(b); avisos.push(`${n}: había una fuente dentro del texto; se pasó a las fuentes del subpunto.`); continue; }
        if (!b || !TIPOS_BLOQUE_IA.includes(b.tipo)) { errores.push(`${n}: hay un bloque de tipo “${b && b.tipo}”, que no existe.`); continue; }
        if (b.tipo === "texto") {
          const limpio = limpiarTextoIA(b.texto);
          if (limpio.cambiado) etiquetas++;
          b.texto = limpio.html;
        }
        if (b.tipo === "subtitulo") b.texto = String(b.texto || "").replace(/<[^>]*>/g, "").trim();
        if (b.tipo === "pasaje") {
          b.referencia = limpiarReferencia(String(b.referencia || "")).trim();
          let r = leerReferencia(b.referencia);
          if (!r) { errores.push(`${n}: no se entiende la referencia “${b.referencia}”.`); continue; }
          if (!r.version) { b.referencia += ` ${VERSION_POR_IDIOMA[e.idioma]}`; r = leerReferencia(b.referencia); avisos.push(`${n}: “${b.referencia}” no tenía versión; se le puso ${r.version}.`); }
          // Si trae un texto que no es el que el autor ya pegó en sus estudios, lo escribió la IA
          const r0 = r;
          if ((b.versiculos || []).some(v => v && v.texto && limpiarVerso(String(v.texto)) !== limpiarVerso(banco.get(llaveVerso(r0, String(v.numero || "").trim(), e.idioma)) || "")))
            borrados.push(`${n} ${b.referencia}`);
          // Cada versículo: el que ya está copiado en tus estudios, o vacío para que lo pegues
          b.versiculos = versiculosDeReferencia(b.referencia).map(v => {
            const texto = banco.get(llaveVerso(r, v, e.idioma)) || "";
            texto ? llenos++ : porPegar++;
            return { numero: String(v), texto };
          });
          delete b.imagen;
        }
        bloques.push(b);
      }
      p.bloques = bloques;
      // Fuentes: con nombre y link; el griego se llena del SBLGNT
      p.fuentes = p.fuentes.filter(f => {
        if (f && f.tipo === "griego") { griegos.push({ f, n }); return true; }
        if (!f || f.tipo !== "fuente") { avisos.push(`${n}: se quitó una fuente de tipo “${f && f.tipo}”, que no existe.`); return false; }
        f.titulo = String(f.titulo || "").trim(); f.texto = String(f.texto || "").trim(); f.url = String(f.url || "").trim();
        if (!f.url) avisos.push(`${n}: la fuente “${f.titulo}” no tiene link.`);
        else if (!/^https:\/\//.test(f.url)) avisos.push(`${n}: el link de “${f.titulo}” no empieza con https://. Revísalo.`);
        return true;
      });
      const textos = p.bloques.filter(b => b.tipo === "texto").map(b => b.texto).join(" ");
      if (DATO_CON_FUENTE.test(textos) && !p.fuentes.some(f => f.tipo === "fuente"))
        avisos.push(`${n}: habla de hebreo, griego o fechas y no tiene ninguna fuente.`);
    });
  });

  // El griego, solo de los archivos del SBLGNT (nunca lo que escribió la IA)
  for (const { f, n } of griegos) {
    const r = leerReferencia(f.referencia);
    if (!r || !esNuevoTestamento(r.libro)) { avisos.push(`${n}: el griego de “${f.referencia || ""}” no se pudo traer (solo hay Nuevo Testamento).`); f.versiculos = []; continue; }
    try {
      const capitulo = (await cargarJSON(`griego/sblgnt/${r.libro.codigo}.json`))[r.capitulo] || {};
      f.versiculos = versiculosDeReferencia(f.referencia).map(v => ({ numero: String(v), texto: capitulo[v] || "" }));
    } catch (err) { avisos.push(`${n}: no se pudo traer el griego de ${f.referencia}.`); }
  }

  if (borrados.length) avisos.push(`La IA escribió el texto de ${borrados.length} pasaje${borrados.length > 1 ? "s" : ""} (${borrados.join(" · ")}). Se borró: la IA nunca escribe versículos. Los que ya tenías copiados se pusieron solos; los demás los pegas tú.`);
  if (etiquetas) avisos.push(`Se limpiaron etiquetas que no son del formato del estudio en ${etiquetas} texto${etiquetas > 1 ? "s" : ""}.`);

  // Al reemplazar: nunca se quita Biblia, y el mapa aprobado no cambia sin que lo veas
  if (anterior) {
    const antes = versiculosDelEstudio(anterior), ahora = versiculosDelEstudio(e);
    const quitados = [...antes].filter(([llave]) => !ahora.has(llave)).map(([, donde]) => donde);
    if (quitados.length) errores.push(`La IA quitó versículos que ya estaban en el estudio: ${[...new Set(quitados)].join(" · ")}. La Biblia no se quita: pídele que los devuelva.`);
    const mapa = x => (x.temas || []).flatMap((t, i) => (t.puntos || []).map((p, j) => `${i + 1}.${j + 1} ${p.titulo}`));
    const ma = mapa(anterior), mn = mapa(e);
    const nuevos = mn.filter(x => !ma.includes(x)), fuera = ma.filter(x => !mn.includes(x));
    if (nuevos.length || fuera.length)
      avisos.push(`El mapa cambió.${fuera.length ? ` Antes: ${fuera.join(" · ")}.` : ""}${nuevos.length ? ` Ahora: ${nuevos.join(" · ")}.` : ""} Revisa que lo hayas pedido tú.`);
  }

  const m = medir(e);
  if (m.versiculos > LIMITE_VERSICULOS) errores.push(`Tiene ${m.versiculos} versículos de la LBLA y Lockman permite ${LIMITE_VERSICULOS}.`);
  if (m.faltan) avisos.push(`La LBLA sería el ${String(m.porcentaje).replace(".", ",")}% del estudio (máx. ${LIMITE_PORCENTAJE}%) cuando estén todos los versículos. Faltan unas ${m.faltan} palabras de explicación: pídeselas a la IA, sin inventar y sin quitar Biblia.`);
  if (m.otras) avisos.push(`Versículos de otras versiones: ${m.otras}. Sus reglas de derechos todavía no están revisadas.`);
  buenas.push(`Puntos: ${e.temas.length} · subpuntos: ${e.temas.reduce((s, t) => s + t.puntos.length, 0)}.`);
  if (llenos) buenas.push(`Versículos que ya estaban copiados en tus estudios y se pusieron solos: ${llenos}.`);
  if (porPegar) buenas.push(`Versículos por pegar (“Leer capturas” o pegar desde la app): ${porPegar}.`);
  return { estudio: e, destino, sha: version, errores, avisos, buenas };
}

// ---------- La ventana en la lista de estudios ----------

function dibujarIA() {
  const caja = $("cajaIA");
  const opciones = slugsExistentes.map(s => `<option value="${esc(s)}">Reemplaza: ${esc(s)}</option>`).join("");
  const r = revisionIA;
  const lista = (clase, cosas) => cosas.map(t => `<li class="${clase}">${esc(t)}</li>`).join("");
  caja.innerHTML = `
    <section class="bloque-ed ia-ed">
      <div class="capturas-cab">
        <h2>Pegar estudio de la IA</h2>
        <button class="btn" type="button" data-ia="cerrar">Cerrar</button>
      </div>
      <p class="ayuda-fuente">Pega aquí el bloque de código que te dio la IA (Gemini, ChatGPT…). El panel lo revisa con tus reglas antes de abrirlo. No se publica nada hasta que tú toques Publicar.</p>
      <select id="destinoIA" aria-label="Qué estudio es"><option value="">Estudio nuevo</option>${opciones}</select>
      <textarea id="textoIA" rows="8" placeholder="{ &quot;titulo&quot;: … }"></textarea>
      <div class="barra-acciones">
        <button class="btn principal" type="button" data-ia="revisar">Revisar</button>
        ${r && !r.errores.length ? `<button class="btn principal" type="button" data-ia="abrir">Abrir en el editor</button>` : ""}
      </div>
      <p class="ayuda-pegar" id="avisoIA" role="status"></p>
      ${r ? `<ul class="lista-capturas">${lista("falta error", r.errores)}${lista("parcial", r.avisos)}${lista("listo", r.buenas)}</ul>` : ""}
      <p class="ayuda-fuente">Reglas para la IA: <a href="ia/instrucciones.md" download="instrucciones.md">descargar instrucciones.md</a> (súbelo a tu Gem o proyecto) ·
        <button class="mini-link" type="button" data-ia="copiar">copiar las instrucciones</button> ·
        <a href="https://github.com/DelvinSmart/que-dice-la-biblia/blob/main/ia/COMO-HACER-UN-ESTUDIO-CON-UNA-IA.md" target="_blank" rel="noopener">guía paso a paso</a></p>
    </section>`;
  if (r) { $("destinoIA").value = r.destino || ""; $("textoIA").value = r.texto || ""; }
}

$("btnIA").addEventListener("click", () => {
  const caja = $("cajaIA");
  caja.hidden = !caja.hidden;
  if (!caja.hidden) { dibujarIA(); $("textoIA").focus(); }
});

$("cajaIA").addEventListener("click", async e => {
  const accion = e.target.closest("[data-ia]")?.dataset.ia;
  if (accion === "cerrar") { $("cajaIA").hidden = true; revisionIA = null; }
  if (accion === "copiar") {
    try {
      await navigator.clipboard.writeText(await (await fetch("ia/instrucciones.md", { cache: "no-store" })).text());
      aviso("avisoIA", "✓ Instrucciones copiadas. Pégalas en las instrucciones de tu Gem o de tu proyecto.");
    } catch (err) { aviso("avisoIA", "No se pudieron copiar. Usa “descargar instrucciones.md”."); }
  }
  if (accion === "revisar") {
    const texto = $("textoIA").value, destino = $("destinoIA").value;
    if (!texto.trim()) return aviso("avisoIA", "Primero pega el estudio que te dio la IA.");
    aviso("avisoIA", "Revisando…");
    try {
      revisionIA = { ...(await revisarEstudioIA(texto, destino)), texto };
      dibujarIA();
      aviso("avisoIA", revisionIA.errores.length ? "Hay cosas en rojo que se tienen que arreglar antes de abrirlo." : "Revisado. Lee los avisos y ábrelo en el editor.");
    } catch (err) {
      revisionIA = null;
      aviso("avisoIA", err.status ? mensajeError(err) : err.message);
    }
  }
  if (accion === "abrir" && revisionIA && !revisionIA.errores.length) {
    const { estudio: datos, destino, sha: version } = revisionIA;
    revisionIA = null;
    $("cajaIA").hidden = true;
    abrirEditor(destino, version, datos);
    marcarCambio(); // queda como "Cambios sin publicar" y guardado como borrador en este aparato
    $("borrador").hidden = true;
  }
});

$("btnCopiarReglas").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(await (await fetch("ia/instrucciones.md", { cache: "no-store" })).text());
    aviso("avisoReglas", "✓ Instrucciones copiadas. Pégalas en Gemini o ChatGPT y escribe el tema.");
  } catch (err) { aviso("avisoReglas", "No se pudieron copiar. Usa “Descargar instrucciones.md”."); }
});
