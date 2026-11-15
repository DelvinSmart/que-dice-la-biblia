// Conexión del panel con GitHub: lee, guarda y borra los archivos de estudios/ usando la llave (token)
// del autor. La llave se guarda solo en este aparato (localStorage). Sin llave válida, GitHub rechaza todo.
const REPO = "DelvinSmart/que-dice-la-biblia";
const RAMA = "main";
const CLAVE_LLAVE = "estudios-biblicos-llave";

const Github = {
  llave() {
    try { return localStorage.getItem(CLAVE_LLAVE) || ""; } catch (e) { return ""; }
  },
  guardarLlave(llave) {
    try { localStorage.setItem(CLAVE_LLAVE, llave.trim()); } catch (e) {}
  },
  borrarLlave() {
    try { localStorage.removeItem(CLAVE_LLAVE); } catch (e) {}
  },

  async pedir(ruta, opciones = {}) {
    const r = await fetch(`https://api.github.com/repos/${REPO}/${ruta}`, {
      ...opciones,
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.llave()}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opciones.body ? { "Content-Type": "application/json" } : {})
      }
    });
    if (!r.ok) {
      const error = new Error(`GitHub respondió ${r.status}`);
      error.status = r.status;
      throw error;
    }
    return r.status === 204 ? null : r.json();
  },

  // Nombres de archivo (sin .json) de todos los estudios
  async listar() {
    const archivos = await this.pedir(`contents/estudios?ref=${RAMA}`);
    return archivos.filter(a => a.type === "file" && a.name.endsWith(".json")).map(a => a.name.replace(/\.json$/, ""));
  },

  async leer(slug) {
    const d = await this.pedir(`contents/estudios/${encodeURIComponent(slug)}.json?ref=${RAMA}`);
    return { sha: d.sha, datos: JSON.parse(desdeBase64(d.content)) };
  },

  // Crea o reemplaza el estudio. Devuelve el sha nuevo (sirve para el próximo guardado).
  async guardar(slug, datos, sha, mensaje) {
    const r = await this.pedir(`contents/estudios/${encodeURIComponent(slug)}.json`, {
      method: "PUT",
      body: JSON.stringify({ message: mensaje, content: aBase64(JSON.stringify(datos, null, 2) + "\n"), branch: RAMA, ...(sha ? { sha } : {}) })
    });
    return r.content.sha;
  },

  // Sube una imagen (contenido ya en base64) a la ruta indicada, por ejemplo imagenes/estudio-123.jpg
  subirArchivo(ruta, base64, mensaje) {
    return this.pedir(`contents/${ruta.split("/").map(encodeURIComponent).join("/")}`, {
      method: "PUT",
      body: JSON.stringify({ message: mensaje, content: base64, branch: RAMA })
    });
  },

  borrar(slug, sha) {
    return this.pedir(`contents/estudios/${encodeURIComponent(slug)}.json`, {
      method: "DELETE",
      body: JSON.stringify({ message: `Eliminar estudio ${slug}`, sha, branch: RAMA })
    });
  }
};

// GitHub manda y recibe el contenido en base64; estas dos funciones respetan los acentos (UTF-8)
function aBase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  bytes.forEach(b => { binario += String.fromCharCode(b); });
  return btoa(binario);
}
function desdeBase64(b64) {
  const binario = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binario, c => c.charCodeAt(0)));
}
