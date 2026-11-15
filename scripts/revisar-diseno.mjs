// Candado de diseño: ninguna hoja de estilos (salvo css/motor.css) ni ningún JS puede escribir un valor a mano.
// Prohibido fuera del motor: colores (#hex, rgb, hsl), curvas (cubic-bezier) y números con unidad
// (px, pt, mm, em, rem, s, ms), salvo el cero. Los @media y @page sí llevan números: CSS no deja usar variables ahí.
// Se ejecuta antes de armar el sitio (scripts/construir.mjs); si encuentra algo, no se publica.
import fs from "node:fs";
import path from "node:path";

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const hojas = fs.readdirSync(path.join(raiz, "css")).filter(f => f.endsWith(".css") && f !== "motor.css").map(f => path.join("css", f));
const scripts = fs.readdirSync(path.join(raiz, "js")).filter(f => f.endsWith(".js")).map(f => path.join("js", f));

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/g;
const CURVA = /cubic-bezier\(/g;
const UNIDAD = /(?<![\w.#-])-?(?!0+(?:\.0+)?(?:px|pt|mm|em|rem|ms|s)\b)\d*\.?\d+(?:px|pt|mm|em|rem|ms|s)(?![\w-])/g;

const errores = [];
function revisar(archivo, texto, reglas) {
  texto.split("\n").forEach((linea, i) => {
    for (const regla of reglas) for (const m of linea.matchAll(regla)) errores.push(`${archivo}:${i + 1}  «${m[0]}»  →  usa una variable de css/motor.css`);
  });
}

for (const hoja of hojas) {
  const css = fs.readFileSync(path.join(raiz, hoja), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "))       // comentarios fuera (se guardan los saltos de línea)
    .replace(/@(media|page|supports)[^{]*/g, m => m.replace(/[^\n]/g, " "));
  revisar(hoja, css, [COLOR, CURVA, UNIDAD]);
}
for (const js of scripts) {
  const codigo = fs.readFileSync(path.join(raiz, js), "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "));
  revisar(js, codigo, [/["'`]#[0-9a-fA-F]{3,8}["'`]/g, /\b(?:rgb|rgba|hsl|hsla)\(\s*\d/g, CURVA]);
}

if (errores.length) {
  console.error(`Candado de diseño: ${errores.length} valor(es) escritos a mano:\n` + errores.join("\n"));
  process.exit(1);
}
console.log("Candado de diseño: todo sale de css/motor.css ✓");
