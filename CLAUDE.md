# Ecos de Aethelgard — guía para trabajar en el proyecto

Juego de rol de acción **hecho de sonido**, en español, pensado para personas ciegas y jugable por cualquiera. Las criaturas atacan desde cuatro direcciones; el jugador las reconoce por su sonido y responde con el elemento que las vence. Se publica con GitHub Pages desde `main`: <https://zeterpe.github.io/EcosDeAethelgard-/>.

**Prioridades, por este orden:** que se pueda jugar sin ver la pantalla, que sea divertido, y lo demás.

## Tecnología

- HTML + CSS + JavaScript **sin compilación ni dependencias**. Los archivos de `js/` son *scripts clásicos* que comparten el ámbito global: el **orden de los `<script>` en `index.html` importa** (config → data → lore → storage → speech → audio → music → narrator → input → combat → tutorial → ui → cloud → online → app).
- Sonido: todo se sintetiza con Web Audio (`js/audio.js`, voces de criaturas y efectos; `js/music.js`, música generativa). Los únicos audios grabados son los de la narración (`audio/narracion/`).
- Voz: `speechSynthesis` o lector de pantalla (regiones `aria-live`), en `js/speech.js`.
- Narración grabada: `js/narrator.js` (descarga los MP3 y los reproduce con Web Audio, con efectos por personaje; si algo falla, usa la voz del sistema).
- Online opcional con Firebase (`js/config.js`, `js/cloud.js`, `js/online.js`, reglas en `firebase/firestore.rules`). Con `firebase: null` el juego funciona sin conexión.

| Archivo | Qué contiene |
| --- | --- |
| `js/data.js` | Elementos, enemigos, niveles, rutas, dificultades, logros, utilidades, `GAME_VERSION`, `STORY_LINES` |
| `js/lore.js` | Toda la narrativa (ecos, Crónicas, criaturas, guardianes, Avatar) |
| `js/storage.js` | Ajustes por defecto, perfiles, migraciones |
| `js/combat.js` | Motor de combate y mecánicas de jefes |
| `js/ui.js` | Pantallas, diálogos, listas, opciones, `Narration` |
| `js/app.js` | Flujo del juego: menús, historia, rutas, biblioteca, opciones |
| `tools/generar-narracion.mjs` | Genera la narración con Azure (reparto de voces en `REPARTO`) |
| `.github/workflows/narracion.yml` | Acción «Generar narración» |

## Cómo probarlo

No abras `index.html` con doble clic: así no cargan las voces grabadas. Desde la carpeta del proyecto:

```bash
npx http-server -c-1 .
```

y abre la dirección que indique (normalmente <http://127.0.0.1:8080>). Usa auriculares.

En la consola del navegador, `Aethelgard.debug` permite saltar a cualquier punto:

```js
const d = Aethelgard.debug;
d.profile                      // partida actual
d.settings                     // ajustes
d.playCampaignLevel(15)        // nivel de la historia (1–30)
d.playRouteLevel('fire', 3)    // rutas: fire · water · wind · earth (niveles 1–5)
d.playGuardian('earth')        // guardián de una ruta
d.playFinal()                  // Avatar del Silencio
d.startArena(); d.startPractice(); d.startTutorial()
d.setTimeScale(0.3)            // combates más rápidos para probar
d.narrator.diagnose()          // estado de la narración grabada
```

Ojo: muchas de estas funciones devuelven una promesa que solo termina al acabar el flujo; llámalas sin `await`.

**Comprobaciones automáticas** (no instalan nada; GitHub las lanza también en cada rama con la acción «Comprobar el juego»):

```bash
node tools/comprobar.mjs
```

Revisan que la versión coincida en `js/data.js` y en todos los `?v=`, el orden de los scripts, que la narración se pueda generar y cuántos párrafos conservan su voz grabada, y la lógica (hechizos, azar con semilla, rachas, medallas y partidas guardadas). Si añades lógica nueva que se pueda comprobar sin navegador, añade ahí su prueba.

**Comprobación mínima antes de subir un cambio:** entrenamiento, nivel 1, un guardián, Biblioteca → Archivo de ecos (debe sonar el narrador grabado), Opciones → «Comprobar la voz de la historia», y que la consola no muestre errores.

## Reglas importantes

1. **Versión.** Si cambias cualquier `.js` o `.css`, sube `GAME_VERSION.id` en `js/data.js` (formato `AAAAMMDD` + letra) y pon **el mismo valor** en todos los `?v=` de `index.html`. Si no, los navegadores siguen usando la copia antigua.
2. **Los textos narrados están grabados.** Los textos de `js/lore.js` y de `STORY_LINES` (`js/data.js`) tienen audio en `audio/narracion/`. Si cambias uno, ese párrafo se leerá con la voz del sistema hasta que se vuelva a lanzar **GitHub → Actions → «Generar narración»** (solo regenera lo que cambia).
   - No edites nunca `audio/narracion/` a mano.
   - Cada narración del juego (`Narration.run(párrafos, { key })`) tiene su sección con la misma `key` en `secciones()` de `tools/generar-narracion.mjs`. Si añades historia nueva, añádela en los dos sitios.
   - En `js/lore.js`, las comillas rectas `"…"` marcan lo que dice un personaje (el generador le pone otra voz). No uses comillas para otras cosas.
   - Escribe para el oído: frases claras, nada de símbolos, abreviaturas ni números romanos sueltos.
3. **Secretos.** La clave de Azure vive solo en los secretos del repositorio (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`). Nunca la pongas en un archivo ni la subas.
4. **Accesibilidad en cada cambio.**
   - Todo lo que aparece en pantalla debe anunciarse por voz.
   - Usa `UI.show`, `Dialog.open`, `ListScreen.open` y `UI.say`, que gestionan el foco y los anuncios.
   - Todo se maneja con teclado y con pantalla táctil.
   - Respeta los ajustes: modo lector de pantalla (`settings.output === 'sr'`), audio mono, nivel de anuncios (`verbosity`) y las velocidades de voz.
   - Lo que la voz del juego añade a un control va en `data-desc` (lo amplía) o `data-speak` (lo sustituye): `js/ui.js` lo expone solo al lector de pantalla. No lo digas con `speech.say` aparte.
   - Lo que haya que decir justo antes de cambiar de pantalla o de abrir un diálogo va en la entrada (`intro`) de esa pantalla o en el texto del diálogo: dicho aparte, la pantalla siguiente lo corta.
5. **Azar.** En la lógica de juego usa `rand()`, `pick()` y `shuffle()` de `js/data.js` (tienen semilla para el desafío diario y los duelos). `Math.random` solo para efectos de sonido. En el combate, lo que deba salir igual para todos los jugadores va dentro de `GameRandom.scoped('etiqueta', …)`: así no depende de cuánto azar haya gastado antes cada uno (quien falla tiene más turnos).
6. **No romper partidas guardadas.**
   - Los campos nuevos del perfil van en `newProfile()` y se rellenan en `migrateProfile()` (`js/storage.js`).
   - Los ajustes nuevos van en `DEFAULT_SETTINGS`. Si cambias un valor por defecto que ya tenían guardado los jugadores, usa `settingsVersion`.
7. **Online.** No relajes `firebase/firestore.rules`. El panel del creador depende de que solo los documentos `admins/{uid}`, creados a mano en la consola de Firebase, den permisos de administrador.
8. **Textos del juego en español**, tuteando al jugador, con el estilo del resto.

## Forma de trabajar con Git

- En este repositorio también trabaja Claude Code desde la web (ramas `claude/…`). **Antes de empezar, actualiza** (`git pull`) y trabaja en una **rama propia**, nunca directamente en `main`.
- Sube la rama y abre un *pull request* hacia `main`; al fusionarlo, GitHub Pages publica el juego en unos minutos.
- La acción «Generar narración» hace commits en la rama donde se lanza: no subas cambios a esa rama mientras se está ejecutando.

## Documentación

- `README.md`: descripción del juego.
- `CONFIGURAR_ONLINE.md`: activar cuentas, amigos, duelos y panel del creador (Firebase).
- `CONFIGURAR_VOCES.md`: voces de Azure y la acción de narración.
