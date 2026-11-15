# Reglas para las IAs que trabajan en este repositorio

Lee esto antes de escribir o cambiar un estudio.

## El nombre

- El proyecto se llama **¿Qué dice la Biblia?** en español y **O que diz a Bíblia?** en portugués (desde el 15 de noviembre de 2026). Antes se llamaba "Estudios Bíblicos"; ese nombre ya no se usa.
- El nombre del autor **no** va en el nombre del proyecto. Si un día se pone, va en una sección aparte ("Quién enseña"), no en el título.
- Redes: el usuario será **@quedicelabiblia.oficial**. En TikTok se cambia el 27 de noviembre de 2026; en YouTube, cuando el autor lo reserve.
- La página es https://delvinsmart.github.io/que-dice-la-biblia/ y el repositorio es `DelvinSmart/que-dice-la-biblia` (antes `estudios-biblicos`). Todo está en este único repositorio. No crees repositorios aparte, ni siquiera para redirigir.
- En el panel, las claves guardadas en el aparato (`estudios-biblicos-llave` y `estudios-biblicos-borrador-…`) se quedan con el nombre viejo a propósito: si se cambian, el autor pierde la llave y los borradores guardados.

## Los estudios

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
