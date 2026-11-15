// Versión para imprimir de un estudio (pdf.html?e=<slug>&tema=claro|oscuro): el mapa en la primera página
// y cada tema en su propia página. scripts/pdfs.sh la convierte en dos PDF: oscuro y claro.
// Los colores son los de la página (css/colores.css): claro = fondo gris suave, oscuro = azul muy oscuro.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get("tema") === "claro" ? "light" : "dark";
(async () => {
  const slug = new URLSearchParams(location.search).get("e") || "";
  const e = await cargarEstudio(slug);
  const T = TEXTOS[e.idioma] || TEXTOS.es;
  document.title = e.titulo;
  document.documentElement.lang = e.idioma === "pt" ? "pt-BR" : "es";
  const temas = e.temas || [];

  let out = `<div class="portada"><h1>${esc(e.titulo)}</h1>
<ul class="q">${(e.preguntas || []).map(q => `<li>${esc(q)}</li>`).join("")}</ul>
<div class="yb">${esc(e.cierre)}</div></div><div class="ov">`;
  temas.forEach((t, bi) => {
    out += `<div class="ob" style="--c:var(${colorDe(t)})"><div class="oh"><span class="num">${bi + 1}</span>${esc(t.titulo)}</div>
<div class="ol">${(t.puntos || []).map((p, li) => `<span><b>${bi + 1}.${li + 1}</b>${esc(p.titulo)}</span>`).join("")}</div></div>`;
  });
  out += "</div>" + avisosDerechos(e);
  temas.forEach((t, bi) => {
    out += `<section class="sec" style="--c:var(${colorDe(t)})"><div class="sh"><span class="num">${bi + 1}</span><div class="t"><small>${esc(t.subtitulo)}</small>${esc(t.titulo)}</div></div>`;
    (t.puntos || []).forEach((p, li) => {
      out += `<div class="pt"><div class="pl"><span class="n">${bi + 1}.${li + 1}</span>${esc(p.titulo)}${p.nuevo ? `<span class="new">${T.nuevo}</span>` : ""}</div>${puntoHTML(p, true)}</div>`;
    });
    out += "</section>";
  });
  out += paginaFuentesHTML(e);
  document.getElementById("app").innerHTML = out;
  document.body.dataset.listo = "1";
})();
