// Panel · medidor de citas bíblicas. Lockman permite citar la LBLA hasta 500 versículos por obra,
// siempre que los versículos no pasen del 25% del texto (https://www.lockman.org/espanol/permiso-para-citar/).
// Se mide todo el estudio: los versículos contra todo lo que escribe el autor (títulos, preguntas, textos, fuentes…).
// Si se pasa, Publicar no publica y dice cuánto texto propio falta.

const LIMITE_VERSICULOS = 500;
const LIMITE_PORCENTAJE = 25;

const palabras = html => (String(html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").match(/[\p{L}\p{N}]+/gu) || []).length;

// Cuántos versículos tiene un pasaje: por su referencia; si no se entiende, por los recuadros ("22-23" cuenta 2)
function versiculosDe(b) {
  const r = leerReferencia(b.referencia);
  if (r) return contarTramos(r.tramos);
  return (b.versiculos || []).filter(v => v.texto).reduce((n, v) => {
    const [a, z] = String(v.numero).split(/[-–]/).map(x => parseInt(x, 10));
    return n + (Number.isFinite(z) && z >= a ? z - a + 1 : 1);
  }, 0);
}

function medir(e) {
  let versiculos = 0, sinTexto = 0, deBiblia = 0;
  let propias = palabras(e.titulo) + palabras(e.descripcion) + palabras(e.cierre)
    + (e.preguntas || []).reduce((n, q) => n + palabras(q), 0);
  for (const t of e.temas || []) {
    propias += palabras(t.titulo) + palabras(t.subtitulo);
    for (const p of t.puntos || []) {
      propias += palabras(p.titulo);
      for (const b of p.bloques || []) {
        if (b.tipo === "pasaje") {
          const n = versiculosDe(b);
          versiculos += n;
          const conTexto = (b.versiculos || []).filter(v => v.texto);
          if (!conTexto.length && !b.imagen) sinTexto += n;
          deBiblia += conTexto.reduce((s, v) => s + palabras(v.texto), 0);
        } else {
          propias += palabras(b.texto) + palabras(b.pie) + palabras(b.titulo);
        }
      }
    }
  }
  const total = propias + deBiblia;
  // Con un decimal: 25,4% ya se pasa, aunque redondeado parezca 25%
  const porcentaje = total ? Math.round((deBiblia / total) * 1000) / 10 : 0;
  // Para que la Biblia sea como máximo el 25%, lo propio tiene que ser al menos 3 veces lo bíblico
  const faltan = Math.max(0, Math.ceil(deBiblia * (100 - LIMITE_PORCENTAJE) / LIMITE_PORCENTAJE) - propias);
  return { versiculos, sinTexto, porcentaje, faltan };
}

const nivel = (valor, limite) => (valor > limite ? "rojo" : valor > limite * 0.8 ? "amarillo" : "verde");

// El medidor completo va en un recuadro arriba de la vista previa (computadora) y, al tocar el resumen
// pequeño de la barra ("86/500 · 23,4%"), se abre debajo de la barra (teléfono y iPad).
function actualizarMedidor() {
  if (!estudio || !$("medidor")) return;
  const m = medir(estudio);
  const pct = String(m.porcentaje).replace(".", ",");
  const peor = m.faltan || m.versiculos > LIMITE_VERSICULOS ? "rojo"
    : [nivel(m.versiculos, LIMITE_VERSICULOS), nivel(m.porcentaje, LIMITE_PORCENTAJE)].includes("amarillo") ? "amarillo" : "verde";
  const mini = $("medidorMini");
  mini.className = `medidor-mini ${peor}`;
  mini.innerHTML = `<i></i>${m.versiculos}/${LIMITE_VERSICULOS} · ${pct}%${m.faltan ? " ⚠" : ""}`;
  mini.title = `Versículos ${m.versiculos} de ${LIMITE_VERSICULOS} · texto bíblico ${pct}% del estudio (máx. ${LIMITE_PORCENTAJE}%)`;
  $("medidor").innerHTML = $("medidorPop").innerHTML = detalleMedidor(m);
}

function detalleMedidor(m) {
  const pendientes = m.sinTexto ? ` · ${m.sinTexto} sin texto todavía` : "";
  return `
    <div class="medida ${nivel(m.versiculos, LIMITE_VERSICULOS)}">
      <span>Versículos <b>${m.versiculos}</b> de ${LIMITE_VERSICULOS}${pendientes}</span>
      <span class="barrita"><i style="width:${Math.min(100, (m.versiculos / LIMITE_VERSICULOS) * 100)}%"></i></span>
    </div>
    <div class="medida ${m.faltan ? "rojo" : nivel(m.porcentaje, LIMITE_PORCENTAJE)}">
      <span>Texto bíblico <b>${String(m.porcentaje).replace(".", ",")}%</b> del estudio (máx. ${LIMITE_PORCENTAJE}%)</span>
      <span class="barrita"><i style="width:${Math.min(100, (m.porcentaje / LIMITE_PORCENTAJE) * 100)}%"></i></span>
    </div>
    ${m.faltan ? `<p class="medida-aviso">Te faltan unas <b>${m.faltan} palabras</b> de explicación para poder usar estos versículos.</p>` : ""}`;
}

// Antes de publicar: si se pasa de los límites, no publica y explica qué falta
function motivoParaNoPublicar() {
  const m = medir(estudio);
  if (m.versiculos > LIMITE_VERSICULOS)
    return `No se publicó: el estudio tiene ${m.versiculos} versículos y el máximo es ${LIMITE_VERSICULOS}. Quita ${m.versiculos - LIMITE_VERSICULOS}.`;
  if (m.faltan)
    return `No se publicó: los versículos son el ${String(m.porcentaje).replace(".", ",")}% del estudio (máx. ${LIMITE_PORCENTAJE}%). Escribe unas ${m.faltan} palabras más de explicación, o quita versículos.`;
  return "";
}

$("medidorMini").addEventListener("click", () => {
  const pop = $("medidorPop");
  pop.hidden = !pop.hidden;
  $("medidorMini").setAttribute("aria-expanded", String(!pop.hidden));
});
// Se cierra al tocar fuera
document.addEventListener("click", e => {
  const pop = $("medidorPop");
  if (!pop.hidden && !e.target.closest("#medidorPop, #medidorMini")) {
    pop.hidden = true;
    $("medidorMini").setAttribute("aria-expanded", "false");
  }
});
