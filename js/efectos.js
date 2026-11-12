// Efecto de entrada, el mismo de Copiloto Driver: cada elemento aparece subiendo un poco,
// de borroso a nítido y de 97% a su tamaño, uno detrás de otro. Los estilos están en css/styles.css (.reveal).
document.documentElement.classList.add("js");

const observadorEntrada = "IntersectionObserver" in window
  ? new IntersectionObserver(entradas => entradas.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-visible");
      observadorEntrada.unobserve(e.target);
    }), { rootMargin: "0px 0px -5% 0px" })
  : null;

// Hace entrar una lista de elementos en cascada: "paso" ms entre uno y otro, empezando en "inicio" ms
function revelar(elementos, paso = 60, inicio = 0) {
  [...elementos].forEach((el, k) => {
    el.classList.add("reveal");
    el.classList.remove("is-visible");
    el.style.setProperty("--reveal-delay", `${inicio + Math.min(k, 10) * paso}ms`);
    if (observadorEntrada) observadorEntrada.observe(el);
    else el.classList.add("is-visible");
  });
}
