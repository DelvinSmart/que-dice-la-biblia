// Ventana "LBLA": muestra el pasaje en la Biblia en línea de Lockman (bible.lockman.org), el dueño de la LBLA,
// dentro de la página. El texto no se copia ni se guarda: es la página de Lockman, con su nombre y su link.
// Se abre con el botón "LBLA" de cada pasaje y se cierra con ✕, tocando fuera o con Esc. Entra y sale con efecto.
(() => {
  const ventana = document.createElement("div");
  ventana.className = "ventana-lbla";
  ventana.setAttribute("role", "dialog");
  ventana.setAttribute("aria-modal", "true");
  ventana.setAttribute("aria-labelledby", "vlTitulo");
  ventana.innerHTML = `
    <div class="ventana-caja">
      <header class="ventana-cab">
        <span class="ventana-titulo" id="vlTitulo"></span>
        <a class="ventana-abrir" id="vlAbrir" target="_blank" rel="noopener">bible.lockman.org ↗</a>
        <button type="button" class="ventana-cerrar" id="vlCerrar" aria-label="Cerrar">✕</button>
      </header>
      <div class="ventana-cuerpo">
        <p class="ventana-cargando" id="vlCargando">Cargando la Biblia de las Américas desde bible.lockman.org…</p>
        <iframe class="ventana-marco" id="vlMarco" title="La Biblia de las Américas en bible.lockman.org"></iframe>
      </div>
      <p class="ventana-pie">La Biblia de las Américas · página oficial de The Lockman Foundation</p>
    </div>`;
  document.body.appendChild(ventana);
  const $v = id => document.getElementById(id);

  function abrir(url, titulo) {
    $v("vlTitulo").textContent = titulo;
    $v("vlAbrir").href = url;
    if ($v("vlMarco").src !== url) {
      $v("vlCargando").hidden = false;
      $v("vlMarco").classList.remove("listo");
      $v("vlMarco").src = url;
    }
    ventana.classList.add("abierta");
    $v("vlCerrar").focus({ preventScroll: true });
  }
  const cerrar = () => ventana.classList.remove("abierta");
  // Mientras Lockman carga se ve el aviso; cuando termina, aparece su página
  $v("vlMarco").addEventListener("load", () => {
    if (!$v("vlMarco").src) return;
    $v("vlCargando").hidden = true;
    $v("vlMarco").classList.add("listo");
  });

  document.addEventListener("click", e => {
    const boton = e.target.closest(".boton-lbla");
    if (boton) { abrir(boton.dataset.lockman, boton.dataset.titulo); return; }
    if (e.target === ventana || e.target.closest("#vlCerrar")) cerrar();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && ventana.classList.contains("abierta")) cerrar(); });
})();
