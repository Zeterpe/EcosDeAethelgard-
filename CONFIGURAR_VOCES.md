# Activar las voces grabadas de la historia (gratis)

La historia (ecos, actos, rutas, guardianes, el Avatar y los créditos) puede sonar con **voces neuronales de Microsoft Azure** en lugar de la voz robótica del navegador. Cada personaje tiene su voz y su efecto:

| Personaje | Voz de Azure | Cómo suena en el juego |
| --- | --- | --- |
| Narrador | Álvaro | Voz grave y pausada con la cola de una catedral |
| Maestra Sylvara | Elvira | Grabación antigua que resuena, con chisporroteo de disco |
| Archivero Tomás | Arnau | Grabación antigua, como Sylvara |
| Avatar del Silencio | Saúl | Muy grave, con un coro desafinado y eco de caverna |
| Ignar · La Gran Corriente · Zael · Rok | Elías · Vera · Teo · Darío | Susurro espectral cuando hablan liberados |
| Gritos de furia de los guardianes | las mismas | Grito saturado y doblado |

Los audios se generan **una sola vez** y se guardan en el repositorio (`audio/narracion/`). Los jugadores no necesitan nada: el juego los descarga como cualquier otro archivo.

Mientras no hagas estos pasos, el juego funciona igual que ahora: la historia la lee la voz del sistema.

---

## 1. Crear la cuenta gratuita de Azure (10 minutos)

1. Entra en <https://azure.microsoft.com/free> y crea la cuenta con tu cuenta de Microsoft (o crea una).
2. Te pedirá un teléfono y una tarjeta **solo para verificar que eres una persona**. El plan que vamos a usar (**F0**) es gratuito para siempre y **nunca cobra**: si se acabaran los caracteres gratuitos del mes, simplemente deja de generar hasta el mes siguiente.
   - Si eres estudiante, <https://azure.microsoft.com/free/students> no pide tarjeta.

## 2. Crear el recurso de voz

1. Entra en <https://portal.azure.com>.
2. **Crear un recurso** → busca **Speech** (o «Voz» / «Servicios de voz») → **Crear**.
3. Rellena:
   - **Suscripción**: la gratuita que acabas de crear.
   - **Grupo de recursos**: **Crear nuevo** → por ejemplo `ecos`.
   - **Región**: **West Europe** (Europa occidental).
   - **Nombre**: cualquiera, por ejemplo `ecos-voces`.
   - **Plan de tarifa**: **Free F0**. Esto es importante: es el gratuito.
4. **Revisar y crear** → **Crear**. Tarda un minuto.
5. Pulsa **Ir al recurso** → en el menú izquierdo, **Claves y punto de conexión** (Keys and Endpoint).
6. Copia la **CLAVE 1** y apunta la **Ubicación/Región** (será `westeurope`).

> La clave es **secreta**: no la pegues en ningún archivo del juego ni se la pases a nadie. Solo va en los secretos de GitHub (paso 3).

## 3. Guardar la clave en GitHub (como secreto)

1. En el repositorio de GitHub: **Settings → Secrets and variables → Actions**.
2. **New repository secret**:
   - Nombre: `AZURE_SPEECH_KEY` · Valor: la CLAVE 1 → **Add secret**.
3. **New repository secret** otra vez:
   - Nombre: `AZURE_SPEECH_REGION` · Valor: `westeurope` → **Add secret**.

GitHub guarda los secretos cifrados: nadie puede verlos, ni siquiera tú después de guardarlos.

## 4. Fusionar el pull request

El botón para generar la narración solo aparece cuando el archivo `.github/workflows/narracion.yml` está en la rama principal (`main`). Fusiona primero el pull request.

## 5. Generar las voces

1. En el repositorio: pestaña **Actions** → en la lista de la izquierda, **Generar narración**.
2. **Run workflow** → rama `main` → **Run workflow**.
3. Tarda unos **8 minutos** (son 128 fragmentos y el plan gratuito permite unos 20 por minuto). Puedes cerrar la página: sigue solo.
4. Al terminar, el propio GitHub guarda los audios en el repositorio y GitHub Pages actualiza el juego en un par de minutos.

Para comprobarlo: abre el juego, entra en **Opciones → Voz de la historia** (debe decir «Cada personaje tiene su propia voz y sus efectos») y escucha cualquier eco en **Biblioteca → Archivo de la historia**.

Si la ejecución sale en rojo, abre el paso que ha fallado: el mensaje dice qué pasa (normalmente un secreto mal copiado o una región distinta de la del recurso).

---

## Cambiar voces o textos

- **Cambiar una voz**: edita el bloque `REPARTO` al principio de [`tools/generar-narracion.mjs`](tools/generar-narracion.mjs) (voz, velocidad, tono, pausa o efecto) y vuelve a lanzar **Generar narración**. Solo se regeneran los fragmentos de ese personaje.
- **Cambiar la historia**: si editas un texto de `js/lore.js`, ese párrafo vuelve a la voz del sistema hasta que lances otra vez **Generar narración**. El juego nunca reproduce un audio que no coincida con el texto actual.
- **Regenerarlo todo**: marca la casilla «Regenerar todos los audios» al lanzar la acción.

Voces masculinas de España que puedes probar: Álvaro, Arnau, Darío, Elías, Nil, Saúl, Teo. Femeninas: Abril, Elvira, Estrella, Irene, Laia, Lía, Triana, Vera, Ximena. Se escriben así: `es-ES-SaulNeural`. Puedes escucharlas en <https://speech.microsoft.com/portal/voicegallery>.

## Generarlo desde tu ordenador (opcional)

Con [Node.js](https://nodejs.org) 18 o superior, desde la carpeta del juego:

```bash
# Ver el reparto y lo que se generaría, sin gastar nada
node tools/generar-narracion.mjs --prueba

# Generar de verdad
AZURE_SPEECH_KEY=tu_clave AZURE_SPEECH_REGION=westeurope node tools/generar-narracion.mjs
```

En Windows (PowerShell): `$env:AZURE_SPEECH_KEY="tu_clave"; $env:AZURE_SPEECH_REGION="westeurope"; node tools/generar-narracion.mjs`

Después sube la carpeta `audio/narracion` al repositorio.

## Coste

La historia completa son unos **24.000 caracteres**. El plan gratuito da **500.000 al mes**: puedes regenerarla entera unas 20 veces al mes sin pagar nada, y como solo se regenera lo que cambia, normalmente gastarás muchísimo menos.

## Para los jugadores

En **Opciones → Voz de la historia** cada uno elige:

- **Narradores grabados**: las voces de Azure con sus efectos.
- **Voz del sistema**: la misma voz que el resto del juego (o el lector de pantalla), por si alguien la prefiere más rápida.

La velocidad de voz de las opciones también acelera o frena las grabaciones (sin cambiar el tono), y **Enter** salta un párrafo y **Escape** toda la narración, igual que antes.
