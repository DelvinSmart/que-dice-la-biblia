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
      for (const f of p.fuentes || []) propias += palabras(f.titulo) + palabras(f.texto);
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

// En la barra solo va el resumen ("86/500 · 23,4%"). El detalle sale en un recuadro al tocar el resumen
// (o al Publicar si se pasa del límite), con efecto de entrada, y se esconde solo: al tocar fuera,
// al escribir, al bajar la página o a los 8 segundos (no se esconde mientras el mouse está encima).
const SEGUNDOS_MEDIDOR = 8;
let relojMedidor = null;

function actualizarMedidor() {
  if (!estudio || !$("medidorMini")) return;
  const m = medir(estudio);
  const pct = String(m.porcentaje).replace(".", ",");
  const peor = m.faltan || m.versiculos > LIMITE_VERSICULOS ? "rojo"
    : [nivel(m.versiculos, LIMITE_VERSICULOS), nivel(m.porcentaje, LIMITE_PORCENTAJE)].includes("amarillo") ? "amarillo" : "verde";
  const mini = $("medidorMini");
  mini.className = `medidor-mini ${peor}`;
  mini.innerHTML = `<i></i>${m.versiculos}/${LIMITE_VERSICULOS} · ${pct}%${m.faltan ? " ⚠" : ""}`;
  mini.title = `Versículos ${m.versiculos} de ${LIMITE_VERSICULOS} · texto bíblico ${pct}% del estudio (máx. ${LIMITE_PORCENTAJE}%)`;
  $("medidorPop").innerHTML = detalleMedidor(m);
}

const medidorAbierto = () => $("medidorPop").classList.contains("abierto");

function mostrarMedidor() {
  $("medidorPop").classList.add("abierto");
  $("medidorMini").setAttribute("aria-expanded", "true");
  esconderMedidorLuego();
}

function esconderMedidor() {
  clearTimeout(relojMedidor);
  $("medidorPop").classList.remove("abierto");
  $("medidorMini").setAttribute("aria-expanded", "false");
}

function esconderMedidorLuego() {
  clearTimeout(relojMedidor);
  relojMedidor = setTimeout(() => ($("medidorPop").matches(":hover") ? esconderMedidorLuego() : esconderMedidor()), SEGUNDOS_MEDIDOR * 1000);
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

$("medidorMini").addEventListener("click", () => (medidorAbierto() ? esconderMedidor() : mostrarMedidor()));

// Se esconde al tocar fuera, al escribir o al bajar la página
document.addEventListener("click", e => {
  if (medidorAbierto() && !e.target.closest("#medidorPop, #medidorMini, #btnPublicar")) esconderMedidor();
});
document.addEventListener("input", () => { if (medidorAbierto()) esconderMedidor(); });
window.addEventListener("scroll", () => { if (medidorAbierto()) esconderMedidor(); }, { passive: true });
