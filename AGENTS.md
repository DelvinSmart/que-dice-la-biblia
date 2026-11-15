# Reglas para las IAs que trabajan en este repositorio

Lee esto antes de escribir o cambiar un estudio.

## El nombre

- El proyecto se llama **¿Qué dice la Biblia?** en español y **O que diz a Bíblia?** en portugués (desde el 15 de noviembre de 2026). Antes se llamaba "Estudios Bíblicos"; ese nombre ya no se usa.
- El nombre del autor **no** va en el nombre del proyecto. Si un día se pone, va en una sección aparte ("Quién enseña"), no en el título.
- Redes: el usuario será **@quedicelabiblia.oficial**. En TikTok se cambia el 27 de noviembre de 2026; en YouTube, cuando el autor lo reserve.
- La página es https://delvinsmart.github.io/que-dice-la-biblia/ y el repositorio es `DelvinSmart/que-dice-la-biblia` (antes `estudios-biblicos`). Todo está en este único repositorio. No crees repositorios aparte, ni siquiera para redirigir.
- En el panel, las claves guardadas en el aparato (`estudios-biblicos-llave` y `estudios-biblicos-borrador-…`) se quedan con el nombre viejo a propósito: si se cambian, el autor pierde la llave y los borradores guardados.

## Los estudios

- **Fuentes:** no van en el texto del estudio. Cada subpunto las guarda en su lista `"fuentes": [...]` (al lado de `"bloques"`): `{"tipo": "fuente", "titulo": "…", "texto": "resumen corto", "url": "https://…"}` o `{"tipo": "griego", …}`. En la página salen como botoncitos al final del subpunto (al tocar uno se abre un recuadro con el resumen y el link) y todas juntas en el último paso del mapa, "Fuentes del estudio". En el panel se editan en la sección "Fuentes del estudio", debajo de "+ Punto". Cada dato histórico, de idioma original o de fecha debe tener su fuente. No inventes fuentes ni links: si no estás seguro, pregúntale al autor.
- Un estudio **no es código**. Es un archivo JSON en `estudios/`, y el modelo es `estudios/lenguas-extranas.json`. Para un estudio nuevo no se toca el HTML, el CSS ni el JS.
- Escribe con las palabras del autor y respeta su forma de hablar. No cambies su texto sin preguntarle.
- Los versículos van en LBLA. Lockman permite citar hasta 500 versículos por obra, sin un libro completo y sin pasar del 25% del texto, con el aviso completo y un enlace a www.LBLA.com (https://www.lockman.org/espanol/permiso-para-citar/). La página y el PDF ya ponen el aviso solos en todo pasaje cuya referencia termine en "LBLA": escribe siempre la versión al final de la referencia.
- Aun así, no copies el texto de memoria ni de internet: deja la referencia y el autor lo pega desde su app de la Biblia. Una IA o un modelo local no sirve para sacar versículos, porque cambia palabras.
- No inventes citas, autores ni fechas. Si algo no es seguro, dilo.
- Publica (push a `main`) solo cuando el autor lo diga. Haz commit solo de tus archivos, con sus nombres.

## Cómo se consiguen los versículos (siempre igual)

La IA **nunca** escribe el texto de un versículo: ni de memoria, ni de internet, ni con un modelo local. Solo el autor lo copia de su app de la Biblia. Así:

1. **La IA le da al autor UNA sola lista** con todas las referencias del estudio, en orden y por subpunto, con la versión al final:
   `1.1 Efesios 4:11 LBLA`
   `1.2 Hechos 20:17, 28 LBLA · 1 Pedro 5:1-2 LBLA`
   Antes de darla, la IA cuenta los versículos (máximo 500 por estudio, sin un libro completo) y avisa si una referencia se repite en dos subpuntos.
2. **El autor copia todo de una vez:** en la app selecciona los versículos de cada referencia, toca Copiar y los pega uno detrás de otro en UN solo mensaje del chat, en el mismo orden de la lista. Puede pegarlos tal como salen de la app, con los números de versículo y la referencia que la app pone.
3. **La IA los acomoda:** pone cada pasaje en su subpunto como un bloque `{"tipo": "pasaje", "referencia": "Efesios 4:11 LBLA", "versiculos": [{"numero": "11", "texto": "…"}]}`, separa los versículos por número, quita lo que la app agrega (enlaces, "Compartir", etc.) y no cambia ni una palabra del texto.
4. **La IA comprueba y le dice al autor:** cuántos pasajes recibió, cuáles faltan y si algún texto no coincide con su referencia (por ejemplo, un número de versículo que no está en el rango). Lo que falte queda como referencia sin texto hasta que el autor lo pegue; nunca se rellena.
5. Otra versión (RVR1960, ARA, etc.) se trata igual, con su sigla al final de la referencia. El aviso de derechos automático de la página es solo para la LBLA; para otra versión, avisa al autor antes de publicar.

## Herramientas del panel para los versículos

- **Buscador:** en cada pasaje se escoge libro, capítulo, desde, hasta y versión. "Poner" escribe la referencia y "Abrir en la Biblia" abre ese pasaje exacto en Bible.com (o en la app YouVersion en el teléfono) para copiarlo. Los libros y los enlaces están en `js/biblia.js`.
- **Versículos ya copiados:** al poner una referencia, el panel busca si esos versículos ya están en algún estudio, en la misma versión, y los reutiliza (`js/panel-reusar.js`). La IA hace lo mismo: antes de pedirle un versículo al autor, busca si ya está en otro estudio de `estudios/` y lo reutiliza tal cual.
- **Medidor:** el panel muestra los versículos (máx. 500) y qué porcentaje del estudio es texto bíblico (máx. 25%), y no publica si se pasa (`js/panel-medidor.js`). La IA que haga commit directo tiene que comprobar lo mismo antes: si los versículos pasan del 25% de las palabras del estudio, no publica y le dice al autor cuántas palabras de explicación faltan.

## Texto griego (SBLGNT)

- El Nuevo Testamento griego del SBLGNT está en `griego/sblgnt/` (un JSON por libro, licencia CC BY 4.0: se puede publicar con el crédito, sin límite de versículos). Ver `griego/sblgnt/README.md`.
- El griego va en las **fuentes** del subpunto, no en el texto: `{"tipo": "griego", "referencia": "1 Timoteo 1:5-7", "versiculos": [{"numero": "5", "texto": "…"}]}`. En el panel, "+ Griego" (en "Fuentes del estudio") lo llena solo con "Traer el griego". La IA copia el texto **solo** de esos archivos, nunca de memoria.
- No cuenta en el medidor de la LBLA. La página pone sola el crédito del SBLGNT.
- El Antiguo Testamento (hebreo) todavía no está: su licencia hay que revisarla aparte.

## Reina-Valera 1960 y LBLA al lado de cada pasaje

- Cada pasaje (en español) tiene, dentro de su botoncito, los botones "LBLA" y "RVR 1960". Los tres (el pasaje, LBLA y RVR 1960) se abren en el **mismo lugar**, debajo de la fila, de a uno: si había otro abierto, primero se va con su efecto y después entra el nuevo (`abrirRecuadro` en `js/mapa.js`).
- **RVR 1960:** el texto lo entrega el servicio de Reftagger de Logos (reftagger.bibliacdn.com) en ese momento: cada versículo se pide directamente y todos a la vez, y los del subpunto abierto se adelantan; se muestra con el formato de nuestros pasajes y el crédito de Logos (`js/rvr.js`). No se guarda en la página. Logos no tiene la LBLA ni las versiones en portugués.
- **LBLA:** el versículo en la Biblia en línea de Lockman (bible.lockman.org), reducido y recortado para que se vea solo su recuadro, con flechas para los versículos del pasaje (`abrirLBLA` en `js/mapa.js`, medidas en `css/motor.css`). Tampoco se copia nada.
- Si un pasaje todavía no tiene el texto de la LBLA, la página avisa que se puede leer en esos dos botones.

## El motor de diseño (obligatorio)

- **Todos** los valores de diseño salen de `css/motor.css`: colores (claro y oscuro), tamaños de letra, pesos, interlineado, espacios, bordes, esquinas, separación de letras, duraciones, curvas, desenfoques y sombras. Las demás hojas (`styles.css`, `panel.css`, `pdf.css`) solo usan `var(--…)`.
- **Candado:** `scripts/revisar-diseno.mjs` corre antes de armar el sitio (`scripts/construir.mjs`) y en la publicación. Si alguna hoja (fuera del motor) o algún JS escribe un color, una curva o un número con unidad (px, pt, mm, em, rem, s, ms), no se publica. Excepción: los `@media` y `@page`, porque CSS no deja usar variables ahí.
- Si hace falta un valor nuevo, se agrega al motor con su nombre y se usa con `var(--nombre)`.

## "Leer capturas" en el panel

- Arriba de los puntos, "Pasajes sin texto" con el botón "Leer capturas": el autor escoge varias capturas de su app de la Biblia a la vez; el panel las lee en el navegador (Tesseract.js), reconoce el libro y el capítulo del encabezado de cada una y pone los versículos en los pasajes vacíos que corresponden. Muestra qué se llenó, qué quedó a medias y qué falta (`js/panel-capturas.js`). El texto lo trae el autor en sus capturas; el panel no entra a ninguna página a buscarlo (Lockman prohíbe el scraping).
