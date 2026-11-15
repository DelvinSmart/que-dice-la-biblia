# ¿Qué dice la Biblia? · O que diz a Bíblia?

Estudios de la Biblia organizados como un mapa: cada estudio es un tema, el tema tiene puntos (1, 2, 3…), cada punto tiene subpuntos (1.1, 1.2…), y cada subpunto tiene su contenido: textos, pasajes bíblicos y subtítulos. Se leen en la página y se descargan en PDF.

Página: https://delvinsmart.github.io/que-dice-la-biblia/

## Cómo añadir o editar un estudio

Todo se hace en el panel: https://delvinsmart.github.io/que-dice-la-biblia/panel.html
(también está el enlace "Editar estudios" al final de la página de inicio).

1. La primera vez en cada aparato, pega tu llave de GitHub (ver abajo). Se guarda solo en ese aparato.
2. Toca **+ Nuevo estudio**, o abre uno de la lista.
3. Llena la portada; añade **+ Punto**, dentro de cada punto **+ Subpunto**, y dentro de cada subpunto **+ Texto**, **+ Pasaje bíblico**, **+ Subtítulo** o **+ Imagen** (foto o imagen con pie de foto; se achica sola y va en un recuadro con la raya del color del punto) o **+ Video** (link de YouTube, o un video corto de hasta 25 MB). En un pasaje bíblico también puedes poner **una imagen en vez del texto de los versículos**. Con ↑ ↓ cambias el orden y con ✕ borras.
En cada **Pasaje bíblico**, usa **Pegar desde la app Biblia**: copia el pasaje en tu app (con “Copiar” o “Compartir”), pégalo y toca **Llenar referencia y versículos**. Si el texto trae los números de versículo, se separan solos; si no, queda en un solo recuadro con el rango (por ejemplo 22-23).

Con el botón **Foto o captura** puedes tomar una foto o escoger una captura: el panel lee el texto (sin subir la foto a ningún servidor) y muestra la lista de versículos encontrados. Marca los que quieres (puedes corregir el número o el texto) y toca **Usar los seleccionados**: la referencia se arma sola con el libro y el capítulo de la foto o de la referencia, por ejemplo `Jeremías 1:1-3 LBLA` o `Jeremías 1:1, 5, 30 LBLA`. La primera vez tarda unos segundos en preparar el lector.

También sirve con fotos o capturas, en iPhone, iPad y Mac: con **Texto en vivo** de Apple, abre la foto, selecciona el texto, cópialo y pégalo ahí. Si trae los números de versículo, se separan solos (la referencia se escribe a mano).

4. Mientras escribes, la **vista previa** muestra la página real del estudio, en el punto que estás editando: al lado en la computadora y el iPad, o con el botón **Vista previa** en el iPhone. En cada punto, **Ver cómo queda** muestra solo ese punto.
5. Toca **Publicar**. En uno o dos minutos la página y el PDF se actualizan solos.

Lo que escribes se guarda solo en el aparato mientras editas, así que si se cierra la página no se pierde: al volver, el panel ofrece **Recuperar**.

Para tener un estudio en dos idiomas, crea uno en español y otro en portugués, y en cada uno escoge el otro en **El mismo estudio en el otro idioma**. Así aparece el botón ES | PT.

### La llave (solo el autor puede guardar)

El panel lo puede abrir cualquiera, pero sin la llave solo ve la pantalla de entrada: GitHub rechaza cualquier cambio que no venga con la llave del autor.

Para crearla: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → **Generate new token**.
- Repository access: **Only select repositories** → `que-dice-la-biblia`.
- Permissions → Repository permissions → **Contents: Read and write**.

Si se pierde un aparato, borra la llave en esa misma página de GitHub y crea otra.

## Archivos

- `estudios/`: un archivo JSON por estudio. Aquí está todo el contenido.
- `imagenes/` y `videos/`: las imágenes y los videos que se agregan a los estudios desde el panel.
- `index.html` + `js/inicio.js`: la página de inicio con la lista de estudios.
- `estudio.html` + `js/mapa.js`: la página de cada estudio (`estudio.html?e=nombre-del-archivo`). Con `?vista=1` es la vista previa del panel.
- `js/estudios.js`: carga los estudios y convierte los bloques en HTML.
- `js/ui.js`: los textos de los botones en español y portugués.
- `js/efectos.js`: el efecto de entrada de tarjetas, temas y textos (el mismo de Copiloto Driver).
- `pdf.html` + `js/pdf.js` + `css/pdf.css`: la versión para PDF.
- `css/styles.css`: colores, letras y diseño.
- `panel.html` + `css/panel.css`: el panel para crear y editar estudios. Su código está en:
  - `js/panel-estado.js`: el estudio que se edita, las pantallas, el borrador automático y la limpieza de lo que se pega.
  - `js/panel-lista.js`: la pantalla de la llave y la lista de estudios.
  - `js/panel-editor.js`: el editor de temas, puntos, textos, versículos y subtítulos.
  - `js/panel-foto.js`: el botón “Foto o captura”: lee el texto de una imagen dentro del navegador (Tesseract.js) y lo deja listo para revisar.
  - `js/panel-imagen.js`: imágenes y videos: achica las fotos en el aparato y sube imágenes y videos a `imagenes/` y `videos/` al publicar.
  - `js/panel-pegar.js`: “Pegar desde la app Biblia”: lee lo copiado de la app y llena la referencia y los versículos.
  - `js/panel-publicar.js`: publicar y eliminar estudios.
  - `js/panel-vista.js`: la vista previa en vivo.
- `js/github.js`: la conexión del panel con GitHub (leer, guardar y borrar estudios con la llave).
- `scripts/construir.mjs`: arma el sitio en `_site/` y crea la lista de estudios.
- `scripts/pdfs.sh`: genera un PDF por estudio en `_site/descargas/`.
- `.github/workflows/publicar.yml`: publica todo en GitHub Pages en cada cambio.

## Verlo en la computadora

```sh
node scripts/construir.mjs
sh scripts/pdfs.sh
cd _site && python3 -m http.server 8000
```

Y abre http://localhost:8000 en el navegador.

Nota para el código: en los archivos JSON los puntos se guardan en `temas` y los subpuntos en `puntos` (nombres internos de la primera versión).
