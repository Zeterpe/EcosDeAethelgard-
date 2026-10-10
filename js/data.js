/* =============================================
   ECOS DE AETHELGARD — data.js
   Datos del juego: elementos, enemigos, niveles,
   dificultades, logros y puntuación.
   ============================================= */
'use strict';

/** Versión del juego. Al publicar cambios, súbela también en los ?v= de index.html. */
const GAME_VERSION = { id: '20261010a', spoken: '10 de octubre de 2026' };

// ═══════════════════════════════════════════════════════
// Elementos y ciclo elemental
// Agua apaga Fuego · Fuego doma Viento · Viento mueve Tierra · Tierra detiene Agua
// ═══════════════════════════════════════════════════════

const ELEMENTS = {
    agua: { id: 'agua', name: 'Agua', icon: '💧', beats: 'fuego', verb: 'apaga' },
    fuego: { id: 'fuego', name: 'Fuego', icon: '🔥', beats: 'viento', verb: 'doma' },
    tierra: { id: 'tierra', name: 'Tierra', icon: '🪨', beats: 'agua', verb: 'detiene' },
    viento: { id: 'viento', name: 'Viento', icon: '💨', beats: 'tierra', verb: 'mueve' },
};
const ELEMENT_IDS = ['agua', 'fuego', 'tierra', 'viento'];

/** Elemento que vence a `elId`. */
function weaknessOf(elId) { return ELEMENT_IDS.find(id => ELEMENTS[id].beats === elId); }

const DUAL_SPELLS = {
    'agua+fuego': { name: 'Vapor Abrasador', icon: '♨️' },
    'agua+tierra': { name: 'Ciénaga', icon: '🟫' },
    'agua+viento': { name: 'Tormenta de Hielo', icon: '❄️' },
    'fuego+tierra': { name: 'Lava Ardiente', icon: '🌋' },
    'fuego+viento': { name: 'Llamarada Ciclónica', icon: '🌪️' },
    'tierra+viento': { name: 'Vendaval de Polvo', icon: '🏜️' },
};

function spellKey(ids) { return [...new Set(ids)].sort().join('+'); }
function dualName(a, b) { return DUAL_SPELLS[spellKey([a, b])].name; }
function dualByName(name) {
    const k = Object.keys(DUAL_SPELLS).find(key => DUAL_SPELLS[key].name === name);
    return k ? { key: k, elements: k.split('+'), ...DUAL_SPELLS[k] } : null;
}

/**
 * Perfil de combate de un guardián de un solo elemento.
 * Débil: el elemento que lo vence. Crítico: su debilidad + el elemento neutral.
 * Curación crítica: su propio elemento + el elemento al que él vence.
 */
function guardianProfile(elId) {
    const weak = weaknessOf(elId);
    const beaten = ELEMENTS[elId].beats;
    const neutral = ELEMENT_IDS.find(id => id !== elId && id !== weak && id !== beaten);
    return { weak: [weak], cure: [elId], critHit: dualName(weak, neutral), critCure: dualName(elId, beaten) };
}

// ═══════════════════════════════════════════════════════
// Direcciones
// ═══════════════════════════════════════════════════════

const DIRECTIONS = {
    up: { id: 'up', name: 'arriba', label: '↑', pan: 0 },
    down: { id: 'down', name: 'abajo', label: '↓', pan: 0 },
    left: { id: 'left', name: 'izquierda', label: '←', pan: -1 },
    right: { id: 'right', name: 'derecha', label: '→', pan: 1 },
};
const DIR_IDS = ['up', 'down', 'left', 'right'];

const KEY_SCHEMES = {
    clasico: {
        name: 'Clásico: A S D F y flechas',
        elements: { a: 'agua', s: 'fuego', d: 'tierra', f: 'viento' },
        directions: { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' },
        labels: { agua: 'A', fuego: 'S', tierra: 'D', viento: 'F', up: '↑', down: '↓', left: '←', right: '→' },
        spoken: { agua: 'A', fuego: 'S', tierra: 'D', viento: 'F', up: 'flecha arriba', down: 'flecha abajo', left: 'flecha izquierda', right: 'flecha derecha' },
    },
    zurdo: {
        name: 'Zurdo: J K L Ñ y W A S D',
        elements: { j: 'agua', k: 'fuego', l: 'tierra', 'ñ': 'viento', ';': 'viento' },
        directions: {
            w: 'up', s: 'down', a: 'left', d: 'right',
            ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        },
        labels: { agua: 'J', fuego: 'K', tierra: 'L', viento: 'Ñ', up: 'W', down: 'S', left: 'A', right: 'D' },
        spoken: { agua: 'J', fuego: 'K', tierra: 'L', viento: 'eñe', up: 'W', down: 'S', left: 'A', right: 'D' },
    },
};

// ═══════════════════════════════════════════════════════
// Enemigos
// tier: basic · elite · minion · miniboss · boss · final
// ═══════════════════════════════════════════════════════

const ENEMIES = {
    wolf_fire: {
        id: 'wolf_fire', name: 'Lobo de Fuego', short: 'Lobo', tier: 'basic', lives: 1,
        elements: ['fuego'], weak: ['agua'], cure: ['fuego'], critHit: null, critCure: null,
        voice: 'wolf', icon: '🐺',
        desc: 'Un aullido entre chasquidos de brasas. Corre en manada por las ruinas de la Academia.',
    },
    frog_water: {
        id: 'frog_water', name: 'Rana de Agua', short: 'Rana', tier: 'basic', lives: 1,
        elements: ['agua'], weak: ['tierra'], cure: ['agua'], critHit: null, critCure: null,
        voice: 'frog', icon: '🐸',
        desc: 'Un croar húmedo y burbujeante. Pequeña, pero traicionera.',
    },
    bat_wind: {
        id: 'bat_wind', name: 'Murciélago de Viento', short: 'Murciélago', tier: 'basic', lives: 1,
        elements: ['viento'], weak: ['fuego'], cure: ['viento'], critHit: null, critCure: null,
        voice: 'bat', icon: '🦇',
        desc: 'Chillidos agudos y un aleteo frenético. Caza en la oscuridad, igual que tú.',
    },
    golem_earth: {
        id: 'golem_earth', name: 'Gólem de Tierra', short: 'Gólem', tier: 'basic', lives: 1,
        elements: ['tierra'], weak: ['viento'], cure: ['tierra'], critHit: null, critCure: null,
        voice: 'golem', icon: '🗿',
        desc: 'Pasos que hacen temblar el suelo y un crujido de roca al moverse.',
    },
    magma_elem: {
        id: 'magma_elem', name: 'Elemental de Magma', short: 'Magma', tier: 'elite', lives: 3,
        elements: ['fuego', 'tierra'], weak: ['agua', 'viento'], cure: ['fuego', 'tierra'],
        critHit: 'Tormenta de Hielo', critCure: 'Lava Ardiente',
        voice: 'magma', icon: '🌋',
        desc: 'Burbujeo de lava y un rugido sordo. Fuego y Tierra fundidos en un solo cuerpo.',
    },
    storm_spec: {
        id: 'storm_spec', name: 'Espectro Tormenta', short: 'Espectro', tier: 'elite', lives: 3,
        elements: ['agua', 'viento'], weak: ['tierra', 'fuego'], cure: ['agua', 'viento'],
        critHit: 'Lava Ardiente', critCure: 'Tormenta de Hielo',
        voice: 'storm', icon: '🌩️',
        desc: 'Un lamento fantasmal entre truenos. Agua y Viento hechos tempestad.',
    },
    ent_forest: {
        id: 'ent_forest', name: 'Ent del Bosque', short: 'Ent', tier: 'elite', lives: 3,
        elements: ['tierra', 'agua'], weak: ['fuego', 'viento'], cure: ['tierra', 'agua'],
        critHit: 'Llamarada Ciclónica', critCure: 'Ciénaga',
        voice: 'ent', icon: '🌳',
        desc: 'Madera que cruje y hojas que susurran. Un bosque entero que camina.',
    },
    djinn_desert: {
        id: 'djinn_desert', name: 'Djinn del Desierto', short: 'Djinn', tier: 'elite', lives: 3,
        elements: ['viento', 'tierra'], weak: ['agua', 'fuego'], cure: ['viento', 'tierra'],
        critHit: 'Vapor Abrasador', critCure: 'Vendaval de Polvo',
        voice: 'djinn', icon: '🧞',
        desc: 'Campanillas místicas sobre un remolino de arena. Viento y Tierra entrelazados.',
    },
    ember: {
        id: 'ember', name: 'Brasa de la Forja', short: 'Brasa', tier: 'minion', lives: 1,
        elements: ['fuego'], weak: ['agua'], cure: ['fuego'], critHit: null, critCure: null,
        voice: 'ember', icon: '✨',
        desc: 'Chispas vivas que Ignar arranca de su yunque. Un chasquido y un silbido.',
    },
    shadow: {
        id: 'shadow', name: 'Sombra Imitadora', short: 'Sombra', tier: 'miniboss', lives: 6,
        elements: [], weak: [], cure: [], critHit: null, critCure: null,
        voice: 'shadow', icon: '🌑', mechanic: 'mimic',
        desc: 'No tiene voz propia: roba la de otras criaturas, deformada como un eco enfermo. Escucha a quién imita y respóndele como si fuera ella.',
    },
    boss_fire: {
        id: 'boss_fire', name: 'Señor de las Cenizas', short: 'Ignar', tier: 'boss', lives: 12,
        elements: ['fuego'], ...guardianProfile('fuego'),
        voice: 'ignar', icon: '🔨', mechanic: 'forge', route: 'fire',
        desc: 'Ignar, el Gran Herrero. Golpes de yunque y el rugido de una forja que no se apaga. Cada pocos golpes lanza brasas contra ti.',
    },
    boss_water: {
        id: 'boss_water', name: 'Leviatán Abisal', short: 'Leviatán', tier: 'boss', lives: 12,
        elements: ['agua'], ...guardianProfile('agua'),
        voice: 'leviathan', icon: '🐋', mechanic: 'current', route: 'water',
        desc: 'La Gran Corriente, corrompida. Un canto de ballena desde el abismo. Se desplaza antes de atacar: apunta a donde termina su movimiento.',
    },
    boss_wind: {
        id: 'boss_wind', name: 'Rey de los Vendavales', short: 'Zael', tier: 'boss', lives: 12,
        elements: ['viento'], ...guardianProfile('viento'),
        voice: 'zael', icon: '🌪️', mechanic: 'decoy', route: 'wind',
        desc: 'Zael, el mensajero. Un vendaval que grita. Lanza ecos falsos, lejanos y apagados: apunta siempre al grito cercano.',
    },
    boss_earth: {
        id: 'boss_earth', name: 'Titán de la Montaña', short: 'Rok', tier: 'boss', lives: 14,
        elements: ['tierra'], ...guardianProfile('tierra'),
        voice: 'rok', icon: '⛰️', mechanic: 'shield', route: 'earth',
        desc: 'Rok, la Memoria Viva. Pasos de terremoto. A veces alza un escudo de piedra: cuando lo oigas crujir, no ataques.',
    },
    final_boss: {
        id: 'final_boss', name: 'Avatar del Silencio', short: 'Avatar', tier: 'final', lives: 20,
        elements: [], weak: [], cure: [], critHit: null, critCure: null,
        voice: 'avatar', icon: '👁️', mechanic: 'shift',
        desc: 'El hueco entre los elementos. Cambia de elemento sin cesar: escucha su firma elemental y respóndele como a un guardián.',
    },
};

const BASICS = ['wolf_fire', 'frog_water', 'bat_wind', 'golem_earth'];
const ELITES = ['magma_elem', 'storm_spec', 'ent_forest', 'djinn_desert'];
const ALL_COMMON = [...BASICS, ...ELITES];
const GUARDIANS = ['boss_fire', 'boss_water', 'boss_wind', 'boss_earth'];
const BESTIARY_ORDER = [...BASICS, ...ELITES, 'ember', 'shadow', ...GUARDIANS, 'final_boss'];

const TIER_LABELS = {
    basic: 'Criatura básica', elite: 'Criatura élite', minion: 'Esbirro',
    miniboss: 'Enemigo especial', boss: 'Guardián', final: 'Enemigo final',
};

// ═══════════════════════════════════════════════════════
// Rutas (tras el nivel 30)
// ═══════════════════════════════════════════════════════

const ROUTES = {
    fire: {
        id: 'fire', name: 'Fuego', place: 'Las Tierras de Escoria', dir: 'up', element: 'fuego',
        boss: 'boss_fire', guardian: 'Ignar', achievement: 'branch_fire', theme: 'fire', reverb: 'hall', icon: '🔥',
        pool: ['wolf_fire', 'frog_water', 'magma_elem', 'djinn_desert'],
    },
    water: {
        id: 'water', name: 'Agua', place: 'Las Fosas Abisales', dir: 'down', element: 'agua',
        boss: 'boss_water', guardian: 'la Gran Corriente', achievement: 'branch_water', theme: 'water', reverb: 'cave', icon: '💧',
        pool: ['frog_water', 'wolf_fire', 'storm_spec', 'ent_forest'],
    },
    wind: {
        id: 'wind', name: 'Viento', place: 'La Meseta de los Ecos Rotos', dir: 'left', element: 'viento',
        boss: 'boss_wind', guardian: 'Zael', achievement: 'branch_wind', theme: 'wind', reverb: 'open', icon: '💨',
        pool: ['bat_wind', 'golem_earth', 'djinn_desert', 'storm_spec'],
    },
    earth: {
        id: 'earth', name: 'Tierra', place: 'El Corazón de Piedra', dir: 'right', element: 'tierra',
        boss: 'boss_earth', guardian: 'Rok', achievement: 'branch_earth', theme: 'earth', reverb: 'cave', icon: '🪨',
        pool: ['golem_earth', 'bat_wind', 'ent_forest', 'magma_elem'],
    },
};
const ROUTE_IDS = ['fire', 'water', 'wind', 'earth'];
const ROUTE_LEVELS = 5;   // niveles de ruta antes del guardián

// ═══════════════════════════════════════════════════════
// Campaña: niveles 1–30
// count: enemigos · react: ms de reacción (dificultad Invocador)
// elite: probabilidad de élite · modifier: frenzy | fog | elite
// ═══════════════════════════════════════════════════════

const COMMON_LEVELS = 30;

const ACTS = [
    { from: 1, to: 10, name: 'Acto I: La Academia en Ruinas', theme: 'academy', reverb: 'hall' },
    { from: 11, to: 20, name: 'Acto II: Los Campos Corrompidos', theme: 'fields', reverb: 'open' },
    { from: 21, to: 30, name: 'Acto III: El Umbral', theme: 'threshold', reverb: 'cave' },
];
function actFor(level) { return ACTS.find(a => level >= a.from && level <= a.to) || ACTS[ACTS.length - 1]; }

const CAMPAIGN = [
    null,
    /* 1 */ { count: 4, react: 6000, pool: ['wolf_fire'] },
    /* 2 */ { count: 5, react: 5800, pool: ['wolf_fire', 'frog_water'] },
    /* 3 */ { count: 6, react: 5500, pool: ['wolf_fire', 'frog_water', 'bat_wind'] },
    /* 4 */ { count: 6, react: 5300, pool: BASICS },
    /* 5 */ { count: 7, react: 5000, pool: BASICS },
    /* 6 */ { count: 7, react: 4800, pool: BASICS },
    /* 7 */ { count: 8, react: 4700, pool: BASICS, modifier: 'frenzy' },
    /* 8 */ { count: 8, react: 4500, pool: BASICS },
    /* 9 */ { count: 9, react: 4300, pool: BASICS },
    /* 10 */ { count: 8, react: 4400, pool: [...BASICS, 'magma_elem'], elite: 0.3 },
    /* 11 */ { count: 9, react: 4200, pool: [...BASICS, 'magma_elem', 'storm_spec'], elite: 0.25 },
    /* 12 */ { count: 9, react: 4100, pool: [...BASICS, 'magma_elem', 'storm_spec', 'ent_forest'], elite: 0.25 },
    /* 13 */ { count: 10, react: 4000, pool: ALL_COMMON, elite: 0.25 },
    /* 14 */ { count: 10, react: 3900, pool: ALL_COMMON, elite: 0.25, modifier: 'frenzy' },
    /* 15 */ { count: 4, react: 3900, pool: BASICS, miniboss: { lives: 6, mimic: BASICS } },
    /* 16 */ { count: 11, react: 3700, pool: ALL_COMMON, elite: 0.3 },
    /* 17 */ { count: 11, react: 3600, pool: ALL_COMMON, elite: 0.3 },
    /* 18 */ { count: 10, react: 3700, pool: ALL_COMMON, elite: 0.3, modifier: 'fog' },
    /* 19 */ { count: 12, react: 3450, pool: ALL_COMMON, elite: 0.32 },
    /* 20 */ { count: 12, react: 3400, pool: ALL_COMMON, elite: 0.33 },
    /* 21 */ { count: 12, react: 3300, pool: ALL_COMMON, elite: 0.35, modifier: 'frenzy' },
    /* 22 */ { count: 12, react: 3250, pool: ALL_COMMON, elite: 0.35 },
    /* 23 */ { count: 12, react: 3350, pool: ALL_COMMON, elite: 0.36, modifier: 'fog' },
    /* 24 */ { count: 13, react: 3150, pool: ALL_COMMON, elite: 0.38 },
    /* 25 */ { count: 5, react: 3200, pool: ALL_COMMON, elite: 0.3, miniboss: { lives: 8, mimic: ALL_COMMON } },
    /* 26 */ { count: 14, react: 3050, pool: ALL_COMMON, elite: 0.4 },
    /* 27 */ { count: 8, react: 3200, pool: ELITES, modifier: 'elite' },
    /* 28 */ { count: 13, react: 3150, pool: ALL_COMMON, elite: 0.42, modifier: 'fog' },
    /* 29 */ { count: 15, react: 2950, pool: ALL_COMMON, elite: 0.45, modifier: 'frenzy' },
    /* 30 */ { count: 16, react: 2900, pool: ALL_COMMON, elite: 0.45 },
];

/** Ecos que suenan al COMENZAR un nivel. El eco 30 suena al superarlo. */
const ECHO_AT_START = { 1: '1', 10: '10', 15: '15_shadow', 20: '20', 25: '25_shadow' };
/** Páginas de las Crónicas de los Antiguos Ecos que se encuentran al SUPERAR un nivel. */
const CHRONICLE_AT_END = { 5: 1, 10: 2, 15: 3, 20: 4, 25: 5 };
/** En cada ruta, la leyenda del guardián suena al superar este nivel. */
const LEGEND_AT_ROUTE_LEVEL = 3;

/** Nivel de ruta (1..5). */
function routeLevelDef(routeId, n) {
    return {
        count: 10 + n,
        react: 3000 - n * 60,
        pool: ROUTES[routeId].pool,
        elite: 0.35 + n * 0.04,
        modifier: n === 3 ? 'fog' : n === 4 ? 'frenzy' : null,
    };
}

const MODIFIERS = {
    frenzy: {
        id: 'frenzy', name: 'Frenesí',
        desc: 'Los enemigos llegan más rápido. Los puntos valen más.',
        react: 0.85, pace: 0.6, score: 1.5,
    },
    fog: {
        id: 'fog', name: 'Niebla',
        desc: 'Los enemigos no anuncian su posición. Confía solo en tu oído. Los puntos valen más.',
        react: 1.1, pace: 1, score: 1.5, hideDir: true,
    },
    elite: {
        id: 'elite', name: 'Élite',
        desc: 'Solo criaturas élite. Prepara tus dúos.',
        react: 1, pace: 1, score: 1.25,
    },
};

// ═══════════════════════════════════════════════════════
// Dificultad, puntuación y ritmo
// ═══════════════════════════════════════════════════════

const DIFFICULTIES = {
    aprendiz: {
        id: 'aprendiz', name: 'Aprendiz', react: 1.5, lives: 7, healEvery: 5, hints: true, score: 0.75,
        desc: 'Más tiempo, siete vidas y pistas de debilidad en cada enemigo. La dirección se anuncia siempre.',
    },
    invocador: {
        id: 'invocador', name: 'Invocador', react: 1.0, lives: 5, healEvery: 8, hints: false, score: 1,
        desc: 'La experiencia equilibrada. Cinco vidas.',
    },
    archimago: {
        id: 'archimago', name: 'Archimago', react: 0.75, lives: 3, healEvery: 10, hints: false, score: 1.5,
        desc: 'Menos tiempo y solo tres vidas. Puntos por uno coma cinco.',
    },
};
const DIFFICULTY_IDS = ['aprendiz', 'invocador', 'archimago'];

const SCORE = {
    hit: 100, crit: 250, shieldBlock: 150, speedBonus: 0.5,
    kill: { basic: 50, minion: 25, elite: 200, miniboss: 800, boss: 1500, final: 5000 },
    wave: 300, level: 500, flawless: 1000,
};

const CFG = {
    PACE_MS: 1100,            // pausa mínima entre turnos
    PACE_MAX_EXTRA_MS: 2600,  // máximo que se espera a que termine la voz
    FIRST_TURN_MS: 1300,
    STREAK_MULT_STEP: 5,      // cada 5 aciertos seguidos sube el multiplicador
    MAX_MULT: 4,
    TICK_FROM: 0.55,          // el tic-tac empieza al 55 % del tiempo
    SHIELD_MS: 2800,          // duración del escudo de Rok
    RESUME_GRACE_MS: 1200,    // tiempo extra al volver de la pausa
    MIN_REACT_MS: 1400,
    PRACTICE_REACT_MS: 7000,
    ARENA_BOSS_EVERY: 5,
};

// ═══════════════════════════════════════════════════════
// Logros
// ═══════════════════════════════════════════════════════

const ACHIEVEMENTS_DEF = [
    { id: 'tutorial', name: 'Oídos Abiertos', desc: 'Completa el entrenamiento.' },
    { id: 'first_kill', name: 'Primera Sangre', desc: 'Derrota a tu primer enemigo.' },
    { id: 'first_crit', name: 'Voces Unidas', desc: 'Acierta tu primer golpe crítico con un dúo.' },
    { id: 'act1', name: 'Superviviente de la Academia', desc: 'Supera el nivel 10.' },
    { id: 'shadow', name: 'Cazador de Sombras', desc: 'Derrota a la Sombra Imitadora.' },
    { id: 'act2', name: 'Más Allá de los Campos', desc: 'Supera el nivel 20.' },
    { id: 'threshold', name: 'El Umbral', desc: 'Supera el nivel 30 y elige tu destino.' },
    { id: 'branch_fire', name: 'Señor del Fuego', desc: 'Purifica a Ignar en la ruta de Fuego.' },
    { id: 'branch_water', name: 'Guardián del Agua', desc: 'Purifica a la Gran Corriente en la ruta de Agua.' },
    { id: 'branch_wind', name: 'Voz del Viento', desc: 'Purifica a Zael en la ruta de Viento.' },
    { id: 'branch_earth', name: 'Corazón de Piedra', desc: 'Purifica a Rok en la ruta de Tierra.' },
    { id: 'final_boss', name: 'Ecos Eternos', desc: 'Derrota al Avatar del Silencio.' },
    { id: 'oyente', name: 'El Oyente sin Miedo', desc: 'Sostén el Aliento y suéltalo cuando suene la campana.' },
    { id: 'streak10', name: 'En Armonía', desc: 'Consigue una racha de 10 aciertos seguidos.' },
    { id: 'streak25', name: 'Sinfonía Elemental', desc: 'Consigue una racha de 25 aciertos seguidos.' },
    { id: 'flawless', name: 'Intocable', desc: 'Supera un nivel de la historia sin recibir daño.' },
    { id: 'gold10', name: 'Oído de Oro', desc: 'Consigue la medalla de oro en diez niveles de la historia.' },
    { id: 'fog', name: 'Oído Absoluto', desc: 'Supera un nivel de Niebla.' },
    { id: 'crits50', name: 'Maestro de los Dúos', desc: 'Acierta 50 golpes críticos en total.' },
    { id: 'arena10', name: 'Gladiador del Eco', desc: 'Alcanza la oleada 10 en la Arena.' },
    { id: 'arena20', name: 'Leyenda de la Arena', desc: 'Alcanza la oleada 20 en la Arena.' },
    { id: 'bestiary', name: 'Erudito', desc: 'Encuentra a todas las criaturas comunes del Bestiario.' },
    { id: 'archimago', name: 'Archimago', desc: 'Purifica a un guardián en dificultad Archimago.' },
    { id: 'daily', name: 'Eco del Día', desc: 'Completa un desafío diario.' },
    { id: 'daily3', name: 'Tres Amaneceres', desc: 'Juega el desafío diario tres días seguidos.' },
    { id: 'daily7', name: 'Semana de Ecos', desc: 'Juega el desafío diario siete días seguidos.' },
    { id: 'daily30', name: 'Luna Entera', desc: 'Juega el desafío diario treinta días seguidos.' },
    { id: 'friend', name: 'Compañeros de Armas', desc: 'Añade a un amigo en la Comunidad.' },
    { id: 'duel_win', name: 'Primer Duelo', desc: 'Gana un duelo contra otro invocador.' },
    { id: 'duel_master', name: 'Maestro Duelista', desc: 'Gana cinco duelos.' },
];

// ═══════════════════════════════════════════════════════
// Leyendas de la Academia (rivales ficticios para la Arena)
// ═══════════════════════════════════════════════════════

const LEGENDS = [
    { name: 'Maestra Sylvara', score: 150000, wave: 12, note: 'Guardiana del Segundo Anillo' },
    { name: 'Archivero Tomás', score: 40000, wave: 7, note: 'Aprendiz de tercer año' },
    { name: 'Lía la Novicia', score: 8000, wave: 4, note: 'Estudiante de primer año' },
];

// ═══════════════════════════════════════════════════════
// Utilidades compartidas
// ═══════════════════════════════════════════════════════

/** Generador pseudoaleatorio con semilla (mulberry32 sobre un hash FNV). */
function makeRng(seedStr) {
    let h = 2166136261;
    for (const ch of String(seedStr)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => {
        h += 0x6D2B79F5;
        let t = h;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Azar de la partida. Con semilla (desafío diario, duelos) todos los jugadores
 * reciben las mismas oleadas, criaturas y direcciones.
 */
const GameRandom = {
    _r: null,
    _seed: null,
    seed(s) { this._seed = String(s); this._r = makeRng(s); },
    clear() { this._r = null; this._seed = null; },
    get seeded() { return !!this._r; },
    /**
     * Ejecuta fn con un azar propio, derivado de la semilla y de `tag` (por ejemplo «oleada:3»).
     * Así esa parte de la partida sale igual para todos los jugadores, hayan gastado el azar que
     * hayan gastado antes (quien falla tiene más turnos). Sin semilla, no cambia nada.
     * Solo cubre lo que fn hace antes de su primera espera (await).
     */
    scoped(tag, fn) {
        if (this._seed === null) return fn();
        const prev = this._r;
        this._r = makeRng(`${this._seed}|${tag}`);
        try { return fn(); } finally { this._r = prev; }
    },
};
function rand() { return GameRandom._r ? GameRandom._r() : Math.random(); }
function pick(arr, rnd = rand) { return arr[Math.floor(rnd() * arr.length)]; }
function shuffle(arr, rnd = rand) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }
function fmtNum(n) { return Math.round(n).toLocaleString('es-ES'); }
function fmtDecimal(n, digits = 1) { return n.toFixed(digits).replace('.', ','); }
function joinY(list) {
    if (list.length <= 1) return list.join('');
    // «e» ante una palabra que empieza por el sonido i («Primera Sangre e Intocable»), salvo «hie-».
    const last = String(list[list.length - 1]);
    const y = /^h?i(?![aeoáéó])/i.test(last) ? 'e' : 'y';
    return `${list.slice(0, -1).join(', ')} ${y} ${last}`;
}
function elementNames(ids) { return joinY(ids.map(id => ELEMENTS[id].name)); }
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
/** Nombre de invocador limpio: solo letras, números, espacios, guion y guion bajo; 24 caracteres como mucho. */
function cleanName(raw) {
    return String(raw ?? '').replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
}

/** Día anterior o posterior a un identificador de día «AAAA-MM-DD». */
function dayShift(day, delta) {
    const [y, m, d] = day.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

/**
 * Días seguidos jugando el desafío diario. `days` son los días jugados y `today` el de hoy.
 * Si hoy aún no se ha jugado, la racha de ayer sigue viva.
 */
function dailyStreak(days, today) {
    const played = new Set(days || []);
    let day = played.has(today) ? today : dayShift(today, -1);
    let n = 0;
    while (played.has(day)) { n++; day = dayShift(day, -1); }
    return n;
}

/** Medallas de los niveles de la historia: oro sin recibir golpes, plata con uno, bronce al superarlo. */
const MEDALS = {
    1: { name: 'bronce', icon: '🥉' },
    2: { name: 'plata', icon: '🥈' },
    3: { name: 'oro', icon: '🥇' },
};
function medalFor(result) {
    const hits = result.stats.damage;
    return hits === 0 ? 3 : hits === 1 ? 2 : 1;
}

function fmtDuration(secs) {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
    const parts = [];
    if (h > 0) parts.push(plural(h, 'hora', 'horas'));
    if (m > 0) parts.push(plural(m, 'minuto', 'minutos'));
    return parts.length ? parts.join(' y ') : 'menos de un minuto';
}

/**
 * Frases fijas del modo historia. Las usan el juego y el generador de
 * narración (tools/generar-narracion.mjs), así que se pueden grabar con
 * la voz del narrador: si se cambian, hay que volver a generar las voces.
 */
const STORY_LINES = {
    campaignIntro(n) {
        const def = CAMPAIGN[n], mod = def.modifier ? MODIFIERS[def.modifier] : null;
        const count = def.count + (def.miniboss ? 1 : 0);
        let t = `Nivel ${n}. `;
        if (mod) t += `${mod.name}: ${mod.desc} `;
        if (def.miniboss) t += 'La Sombra Imitadora acecha entre los enemigos. ';
        return t + `${plural(count, 'enemigo', 'enemigos')}. ¡Prepárate!`;
    },
    routeIntro(r, n) {
        const R = ROUTES[r], def = routeLevelDef(r, n), mod = def.modifier ? MODIFIERS[def.modifier] : null;
        return `Ruta de ${R.name}, nivel ${n} de ${ROUTE_LEVELS}. ${mod ? `${mod.name}: ${mod.desc} ` : ''}${plural(def.count, 'enemigo', 'enemigos')}.`;
    },
    meetName(def) { return `¡Nueva criatura! ${def.name}. ${def.desc} Escucha.`; },
    meetWeak(def) { return `${weaknessText(def)} Nunca uses ${elementNames(def.cure)}: la curarías. Escucha otra vez.`; },
};

/** Describe cómo vencer a un perfil de combate (para pistas y bestiario). */
function weaknessText(profile) {
    if (!profile.weak || profile.weak.length === 0) return 'Sin debilidad fija.';
    let t = `Débil a ${elementNames(profile.weak)}.`;
    if (profile.critHit) {
        const d = dualByName(profile.critHit);
        t += ` Crítico: ${profile.critHit}, ${elementNames(d.elements)} a la vez.`;
    }
    return t;
}

// Artículos para frases naturales («La Rana te ataca», «Ignar te ataca»).
const ENEMY_ARTICLES = { frog_water: 'la', ember: 'la', shadow: 'la', boss_fire: '', boss_wind: '', boss_earth: '' };
for (const e of Object.values(ENEMIES)) e.art = ENEMY_ARTICLES[e.id] ?? 'el';

function capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
/** «el Lobo», «la Rana», «Ignar». */
function shortWithArt(def) { return def.art ? `${def.art} ${def.short}` : def.short; }
/** «el Lobo de Fuego», «la Rana de Agua». */
function nameWithArt(def) { return def.art ? `${def.art} ${def.name}` : def.name; }
function defeatedWord(def) {
    if (def.tier === 'boss') return 'purificado';
    return def.art === 'la' ? 'derrotada' : 'derrotado';
}
