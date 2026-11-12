// Arma el sitio en _site/: copia las páginas y los estudios, y crea estudios/indice.json
// con la lista de todos los estudios (la usa la página de inicio).
import fs from "node:fs";
import path from "node:path";

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const salida = path.join(raiz, "_site");
const copiar = ["index.html", "estudio.html", "panel.html", "pdf.html", "css", "js", "estudios"];

fs.rmSync(salida, { recursive: true, force: true });
fs.mkdirSync(salida);
copiar.forEach(f => fs.cpSync(path.join(raiz, f), path.join(salida, f), { recursive: true }));

const carpeta = path.join(raiz, "estudios");
const indice = fs.readdirSync(carpeta)
  .filter(f => f.endsWith(".json") && f !== "indice.json")
  .map(f => {
    const e = JSON.parse(fs.readFileSync(path.join(carpeta, f), "utf8"));
    const temas = e.temas || [];
    return {
      slug: f.replace(/\.json$/, ""),
      titulo: e.titulo,
      idioma: e.idioma || "es",
      otro_idioma: e.otro_idioma || "",
      descripcion: e.descripcion || "",
      color: temas[0]?.color || "azul",
      temas: temas.length,
      puntos: temas.reduce((n, t) => n + (t.puntos || []).length, 0)
    };
  })
  .sort((a, b) => a.idioma.localeCompare(b.idioma) || a.titulo.localeCompare(b.titulo, "es"));

fs.writeFileSync(path.join(salida, "estudios", "indice.json"), JSON.stringify(indice, null, 2) + "\n");
console.log(`Sitio listo en _site/ con ${indice.length} estudios`);
