# Estudios Bíblicos

Estudios de la Biblia organizados como un mapa: cada estudio tiene temas (1, 2, 3…), cada tema tiene puntos (1.1, 1.2…), y cada punto tiene su contenido: textos, pasajes bíblicos y subtítulos. Se leen en la página y se descargan en PDF.

Página: https://delvinsmart.github.io/estudios-biblicos/

## Cómo añadir o editar un estudio

Todo se hace en el panel: https://delvinsmart.github.io/estudios-biblicos/panel.html
(también está el enlace "Editar estudios" al final de la página de inicio).

1. La primera vez en cada aparato, pega tu llave de GitHub (ver abajo). Se guarda solo en ese aparato.
2. Toca **+ Nuevo estudio**, o abre uno de la lista.
3. Llena la portada; añade **+ Tema**, dentro de cada tema **+ Punto**, y dentro de cada punto **+ Texto**, **+ Pasaje bíblico** o **+ Subtítulo**. Con ↑ ↓ cambias el orden y con ✕ borras.
4. Mientras escribes, la **vista previa** muestra la página real del estudio, en el punto que estás editando: al lado en la computadora y el iPad, o con el botón **Vista previa** en el iPhone. En cada punto, **Ver cómo queda** muestra solo ese punto.
5. Toca **Publicar**. En uno o dos minutos la página y el PDF se actualizan solos.

Lo que escribes se guarda solo en el aparato mientras editas, así que si se cierra la página no se pierde: al volver, el panel ofrece **Recuperar**.

Para tener un estudio en dos idiomas, crea uno en español y otro en portugués, y en cada uno escoge el otro en **El mismo estudio en el otro idioma**. Así aparece el botón ES | PT.

### La llave (solo el autor puede guardar)

El panel lo puede abrir cualquiera, pero sin la llave solo ve la pantalla de entrada: GitHub rechaza cualquier cambio que no venga con la llave del autor.

Para crearla: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → **Generate new token**.
- Repository access: **Only select repositories** → `estudios-biblicos`.
- Permissions → Repository permissions → **Contents: Read and write**.

Si se pierde un aparato, borra la llave en esa misma página de GitHub y crea otra.

## Archivos

- `estudios/`: un archivo JSON por estudio. Aquí está todo el contenido.
- `index.html` + `js/inicio.js`: la página de inicio con la lista de estudios.
- `estudio.html` + `js/mapa.js`: la página de cada estudio (`estudio.html?e=nombre-del-archivo`). Con `?vista=1` es la vista previa del panel.
- `js/estudios.js`: carga los estudios y convierte los bloques en HTML.
- `js/ui.js`: los textos de los botones en español y portugués.
- `js/efectos.js`: el efecto de entrada de tarjetas, temas y textos (el mismo de Copiloto Driver).
- `pdf.html` + `js/pdf.js` + `css/pdf.css`: la versión para PDF.
- `css/styles.css`: colores, letras y diseño.
- `panel.html` + `js/panel.js` + `css/panel.css`: el panel para crear y editar estudios.
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
