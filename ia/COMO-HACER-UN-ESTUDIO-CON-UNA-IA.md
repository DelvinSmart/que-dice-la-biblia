# Cómo hacer un estudio con una IA (Gemini o ChatGPT)

Las reglas que tiene que seguir la IA están en **[instrucciones.md](instrucciones.md)**. Es un solo archivo para todas: Gemini, ChatGPT y Claude. Si cambias una regla, cámbiala ahí y vuelve a subir el archivo a tu Gem o a tu proyecto.

## Antes de empezar (una sola vez)

### Opción A: un Gem en Gemini
1. En la computadora, entra a https://gemini.google.com. Los Gems se crean solo en la página web; después los puedes usar también en la app del teléfono.
2. Abre el menú de la izquierda, toca **Gems** y después **Nuevo Gem** (New Gem).
3. **Nombre:** "¿Qué dice la Biblia?".
4. **Instrucciones:** escribe esto: "Sigue al pie de la letra el archivo instrucciones.md. Es obligatorio."
5. **Conocimiento** (Knowledge) → **Agregar archivos**: sube `ia/instrucciones.md` y un estudio de modelo, por ejemplo `estudios/pastoras.json`. Están en la carpeta `que-dice-la-biblia`.
6. Toca **Guardar**.

### Opción B: un proyecto en ChatGPT
1. Entra a https://chatgpt.com con tu cuenta.
2. En el menú de la izquierda, en **Proyectos**, toca **Nuevo proyecto**. Ponle "¿Qué dice la Biblia?".
3. En las **instrucciones** del proyecto escribe lo mismo: "Sigue al pie de la letra el archivo instrucciones.md. Es obligatorio."
4. En **archivos**, sube `ia/instrucciones.md` y `estudios/pastoras.json`.

> En el panel, el botón **"Copiar instrucciones para la IA"** copia el archivo completo, por si prefieres pegarlo en el campo de instrucciones.

## Hacer un estudio nuevo

1. Abre tu Gem o tu proyecto y dile el tema y tu punto de partida, con tus palabras. Por ejemplo: "Quiero un estudio sobre el diezmo. Yo creo que…".
2. **Conversen.** La IA te hace preguntas. Responde con calma.
3. **Investigación.** La IA te muestra lo que dice la Biblia, el hebreo y el griego, los que piensan distinto y la historia, con sus links. Si la Biblia te corrige, eso es lo que vale.
4. **El mapa.** La IA te propone los puntos y subpuntos. Lo apruebas o lo cambias.
5. **El estudio.** Dile "escríbelo". Revisa que hable como tú.
6. **Entrega.** Dile "dame el JSON". La IA te da un bloque de código. Cópialo completo (en Gemini y ChatGPT hay un botón de copiar arriba del bloque).
7. En el **panel** de tu página, toca **"Pegar estudio de la IA"**, deja "Estudio nuevo", pega y toca **Revisar**.
8. El panel te dice qué está bien y qué no (ver abajo). Si todo está bien, toca **Abrir en el editor**.
9. En el editor: pega los versículos que falten ("Leer capturas" o "Pegar desde la app"), revisa todo y toca **Publicar**.

## Revisar un estudio que ya existe (una IA revisa el trabajo)

1. Abre el estudio en GitHub o en la carpeta (`estudios/pastoras.json`) y súbeselo a la IA, o pégale el texto.
2. Dile: "Revisa este estudio con la parte 8 de las instrucciones". Te da una lista de lo que encontró, con pruebas.
3. **Compruébalo tú** (o pídeselo a otra IA, por ejemplo a Claude): abre los links y los versículos de la lista. Una IA también se equivoca.
4. Aprueba lo que esté bien y pídele el JSON corregido.
5. En el panel, toca **"Pegar estudio de la IA"**, escoge **el estudio que se reemplaza** (por ejemplo "¿Pastoras?"), pega y toca **Revisar**.
6. El panel compara con el estudio publicado: si la IA quitó un solo versículo, **no deja abrirlo**. Los versículos que ya tenías pegados vuelven solos.

## Qué revisa el panel cuando pegas

**No deja seguir (rojo):**
- El JSON está roto o no tiene la forma de un estudio.
- Un pasaje no tiene una referencia que se entienda.
- Al reemplazar un estudio, la IA quitó versículos que ya estaban.

**Lo arregla solo y te avisa (amarillo):**
- La IA escribió el texto de un versículo: se borra, porque la IA nunca escribe versículos. Lo pegas tú.
- Una referencia sin versión: se le pone la del idioma (LBLA en español, ARA en portugués).
- Una fuente o un griego dentro del texto: se pasa a las fuentes del subpunto.
- El griego se llena del SBLGNT, nunca de lo que escribió la IA.
- Etiquetas raras en el texto: se quitan.

**Te avisa para que lo veas (amarillo):**
- Subpuntos que hablan de griego, hebreo o fechas y no tienen fuente.
- Fuentes sin link.
- El mapa cambió (puntos o subpuntos nuevos, quitados o con otro nombre).
- El 25%: si la LBLA pasa del límite, cuántas palabras de explicación faltan. **Nunca se quitan versículos**: se le pide a la IA más explicación, sin inventar.

**Te dice lo bueno (verde):**
- Cuántos versículos ya estaban copiados en tus estudios y se pusieron solos.
- Cuántos faltan por pegar.

## Lo que nunca hace la IA
- Escribir el texto de un versículo.
- Quitar o acortar Biblia.
- Inventar una fuente, una fecha o un link.
- Cambiar tu conclusión para darte la razón, o cambiar tu estilo.
- Publicar. Publicas tú, desde el panel.
