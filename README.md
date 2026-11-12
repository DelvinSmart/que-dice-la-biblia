# Estudios Bíblicos

Estudios de la Biblia organizados como un mapa: cada estudio tiene temas (1, 2, 3…), cada tema tiene puntos (1.1, 1.2…), y cada punto tiene su contenido: textos, pasajes bíblicos y subtítulos. Se leen en la página y se descargan en PDF.

Página: https://delvinsmart.github.io/estudios-biblicos/

## Cómo añadir o editar un estudio

1. Entra a https://app.pagescms.org con tu cuenta de GitHub y abre este repositorio.
2. En **Estudios bíblicos**, toca **Añadir** para uno nuevo, o abre uno que ya existe.
3. Llena el título, el idioma y las preguntas; añade **Temas**, dentro de cada tema **Puntos**, y dentro de cada punto el **Contenido** (Texto, Pasaje bíblico o Subtítulo), en el orden que quieras.
4. Guarda. En uno o dos minutos la página y el PDF se actualizan solos.

Para tener un estudio en dos idiomas, crea uno en español y otro en portugués, y en cada uno escribe en **El mismo estudio en el otro idioma** el nombre del archivo del otro (sin `.json`). Así aparece el botón ES | PT.

## Archivos

- `estudios/`: un archivo JSON por estudio. Aquí está todo el contenido.
- `index.html` + `js/inicio.js`: la página de inicio con la lista de estudios.
- `estudio.html` + `js/mapa.js`: la página de cada estudio (`estudio.html?e=nombre-del-archivo`).
- `js/estudios.js`: carga los estudios y convierte los bloques en HTML.
- `js/ui.js`: los textos de los botones en español y portugués.
- `pdf.html` + `js/pdf.js` + `css/pdf.css`: la versión para PDF.
- `css/styles.css`: colores, letras y diseño.
- `.pages.yml`: la configuración del panel de edición.
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
