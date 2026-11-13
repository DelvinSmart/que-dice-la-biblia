// Panel · pantalla de la llave, lista de estudios y apertura del editor.

// ---------- Llave ----------

$("formLlave").addEventListener("submit", async e => {
  e.preventDefault();
  const llave = $("campoLlave").value.trim();
  if (!llave) return aviso("avisoLlave", "Pega tu llave primero.");
  Github.guardarLlave(llave);
  aviso("avisoLlave", "Comprobando…");
  try {
    await Github.listar();
    $("campoLlave").value = "";
    aviso("avisoLlave", "");
    abrirLista();
  } catch (err) {
    Github.borrarLlave();
    aviso("avisoLlave", mensajeError(err));
  }
});

$("btnSalir").addEventListener("click", () => {
  Github.borrarLlave();
  mostrar("pLlave");
});

// ---------- Lista de estudios ----------

async function abrirLista() {
  mostrar("pLista");
  aviso("avisoLista", "");
  $("listaEstudios").textContent = "Cargando…";
  try {
    slugsExistentes = await Github.listar();
    const estudios = await Promise.all(slugsExistentes.map(async s => ({ slug: s, ...(await Github.leer(s)).datos })));
    $("listaEstudios").innerHTML = estudios.map(e => {
      const puntos = (e.temas || []).reduce((n, t) => n + (t.puntos || []).length, 0);
      return `<button type="button" class="tarjeta tarjeta-panel" data-slug="${esc(e.slug)}" style="--c:var(${COLORES[e.temas?.[0]?.color] || "--b1"})">
        <span class="etiqueta">${e.idioma === "pt" ? "Português" : "Español"}</span>
        <h2>${esc(e.titulo)}</h2>
        <span class="cuenta">${(e.temas || []).length} puntos · ${puntos} subpuntos</span>
      </button>`;
    }).join("") || "<p>Todavía no hay estudios.</p>";
    revelar($("listaEstudios").children, 70);
  } catch (err) {
    $("listaEstudios").textContent = "";
    if (err.status === 401) { Github.borrarLlave(); mostrar("pLlave"); aviso("avisoLlave", mensajeError(err)); return; }
    aviso("avisoLista", mensajeError(err));
  }
}

$("listaEstudios").addEventListener("click", async e => {
  const t = e.target.closest("[data-slug]");
  if (!t) return;
  try {
    const { sha: s, datos } = await Github.leer(t.dataset.slug);
    abrirEditor(t.dataset.slug, s, datos);
  } catch (err) {
    aviso("avisoLista", mensajeError(err));
  }
});

$("btnNuevo").addEventListener("click", () => {
  abrirEditor("", null, {
    titulo: "", idioma: "es", otro_idioma: "", descripcion: "", preguntas: [], cierre: "",
    temas: [nuevoTema()]
  });
});

// ---------- Abrir y cerrar el editor ----------

function abrirEditor(s, version, datos) {
  slug = s; sha = version; estudio = datos; cambios = false;
  (estudio.temas || []).forEach((t, i) => { if (i === 0) abiertos.add(t); });
  const guardado = leerBorrador();
  $("borrador").hidden = !guardado || guardado === JSON.stringify(estudio);
  mostrar("pEditor");
  dibujar();
  revelar(document.querySelectorAll("#editor > *"), 60);
}

$("btnVolver").addEventListener("click", () => {
  if (cambios && $("btnVolver").dataset.seguro !== "1") {
    pedirConfirmacion($("btnVolver"), "¿Salir sin publicar? Toca otra vez");
    return;
  }
  abrirLista();
});

$("borrador").addEventListener("click", e => {
  const accion = e.target.dataset.accion;
  if (accion === "recuperar") { estudio = JSON.parse(leerBorrador()); marcarCambio(); dibujar(); }
  if (accion === "descartar") borrarBorrador();
  if (accion) $("borrador").hidden = true;
});

window.addEventListener("beforeunload", e => { if (cambios) e.preventDefault(); });

// ---------- Inicio: con llave guardada va directo a la lista ----------
document.addEventListener("DOMContentLoaded", () => {
  if (Github.llave()) abrirLista();
  else mostrar("pLlave");
});
