// Reina-Valera 1960 dentro del recuadro del pasaje, sin guardar el texto en la página: el texto lo entrega en ese
// momento Reftagger de Logos (gratis, con su licencia), versículo por versículo. Reftagger normalmente lo muestra en
// un globo flotante; aquí se le pide a un botón suyo invisible, se toma el texto y se esconde su globo, para
// mostrarlo con el formato de nuestros pasajes y el crédito de Logos (js/mapa.js → abrirRVR).
var refTagger = {
  settings: {
    bibleVersion: "RVR60",
    language: "es",
    socialSharing: [],
    noSearchTagNames: ["body"] // no busca referencias en la página: solo en lo que le pasamos
  }
};
(() => {
  const s = document.createElement("script");
  s.src = "https://api.reftagger.com/v2/RefTagger.js";
  s.async = true;
  document.head.appendChild(s);
})();

const esperar = ms => new Promise(r => setTimeout(r, ms));
const textosRVR = new Map(); // "1TI.3.2" → texto (no se vuelve a pedir en la misma visita)

// El texto de UN versículo en la RVR 1960 (en inglés para Reftagger: "1 Timothy 3:2")
async function versiculoRVR(libro, capitulo, numero) {
  const clave = `${libro.codigo}.${capitulo}.${numero}`;
  if (textosRVR.has(clave)) return textosRVR.get(clave);
  for (let i = 0; i < 40 && !(window.refTagger && typeof refTagger.tag === "function"); i++) await esperar(150);
  if (typeof refTagger.tag !== "function") throw new Error("Logos no cargó");
  const span = document.createElement("span");
  span.className = "rvr-oculto";
  span.textContent = `${libro.en} ${capitulo}:${numero}`;
  document.body.appendChild(span);
  document.documentElement.classList.add("rvr-trayendo"); // su globo no se ve mientras tanto
  try {
    refTagger.tag(span);
    const a = span.querySelector("a");
    if (!a) throw new Error("sin referencia");
    a.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    let cuerpo = null;
    for (let i = 0; i < 50 && !cuerpo; i++) {
      await esperar(150);
      const globo = [...document.querySelectorAll(".rtTooltip")].find(t => getComputedStyle(t).display !== "none"
        && new RegExp(`:${numero}\\b`).test(t.querySelector(".rtTooltipHeader")?.textContent || ""));
      const texto = globo?.querySelector(".rtTooltipBody")?.textContent.replace(/\s+/g, " ").trim();
      if (texto && texto.length > 3) cuerpo = texto;
    }
    a.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    if (!cuerpo) throw new Error("sin texto");
    // Viene "3 1Palabra fiel…" (capítulo y número pegados): se quitan para dejar solo el texto
    const limpio = cuerpo.replace(new RegExp(`^(?:${capitulo}\\s+)?${numero}\\s*`), "").trim();
    textosRVR.set(clave, limpio);
    return limpio;
  } finally {
    span.remove();
    await esperar(200);
    document.documentElement.classList.remove("rvr-trayendo");
  }
}

// Todos los versículos de una referencia, uno detrás de otro; "alLlegar" recibe cada uno apenas llega
async function pasajeRVR(ref, alLlegar) {
  const r = leerReferencia(ref);
  if (!r) throw new Error("referencia");
  for (const n of versiculosDeReferencia(ref)) alLlegar({ numero: String(n), texto: await versiculoRVR(r.libro, r.capitulo, n) });
}
