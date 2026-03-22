/* =============================================
   ECOS DE AETHELGARD — main.js  (Fases 1-8)
   LORE íntegro de Fase 7 + Leaderboard Fase 8
   ============================================= */
'use strict';

// ═══════════════════════════════════════════════════════
// §1  CONFIGURACIÓN GLOBAL
// ═══════════════════════════════════════════════════════

const CFG = {
    PLAYER_MAX_LIVES: 5,
    COMBO_WINDOW_MS: 600,
    SPAWN_MIN_MS: 3500,
    SPAWN_MAX_MS: 5000,
    REACTION_BASE_MS: 3500,
    REACTION_MIN_MS: 1200,
    ELITE_BASE_PROB: 0.10,
    ELITE_MAX_PROB: 0.60,
    COMMON_LEVELS: 30,
    BRANCH_LEVELS: 10,
    FINAL_BOSS_LIVES: 20,
    FINAL_BOSS_SHIFT_S: 8,
    BOSS_RAGE_THRESHOLD: 5,
    BOSS_RAGE_SPEED_MOD: 0.80,
};

const DIRECTIONS = {
    ArrowLeft: { name: 'izquierda', label: '←', pan: -1.0 },
    ArrowRight: { name: 'derecha', label: '→', pan: 1.0 },
    ArrowUp: { name: 'arriba', label: '↑', pan: 0.0, pitch: 'high' },
    ArrowDown: { name: 'abajo', label: '↓', pan: 0.0, pitch: 'low' },
};
const DIR_KEYS = Object.keys(DIRECTIONS);

const ELEMENTS = {
    a: { name: 'Agua', icon: '💧' },
    s: { name: 'Fuego', icon: '🔥' },
    d: { name: 'Tierra', icon: '🪨' },
    f: { name: 'Viento', icon: '💨' },
};

const DUAL_SPELLS = {
    'Agua+Fuego': 'Vapor Abrasador',
    'Agua+Tierra': 'Ciénaga',
    'Agua+Viento': 'Tormenta de Hielo',
    'Fuego+Tierra': 'Lava Ardiente',
    'Fuego+Viento': 'Llamarada Ciclónica',
    'Tierra+Viento': 'Vendaval de Polvo',
};

const ENEMIES = {
    wolf_fire: { id: 'wolf_fire', name: 'Lobo de Fuego', tier: 'basic', lives: 1, weak: ['Agua'], curative: ['Fuego'], criticalHit: null, criticalCure: null, audioFreq: 180 },
    bat_wind: { id: 'bat_wind', name: 'Murciélago de Viento', tier: 'basic', lives: 1, weak: ['Fuego'], curative: ['Viento'], criticalHit: null, criticalCure: null, audioFreq: 440 },
    golem_earth: { id: 'golem_earth', name: 'Gólem de Tierra', tier: 'basic', lives: 1, weak: ['Viento'], curative: ['Tierra'], criticalHit: null, criticalCure: null, audioFreq: 90 },
    frog_water: { id: 'frog_water', name: 'Rana de Agua', tier: 'basic', lives: 1, weak: ['Tierra'], curative: ['Agua'], criticalHit: null, criticalCure: null, audioFreq: 280 },
    magma_elem: { id: 'magma_elem', name: 'Elemental de Magma', tier: 'elite', lives: 5, weak: ['Agua', 'Viento'], curative: ['Fuego', 'Tierra'], criticalHit: 'Tormenta de Hielo', criticalCure: 'Lava Ardiente', audioFreq: 120 },
    storm_spec: { id: 'storm_spec', name: 'Espectro Tormenta', tier: 'elite', lives: 5, weak: ['Tierra', 'Fuego'], curative: ['Agua', 'Viento'], criticalHit: 'Lava Ardiente', criticalCure: 'Tormenta de Hielo', audioFreq: 320 },
    ent_forest: { id: 'ent_forest', name: 'Ent del Bosque', tier: 'elite', lives: 5, weak: ['Fuego', 'Viento'], curative: ['Tierra', 'Agua'], criticalHit: 'Llamarada Ciclónica', criticalCure: 'Ciénaga', audioFreq: 200 },
    djinn_desert: { id: 'djinn_desert', name: 'Djinn del Desierto', tier: 'elite', lives: 5, weak: ['Agua', 'Fuego'], curative: ['Viento', 'Tierra'], criticalHit: 'Vapor Abrasador', criticalCure: 'Vendaval de Polvo', audioFreq: 360 },
    boss_fire: { id: 'boss_fire', name: 'Señor de las Cenizas', tier: 'boss', lives: 10, weak: ['Agua'], curative: ['Fuego'], criticalHit: 'Tormenta de Hielo', criticalCure: 'Lava Ardiente', audioFreq: 150 },
    boss_water: { id: 'boss_water', name: 'Leviatán Abisal', tier: 'boss', lives: 10, weak: ['Tierra'], curative: ['Agua'], criticalHit: 'Lava Ardiente', criticalCure: 'Ciénaga', audioFreq: 60 },
    boss_wind: { id: 'boss_wind', name: 'Rey de los Vendavales', tier: 'boss', lives: 10, weak: ['Fuego'], curative: ['Viento'], criticalHit: 'Llamarada Ciclónica', criticalCure: 'Vendaval de Polvo', audioFreq: 480 },
    boss_earth: { id: 'boss_earth', name: 'Titán de la Montaña', tier: 'boss', lives: 10, weak: ['Viento'], curative: ['Tierra'], criticalHit: 'Vendaval de Polvo', criticalCure: 'Ciénaga', audioFreq: 70 },
    final_boss: { id: 'final_boss', name: 'Avatar del Silencio', tier: 'final', lives: 20, weak: [], curative: [], criticalHit: null, criticalCure: null, audioFreq: 220 },
};

const ROUTES = {
    fire: { name: 'Fuego', key: 'ArrowUp', boss: 'boss_fire', achievement: 'branch_fire', bgm: 'bgm_fire', pool: ['wolf_fire', 'frog_water', 'magma_elem', 'djinn_desert'] },
    water: { name: 'Agua', key: 'ArrowDown', boss: 'boss_water', achievement: 'branch_water', bgm: 'bgm_water', pool: ['frog_water', 'wolf_fire', 'storm_spec', 'ent_forest'] },
    wind: { name: 'Viento', key: 'ArrowLeft', boss: 'boss_wind', achievement: 'branch_wind', bgm: 'bgm_wind', pool: ['bat_wind', 'golem_earth', 'djinn_desert', 'storm_spec'] },
    earth: { name: 'Tierra', key: 'ArrowRight', boss: 'boss_earth', achievement: 'branch_earth', bgm: 'bgm_earth', pool: ['golem_earth', 'bat_wind', 'ent_forest', 'magma_elem'] },
};

const ACHIEVEMENTS_DEF = [
    { id: 'first_kill', name: 'Primera Sangre', desc: 'Derrota a tu primer enemigo.' },
    { id: 'branch_fire', name: 'Señor del Fuego', desc: 'Completa la ruta de Fuego.' },
    { id: 'branch_water', name: 'Guardián del Agua', desc: 'Completa la ruta de Agua.' },
    { id: 'branch_wind', name: 'Voz del Viento', desc: 'Completa la ruta de Viento.' },
    { id: 'branch_earth', name: 'Corazón de Piedra', desc: 'Completa la ruta de Tierra.' },
    { id: 'final_boss', name: 'Ecos Eternos', desc: 'Derrota al Avatar del Silencio.' },
];
const BRANCH_ACH_IDS = ['branch_fire', 'branch_water', 'branch_wind', 'branch_earth'];

// ═══════════════════════════════════════════════════════
// §2  DATOS MOCK LEADERBOARD  (Fase 8)
// ═══════════════════════════════════════════════════════

const LEADERBOARD_MOCK = [
    {
        id: 'usr_elena', nombre: 'Elena la Silenciosa', nivel: 34, tiempoJugado: 7800,
        jefesDerrotados: ['Señor de las Cenizas', 'Leviatán Abisal', 'Rey de los Vendavales', 'Titán de la Montaña'],
        estado: 'online',
    },
    {
        id: 'usr_rodrigo', nombre: 'Rodrigo Ceniza', nivel: 28, tiempoJugado: 5040,
        jefesDerrotados: ['Señor de las Cenizas', 'Leviatán Abisal'],
        estado: 'offline',
    },
    {
        id: 'usr_naia', nombre: 'Naia del Abismo', nivel: 41, tiempoJugado: 12300,
        jefesDerrotados: ['Señor de las Cenizas', 'Leviatán Abisal', 'Rey de los Vendavales', 'Titán de la Montaña', 'Avatar del Silencio'],
        estado: 'online',
    },
    {
        id: 'usr_tomeu', nombre: 'Tomeu Viento Norte', nivel: 15, tiempoJugado: 1920,
        jefesDerrotados: [],
        estado: 'offline',
    },
];

// ═══════════════════════════════════════════════════════
// §3  LORE — Diccionario completo (Fase 7, íntegro)
// ═══════════════════════════════════════════════════════

const LORE = {

    echos: {

        1: [
            `Bienvenido a Aethelgard.`,

            `Cierra los ojos. No porque no puedas ver, sino porque en este mundo, ` +
            `los ojos ya no sirven de nada. Lo que una vez fue un reino de luz y armonía ` +
            `es ahora un mar de oscuridad donde solo el sonido dice la verdad. ` +
            `Cada crujido, cada rugido, cada silbido en el aire es una advertencia. ` +
            `Aprende a escucharlos. Tu vida depende de ello.`,

            `Hace exactamente cuarenta y siete días, el Gran Eco se quebró. ` +
            `Así lo llamamos los supervivientes: el Gran Eco, ese equilibrio invisible ` +
            `que mantenía a los cuatro elementos en danza perpetua. ` +
            `Nadie sabe cómo ocurrió. Algunos dicen que fue un experimento de la Academia. ` +
            `Otros hablan de una voz muy antigua que fue despertada sin querer ` +
            `por un aprendiz demasiado ambicioso. La mayoría simplemente llama a lo que vino ` +
            `el Silencio, porque eso es lo que hace: silencia. Primero las risas. ` +
            `Luego las canciones. Luego los nombres.`,

            `Los maestros de la Academia de los Ecos pasaron años enseñándonos ` +
            `que cada elemento tiene su voz y que cada voz tiene su respuesta. ` +
            `El Fuego habla con calor y rabia, y el Agua puede acallarlo. ` +
            `El Viento grita a través de las grietas, y el Fuego puede domarlo. ` +
            `La Tierra murmura con paciencia milenaria, y el Viento puede moverla. ` +
            `El Agua fluye sin cesar, y la Tierra puede detenerla. ` +
            `Esto no es magia. Es escucha activa. Es respuesta justa. ` +
            `Es lo único que queda entre nosotros y la extinción total.`,

            `Tú eres el último en pie. No te pregunto si estás preparado. ` +
            `Nadie lo está nunca. Solo te digo esto: ` +
            `cuando escuches el sonido de algo que se acerca, ` +
            `no pienses. Siente el elemento en su voz. ` +
            `Y respóndele con el opuesto. ` +
            `Esa es toda la sabiduría que me queda para darte.`,

            `Que los ecos te guíen, invocador. Comienza.`,
        ],

        10: [
            `Aquí llega un eco del pasado. La voz que escuchas ahora ` +
            `pertenece a la Maestra Sylvara, Guardiana del Segundo Anillo de la Academia. ` +
            `Esta grabación fue encontrada en los archivos sellados del sótano norte. ` +
            `Fecha: dieciséis días antes del Gran Eco.`,

            `"Si alguien escucha esto, significa que yo ya no estoy. ` +
            `Y si yo no estoy, significa que la Academia ha caído. ` +
            `Así que escucha bien, desconocido, porque lo que voy a decirte ` +
            `costó la vida de veintidós estudiantes descubrirlo.`,

            `El Silencio no destruye los elementos. Los pervierte. ` +
            `Una criatura corrompida por el Silencio lleva dentro ` +
            `el elemento que la creó, pero retorcido, enfermizo. ` +
            `Si intentas combatirla con su propio elemento, ` +
            `no la dañas. La alimentas. La haces más grande, más rápida, más hambrienta. ` +
            `Hemos visto a aprendices lanzar Fuego contra lobos de Fuego ` +
            `y ver cómo los animales se duplicaban ante sus ojos aterrorizados.`,

            `La respuesta siempre es el opuesto. Siempre. ` +
            `Pero hay algo más sutil que mis colegas ignoraron: ` +
            `las criaturas élite, las que han absorbido más Silencio, ` +
            `no responden igual a un solo elemento. ` +
            `Para ellas necesitas combinar dos voces elementales en un solo grito. ` +
            `Solo así las heridas son profundas. Solo así sangran de verdad. ` +
            `Aprende los dúos. Practica los dúos. Los dúos son la diferencia entre vivir y desaparecer."`,

            `Fin de la grabación. La Maestra Sylvara no sobrevivió a la caída de la Academia. ` +
            `Pero sus palabras sí. Úsalas bien.`,
        ],

        '15_shadow': [
            `...`,
            `¿Crees que no te veo, pequeño mago?`,
            `He observado cada uno de tus pasos desde que pusiste el pie en estas ruinas. ` +
            `He contado cada vez que respiraste demasiado rápido. ` +
            `Cada vez que dudaste. Cada vez que casi fallaste.`,
            `Llegarás al umbral. Lo sé. Eso es exactamente lo que quiero.`,
            `Ven a mí. Ven a mí y te mostraré lo que realmente es el Silencio ` +
            `cuando no tiene que contenerse.`,
            `...`,
        ],

        20: [
            `Otro eco. Esta vez la voz es más joven, más quebrada. ` +
            `El Archivero Tomás, aprendiz de tercer año. ` +
            `Esta grabación es la última entrada de su diario personal. ` +
            `Lleva la fecha del día del Gran Eco.`,

            `"No sé si esto llegará a alguien. La Academia arde. ` +
            `No con Fuego elemental, que eso podríamos combatirlo. ` +
            `Arde con algo que no tiene nombre todavía. ` +
            `Un frío que quema. Una oscuridad que suena. ` +
            `Los maestros no lo vieron venir porque buscaban una amenaza externa. ` +
            `Nunca imaginaron que el Silencio nacería de dentro, ` +
            `del hueco entre los cuatro elementos, ` +
            `de ese espacio vacío que siempre dimos por sentado.`,

            `He visto cosas esta noche que no voy a describir. ` +
            `Solo diré esto: los guardianes han caído. ` +
            `Ignar, el Gran Herrero, ya no responde a su nombre. ` +
            `Rok, la Memoria Viva, ha dejado de moverse y aplasta todo lo que toca sin distinción. ` +
            `Zael no lleva mensajes. Solo lleva destrucción. ` +
            `Y la Gran Corriente ya no canta.`,

            `Si llegas al nivel treinta, invocador, significa que eres extraordinario. ` +
            `O que eres el único que queda. Puede que ambas cosas. ` +
            `Lo que te espera después del treinta no es un nivel más difícil. ` +
            `Es una decisión. La decisión más importante que nadie ha tomado en Aethelgard. ` +
            `Elige con el corazón, no con la cabeza. ` +
            `Los guardianes corrompidos aún guardan algo suyo dentro. ` +
            `Algo que espera ser liberado. ` +
            `Tú no vas a matarlos. Vas a purificarlos.`,

            `Eso espero. Eso rezo. Que alguien sea capaz de purificarlos."`,

            `Fin. El Archivero Tomás tampoco sobrevivió. ` +
            `Pero dejó encendida una luz muy pequeña en este mundo oscuro. ` +
            `Esa luz eres tú.`,
        ],

        '25_shadow': [
            `...`,
            `Ja. Ja. Ja.`,
            `¿Ves cómo te acercas? ¿Ves cómo no puedes evitarlo? ` +
            `Pensabas que tenías elección. Pensabas que eras el héroe de esta historia.`,
            `No hay héroes en el Silencio, pequeño. Solo hay ecos que se apagan.`,
            `Cuando vengas a mí, y vendrás, tráeme tus miedos. ` +
            `Son lo único que me alimenta ya.`,
            `Solo... el... silencio...`,
            `...`,
        ],

        30: [
            `Para. Escúchame.`,

            `Has llegado al umbral del nivel treinta. ` +
            `En cincuenta y cuatro años de historia de la Academia de los Ecos, ` +
            `solo once magos llegaron aquí con vida. ` +
            `Solo dos pasaron de largo. ` +
            `Solo uno volvió para contarlo, ` +
            `y lo que contó lo dejó incapaz de pronunciar otra palabra en el resto de su vida.`,

            `Lo que hay al otro lado de este umbral no son más enemigos. ` +
            `Son los guardianes de Aethelgard. Los seres que durante siglos ` +
            `mantuvieron el equilibrio elemental del mundo con su sola presencia. ` +
            `Ahora son prisioneros dentro de sus propios cuerpos corrompidos, ` +
            `esclavos del Silencio que los consume desde dentro. ` +
            `Cada golpe que les des no es un acto de violencia. ` +
            `Es un acto de misericordia. Es una cadena que rompes.`,

            `Pero te advierto, porque sería deshonesto no hacerlo: ` +
            `van a intentar matarte. ` +
            `No porque te odien. Sino porque el Silencio que los habita ` +
            `sí que te odia. ` +
            `Con una intensidad que no tiene medida en ningún idioma que conozcas.`,

            `En un momento tendrás que elegir un camino. ` +
            `Cuatro guardianes. Cuatro elementos. Cuatro tragedias distintas. ` +
            `Escucha bien cuando te cuente su historia ` +
            `porque entender su dolor es la mitad de derrotarlos.`,

            `Respira. El umbral te espera. ` +
            `Que los ecos de los caídos te acompañen al otro lado.`,
        ],

    },

    bosses: {

        fire: {
            preRoute: [
                `Las Tierras de Escoria. Una vez fueron los talleres más gloriosos de Aethelgard, ` +
                `donde el Fuego elemental no destruía sino que creaba. ` +
                `Ahora el suelo cruje bajo tus pies como hueso calcinado ` +
                `y el horizonte permanece eternamente anaranjado por brasas que nunca se apagan.`,

                `Ignar. Antes de que el Silencio lo tocara, ese nombre significaba creación. ` +
                `Era el Gran Herrero, el único ser vivo capaz de conversar con el Fuego elemental ` +
                `en su propio idioma, un lenguaje hecho de chasquidos y calor y luz. ` +
                `Sus obras eran legendarias: escudos que nunca se rompían, ` +
                `espadas que cantaban al cortar el aire, ` +
                `campanas cuyo repique se oía a tres valles de distancia. ` +
                `No era un guerrero. Era un artista. El mayor artista que Aethelgard haya conocido.`,

                `Cuando el Silencio llegó, Ignar hizo lo que siempre hacía con los problemas: ` +
                `intentó forjarlos. Intentó crear algo lo suficientemente fuerte ` +
                `como para contener la oscuridad. Avivó sus forjas hasta niveles ` +
                `que ningún ser mortal había alcanzado. ` +
                `El Fuego elemental obedeció. Obedeció hasta que dejó de hacerlo. ` +
                `Y cuando el Fuego se volvió contra su maestro, ` +
                `el Silencio ya estaba dentro, alimentándose de la desesperación de Ignar, ` +
                `transformando su amor por la creación en una sed insaciable de destrucción.`,

                `Lo que vas a enfrentar no es Ignar. ` +
                `Es la cáscara de Ignar, habitada por el Silencio, ` +
                `que usa sus manos maestras para deshacer en vez de crear. ` +
                `Pero en algún lugar dentro de ese infierno andante ` +
                `sigue existiendo el artista. Pequeño. Asustado. Atrapado. ` +
                `Esperando que alguien sea lo suficientemente valiente ` +
                `como para apagar las llamas que ya no le pertenecen.`,

                `Úsalas bien. El Agua tiene la gentileza que el Fuego ha olvidado. ` +
                `Avanza hacia las cenizas, invocador. Ignar lleva demasiado tiempo solo.`,
            ],

            rage: `¡ARDES! ¡TODO ARDERÁ CONTIGO! ` +
                `¡NO PUEDES APAGAR LO QUE YO SOY, LO QUE SIEMPRE HE SIDO, ` +
                `LO QUE EL SILENCIO ME HA HECHO VER QUE SOY! ` +
                `¡MIS FORJAS SON ETERNAS Y TÚ ERES POLVO!`,

            victory: [
                `Las llamas se apagan una a una, como velas al final de una vigilia. ` +
                `El suelo deja de temblar. El calor se retira despacio, ` +
                `como si la tierra misma exhalara un suspiro de alivio eterno.`,

                `Y entonces lo ves. O mejor dicho, lo sientes. ` +
                `Una presencia cálida, pero no abrasadora. Cálida como un hogar, ` +
                `como el primer fuego de invierno, como las manos de alguien ` +
                `que te quiere y está a punto de irse.`,

                `Una voz. Apenas un susurro, pero clara como el primer amanecer: ` +
                `"Lo sabía. Sabía que alguien vendría. ` +
                `Gracias por no rendirte. Gracias por no dejar de escuchar." ` +
                `Una pausa. Un último destello de luz dorada. ` +
                `"Cuida el fuego, invocador. El fuego que da calor, no el que consume. ` +
                `Ese siempre fue el verdadero."`,

                `Ignar se desvanece. No como algo que muere, ` +
                `sino como algo que finalmente descansa. ` +
                `Las Tierras de Escoria comienzan a enfriarse. Lentamente. ` +
                `Pero es un comienzo.`,
            ],
        },

        water: {
            preRoute: [
                `Las Fosas Abisales. Un lugar donde la presión del agua ` +
                `es tan grande que aplasta el pensamiento antes que los huesos. ` +
                `El sonido aquí es diferente: más grave, más lento, ` +
                `como si el tiempo mismo se moviera con la densidad del abismo.`,

                `La Gran Corriente. Así se llamaba a sí mismo el ser ` +
                `que ahora yace en el fondo de estas aguas corrompidas. ` +
                `No tenía un nombre como los humanos entienden los nombres. ` +
                `Era simplemente el movimiento, la conexión fluida entre todos los océanos, ` +
                `lagos y ríos de Aethelgard. Donde él pasaba, el agua recordaba su propósito. ` +
                `Los pescadores lo amaban. Los navegantes le rezaban. ` +
                `Los niños de las costas le cantaban por las noches ` +
                `y juraban escuchar su respuesta en el rumor de las olas.`,

                `El Silencio llegó al agua de una manera diferente que al Fuego. ` +
                `No lo atacó. Lo paralizó. ` +
                `Fue como si alguien hubiera detenido el tiempo en el interior de la Gran Corriente. ` +
                `El movimiento perpetuo se convirtió en quietud. ` +
                `Y en esa quietud nació algo terrible: ` +
                `un hambre de movimiento imposible de saciar ` +
                `que solo puede expresarse jalando todo hacia el fondo, ` +
                `hacia la oscuridad donde ya nada se mueve ` +
                `porque ya nada existe.`,

                `El Leviatán Abisal no quiere matarte. ` +
                `Eso sería demasiado simple. ` +
                `Quiere retenerte. Quiere que te quedes. ` +
                `Quiere que la quietud que lo consume te consuma también. ` +
                `Porque en su interior corrupto, la soledad es lo único que le queda, ` +
                `y la soledad compartida es la única forma que le queda de amar.`,

                `La Tierra puede anclarte. Puede darte el peso suficiente ` +
                `para no ser arrastrado por las profundidades. ` +
                `Desciende, invocador. La Gran Corriente espera que alguien ` +
                `le recuerde cómo fluir.`,
            ],

            rage: `¡QUÉDATE! ¡TODOS SE QUEDAN AL FINAL! ` +
                `¡EL ABISMO NO SUELTA, EL ABISMO NUNCA SUELTA, ` +
                `Y TÚ SERÁS EL ÚLTIMO ECO EN ESTAS AGUAS ETERNAS! ` +
                `¡VEN A MÍ! ¡VEN ABAJO DONDE TODO ES PAZ, DONDE TODO ES OSCURIDAD, ` +
                `DONDE TODO ES SILENCIO PARA SIEMPRE!`,

            victory: [
                `El agua comienza a moverse. Primero despacio, casi imperceptiblemente. ` +
                `Luego con más decisión, con más alegría. ` +
                `Una corriente nace en el punto exacto donde el Leviatán cayó, ` +
                `y se expande hacia afuera como los círculos que deja una piedra en un estanque.`,

                `El sonido cambia. Ya no es ese grave aplastante del abismo. ` +
                `Es algo más antiguo, más musical. ` +
                `Como un canto que hubiera estado contenido durante demasiado tiempo ` +
                `y ahora por fin puede respirar.`,

                `Sientes algo tocar tu mano bajo el agua. No es una mano. ` +
                `Es solo una corriente, pero tiene la gentileza de una mano. ` +
                `Y escuchas, o quizás imaginas, algo que suena como palabras: ` +
                `"Gracias por devolverte. ` +
                `Gracias por recordarme que fluir no es debilidad. ` +
                `Es la forma más valiente de existir."`,

                `La Gran Corriente vuelve al mar. ` +
                `Y el mar, por primera vez en cuarenta y siete días, ` +
                `vuelve a escucharse desde la costa.`,
            ],
        },

        wind: {
            preRoute: [
                `La Meseta de los Ecos Rotos. ` +
                `Un lugar donde el viento no descansa nunca, ` +
                `pero tampoco lleva ningún mensaje. ` +
                `Solo grita. Un grito que lleva tanto tiempo sonando ` +
                `que ya nadie recuerda qué intentaba decir.`,

                `Zael. El nombre suena como el propio viento: breve, agudo, libre. ` +
                `O al menos así sonaba antes. ` +
                `Era el mensajero de Aethelgard, ` +
                `el ser más rápido que existía y el más necesario. ` +
                `En un mundo sin caminos seguros, sin comunicación fiable, ` +
                `Zael era el hilo que cosía las comunidades unas con otras. ` +
                `Llevaba noticias de nacimientos y muertes. ` +
                `Llevaba peticiones de ayuda y promesas de amor. ` +
                `Llevaba advertencias. ` +
                `Intentó llevar una advertencia sobre el Silencio.`,

                `Nadie lo escuchó. ` +
                `Corrió de pueblo en pueblo, de montaña en montaña, ` +
                `gritando con toda la fuerza que el viento le daba. ` +
                `Y nadie. Levantó la vista. ` +
                `Porque los humanos llevan siglos aprendiendo a ignorar el viento. ` +
                `A verlo como ruido de fondo, como algo inevitable y sin importancia. ` +
                `La desesperación de no ser escuchado ` +
                `fue exactamente la grieta que el Silencio necesitaba. ` +
                `Entró por ahí y transformó al mensajero en la tormenta. ` +
                `Si nadie quiere escuchar el viento, ` +
                `que el viento se asegure de que no puedan ignorarlo.`,

                `El Rey de los Vendavales no destruye por crueldad. ` +
                `Destruye por la rabia acumulada de haber sido ignorado ` +
                `cuando más importaba. ` +
                `Cada ráfaga que lanza es una advertencia que nadie oyó. ` +
                `Cada tormenta es un grito de auxilio que llegó demasiado tarde.`,

                `El Fuego puede calentar lo que el frío de la soledad ha congelado. ` +
                `Sube a la meseta, invocador. ` +
                `Y esta vez, escucha. Escucha de verdad lo que el viento lleva.`,
            ],

            rage: `¡ESCÚCHAME! ¡AHORA SÍ QUE ME ESCUCHARÁS! ` +
                `¡CUANDO EL VENDAVAL LO ARRASTRA TODO NO HAY FORMA DE MIRAR HACIA OTRO LADO! ` +
                `¡DEMASIADO TARDE VINISTE, DEMASIADO TARDE PARA TODOS! ` +
                `¡EL VIENTO QUE ADVERTÍA SE HA CONVERTIDO EN EL VIENTO QUE COBRA!`,

            victory: [
                `El viento cae. ` +
                `No de golpe, sino como cuando una persona agotada por fin se permite descansar. ` +
                `La Meseta de los Ecos Rotos queda en silencio por primera vez en semanas. ` +
                `Pero es un silencio diferente al del Silencio. ` +
                `Es el silencio de la paz. El silencio que viene después de las lágrimas.`,

                `Y entonces el viento vuelve. ` +
                `Suave. Gentil. Como solía ser. ` +
                `Rodea tu cuerpo con una calidez imposible para el aire en estas alturas ` +
                `y entiendes que es un abrazo. El único abrazo que puede dar alguien ` +
                `hecho de aire y libertad.`,

                `Las palabras llegan dispersas, como siempre llegan las palabras del viento: ` +
                `"...te escuché... ` +
                `...me escuchaste... ` +
                `...eso era todo lo que necesitaba... ` +
                `...lleva mi voz a donde haga falta... ` +
                `...yo seguiré. Siempre sigo."`,

                `Y el viento continúa su camino. ` +
                `Pero ahora lleva algo diferente: ` +
                `el eco de una historia que por fin tuvo final.`,
            ],
        },

        earth: {
            preRoute: [
                `El Corazón de Piedra. ` +
                `Un lugar tan antiguo que los mapas de la Academia ` +
                `ni siquiera intentaban representarlo con precisión. ` +
                `"Aquí el suelo recuerda", ponía en los bordes del mapa. ` +
                `Solo eso. ` +
                `Los cartógrafos que intentaron ir más lejos no volvieron para corregirlo.`,

                `Rok. ` +
                `No es un nombre que alguien le pusiera. ` +
                `Es el nombre que él mismo se dio cuando los primeros humanos ` +
                `intentaron comunicarse con él y él necesitó una manera de responder. ` +
                `Rok, decía, como el sonido de una piedra cayendo en el agua. ` +
                `Corto. Definitivo. Exacto. ` +
                `Era la Memoria Viva de Aethelgard, ` +
                `el guardián de todo lo que había existido antes de que hubiera palabras ` +
                `para nombrarlo. ` +
                `Cuando los magos necesitaban entender algo muy antiguo, ` +
                `algo perdido en el tiempo antes de los registros escritos, ` +
                `iban a Rok. Y Rok recordaba. Siempre recordaba.`,

                `El Silencio no atacó a Rok. No se atrevió, al principio. ` +
                `Rok era demasiado grande, demasiado antiguo, ` +
                `demasiado profundamente arraigado en la realidad de Aethelgard. ` +
                `Así que el Silencio esperó. ` +
                `Fue borrando recuerdos, uno por uno, ` +
                `tan despacio que Rok no lo notaba. ` +
                `Un siglo. Dos siglos. Tres. ` +
                `Hasta que la Memoria Viva comenzó a olvidar. ` +
                `Y cuando Rok comprendió que estaba olvidando, ` +
                `el terror que sintió fue tan absoluto, tan incompatible con su naturaleza, ` +
                `que el Silencio pudo entrar por las grietas que el terror abrió.`,

                `El Titán de la Montaña no aplasta por maldad. ` +
                `Aplasta porque olvidó que había algo más. ` +
                `Aplasta porque el peso de lo que ya no recuerda ` +
                `es el único peso que le queda, ` +
                `y no sabe qué hacer con él salvo descargarlo sobre el mundo.`,

                `El Viento puede llevar lo que la piedra no puede soltar. ` +
                `Penetra en el Corazón de Piedra, invocador. ` +
                `Dale a Rok algo que recordar en sus últimos momentos. ` +
                `Ese recuerdo puedes ser tú.`,
            ],

            rage: `¡ROK RECUERDA! ¡ROK AÚN RECUERDA ALGO! ` +
                `¡RECUERDA EL PESO! ¡RECUERDA EL APLASTAMIENTO! ` +
                `¡RECUERDA QUE TODO LO QUE EXISTE TERMINA POR DESMORONARSE ` +
                `BAJO EL PESO DE LO QUE FUE Y YA NO ES! ` +
                `¡TÚ TAMBIÉN SERÁS POLVO, PEQUEÑA VOZ, POLVO Y SILENCIO!`,

            victory: [
                `La tierra se detiene. ` +
                `No el tipo de quietud ominosa que había antes. ` +
                `La quietud de algo que finalmente puede descansar ` +
                `después de un esfuerzo demasiado largo.`,

                `Sientes el suelo vibrar bajo tus pies. ` +
                `No de manera amenazante. ` +
                `Como un latido muy, muy lento. ` +
                `Como si la montaña entera respirara.`,

                `Y desde las profundidades de la piedra, ` +
                `tan bajo que lo sientes más en el pecho que en los oídos, ` +
                `llega algo que podría ser lenguaje: ` +
                `"...recuerdo. ` +
                `Recuerdo la primera vez que los humanos pusieron una mano en la piedra ` +
                `y preguntaron quién era yo. ` +
                `Recuerdo que respondí. ` +
                `Recuerdo que eso fue hermoso. ` +
                `Gracias por preguntarme otra vez."`,

                `El Corazón de Piedra se asienta. ` +
                `Profundamente, irrevocablemente, en paz. ` +
                `Y en las paredes de roca, si sabes escuchar, ` +
                `puedes oír el comienzo de algo que suena, muy remotamente, ` +
                `a memoria.`,
            ],
        },

    },

    finalBoss: {
        intro: [
            `Entonces has venido. Los cuatro guardianes han sido liberados. ` +
            `Las cuatro rutas han sido purificadas. ` +
            `Y ahora estás aquí, en el centro de todo, ` +
            `en el lugar donde el Silencio comenzó.`,

            `Soy lo que queda cuando se quita todo lo demás. ` +
            `No soy un guardián corrompido. No tengo historia trágica que te expliquen ` +
            `ni espíritu que liberar. ` +
            `Soy el espacio entre los elementos. ` +
            `Soy el hueco que nadie pensó en llenar. ` +
            `Soy la pausa entre dos notas que se volvió más larga que la música misma.`,

            `Has aprendido a escuchar. Eso es admirable. ` +
            `Pero yo cambio. No tengo elemento fijo. ` +
            `Soy todos y ninguno, y cambiaré una y otra vez ` +
            `hasta que tus reflejos fallen, hasta que tu concentración se quiebre, ` +
            `hasta que el agotamiento te haga cometer el error que yo llevo esperando.`,

            `Veinte vidas. Las contaré contigo, invocador. ` +
            `Porque incluso yo puedo apreciar la rareza de alguien ` +
            `que llega hasta aquí. ` +
            `Será una lástima que termine igual que todos los demás.`,
        ],

        victory: [
            `Algo cambia en el aire. ` +
            `No lo percibes de inmediato porque nunca has sentido esto antes. ` +
            `Nadie vivo lo ha sentido. ` +
            `Es la ausencia del Silencio. ` +
            `Un vacío que, paradójicamente, suena. ` +
            `Suena a todo lo que el Silencio había estado acallando.`,

            `Los cuatro elementos regresan. ` +
            `No violentamente, no en explosión. ` +
            `Regresan como el amanecer: inevitablemente, con calma, sin pedir permiso. ` +
            `El calor del Fuego devuelto. El murmullo del Agua liberada. ` +
            `El susurro del Viento que retoma su camino. ` +
            `El pulso de la Tierra que vuelve a latir.`,

            `Y desde todas partes a la vez, ` +
            `desde el Fuego y el Agua y el Viento y la Tierra, ` +
            `cuatro voces que reconoces: Ignar, la Gran Corriente, Zael, Rok. ` +
            `No dicen palabras. Solo hacen lo que hacían antes del Silencio. ` +
            `Simplemente están ahí. ` +
            `Y ese estar es el sonido más hermoso que Aethelgard ha producido en décadas.`,

            `Tú. En el centro de todo. ` +
            `El último mago de la Academia de los Ecos. ` +
            `El que escuchó cuando nadie más podía. ` +
            `El que respondió cuando todo decía que era imposible.`,

            `Los ecos de Aethelgard permanecen. ` +
            `Gracias a ti, permanecen.`,
        ],
    },

};

// ═══════════════════════════════════════════════════════
// §4  Storage
// ═══════════════════════════════════════════════════════

class Storage {
    static #PRE = 'aethelgard_user_';
    static #LAST = 'aethelgard_last_user';
    static #OPTS = 'aethelgard_options';

    static save(p) { localStorage.setItem(this.#PRE + p.username.toLowerCase(), JSON.stringify(p)); localStorage.setItem(this.#LAST, p.username); }
    static load(u) { const r = localStorage.getItem(this.#PRE + u.toLowerCase()); return r ? JSON.parse(r) : null; }
    static lastUser() { return localStorage.getItem(this.#LAST) || ''; }
    static saveOpts(o) { localStorage.setItem(this.#OPTS, JSON.stringify(o)); }
    static loadOpts() { const r = localStorage.getItem(this.#OPTS); return r ? JSON.parse(r) : { speechRate: 1.0 }; }
    static newProfile(u) {
        return {
            username: u, createdAt: Date.now(), lastPlayed: Date.now(),
            currentLevel: 1, branch: null, introSeen: false, echosSeen: [],
            achievements: [], bossesDefeated: [],
            stats: { kills: 0, deaths: 0, spells: 0 },
        };
    }
}

// ═══════════════════════════════════════════════════════
// §5  Options
// ═══════════════════════════════════════════════════════

class Options {
    #d; #step = 0.1; #min = 0.5; #max = 2.5;
    constructor() { this.#d = Storage.loadOpts(); }
    get rate() { return this.#d.speechRate; }
    #clamp(v) { return Math.min(this.#max, Math.max(this.#min, +v.toFixed(1))); }
    increase() { this.#d.speechRate = this.#clamp(this.#d.speechRate + this.#step); this.#save(); }
    decrease() { this.#d.speechRate = this.#clamp(this.#d.speechRate - this.#step); this.#save(); }
    #save() { Storage.saveOpts(this.#d); this.#render(); }
    #render() { const el = document.getElementById('speed-display'); if (el) el.textContent = this.#d.speechRate.toFixed(1) + '×'; }
    syncDisplay() { this.#render(); }
}

// ═══════════════════════════════════════════════════════
// §6  Speech  (anti-autoplay + narrate async)
// ═══════════════════════════════════════════════════════

class Speech {
    #synth; #opts; #ready = false; #queue = [];

    constructor(opts) {
        this.#synth = window.speechSynthesis;
        this.#opts = opts;
        const unlock = () => {
            if (this.#ready) return;
            this.#ready = true;
            try { const u = new SpeechSynthesisUtterance(''); u.volume = 0; this.#synth.speak(u); } catch (_) { }
            const pending = [...this.#queue]; this.#queue = [];
            pending.forEach(({ text, opts }) => this.#doSpeak(text, opts));
        };
        ['click', 'keydown', 'touchstart'].forEach(ev =>
            document.addEventListener(ev, unlock, { once: false, passive: true })
        );
    }

    say(text, opts = {}) {
        if (!this.#synth || !text) return;
        if (!this.#ready) {
            if (opts.interrupt) this.#queue = [];
            this.#queue.push({ text, opts });
        } else {
            this.#doSpeak(text, opts);
        }
    }

    #doSpeak(text, { interrupt = false, pitch = 1.0, rate = null } = {}) {
        if (interrupt) this.#synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES'; u.rate = rate ?? this.#opts.rate; u.pitch = pitch; u.volume = 1.0;
        this.#synth.speak(u);
    }

    async narrate(paragraphs, msGap = 600, pitchOverride = null) {
        for (const p of paragraphs) {
            await this.#speakPromise(p, pitchOverride);
            await this.#pause(msGap);
        }
    }

    #speakPromise(text, pitchOverride = null) {
        return new Promise(resolve => {
            if (!this.#ready) {
                const wait = setInterval(() => {
                    if (this.#ready) { clearInterval(wait); this.#speakPromise(text, pitchOverride).then(resolve); }
                }, 100);
                return;
            }
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'es-ES'; u.rate = this.#opts.rate;
            u.pitch = pitchOverride !== null ? pitchOverride : 1.0;
            u.volume = 1.0;
            u.onend = () => resolve(); u.onerror = () => resolve();
            this.#synth.cancel(); this.#synth.speak(u);
        });
    }

    #pause(ms) { return new Promise(r => setTimeout(r, ms)); }
    cancel() { this.#synth?.cancel(); this.#queue = []; }
}

// ═══════════════════════════════════════════════════════
// §7  AudioEngine  (Web Audio API + Howler BGM opcional)
// ═══════════════════════════════════════════════════════

class AudioEngine {
    #ctx = null; #currentBgm = null; #currentBgmKey = null;

    #get() {
        if (!this.#ctx) this.#ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.#ctx.state === 'suspended') this.#ctx.resume();
        return this.#ctx;
    }

    #safe(fn) { try { fn(); } catch (e) { console.warn('[Audio]', e); } }

    #tone(freq, type, dur, pan = 0, peak = 0.4) {
        this.#safe(() => {
            const ctx = this.#get(), t = ctx.currentTime;
            const osc = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
            osc.type = type; osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(peak, t + 0.02);
            g.gain.linearRampToValueAtTime(0, t + dur);
            p.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t);
            osc.connect(g); g.connect(p); p.connect(ctx.destination);
            osc.start(t); osc.stop(t + dur);
        });
    }

    playEnemy(dirInfo, baseFreq = 440, dur = 0.7) {
        let f = baseFreq;
        if (dirInfo.pitch === 'high') f *= 2.0;
        if (dirInfo.pitch === 'low') f *= 0.5;
        this.#tone(f, 'sawtooth', dur, dirInfo.pan);
    }

    playHit(critical = false) { this.#tone(critical ? 880 : 660, 'sine', 0.3, 0, 0.5); }

    playCure(critical = false) {
        this.#safe(() => {
            const ctx = this.#get(), f = critical ? 150 : 200, dur = 0.4, t = ctx.currentTime;
            const osc = ctx.createOscillator(), g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t); osc.frequency.linearRampToValueAtTime(f * 2, t + dur);
            g.gain.setValueAtTime(0.4, t); g.gain.linearRampToValueAtTime(0, t + dur);
            osc.connect(g); g.connect(ctx.destination); osc.start(t); osc.stop(t + dur);
        });
    }

    playPlayerHit() { this.#tone(100, 'square', 0.25, 0, 0.5); }

    playLevelUp() {
        this.#safe(() => {
            const ctx = this.#get(), now = ctx.currentTime;
            [523, 659, 784, 1047].forEach((f, i) => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.type = 'sine'; o.frequency.value = f;
                g.gain.setValueAtTime(0.3, now + i * 0.12);
                g.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.2);
                o.connect(g); g.connect(ctx.destination);
                o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.2);
            });
        });
    }

    playBossShift() { this.#tone(220, 'triangle', 0.5, 0, 0.6); }
    playDeath() { this.#tone(80, 'sawtooth', 1.0, 0, 0.6); }

    loadAllBgm() {
        if (typeof Howl === 'undefined') { console.info('[BGM] Howler no disponible.'); return; }
        ['bgm_common', 'bgm_fire', 'bgm_water', 'bgm_wind', 'bgm_earth', 'bgm_final'].forEach(key => {
            try {
                this[key] = new Howl({
                    src: [`sounds/${key}.mp3`], loop: true, volume: 0.35,
                    onloaderror: (_, err) => { console.info(`[BGM] "${key}.mp3" no encontrado.`); this[key] = null; },
                });
            } catch (e) { console.warn('[BGM]', e); this[key] = null; }
        });
    }

    playBgm(key) {
        if (this.#currentBgmKey === key) return;
        this.#stopBgmFade();
        this.#currentBgmKey = key;
        const h = this[key]; if (!h) return;
        try { h.volume(0); h.play(); h.fade(0, 0.35, 2000); this.#currentBgm = h; } catch (e) { console.warn('[BGM]', e); }
    }

    stopBgm() { this.#stopBgmFade(); this.#currentBgmKey = null; }

    #stopBgmFade() {
        if (!this.#currentBgm) return;
        try {
            const prev = this.#currentBgm;
            prev.fade(prev.volume(), 0, 1500);
            setTimeout(() => { try { prev.stop(); } catch (_) { } }, 1600);
        } catch (_) { }
        this.#currentBgm = null;
    }

    loadHowl(src, key) {
        if (typeof Howl === 'undefined') return;
        try {
            this[key] = new Howl({ src: [src], loop: false, volume: 0.6, onloaderror: (_, err) => { console.info(`[SFX] "${src}" no encontrado.`); this[key] = null; } });
        } catch (e) { console.warn('[Howler]', e); }
    }

    playHowl(key) { try { if (this[key]) this[key].play(); } catch (_) { } }
}

// ═══════════════════════════════════════════════════════
// §8  ComboSystem  (ventana 600 ms — intacta)
// ═══════════════════════════════════════════════════════

class ComboSystem {
    #held = new Set(); #pending = []; #timer = null; #fired = false;
    onSpell = null;

    init() {
        document.addEventListener('keydown', e => this.#kd(e));
        document.addEventListener('keyup', e => this.#ku(e));
    }

    #kd(e) {
        if (app.screens.current !== 'combat') return;
        if (DIR_KEYS.includes(e.key)) e.preventDefault();
        if (e.repeat) return;
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        this.#held.add(k); this.#refreshDisplay();
        if (ELEMENTS[k]) {
            this.#pending.push(k); this.#fired = false;
            clearTimeout(this.#timer);
            this.#timer = setTimeout(() => { this.#pending = []; this.#fired = false; }, CFG.COMBO_WINDOW_MS);
        }
        if (DIRECTIONS[e.key] && !this.#fired) {
            const elems = [...new Set(this.#pending)];
            if (elems.length > 0) {
                this.#fired = true; clearTimeout(this.#timer);
                this.#resolve(elems, e.key); this.#pending = [];
            }
        }
    }

    #ku(e) {
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        this.#held.delete(k); this.#refreshDisplay();
        if (ELEMENTS[k]) this.#pending = this.#pending.filter(x => x !== k);
        if (DIRECTIONS[e.key]) this.#fired = false;
    }

    #resolve(elementKeys, dirKey) {
        const dir = DIRECTIONS[dirKey];
        const names = elementKeys.map(k => ELEMENTS[k].name).sort();
        const name = names.length === 1 ? names[0] : (DUAL_SPELLS[names.join('+')] || names.join(' y '));
        this.onSpell?.({
            name, type: names.length === 1 ? 'simple' : 'dual',
            elements: names, dirKey, direction: dir.name,
            dirLabel: dir.label, icons: elementKeys.map(k => ELEMENTS[k].icon).join(''), ts: Date.now(),
        });
    }

    #refreshDisplay() {
        const el = document.getElementById('keys-active');
        if (el) el.textContent = this.#held.size ? 'Teclas: ' + [...this.#held].join('+').toUpperCase() : '';
    }

    reset() { this.#held.clear(); this.#pending = []; this.#fired = false; clearTimeout(this.#timer); }
}

// ═══════════════════════════════════════════════════════
// §9  LevelManager  (Fase 6 bloques de 5 + ecos Fase 7)
// ═══════════════════════════════════════════════════════

class LevelManager {

    enemiesForLevel(lvl) { return Math.ceil(lvl / 5) * 5; }

    reactionTime(lvl) {
        const t = (Math.min(lvl, CFG.COMMON_LEVELS) - 1) / (CFG.COMMON_LEVELS - 1);
        return Math.round(CFG.REACTION_BASE_MS - t * (CFG.REACTION_BASE_MS - CFG.REACTION_MIN_MS));
    }

    eliteProb(lvl) {
        const t = (Math.min(lvl, CFG.COMMON_LEVELS) - 1) / (CFG.COMMON_LEVELS - 1);
        return CFG.ELITE_BASE_PROB + t * (CFG.ELITE_MAX_PROB - CFG.ELITE_BASE_PROB);
    }

    phase(lvl) {
        if (lvl <= CFG.COMMON_LEVELS) return 'common';
        if (lvl === CFG.COMMON_LEVELS + 1) return 'route_select';
        if (lvl <= CFG.COMMON_LEVELS + CFG.BRANCH_LEVELS + 1) return 'branch';
        return 'boss';
    }

    pickEnemy(lvl, branch, mode) {
        let pool;
        if (mode === 'practice')
            pool = Object.values(ENEMIES).filter(e => e.tier === 'basic' || e.tier === 'elite');
        else if (mode === 'branch' && branch)
            pool = ROUTES[branch].pool.map(id => ENEMIES[id]);
        else
            pool = Object.values(ENEMIES).filter(e => e.tier === 'basic' || e.tier === 'elite');
        const isElite = Math.random() < this.eliteProb(lvl);
        const filtered = isElite ? pool.filter(e => e.tier === 'elite') : pool.filter(e => e.tier === 'basic');
        const src = filtered.length > 0 ? filtered : pool;
        return src[Math.floor(Math.random() * src.length)];
    }

    pickDir() { return DIR_KEYS[Math.floor(Math.random() * DIR_KEYS.length)]; }

    buildBag(lvl, branch, mode) {
        const count = this.enemiesForLevel(lvl);
        return Array.from({ length: count }, (_, i) => {
            const def = this.pickEnemy(lvl, branch, mode);
            return { instanceId: `${def.id}_${lvl}_${i}_${Date.now()}`, def, lives: def.lives };
        });
    }

    echoKeyForLevel(lvl) {
        const map = { 1: '1', 10: '10', 15: '15_shadow', 20: '20', 25: '25_shadow', 30: '30' };
        return map[lvl] || null;
    }

    isShadowEcho(key) { return key === '15_shadow' || key === '25_shadow'; }
}

// ═══════════════════════════════════════════════════════
// §10  CombatEngine  (Fases 6-7 intacto)
// ═══════════════════════════════════════════════════════

class CombatEngine {
    #lm; #sp; #au; #combo;
    #active = false; #mode = 'practice'; #branch = null;
    #playerLives = CFG.PLAYER_MAX_LIVES;
    #level = 1; #reactionMs = CFG.REACTION_BASE_MS;
    #bag = []; #current = null; #spellDone = false;
    #bossRaged = false;
    #reactionT = null; #retireT = null; #timerIv = null; #bossShiftIv = null;

    constructor(lm, sp, au, combo) { this.#lm = lm; this.#sp = sp; this.#au = au; this.#combo = combo; }

    startPractice() {
        this.#mode = 'practice'; this.#level = 1;
        this.#playerLives = CFG.PLAYER_MAX_LIVES; this.#active = true;
        this.#combo.onSpell = s => this.#onSpell(s);
        this.#resetLog(); this.#hudUpdate();
        this.#au.playBgm('bgm_common');
        this.#bag = this.#lm.buildBag(this.#level, null, 'practice');
        this.#nextTurn();
    }

    startStory(lvl, branch) {
        this.#mode = 'story'; this.#level = lvl; this.#branch = branch;
        this.#playerLives = CFG.PLAYER_MAX_LIVES;
        this.#reactionMs = this.#lm.reactionTime(lvl); this.#bossRaged = false; this.#active = true;
        this.#combo.onSpell = s => this.#onSpell(s);
        this.#resetLog(); this.#hudUpdate();
        const bgmKey = branch && ROUTES[branch] ? ROUTES[branch].bgm : 'bgm_common';
        this.#au.playBgm(bgmKey);
        this.#bag = this.#lm.buildBag(lvl, branch, this.#mode);
        this.#announceBagSize(); this.#nextTurn();
    }

    startFinalBoss() {
        this.#mode = 'story'; this.#branch = 'final';
        this.#playerLives = CFG.PLAYER_MAX_LIVES; this.#bossRaged = false; this.#active = true;
        this.#combo.onSpell = s => this.#onSpell(s);
        this.#resetLog(); this.#hudUpdate();
        this.#au.playBgm('bgm_final');
        const def = ENEMIES.final_boss;
        this.#bag = [{ instanceId: 'final_boss_0', def: { ...def, weak: [], curative: [] }, lives: def.lives }];
        this.#reactionMs = CFG.REACTION_MIN_MS;
        this.#nextTurn();
    }

    stop() {
        this.#active = false;
        clearTimeout(this.#reactionT); clearTimeout(this.#retireT);
        clearInterval(this.#timerIv); clearInterval(this.#bossShiftIv);
        this.#current = null; this.#bag = [];
        this.#combo.onSpell = null; this.#combo.reset();
        this.#clearEnemyUi(); this.#au.stopBgm();
    }

    #nextTurn() {
        if (!this.#active) return;
        if (this.#bag.length === 0) { this.#onBagEmpty(); return; }
        const idx = Math.floor(Math.random() * this.#bag.length);
        const inst = this.#bag[idx];
        const dirKey = this.#lm.pickDir(), dirInfo = DIRECTIONS[dirKey];
        this.#current = { ...inst, dirKey, dirInfo }; this.#spellDone = false;
        const livesLabel = inst.lives === inst.def.lives
            ? `${inst.lives} ${inst.lives === 1 ? 'vida' : 'vidas'}`
            : `${inst.lives} vidas restantes`;
        this.#sp.say(`${inst.def.name} por ${dirInfo.name}. ${livesLabel}.`, { interrupt: true });
        this.#au.playEnemy(dirInfo, inst.def.audioFreq, 0.8);
        if (inst.def.id === 'final_boss' && !this.#bossShiftIv) {
            this.#shiftFinalElem();
            this.#bossShiftIv = setInterval(() => this.#shiftFinalElem(), CFG.FINAL_BOSS_SHIFT_S * 1000);
        }
        this.#enemyUiUpdate(); this.#startBar(this.#reactionMs);
        this.#reactionT = setTimeout(() => this.#onTimeout(), this.#reactionMs);
    }

    #retire(delayMs = 3000) {
        clearTimeout(this.#reactionT); clearInterval(this.#timerIv);
        this.#current = null; this.#clearEnemyUi();
        this.#retireT = setTimeout(() => this.#nextTurn(), delayMs);
    }

    #onSpell(spell) {
        if (!this.#active || !this.#current || this.#spellDone) return;
        this.#spellDone = true;
        app.profile.stats.spells++; Storage.save(app.profile);
        const cur = this.#current, isCrit = spell.type === 'dual';

        if (spell.dirKey !== cur.dirKey) {
            this.#sp.say(`Dirección incorrecta. El enemigo vuelve a la bolsa.`, { interrupt: true });
            this.#log('Dirección errónea → daño propio', 'miss');
            this.#hurtPlayer(1, 'dirección incorrecta');
            this.#syncBagEntry(cur); this.#retire(3000); return;
        }

        let effect, delta;
        if (isCrit) {
            if (spell.name === cur.def.criticalHit) { effect = 'crit_hit'; delta = -2; }
            else if (spell.name === cur.def.criticalCure) { effect = 'crit_cure'; delta = +2; }
            else { effect = 'miss_elem'; delta = 0; }
        } else {
            const e = spell.elements[0];
            if (cur.def.weak.includes(e)) { effect = 'hit'; delta = -1; }
            else if (cur.def.curative.includes(e)) { effect = 'cure'; delta = +1; }
            else { effect = 'miss_elem'; delta = 0; }
        }

        if (effect === 'miss_elem') {
            this.#sp.say('Elemento ineficaz. El enemigo vuelve a la bolsa.', { interrupt: true });
            this.#log('Elemento ineficaz → daño propio', 'miss');
            this.#hurtPlayer(1, 'elemento ineficaz');
            this.#syncBagEntry(cur); this.#retire(3000); return;
        }

        cur.lives = Math.max(0, cur.lives + delta);

        if (effect === 'hit' || effect === 'crit_hit') {
            this.#au.playHit(effect === 'crit_hit');
            const critLabel = effect === 'crit_hit' ? ' ¡Crítico!' : '';
            if ((cur.def.tier === 'boss' || cur.def.tier === 'final') &&
                cur.lives <= CFG.BOSS_RAGE_THRESHOLD && !this.#bossRaged) {
                this.#triggerBossRage(cur); this.#syncBagEntry(cur); this.#retire(5000); return;
            }
            if (cur.lives <= 0) {
                this.#removeFromBag(cur.instanceId);
                app.profile.stats.kills++;
                if (app.profile.stats.kills === 1) app.unlockAchievement('first_kill');
                Storage.save(app.profile);
                const remaining = this.#bag.length;
                const msg = remaining > 0
                    ? `${critLabel} ${cur.def.name} derrotado. Quedan ${remaining} en la bolsa.`.trim()
                    : `${critLabel} ${cur.def.name} derrotado.`.trim();
                this.#sp.say(msg, { interrupt: true }); this.#log(`${cur.def.name} derrotado${critLabel}`, 'hit');
                if (cur.def.tier === 'boss' || cur.def.tier === 'final') {
                    clearInterval(this.#bossShiftIv); this.#handleBossVictory(cur.def); return;
                }
                this.#retire(2500);
            } else {
                this.#syncBagEntry(cur);
                const c2 = effect === 'crit_hit' ? '¡Crítico! ' : '';
                this.#sp.say(`${c2}Impacto. ${cur.def.name} tiene ${cur.lives} vidas. Vuelve a la bolsa.`, { interrupt: true });
                this.#log(`Impacto${critLabel} · ${cur.lives} vidas`, 'hit'); this.#retire(3000);
            }
        }

        if (effect === 'cure' || effect === 'crit_cure') {
            this.#au.playCure(effect === 'crit_cure');
            const critLabel = effect === 'crit_cure' ? ' crítica' : '';
            this.#hurtPlayer(1, 'curación del enemigo');
            this.#syncBagEntry(cur);
            this.#sp.say(`${cur.def.name} se curó${critLabel}. Ahora tiene ${cur.lives} vidas.`, { interrupt: false });
            this.#log(`Enemigo curado${critLabel} → ${cur.lives} vidas`, 'cure'); this.#retire(3000);
        }
    }

    #triggerBossRage(cur) {
        this.#bossRaged = true;
        this.#reactionMs = Math.round(this.#reactionMs * CFG.BOSS_RAGE_SPEED_MOD);
        const rageText = this.#branch && LORE.bosses[this.#branch]
            ? LORE.bosses[this.#branch].rage
            : `¡${cur.def.name} entra en furia! ¡El combate se acelera!`;
        this.#sp.say(rageText, { interrupt: true, pitch: 0.7 });
        this.#log('¡FURIA! Tiempo de reacción reducido al 80%', 'damage');
        this.#au.playBossShift();
    }

    #onTimeout() {
        if (!this.#active || !this.#current || this.#spellDone) return;
        this.#spellDone = true; clearInterval(this.#timerIv);
        this.#hurtPlayer(1, 'tiempo agotado');
        this.#syncBagEntry(this.#current);
        this.#sp.say(`${this.#current.def.name} se retiró. Vuelve a la bolsa.`, { interrupt: false });
        this.#log(`Tiempo agotado — ${this.#current.def.name} intacto`, 'damage');
        this.#retire(3000);
    }

    #onBagEmpty() {
        if (this.#mode === 'practice') {
            this.#sp.say('¡Oleada limpiada! Preparando siguiente oleada.', { interrupt: true });
            this.#bag = this.#lm.buildBag(this.#level, null, 'practice');
            setTimeout(() => this.#nextTurn(), 2000); return;
        }
        this.#au.playLevelUp();
        this.#sp.say(`¡Nivel ${this.#level} superado!`, { interrupt: true });
        this.#log(`Nivel ${this.#level} superado`, 'levelup');
        setTimeout(() => this.#advanceLevel(), 1500);
    }

    #advanceLevel() {
        this.#level++; app.profile.currentLevel = this.#level; Storage.save(app.profile);
        const phase = this.#lm.phase(this.#level);
        if (phase === 'route_select') { this.stop(); setTimeout(() => app.showRouteSelect(), 1000); return; }
        if (phase === 'boss') { this.#spawnBoss(); return; }
        this.#reactionMs = this.#lm.reactionTime(this.#level); this.#bossRaged = false;

        const echoKey = this.#lm.echoKeyForLevel(this.#level);
        if (echoKey && !app.profile.echosSeen.includes(echoKey)) {
            app.profile.echosSeen.push(echoKey); Storage.save(app.profile);
            const isShadow = this.#lm.isShadowEcho(echoKey);
            const lines = LORE.echos[echoKey];
            this.stop();
            setTimeout(async () => {
                await window._aethSpeech.narrate(lines, 700, isShadow ? 0.5 : 1.0);
                this.#bag = this.#lm.buildBag(this.#level, this.#branch, this.#mode);
                this.#active = true; this.#combo.onSpell = s => this.#onSpell(s);
                const bgmKey = this.#branch && ROUTES[this.#branch] ? ROUTES[this.#branch].bgm : 'bgm_common';
                this.#au.playBgm(bgmKey);
                window._aethSpeech.say(`Nivel ${this.#level}. Derrota ${this.#bag.length} enemigos.`, { interrupt: true });
                this.#hudUpdate(); this.#nextTurn();
            }, 800);
            return;
        }

        this.#bag = this.#lm.buildBag(this.#level, this.#branch, this.#mode);
        this.#sp.say(`¡Nivel ${this.#level}! Derrota ${this.#bag.length} enemigos.`, { interrupt: true });
        this.#log(`Nivel ${this.#level}`, 'levelup'); this.#hudUpdate();
        setTimeout(() => this.#nextTurn(), 2000);
    }

    #spawnBoss() {
        const route = ROUTES[this.#branch], def = ENEMIES[route.boss];
        this.#bag = [{ instanceId: `${def.id}_boss`, def, lives: def.lives }];
        this.#bossRaged = false; this.#reactionMs = CFG.REACTION_MIN_MS + 300;
        this.#sp.say(`¡JEFE FINAL DE RUTA! ${def.name}. ${def.lives} vidas.`, { interrupt: true });
        this.#hudUpdate(); setTimeout(() => this.#nextTurn(), 1500);
    }

    #handleBossVictory(def) {
        this.#au.stopBgm();
        const afterNarrate = () => {
            if (def.tier === 'final') app.unlockAchievement('final_boss');
            else app.unlockAchievement(ROUTES[this.#branch].achievement);
            app.profile.bossesDefeated.push(def.id);
            app.profile.currentLevel = 1; app.profile.branch = null; Storage.save(app.profile);
            setTimeout(() => { this.stop(); app.goMenu(); }, 2000);
        };
        if (def.tier === 'final') {
            window._aethSpeech.narrate(LORE.finalBoss.victory, 900).then(afterNarrate);
        } else {
            const v = LORE.bosses[this.#branch]?.victory;
            if (v) window._aethSpeech.narrate(v, 900).then(afterNarrate);
            else { this.#sp.say(`${def.name} ha sido purificado.`, { interrupt: true }); afterNarrate(); }
        }
    }

    #shiftFinalElem() {
        const names = Object.values(ELEMENTS).map(e => e.name);
        const elem = names[Math.floor(Math.random() * names.length)];
        const others = names.filter(n => n !== elem);
        const weak = [others[Math.floor(Math.random() * others.length)]];
        if (this.#current?.def.id === 'final_boss') { this.#current.def.weak = weak; this.#current.def.curative = [elem]; }
        const b = this.#bag.find(e => e.def.id === 'final_boss');
        if (b) { b.def.weak = weak; b.def.curative = [elem]; }
        this.#au.playBossShift();
        this.#sp.say(`El Avatar cambia a ${elem}.`, { interrupt: false });
        this.#log(`Cambio de elemento → ${elem}`, 'levelup');
    }

    #syncBagEntry(cur) { const i = this.#bag.findIndex(e => e.instanceId === cur.instanceId); if (i !== -1) this.#bag[i].lives = cur.lives; }
    #removeFromBag(id) { this.#bag = this.#bag.filter(e => e.instanceId !== id); }

    #hurtPlayer(dmg, reason) {
        this.#playerLives = Math.max(0, this.#playerLives - dmg);
        this.#au.playPlayerHit(); this.#hudUpdate();
        app.profile.stats.deaths += dmg; Storage.save(app.profile);
        if (this.#playerLives === 0) {
            this.#sp.say('¡Has muerto! Volviendo al menú.', { interrupt: true }); this.#au.playDeath();
            this.#log('MUERTE del jugador', 'damage');
            app.profile.currentLevel = 1; app.profile.branch = null; Storage.save(app.profile);
            setTimeout(() => { this.stop(); app.goMenu(); }, 3000);
        } else {
            this.#sp.say(`¡Daño por ${reason}! Quedan ${this.#playerLives} ${this.#playerLives === 1 ? 'vida' : 'vidas'}.`, { interrupt: false });
            this.#log(`Daño (${reason}) · Vidas: ${this.#playerLives}`, 'damage');
        }
    }

    #announceBagSize() { this.#sp.say(`Nivel ${this.#level}. Hay ${this.#bag.length} enemigos en la bolsa.`, { interrupt: false }); }

    #hudUpdate() {
        document.getElementById('player-lives').textContent = this.#playerLives;
        document.getElementById('current-level-display').textContent = this.#level;
        document.getElementById('enemies-progress').textContent =
            this.#mode === 'practice' ? `${this.#bag.length} en bolsa` : `${this.#bag.length} restantes`;
    }

    #enemyUiUpdate() {
        const c = this.#current;
        document.getElementById('enemy-name').textContent = `${c.def.name} — ${c.dirInfo.label} ${c.dirInfo.name}`;
        document.getElementById('enemy-lives-display').textContent = `Vidas: ${c.lives}`;
    }

    #clearEnemyUi() {
        document.getElementById('enemy-name').textContent = '—';
        document.getElementById('enemy-lives-display').textContent = '';
        const bar = document.getElementById('enemy-timer-bar');
        if (bar) { bar.style.width = '100%'; bar.style.background = 'var(--color-accent)'; }
    }

    #startBar(total) {
        clearInterval(this.#timerIv);
        const bar = document.getElementById('enemy-timer-bar'); if (!bar) return;
        const start = Date.now();
        this.#timerIv = setInterval(() => {
            const pct = Math.max(0, 100 - (Date.now() - start) / total * 100);
            bar.style.width = pct + '%'; bar.setAttribute('aria-valuenow', Math.round(pct));
            bar.style.background = pct < 30 ? 'var(--color-error)' : pct < 60 ? 'var(--color-accent-dim)' : 'var(--color-accent)';
            if (pct === 0) clearInterval(this.#timerIv);
        }, 50);
    }

    #resetLog() {
        const l = document.getElementById('combat-log');
        if (l) l.innerHTML = '<p class="log-hint">Preparando el campo de batalla…</p>';
    }

    #log(msg, type = 'info') {
        const log = document.getElementById('combat-log'); if (!log) return;
        log.querySelector('.log-hint')?.remove();
        while (log.children.length >= 8) log.removeChild(log.firstChild);
        const t = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const d = document.createElement('div');
        d.className = `log-entry log-${type}`;
        d.innerHTML = `<span class="log-text">${msg}</span><span class="log-time" aria-hidden="true">${t}</span>`;
        log.appendChild(d); log.scrollTop = log.scrollHeight;
    }
}

// ═══════════════════════════════════════════════════════
// §11  Leaderboard  (Fase 8)
// ═══════════════════════════════════════════════════════

class Leaderboard {
    #data = []; #selectedIdx = 0; #modoDetalles = false; #speech;

    constructor(speech) { this.#speech = speech; }

    async load(source) {
        this.#data = Array.isArray(source) ? source : await source;
        this.#data.sort((a, b) => b.nivel - a.nivel || a.tiempoJugado - b.tiempoJugado);
    }

    #formatTime(secs) {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const parts = [];
        if (h > 0) parts.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
        if (m > 0) parts.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
        return parts.length > 0 ? parts.join(' y ') : 'menos de un minuto';
    }

    #rowSpeech(entry, rank) {
        const estado = entry.estado === 'online' ? 'En línea' : 'Desconectado';
        const tiempo = this.#formatTime(entry.tiempoJugado);
        return `Posición ${rank + 1}. ${entry.nombre}. Nivel ${entry.nivel}. Tiempo: ${tiempo}. ${estado}. Pulsa Enter para ver detalles.`;
    }

    #detailSpeech(entry) {
        const jefes = entry.jefesDerrotados.length > 0 ? entry.jefesDerrotados.join(', ') : 'ninguno';
        return `Detalles de ${entry.nombre}. Jefes derrotados: ${jefes}. Pulsa Escape para cerrar.`;
    }

    render() {
        const listEl = document.getElementById('lb-list');
        listEl.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'lb-header'; header.setAttribute('aria-hidden', 'true');
        header.innerHTML = '<span>#</span><span>Nombre</span><span>Nivel</span><span>Tiempo</span><span>Estado</span>';
        listEl.appendChild(header);

        this.#data.forEach((entry, i) => {
            const row = document.createElement('div');
            row.className = 'lb-row' + (i === this.#selectedIdx ? ' lb-selected' : '');
            row.setAttribute('role', 'listitem'); row.setAttribute('tabindex', i === this.#selectedIdx ? '0' : '-1');
            row.dataset.index = i;
            const estadoClass = entry.estado === 'online' ? 'online' : 'offline';
            const estadoText = entry.estado === 'online' ? '[En línea]' : '[Desconectado]';
            const tiempo = this.#formatTime(entry.tiempoJugado);
            row.innerHTML =
                `<span class="lb-rank" aria-hidden="true">${i + 1}</span>` +
                `<span class="lb-name">${entry.nombre}</span>` +
                `<span class="lb-level" aria-hidden="true">${entry.nivel}</span>` +
                `<span class="lb-time" aria-hidden="true">${tiempo}</span>` +
                `<span class="lb-status ${estadoClass}" aria-hidden="true">${estadoText}</span>`;
            row.addEventListener('focus', () => {
                if (this.#modoDetalles) return;
                this.#selectedIdx = i;
                this.#speech.say(this.#rowSpeech(entry, i), { interrupt: true });
            });
            row.addEventListener('click', () => { this.#selectedIdx = i; this.#openDetail(entry); });
            listEl.appendChild(row);
        });
    }

    initKeys(screenEl) {
        screenEl.addEventListener('keydown', e => {
            if (app.screens.current !== 'leaderboard') return;
            if (this.#modoDetalles) {
                if (e.key === 'Escape') { e.preventDefault(); this.#closeDetail(); }
                return;
            }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.#moveTo(Math.min(this.#selectedIdx + 1, this.#data.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); this.#moveTo(Math.max(this.#selectedIdx - 1, 0)); }
            if (e.key === 'Enter') { e.preventDefault(); this.#openDetail(this.#data[this.#selectedIdx]); }
        });
    }

    #moveTo(idx) {
        this.#selectedIdx = idx;
        const rows = document.querySelectorAll('.lb-row');
        rows.forEach((r, i) => {
            r.classList.toggle('lb-selected', i === idx);
            r.setAttribute('tabindex', i === idx ? '0' : '-1');
        });
        rows[idx]?.focus();
    }

    #openDetail(entry) {
        this.#modoDetalles = true;
        document.getElementById('lb-list').style.visibility = 'hidden';
        document.getElementById('btn-back-lb').style.visibility = 'hidden';
        const panel = document.getElementById('lb-detail');
        const nameEl = document.getElementById('lb-detail-name');
        const bodyEl = document.getElementById('lb-detail-body');
        const estado = entry.estado === 'online' ? '[En línea]' : '[Desconectado]';
        const tiempo = this.#formatTime(entry.tiempoJugado);
        const jefes = entry.jefesDerrotados.length > 0 ? entry.jefesDerrotados.join(', ') : 'Ninguno';
        nameEl.textContent = entry.nombre;
        bodyEl.innerHTML =
            `<dt>Estado</dt>           <dd>${estado}</dd>` +
            `<dt>Nivel</dt>            <dd>${entry.nivel}</dd>` +
            `<dt>Tiempo</dt>           <dd>${tiempo}</dd>` +
            `<dt>Jefes derrotados</dt> <dd>${jefes}</dd>`;
        panel.removeAttribute('hidden');
        setTimeout(() => {
            document.getElementById('btn-lb-close').focus();
            this.#speech.say(this.#detailSpeech(entry), { interrupt: true });
        }, 100);
    }

    #closeDetail() {
        this.#modoDetalles = false;
        document.getElementById('lb-detail').setAttribute('hidden', '');
        document.getElementById('lb-list').style.visibility = 'visible';
        document.getElementById('btn-back-lb').style.visibility = 'visible';
        const rows = document.querySelectorAll('.lb-row');
        rows[this.#selectedIdx]?.focus();
        this.#speech.say(`Panel cerrado. ${this.#rowSpeech(this.#data[this.#selectedIdx], this.#selectedIdx)}`, { interrupt: true });
    }

    async open() {
        await this.load(LEADERBOARD_MOCK);
        this.#selectedIdx = 0; this.#modoDetalles = false;
        document.getElementById('lb-detail').setAttribute('hidden', '');
        document.getElementById('lb-list').style.visibility = 'visible';
        document.getElementById('btn-back-lb').style.visibility = 'visible';
        this.render();
        setTimeout(() => {
            const rows = document.querySelectorAll('.lb-row[role="listitem"]');
            if (rows[0]) rows[0].focus();
            this.#speech.say('Clasificación. Usa flechas arriba y abajo para navegar. Enter para ver detalles.', { interrupt: true });
        }, 200);
    }

    closeBtnHandler() { this.#closeDetail(); }
}

// ═══════════════════════════════════════════════════════
// §12  APP  (coordinador global, IIFE)
// ═══════════════════════════════════════════════════════

const app = (() => {
    const opts = new Options();
    const speech = new Speech(opts);
    const audio = new AudioEngine();
    const combo = new ComboSystem();
    const lm = new LevelManager();
    const combat = new CombatEngine(lm, speech, audio, combo);

    // Exponer la instancia REAL de speech para CombatEngine (ecos, victorias)
    window._aethSpeech = speech;

    const leaderboard = new Leaderboard(speech);

    let _profile = null;

    // ── Pantallas ────────────────────────────────────────
    const screens = {
        current: 'username', _m: null,
        init() {
            this._m = {
                username: document.getElementById('screen-username'),
                menu: document.getElementById('screen-menu'),
                options: document.getElementById('screen-options'),
                achievements: document.getElementById('screen-achievements'),
                leaderboard: document.getElementById('screen-leaderboard'),
                route: document.getElementById('screen-route'),
                combat: document.getElementById('screen-combat'),
                game: document.getElementById('screen-game'),
            };
        },
        show(name, focusId = null) {
            Object.entries(this._m).forEach(([k, el]) => el.classList.toggle('active', k === name));
            this.current = name;
            const t = focusId ? document.getElementById(focusId) : this._m[name].querySelector('h1,h2,button');
            if (t) { t.setAttribute('tabindex', '-1'); setTimeout(() => { t.focus(); t.removeAttribute('tabindex'); }, 150); }
        },
    };

    // ── Narrativa ────────────────────────────────────────

    async function narrateIntro(name) {
        if (_profile.introSeen) return;
        _profile.introSeen = true;
        if (!_profile.echosSeen.includes('1')) _profile.echosSeen.push('1');
        Storage.save(_profile);
        await speech.narrate(LORE.echos[1], 700);
    }

    async function narrateBossLore(branch) {
        const lines = LORE.bosses[branch]?.preRoute;
        if (!lines) return;
        await speech.narrate(lines, 700);
    }

    // ── Menú ─────────────────────────────────────────────

    function goMenu() { combat.stop(); refreshMenuInfo(); screens.show('menu', 'btn-play'); }

    function refreshMenuInfo() {
        document.getElementById('menu-welcome').textContent = `¡Hola, ${_profile.username}!`;
        const d = new Date(_profile.lastPlayed).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
        document.getElementById('save-info').textContent = `Nivel ${_profile.currentLevel} · Última sesión: ${d}`;
    }

    function unlockAchievement(id) {
        if (!_profile.achievements.includes(id)) {
            _profile.achievements.push(id); Storage.save(_profile);
            const a = ACHIEVEMENTS_DEF.find(x => x.id === id);
            if (a) speech.say(`Logro desbloqueado: ${a.name}.`, { interrupt: false });
        }
    }

    function hasAllBranchAchs() { return BRANCH_ACH_IDS.every(id => _profile.achievements.includes(id)); }

    function showRouteSelect() {
        const hasFinal = hasAllBranchAchs();
        document.getElementById('route-final-boss').style.display = hasFinal ? 'flex' : 'none';
        document.getElementById('hint-final-boss').style.display = hasFinal ? 'inline' : 'none';
        screens.show('route', 'btn-back-route');
        let msg = 'Has dominado la academia. Elige tu destino. Arriba: Fuego. Abajo: Agua. Izquierda: Viento. Derecha: Tierra.';
        if (hasFinal) msg += ' Espacio: Jefe Final secreto.';
        speech.say(msg, { interrupt: true });
    }

    // ── Init: username ───────────────────────────────────

    function initUsername() {
        const inp = document.getElementById('input-username');
        const err = document.getElementById('username-error');
        const last = Storage.lastUser(); if (last) inp.value = last;
        inp.addEventListener('focus', () =>
            speech.say('Ecos de Aethelgard. Escribe tu nombre y pulsa Enter.', { interrupt: false }),
            { once: true }
        );
        const submit = () => {
            const name = inp.value.trim().replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9 _-]/g, '').trim();
            if (name.length < 2) { err.textContent = 'Mínimo 2 caracteres.'; speech.say('Nombre demasiado corto.', { interrupt: true }); return; }
            err.textContent = '';
            let p = Storage.load(name); const isNew = !p;
            if (isNew) { p = Storage.newProfile(name); Storage.save(p); }
            else { p.lastPlayed = Date.now(); if (!p.echosSeen) p.echosSeen = []; Storage.save(p); }
            _profile = p; refreshMenuInfo(); screens.show('menu', 'btn-play');
            speech.say(isNew ? `Bienvenido, ${name}.` : `Bienvenido de nuevo, ${name}. Nivel ${_profile.currentLevel}.`, { interrupt: true });
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
        document.getElementById('btn-enter').addEventListener('click', submit);
        document.getElementById('btn-enter').addEventListener('focus', () => speech.say('Botón: Entrar al mundo.'));
    }

    // ── Init: menú ───────────────────────────────────────

    function initMenu() {
        document.querySelectorAll('.menu-btn[data-description]').forEach(b => {
            b.addEventListener('focus', () => speech.say(`${b.textContent.trim()}. ${b.dataset.description}`, { interrupt: true }));
        });

        document.getElementById('btn-play').addEventListener('click', async () => {
            const phase = lm.phase(_profile.currentLevel);
            if (phase === 'route_select') { showRouteSelect(); return; }
            document.getElementById('combat-title').textContent = `Nivel ${_profile.currentLevel}`;
            screens.show('combat', 'btn-back-combat');
            if (_profile.currentLevel === 1 && !_profile.introSeen) {
                speech.say('Iniciando la aventura…', { interrupt: true });
                await narrateIntro(_profile.username);
            } else {
                speech.say(`Nivel ${_profile.currentLevel}. Derrota ${lm.enemiesForLevel(_profile.currentLevel)} enemigos.`, { interrupt: true });
            }
            setTimeout(() => combat.startStory(_profile.currentLevel, _profile.branch), 500);
        });

        document.getElementById('btn-combat-test').addEventListener('click', () => {
            document.getElementById('combat-title').textContent = 'Práctica';
            screens.show('combat', 'btn-back-combat');
            speech.say('Modo práctica infinita. Escape para salir.', { interrupt: true });
            setTimeout(() => combat.startPractice(), 600);
        });

        document.getElementById('btn-leaderboard').addEventListener('click', () => {
            screens.show('leaderboard'); leaderboard.open();
        });

        document.getElementById('btn-achievements').addEventListener('click', () => {
            renderAchievements(); screens.show('achievements', 'btn-back-ach');
        });

        document.getElementById('btn-options').addEventListener('click', () => {
            opts.syncDisplay(); screens.show('options', 'btn-speed-down');
            speech.say(`Opciones. Velocidad: ${opts.rate.toFixed(1)}.`, { interrupt: true });
        });

        document.getElementById('btn-exit').addEventListener('click', () => {
            speech.say('Cerrando sesión. ¡Hasta pronto!', { interrupt: true });
            setTimeout(() => { _profile = null; screens.show('username'); document.getElementById('input-username').value = ''; document.getElementById('input-username').focus(); }, 2200);
        });
    }

    // ── Init: opciones ───────────────────────────────────

    function initOptions() {
        const up = document.getElementById('btn-speed-up'), dn = document.getElementById('btn-speed-down');
        const adj = d => { d > 0 ? opts.increase() : opts.decrease(); speech.say(`Velocidad: ${opts.rate.toFixed(1)}`, { interrupt: true }); };
        up.addEventListener('click', () => adj(1)); dn.addEventListener('click', () => adj(-1));
        document.getElementById('screen-options').addEventListener('keydown', e => {
            if (screens.current !== 'options') return;
            if (e.key === 'ArrowRight') { e.preventDefault(); adj(1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); adj(-1); }
        });
        document.getElementById('btn-test-voice').addEventListener('click', () => speech.say('Esta es la velocidad actual.', { interrupt: true }));
        document.getElementById('btn-back-options').addEventListener('click', () => { screens.show('menu', 'btn-options'); speech.say('Menú principal.', { interrupt: true }); });
        [up, dn, document.getElementById('btn-test-voice'), document.getElementById('btn-back-options')]
            .forEach(b => b.addEventListener('focus', () => speech.say(b.textContent.trim(), { interrupt: false })));
    }

    // ── Init: logros ─────────────────────────────────────

    function renderAchievements() {
        const listEl = document.getElementById('achievements-list');
        document.getElementById('ach-username').textContent = _profile.username;
        listEl.innerHTML = '';
        ACHIEVEMENTS_DEF.forEach((ach, i) => {
            const unlocked = _profile.achievements.includes(ach.id);
            const item = document.createElement('div');
            item.className = `achievement-item ${unlocked ? 'unlocked' : ''}`;
            item.setAttribute('role', 'listitem'); item.setAttribute('tabindex', i === 0 ? '0' : '-1');
            item.innerHTML = `<p class="ach-name ${unlocked ? '' : 'locked'}">${unlocked ? '✓' : '🔒'} ${ach.name}</p><p class="ach-desc">${ach.desc}</p>`;
            item.addEventListener('focus', () => speech.say(`${ach.name}. ${unlocked ? 'Desbloqueado' : 'Bloqueado'}. ${ach.desc}`, { interrupt: true }));
            listEl.appendChild(item);
        });
        listEl.addEventListener('keydown', e => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return; e.preventDefault();
            const its = [...listEl.querySelectorAll('[role="listitem"]')];
            const cur = its.findIndex(el => el === document.activeElement);
            const next = e.key === 'ArrowDown' ? Math.min(cur + 1, its.length - 1) : Math.max(cur - 1, 0);
            its.forEach((el, ii) => el.setAttribute('tabindex', ii === next ? '0' : '-1')); its[next].focus();
        });
        const n = _profile.achievements.length;
        setTimeout(() => {
            speech.say(n === 0 ? `Sin logros. ${ACHIEVEMENTS_DEF.length} disponibles.` : `${n} de ${ACHIEVEMENTS_DEF.length} logros.`, { interrupt: true });
            listEl.querySelector('[role="listitem"]')?.focus();
        }, 400);
    }

    function initAchievements() {
        document.getElementById('btn-back-ach').addEventListener('click', () => { screens.show('menu', 'btn-achievements'); speech.say('Menú principal.', { interrupt: true }); });
        document.getElementById('btn-back-ach').addEventListener('focus', () => speech.say('Volver al menú.', { interrupt: false }));
    }

    // ── Init: leaderboard ────────────────────────────────

    function initLeaderboard() {
        leaderboard.initKeys(document.getElementById('screen-leaderboard'));
        document.getElementById('btn-lb-close').addEventListener('click', () => leaderboard.closeBtnHandler());
        document.getElementById('btn-lb-close').addEventListener('focus', () => speech.say('Botón: Cerrar panel de detalles.', { interrupt: false }));
        document.getElementById('btn-back-lb').addEventListener('click', () => { screens.show('menu', 'btn-leaderboard'); speech.say('Menú principal.', { interrupt: true }); });
        document.getElementById('btn-back-lb').addEventListener('focus', () => speech.say('Volver al menú.', { interrupt: false }));
    }

    // ── Init: ruta ───────────────────────────────────────

    function initRoute() {
        document.getElementById('screen-route').addEventListener('keydown', async e => {
            if (screens.current !== 'route') return;
            const map = { ArrowUp: 'fire', ArrowDown: 'water', ArrowLeft: 'wind', ArrowRight: 'earth' };
            if (map[e.key]) { e.preventDefault(); await selectRoute(map[e.key]); }
            if (e.key === ' ' && hasAllBranchAchs()) { e.preventDefault(); selectFinalBoss(); }
        });
        document.getElementById('btn-back-route').addEventListener('click', () => { screens.show('menu', 'btn-play'); speech.say('Menú principal.', { interrupt: true }); });
    }

    async function selectRoute(branch) {
        _profile.branch = branch; _profile.currentLevel = CFG.COMMON_LEVELS + 2; Storage.save(_profile);
        const route = ROUTES[branch];
        document.getElementById('combat-title').textContent = `Ruta ${route.name}`;
        screens.show('combat', 'btn-back-combat');
        speech.say(`Ruta de ${route.name} elegida.`, { interrupt: true });
        await narrateBossLore(branch);
        combat.startStory(_profile.currentLevel, branch);
    }

    async function selectFinalBoss() {
        document.getElementById('combat-title').textContent = 'Jefe Final';
        screens.show('combat', 'btn-back-combat');
        await speech.narrate(LORE.finalBoss.intro, 800);
        combat.startFinalBoss();
    }

    // ── Init: combate ────────────────────────────────────

    function initCombat() {
        document.getElementById('btn-back-combat').addEventListener('click', () => { combat.stop(); speech.say('Saliendo del combate.', { interrupt: true }); screens.show('menu', 'btn-combat-test'); });
        document.getElementById('btn-back-combat').addEventListener('focus', () => speech.say('Salir del combate.', { interrupt: false }));
    }

    // ── Init: juego placeholder ──────────────────────────

    function initGame() {
        document.getElementById('btn-back-from-game').addEventListener('click', () => { screens.show('menu', 'btn-play'); speech.say('Menú principal.', { interrupt: true }); });
    }

    // ── Teclado global ───────────────────────────────────

    function initGlobalKeys() {
        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            const s = screens.current;
            if (s === 'combat') { combat.stop(); speech.say('Menú principal.', { interrupt: true }); screens.show('menu', 'btn-play'); }
            if (['achievements', 'options', 'route', 'game', 'leaderboard'].includes(s)) { screens.show('menu', 'btn-play'); speech.say('Menú principal.', { interrupt: true }); }
        });
    }

    // ── Arranque ─────────────────────────────────────────

    function init() {
        screens.init(); combo.init(); opts.syncDisplay(); audio.loadAllBgm();
        initUsername(); initMenu(); initOptions();
        initAchievements(); initLeaderboard(); initRoute(); initCombat(); initGame();
        initGlobalKeys();
        screens.show('username');
        console.log('[Aethelgard] Fases 1-8 listas.');
    }

    return {
        get profile() { return _profile; },
        get screens() { return screens; },
        goMenu, showRouteSelect, unlockAchievement, init,
    };
})();

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', () => app.init())
    : app.init();

window.Aethelgard = app;