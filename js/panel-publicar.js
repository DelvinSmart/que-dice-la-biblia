// Panel · publicar el estudio en GitHub (crea el archivo si es nuevo) y eliminarlo.

// Nombre de archivo a partir del título: "¿Lenguas extrañas?" → "lenguas-extranas"
function slugDe(titulo) {
  return titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "estudio";
}

$("btnPublicar").addEventListener("click", async () => {
  if (!estudio.titulo.trim()) { $("estado").textContent = "Ponle un título al estudio"; return; }
  const boton = $("btnPublicar");
  boton.disabled = true;
  $("estado").textContent = "Publicando…";
  try {
    const nuevo = !slug;
    let archivo = slug;
    if (nuevo) {
      const base = slugDe(estudio.titulo);
      archivo = base;
      for (let n = 2; slugsExistentes.includes(archivo); n++) archivo = `${base}-${n}`;
    }
    await subirImagenesPendientes();
    const borradorViejo = claveBorrador();
    sha = await Github.guardar(archivo, estudio, sha, `${nuevo ? "Nuevo estudio" : "Actualizar estudio"}: ${estudio.titulo}`);
    try { localStorage.removeItem(borradorViejo); } catch (e) {}
    slug = archivo;
    if (nuevo) slugsExistentes.push(archivo);
    cambios = false;
    $("estado").innerHTML = `Publicado ✓ · en 1 o 2 minutos se ve en <a href="estudio.html?e=${encodeURIComponent(slug)}" target="_blank" rel="noopener">la página</a>`;
    if (nuevo) dibujar();
  } catch (err) {
    $("estado").textContent = mensajeError(err);
  } finally {
    boton.disabled = false;
  }
});

async function eliminarEstudio(boton) {
  if (boton.dataset.seguro !== "1") return pedirConfirmacion(boton, "¿Seguro? Se borra de la página. Toca otra vez");
  try {
    await Github.borrar(slug, sha);
    borrarBorrador();
    cambios = false;
    abrirLista();
  } catch (err) {
    $("estado").textContent = mensajeError(err);
  }
}
