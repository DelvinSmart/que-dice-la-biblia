// Reina-Valera 1960 dentro del recuadro del pasaje, sin guardar el texto en la página. El texto lo entrega en ese
// momento el servicio de Reftagger de Logos (gratis, con su licencia): el mismo que usa su globo de versículos, pero
// pidiendo cada versículo directamente y todos a la vez, para que no haya espera (antes, con el globo, eran ~0,5 s
// por versículo). Se muestra con el formato de nuestros pasajes y el crédito de Logos (js/mapa.js → abrirRVR).
const SERVICIO_RVR = "https://reftagger.bibliacdn.com/bible/rvr60/";
const ESPERA_MAXIMA_RVR = 8000;
const textosRVR = new Map(); // "1TI.3.2" → promesa del texto (cada versículo se pide una sola vez por visita)
let pedidoRVR = 0;

// El nombre del libro como lo entiende Logos: el inglés sin espacios ("1 Timothy" → "1Timothy"); Cantares es "Song"
const libroLogos = libro => (libro.codigo === "SNG" ? "Song" : libro.en.replace(/ /g, ""));

// Logos responde con JSONP: un <script> que llama a una función nuestra con los datos
function pedirLogos(url) {
  return new Promise((ok, falla) => {
    const nombre = `qdlbRVR${++pedidoRVR}`;
    const script = document.createElement("script");
    const limpiar = () => { clearTimeout(reloj); delete window[nombre]; script.remove(); };
    const reloj = setTimeout(() => { limpiar(); falla(new Error("Logos no respondió")); }, ESPERA_MAXIMA_RVR);
    window[nombre] = datos => { limpiar(); ok(datos); };
    script.onerror = () => { limpiar(); falla(new Error("Logos no respondió")); };
    script.src = `${url}&callback=${nombre}`;
    document.head.appendChild(script);
  });
}

// El texto de UN versículo. Logos manda "3 1Palabra fiel…" (capítulo y número pegados): se dejan solo las palabras
function versiculoRVR(libro, capitulo, numero) {
  const clave = `${libro.codigo}.${capitulo}.${numero}`;
  if (!textosRVR.has(clave)) {
    const pedido = pedirLogos(`${SERVICIO_RVR}${libroLogos(libro)}${capitulo}.${numero}?target=reftagger&noInlineStyle=true`)
      .then(datos => {
        const texto = new DOMParser().parseFromString(datos.content || "", "text/html").body.textContent.replace(/\s+/g, " ").trim();
        const limpio = texto.replace(new RegExp(`^(?:${capitulo}\\s+)?${numero}\\s*`), "").trim();
        if (!limpio) throw new Error("sin texto");
        return limpio;
      });
    pedido.catch(() => textosRVR.delete(clave)); // si falla, se puede volver a pedir
    textosRVR.set(clave, pedido);
  }
  return textosRVR.get(clave);
}

// Todos los versículos de una referencia: se piden juntos y se entregan en orden apenas llegan
async function pasajeRVR(ref, alLlegar) {
  const r = leerReferencia(ref);
  if (!r) throw new Error("referencia");
  const numeros = versiculosDeReferencia(ref);
  const pedidos = numeros.map(n => versiculoRVR(r.libro, r.capitulo, n));
  for (const [i, n] of numeros.entries()) alLlegar({ numero: String(n), texto: await pedidos[i] });
}

// Al abrir un subpunto se adelantan sus pasajes, para que al tocar "RVR 1960" (o "LBLA") ya estén listos
function adelantarRVR(referencias) {
  for (const ref of referencias) {
    const r = leerReferencia(ref);
    if (r) versiculosDeReferencia(ref).forEach(n => versiculoRVR(r.libro, r.capitulo, n).catch(() => {}));
  }
}
