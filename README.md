# Ecos de Aethelgard

Un juego de rol de acción hecho de sonido, pensado para personas ciegas y jugable por cualquiera. **Usa auriculares.**

Las criaturas del Silencio te atacan desde cuatro posiciones. Escucha su sonido, reconoce a la criatura y respóndele con el elemento que la vence, en su dirección.

## Cómo jugar

| Tecla | Acción |
| --- | --- |
| **A** · **S** · **D** · **F** | Agua · Fuego · Tierra · Viento |
| **Flechas** | Lanzar el hechizo hacia esa dirección |
| Dos elementos + flecha | Dúo (golpe crítico contra élites y guardianes) |
| **Espacio** | Repetir el enemigo actual |
| **Enter** | Estado: vidas, puntos, racha, enemigos restantes |
| **H** | Pista sobre la debilidad del enemigo |
| **V** | Apagar o encender los anuncios de enemigos (solo sonido) |
| **Escape** | Pausa (y saltar narraciones) |

Pulsa el elemento y, enseguida, la flecha. El elemento queda «cargado» durante la ventana de combinación, así que puedes mantenerlo o soltarlo justo antes. Hay un esquema para zurdos (J K L Ñ + W A S D) y botones táctiles en pantalla.

Durante una narración, **Enter** pasa al párrafo siguiente y **Escape** la salta entera (el juego lo dice en voz alta la primera vez).

**En pantalla táctil** también hay gestos sobre el campo de batalla: toca con uno, dos, tres o cuatro dedos para Agua, Fuego, Tierra o Viento, y desliza un dedo hacia el enemigo para lanzar. Deslizar dos dedos repite el enemigo y deslizar tres pausa. Con VoiceOver o TalkBack activados, el lector se queda con los gestos: hay que desactivarlo mientras se combate (pendiente de probar en un iPhone real).

**Ciclo elemental:** el Agua apaga el Fuego, el Fuego doma el Viento, el Viento mueve la Tierra y la Tierra detiene el Agua. Nunca ataques a una criatura con su propio elemento: la curarías.

**Posición por sonido:** izquierda y derecha suenan en cada oído (con un chasquido de madera); arriba suena agudo y brillante (con una campanilla); abajo, grave y apagado (con un golpe sordo).

## Online con amigos (gratis)

Con una cuenta gratuita la partida se guarda en la nube y se compite con los amigos:

- **Clasificación online**: Arena, Historia, Logros, Duelos y Desafío de hoy, marcando a tus amigos con ★.
- **Comunidad**: lista de invocadores, amigos, la ficha de cada uno con sus logros, récords y estadísticas.
- **Duelos**: desafías a alguien, juegas 5 oleadas y después tu rival juega exactamente las mismas; gana quien saque más puntos. Avisos en directo, revancha e historial de victorias y derrotas.
- **Desafío diario**: las mismas oleadas para todos durante el día (a veces con Niebla o Frenesí), su propia clasificación y racha de días seguidos. En duelos y desafío diario, cada oleada y cada turno salen iguales para todos, falle quien falle.
- **Panel del creador**: solo para ti. Quitar o dar logros, crear logros especiales, reiniciar récords, cambiar niveles, suspender o borrar cuentas, publicar avisos y moderar duelos y puntuaciones.
- **Privacidad**: política de privacidad con consentimiento, descarga de todos tus datos y borrado inmediato de la cuenta. El correo nunca se muestra a nadie.

Para activarlo hay que crear un proyecto gratuito de Firebase: sigue **[CONFIGURAR_ONLINE.md](CONFIGURAR_ONLINE.md)** paso a paso. Sin configurarlo, el juego funciona sin conexión como siempre.

## Narración con voces grabadas (gratis)

La historia puede sonar con voces neuronales de Microsoft Azure en lugar de la voz del navegador: un narrador grave con eco de catedral, Sylvara y Tomás como grabaciones antiguas, el Avatar con un coro inquietante y cada guardián con su propia voz (espectral cuando habla liberado y distorsionada cuando grita de furia). Los audios se generan una vez con el plan gratuito de Azure y se guardan en el repositorio; los jugadores no necesitan nada. Si un párrafo no tiene audio (o su texto ha cambiado), se lee con la voz del sistema. Cada jugador puede elegir en **Opciones → Voz de la historia**.

Para generarlos: **[CONFIGURAR_VOCES.md](CONFIGURAR_VOCES.md)** (crear el recurso gratuito, dos secretos en GitHub y pulsar un botón en Actions).

## Modos

- **Historia**: 30 niveles en tres actos, con ecos narrados, las **Crónicas de los Antiguos Ecos** (una página cada cinco niveles que va desvelando cómo se quebró el Gran Eco), la historia de cada criatura nueva y de por qué se corrompió, niveles especiales (Frenesí, Niebla, Élite) y la Sombra Imitadora en los niveles 15 y 25. Después, cuatro rutas con su guardián y el combate final contra el Avatar del Silencio. Si caes, repites el nivel: nunca pierdes el progreso.
- **Repetir niveles**: vuelve a jugar cualquier nivel superado para mejorar su medalla (oro sin recibir golpes, plata con uno, bronce al superarlo).
- **La Concordia**: al final de la historia sostienes el Aliento y lo sueltas cuando suena la campana de Ignar. Después se puede repetir desde la Biblioteca.
- **Entrenamiento**: tutorial interactivo por capítulos (auriculares, direcciones, elementos, ciclo, hechizos, dúos y controles); si sales, la próxima vez sigues por donde lo dejaste.
- **Arena de los Ecos**: oleadas infinitas, un guardián cada cinco oleadas, récord y clasificación.
- **Práctica libre**: sin vidas ni puntos; cada error se explica.
- **Biblioteca**: bestiario con el sonido de cada criatura (en las cuatro posiciones), grimorio de hechizos, sonidos de posición y archivo de la historia.

## Criaturas raras

A partir del nivel 13 aparecen tres criaturas que piden escuchar de otra manera (la voz no dice por dónde vienen, salvo en Aprendiz y con audio mono):

- **Fuego Errante** (nivel 13): se mueve antes de atacar; apunta a donde termina su llama.
- **Gemelos de Piedra** (nivel 17): suenan a la vez en dos posiciones; hay que alcanzar a los dos, uno detrás de otro, en el mismo turno.
- **Susurro de Bruma** (nivel 22): suena muy bajo y una sola vez.

También salen en las rutas, en la Arena desde la oleada 8 y, una vez conocidas, en la Práctica libre. Sus textos nuevos se leen con la voz del sistema hasta que se vuelva a lanzar **Generar narración**.

## Guardianes

Cada jefe tiene su propia voz y una mecánica única:

Cada ruta guarda además una leyenda de su guardián y una escena antes del combate que explican quién era y por qué es así.

- **Ignar, Señor de las Cenizas**: golpea el yunque y lanza brasas.
- **Leviatán Abisal**: se desplaza antes de atacar; apunta a donde termina el movimiento.
- **Zael, Rey de los Vendavales**: lanza ecos falsos y lejanos; apunta al grito cercano.
- **Rok, Titán de la Montaña**: alza un escudo de piedra; cuando lo oigas, no ataques.
- **Avatar del Silencio**: cambia de elemento sin parar y su voz se apaga hasta ser un susurro.

## Accesibilidad

- Voz propia del juego o **modo lector de pantalla** (NVDA, JAWS, VoiceOver) mediante regiones `aria-live`; el campo de batalla usa `role="application"` para que las teclas lleguen al juego.
- Menús navegables con flechas, lectura del elemento enfocado y sonidos de interfaz.
- Dificultad (Aprendiz, Invocador, Archimago), velocidad, volumen y voz (y una velocidad aparte para la historia, de 0,8 a 2, que empieza en 1,5), nivel de detalle de los anuncios, ventana de combinación, **audio mono** (la voz anuncia siempre la posición), tic-tac de tiempo y radar visual opcional.
- Subtítulos de todo lo que se dice, alto contraste, textos grandes y respeto de `prefers-reduced-motion`.

## Técnica

Sin dependencias: todo el sonido del juego (voces de criaturas, efectos y música generativa por zona) se sintetiza con la Web Audio API; los únicos archivos de audio son, si se generan, los de la narración (`audio/narracion/`), a los que se aplican efectos en tiempo real. Basta con abrir `index.html` en un navegador moderno (o servir la carpeta con cualquier servidor estático). Sin cuenta, el progreso se guarda en `localStorage` (y las partidas de la versión anterior se migran automáticamente). Con cuenta, se guarda en Firebase (plan gratuito Spark); las reglas de seguridad están en `firebase/firestore.rules`.

```
index.html     Pantallas y capas
style.css      Estilos
js/data.js     Elementos, enemigos, niveles, dificultades y logros
js/lore.js     Narrativa
js/storage.js  Perfiles, ajustes y migración
js/speech.js   Voz (síntesis o lector de pantalla)
js/audio.js    Motor de sonido y voces de las criaturas
js/music.js    Música generativa
js/narrator.js Narración grabada y efectos por personaje
js/input.js    Teclado y combinaciones
js/combat.js   Motor de combate y mecánicas de jefes
js/tutorial.js Entrenamiento
js/ui.js       Pantallas, diálogos, listas, opciones y HUD
js/config.js   Configuración del modo online (Firebase)
js/cloud.js    Servicio online: cuentas, guardado, duelos, diario, panel
js/online.js   Pantallas online: cuenta, comunidad, duelos, privacidad, panel
js/app.js      Flujo del juego
firebase/      Reglas de seguridad de Firestore
tools/         Generador de la narración (Azure)
audio/         Audios de la narración y su manifiesto
```
