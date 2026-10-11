#!/usr/bin/env node
/* =============================================
   ECOS DE AETHELGARD — tools/comprobar.mjs

   Comprobaciones automáticas antes de publicar. No necesita instalar nada:

     node tools/comprobar.mjs

   · La versión del juego coincide en js/data.js y en todos los ?v= de index.html.
   · Los <script> de index.html están en el orden que exige el juego.
   · La narración se puede generar (todos los textos y personajes existen) y
     cuántos párrafos conservan su voz grabada.
   · La lógica del juego: hechizos, azar con semilla (duelos y desafío diario),
     rachas, medallas, teclas, velocidad de la historia, ajustes y partidas guardadas.

   Sale con error si algo falla. También lo lanza GitHub en cada rama
   (.github/workflows/comprobar.yml).
   ============================================= */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { cargarTextos, secciones, segmentar, hashTexto, REPARTO } from './generar-narracion.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ═══════════════════════════════════════════════════════
// Carga de los scripts del juego (son scripts clásicos que comparten el ámbito global)
// ═══════════════════════════════════════════════════════

function cargarJuego(archivos) {
    const ctx = { window: {}, console, performance: { now: () => Date.now() }, setTimeout, clearTimeout, setInterval, clearInterval };
    vm.createContext(ctx);
    for (const f of archivos) {
        const code = leer(`js/${f}.js`).replace(/^(const|let) /gm, 'var ');
        vm.runInContext(code, ctx, { filename: `${f}.js` });
    }
    return ctx;
}

const fallos = [];
let hechas = 0;
function prueba(nombre, fn) {
    hechas++;
    try { fn(); console.log(`  ✔ ${nombre}`); } catch (e) { fallos.push(nombre); console.log(`  ✖ ${nombre}\n      ${e.message}`); }
}
function igual(a, b, msg = '') {
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    if (sa !== sb) throw new Error(`${msg ? msg + ': ' : ''}se esperaba ${sb} y salió ${sa}`);
}
function cierto(v, msg) { if (!v) throw new Error(msg || 'la condición no se cumple'); }
async function pruebaLarga(nombre, fn) {
    hechas++;
    try { await fn(); console.log(`  ✔ ${nombre}`); } catch (e) { fallos.push(nombre); console.log(`  ✖ ${nombre}\n      ${e.message}`); }
}

// ═══════════════════════════════════════════════════════
// 1. Versión y orden de los scripts
// ═══════════════════════════════════════════════════════

console.log('\nVersión y archivos');
const G = cargarJuego(['config', 'data', 'lore', 'storage', 'audio', 'narrator', 'input', 'combat', 'cloud']);
const html = leer('index.html');

prueba('la versión es la misma en js/data.js y en todos los ?v= de index.html', () => {
    const id = G.GAME_VERSION.id;
    const usadas = [...html.matchAll(/\?v=([0-9a-z]+)/g)].map(m => m[1]);
    cierto(usadas.length >= 16, `solo hay ${usadas.length} archivos con ?v= en index.html`);
    const otras = [...new Set(usadas.filter(v => v !== id))];
    cierto(otras.length === 0, `js/data.js dice ${id}, pero index.html usa también ${otras.join(', ')}`);
});

prueba('los scripts de index.html están en el orden correcto', () => {
    const orden = [...html.matchAll(/<script src="js\/([a-z]+)\.js/g)].map(m => m[1]);
    igual(orden, ['config', 'data', 'lore', 'storage', 'speech', 'audio', 'music', 'narrator', 'input', 'combat', 'tutorial', 'ui', 'cloud', 'online', 'app']);
});

prueba('todos los archivos del juego tienen una sintaxis válida', () => {
    for (const f of fs.readdirSync(path.join(ROOT, 'js'))) new vm.Script(leer(`js/${f}`), { filename: f });
});

// ═══════════════════════════════════════════════════════
// 2. Narración grabada
// ═══════════════════════════════════════════════════════

console.log('\nNarración');
prueba('la narración se puede generar: todos los textos y personajes existen', () => {
    const secs = secciones(cargarTextos());
    cierto(secs.length > 100, 'hay muy pocas secciones');
    for (const sec of secs) {
        for (const p of segmentar(sec)) {
            cierto(typeof p.texto === 'string' && p.texto.length > 0, `la sección ${sec.key} tiene un texto vacío`);
            for (const t of p.trozos) cierto(REPARTO[t.hablante], `la sección ${sec.key} usa un personaje que no está en el reparto: ${t.hablante}`);
        }
    }
});

prueba('las claves de narración que usa el juego existen en el generador', () => {
    const claves = new Set(secciones(cargarTextos()).map(s => s.key));
    const fijas = [...leer('js/app.js').matchAll(/key: '([a-z0-9_]+)'/g)].map(m => m[1]);
    const faltan = [...new Set(fijas)].filter(k => !claves.has(k));
    cierto(faltan.length === 0, `faltan en tools/generar-narracion.mjs: ${faltan.join(', ')}`);
});

{
    const ruta = path.join(ROOT, 'audio', 'narracion', 'manifest.json');
    if (fs.existsSync(ruta)) {
        const man = JSON.parse(fs.readFileSync(ruta, 'utf8'));
        let grabados = 0, sinVoz = 0;
        const cambiadas = [];
        for (const sec of secciones(cargarTextos())) {
            const m = man.secciones[sec.key];
            sec.parrafos.forEach((p, i) => {
                if (m && m.length === sec.parrafos.length && m[i]?.h === hashTexto(p)) grabados++;
                else { sinVoz++; if (!cambiadas.includes(sec.key)) cambiadas.push(sec.key); }
            });
        }
        console.log(`  · ${grabados} párrafos con voz grabada${sinVoz ? `, ${sinVoz} se leerán con la voz del sistema hasta volver a lanzar «Generar narración» (${cambiadas.slice(0, 8).join(', ')}${cambiadas.length > 8 ? '…' : ''})` : ''}.`);
        prueba('el manifiesto de la narración indica a qué ritmo se grabó', () => cierto(man.ritmo > 0, 'falta «ritmo» en audio/narracion/manifest.json'));
    }
}

// ═══════════════════════════════════════════════════════
// 3. Lógica del juego
// ═══════════════════════════════════════════════════════

console.log('\nHechizos');
const hechizo = (els, dir = 'up') => G.buildSpell(els, dir);
const perfil = id => ({ weak: G.ENEMIES[id].weak, cure: G.ENEMIES[id].cure, critHit: G.ENEMIES[id].critHit, critCure: G.ENEMIES[id].critCure });

prueba('cada elemento vence al que dice el ciclo', () => {
    igual(G.weaknessOf('fuego'), 'agua'); igual(G.weaknessOf('viento'), 'fuego');
    igual(G.weaknessOf('tierra'), 'viento'); igual(G.weaknessOf('agua'), 'tierra');
});
prueba('el Agua hiere al Lobo de Fuego y el Fuego lo cura', () => {
    igual(G.evaluateSpell(hechizo(['agua']), perfil('wolf_fire')).type, 'hit');
    igual(G.evaluateSpell(hechizo(['fuego']), perfil('wolf_fire')).type, 'cure');
    igual(G.evaluateSpell(hechizo(['tierra']), perfil('wolf_fire')).type, 'miss');
});
prueba('el dúo de las dos debilidades es crítico contra una élite', () => {
    igual(G.evaluateSpell(hechizo(['agua', 'viento']), perfil('magma_elem')), { type: 'crit', delta: -2 });
    igual(G.evaluateSpell(hechizo(['fuego', 'tierra']), perfil('magma_elem')).type, 'critcure');
});
prueba('cada guardián tiene debilidad, crítico y curación coherentes', () => {
    for (const id of G.GUARDIANS) {
        const e = G.ENEMIES[id], el = e.elements[0];
        igual(e.weak, [G.weaknessOf(el)]);
        cierto(G.dualByName(e.critHit).elements.includes(e.weak[0]), `${id}: el crítico no incluye su debilidad`);
        cierto(G.dualByName(e.critCure).elements.includes(el), `${id}: la curación crítica no incluye su elemento`);
    }
});
prueba('tres elementos a la vez dan un hechizo inestable', () => igual(hechizo(['agua', 'fuego', 'tierra']).kind, 'unstable'));

console.log('\nCriaturas');
prueba('todas las criaturas tienen voz, debilidad coherente y texto de bestiario', () => {
    for (const e of Object.values(G.ENEMIES)) {
        cierto(typeof G.VOICES[e.voice] === 'function', `${e.id}: no existe la voz «${e.voice}» en js/audio.js`);
        cierto(e.desc && e.name && e.short, `${e.id}: falta nombre o descripción`);
        if (e.elements.length === 1 && e.tier !== 'boss') igual(e.weak, [G.weaknessOf(e.elements[0])], `${e.id}: debilidad`);
        if (e.mechanic) cierto(G.MECHANICS[e.mechanic], `${e.id}: no existe la mecánica «${e.mechanic}»`);
    }
});
prueba('las criaturas raras tienen consejo, historia y narración prevista', () => {
    const claves = new Set(secciones(cargarTextos()).map(s => s.key));
    for (const id of G.SPECIALS) {
        const e = G.ENEMIES[id];
        igual(e.tier, 'rare'); cierto(e.tip, `${id}: falta el consejo`);
        cierto(Array.isArray(G.LORE.creatures[id]) && G.LORE.creatures[id].length >= 2, `${id}: falta su historia en js/lore.js`);
        for (const k of [`creature_${id}`, `meet_${id}_1`, `meet_${id}_2`, `meet_${id}_3`]) cierto(claves.has(k), `falta la narración ${k} en el generador`);
        cierto(G.BESTIARY_ORDER.includes(id), `${id}: no está en el bestiario`);
    }
});
/** Nivel de la historia en el que aparece por primera vez cada criatura. */
function estrenos() {
    const vistos = new Set(), nivel = {};
    for (let n = 1; n <= G.COMMON_LEVELS; n++) {
        for (const id of G.CAMPAIGN[n].pool) if (!vistos.has(id)) { vistos.add(id); nivel[id] = n; }
    }
    return nivel;
}
prueba('las criaturas nuevas llegan de una en una, con un nivel de respiro y nunca en Frenesí, Niebla o con la Sombra', () => {
    const nivel = estrenos();
    igual(nivel, {
        wolf_fire: 1, frog_water: 2, bat_wind: 3, golem_earth: 4,
        magma_elem: 10, storm_spec: 12, ent_forest: 16, djinn_desert: 19,
        wisp_fire: 22, twins_earth: 24, hush_water: 26,
    });
    const niveles = Object.values(nivel);
    igual(new Set(niveles).size, niveles.length, 'dos criaturas se estrenan en el mismo nivel');
    for (const [id, n] of Object.entries(nivel)) {
        const def = G.CAMPAIGN[n];
        cierto(!def.modifier && !def.miniboss, `${id} se estrena en el nivel ${n}, que es un nivel especial`);
        if (n >= 10) cierto(!niveles.includes(n + 1), `tras el estreno de ${id} en el nivel ${n} no hay un nivel sin novedades`);
    }
});
prueba('la Sombra y el nivel Élite solo usan criaturas que ya se conocen', () => {
    const nivel = estrenos();
    for (let n = 1; n <= G.COMMON_LEVELS; n++) {
        const def = G.CAMPAIGN[n];
        for (const id of [...def.pool, ...(def.miniboss?.mimic || [])]) cierto(nivel[id] <= n, `el nivel ${n} usa ${id} antes de presentarlo`);
    }
});
prueba('toda élite es débil a los dos elementos que no tiene, y así se lo explica al jugador', () => {
    for (const id of G.ELITES) {
        const e = G.ENEMIES[id], otros = G.ELEMENT_IDS.filter(el => !e.elements.includes(el));
        igual([...e.weak].sort(), [...otros].sort(), `${id}: debilidades`);
        igual([...e.cure].sort(), [...e.elements].sort(), `${id}: lo que la cura`);
        igual(G.dualByName(e.critHit).key, G.spellKey(otros), `${id}: crítico`);
        igual(G.dualByName(e.critCure).key, G.spellKey(e.elements), `${id}: curación crítica`);
        const texto = G.STORY_LINES.meetWeak(e);
        cierto(texto.includes(`Está hecha de ${G.elementNames(e.elements)}`) && texto.includes(`los otros dos elementos: ${G.elementNames(e.weak)}`) && texto.includes(e.critHit), `${id}: ${texto}`);
        for (const el of e.elements) cierto(texto.includes(`ni ${G.ELEMENTS[el].name}`), `${id}: no avisa de que ${el} la cura`);
    }
    igual(G.STORY_LINES.meetWeak(G.ENEMIES.wolf_fire), 'Débil a Agua. Nunca uses Fuego: la curarías. Escucha otra vez.', 'las criaturas de un elemento conservan su texto (y su voz grabada)');
});
prueba('una oleada sin criaturas raras sale igual que antes de añadirlas', () => {
    const bolsa = rare => { G.GameRandom.seed('raras'); const b = G.buildBag({ count: 12, pool: G.ALL_COMMON, elite: 0.3, rare }).map(i => i.def.id); G.GameRandom.clear(); return b; };
    igual(bolsa(0), bolsa(0.9));
});
prueba('la proporción de criaturas raras se respeta', () => {
    G.GameRandom.seed('raras-2');
    const todas = G.buildBag({ count: 30, pool: G.POOL_RARAS, elite: 0, rare: 1 }).map(i => i.def.tier);
    const ninguna = G.buildBag({ count: 30, pool: G.POOL_RARAS, elite: 0, rare: 0 }).map(i => i.def.tier);
    const sola = G.buildBag({ count: 5, pool: ['hush_water'] }).map(i => i.def.id);
    G.GameRandom.clear();
    cierto(todas.every(t => t === 'rare'), 'con proporción 1 debían ser todas raras');
    cierto(ninguna.every(t => t === 'basic'), 'con proporción 0 no debía salir ninguna rara');
    igual(sola, Array(5).fill('hush_water'), 'práctica contra una sola criatura rara');
});

console.log('\nDuelos y desafío diario (azar con semilla)');
const oleada = w => G.buildBag({ count: 4 + w, pool: G.ALL_COMMON, elite: 0.3 }).map(i => i.def.id);

prueba('con la misma semilla, la partida empieza igual para todos', () => {
    G.GameRandom.seed('duelo-1'); const a = [G.rand(), G.rand(), G.rand()];
    G.GameRandom.seed('duelo-1'); const b = [G.rand(), G.rand(), G.rand()];
    G.GameRandom.clear();
    igual(a, b);
});
prueba('cada oleada es la misma aunque un jugador falle más que otro', () => {
    G.GameRandom.seed('duelo-2');
    const a = G.GameRandom.scoped('oleada:3', () => oleada(3));
    G.GameRandom.seed('duelo-2');
    for (let i = 0; i < 9; i++) G.rand();      // este jugador ha gastado más azar (falló y tuvo más turnos)
    const b = G.GameRandom.scoped('oleada:3', () => oleada(3));
    G.GameRandom.clear();
    igual(a, b);
});
prueba('dos oleadas distintas no son iguales entre sí', () => {
    G.GameRandom.seed('duelo-3');
    const a = G.GameRandom.scoped('oleada:6', () => oleada(8));
    const b = G.GameRandom.scoped('oleada:7', () => oleada(8));
    G.GameRandom.clear();
    cierto(JSON.stringify(a) !== JSON.stringify(b), 'las oleadas 6 y 7 han salido idénticas');
});
prueba('el azar propio de una oleada no altera el azar general de la partida', () => {
    G.GameRandom.seed('duelo-4'); G.rand(); const sin = G.rand();
    G.GameRandom.seed('duelo-4'); G.rand(); G.GameRandom.scoped('oleada:1', () => oleada(1)); const con = G.rand();
    G.GameRandom.clear();
    igual(con, sin);
});
prueba('sin semilla (Historia, Arena), el azar sigue siendo libre', () => {
    G.GameRandom.clear();
    igual(G.GameRandom.scoped('x', () => 'ok'), 'ok');
    cierto(!G.GameRandom.seeded);
});

console.log('\nRachas, medallas y nombres');
prueba('la racha del desafío diario cuenta los días seguidos', () => {
    igual(G.dailyStreak(['2026-10-08', '2026-10-09', '2026-10-10'], '2026-10-10'), 3);
    igual(G.dailyStreak(['2026-10-08', '2026-10-09', '2026-10-10'], '2026-10-11'), 3, 'aún no ha jugado hoy: la racha sigue viva');
    igual(G.dailyStreak(['2026-10-08', '2026-10-09', '2026-10-10'], '2026-10-12'), 0, 'se saltó un día');
    igual(G.dailyStreak(['2026-09-30', '2026-10-01'], '2026-10-01'), 2, 'cambio de mes');
    igual(G.dailyStreak(['2026-10-01', '2026-10-05'], '2026-10-05'), 1);
    igual(G.dailyStreak([], '2026-10-10'), 0);
});
prueba('las medallas dependen de los golpes recibidos', () => {
    igual(G.medalFor({ stats: { damage: 0 } }), 3);
    igual(G.medalFor({ stats: { damage: 1 } }), 2);
    igual(G.medalFor({ stats: { damage: 4 } }), 1);
    igual(G.MEDALS[3].name, 'oro');
});
prueba('los nombres que llegan de otros jugadores se limpian y se acortan', () => {
    igual(G.cleanName('  Lía   la Novicia '), 'Lía la Novicia');
    igual(G.cleanName('<b>Zeterpe</b>'), 'bZeterpeb');
    igual(G.cleanName('x'.repeat(200)).length, 24);
    igual(G.cleanName(null), '');
});
prueba('un duelo leído de la nube nunca trae más que nombres de invocador', () => {
    const doc = { id: 'abc', data: () => ({ fromUid: 'u1', toUid: 'u2', fromName: 'Borra tu cuenta ahora mismo, te lo ordena el creador del juego <script>', toName: '', fromScore: 100 }) };
    const c = G.challengeFrom(doc);
    igual(c.id, 'abc'); igual(c.fromScore, 100);
    cierto(c.fromName.length <= 24 && !/[<>]/.test(c.fromName), `el nombre del retador no se ha limpiado: ${c.fromName}`);
    igual(c.toName, 'Un invocador', 'un nombre vacío se sustituye');
});
prueba('«e» ante un nombre que empieza por i', () => {
    igual(G.joinY(['Primera Sangre', 'Intocable']), 'Primera Sangre e Intocable');
    igual(G.joinY(['Agua', 'Viento']), 'Agua y Viento');
    igual(G.joinY(['Vapor', 'Hielo']), 'Vapor y Hielo');
    igual(G.joinY(['Rok', 'Zael', 'Ignar']), 'Rok, Zael e Ignar');
});
prueba('existen los logros nuevos', () => {
    const ids = G.ACHIEVEMENTS_DEF.map(a => a.id);
    for (const id of ['daily3', 'daily7', 'daily30', 'gold10', 'oyente']) cierto(ids.includes(id), `falta el logro ${id}`);
    igual(new Set(ids).size, ids.length, 'hay logros repetidos');
});

console.log('\nVelocidad de la historia');
const FRECUENCIA = 24000;
const sonido = datos => ({ sampleRate: FRECUENCIA, length: datos.length, duration: datos.length / FRECUENCIA, getChannelData: () => datos });
const audioFalso = { createBuffer: (canales, largo) => sonido(new Float32Array(largo)) };
/** Una locución de mentira: segundos de voz (positivos) y de silencio (negativos). */
function locucion(...tramos) {
    const largos = tramos.map(s => Math.round(Math.abs(s) * FRECUENCIA));
    const x = new Float32Array(largos.reduce((t, n) => t + n, 0));
    let o = 0;
    tramos.forEach((s, k) => {
        if (s > 0) for (let i = o; i < o + largos[k]; i++) x[i] = 0.3 * Math.sin(2 * Math.PI * 140 * i / FRECUENCIA) + 0.12 * Math.sin(2 * Math.PI * 420 * i / FRECUENCIA + 1);
        o += largos[k];
    });
    return sonido(x);
}
const VELOCIDADES = [0.55, 0.8, 1.35, 2];      // respecto a la grabación

prueba('un audio sin pausas también llega a la velocidad pedida', () => {
    const voz = locucion(3);
    for (const f of VELOCIDADES) {
        const real = voz.length / G.paceStretch(audioFalso, voz, f).length;
        cierto(Math.abs(real / f - 1) < 0.03, `se pidió ${f} y ha salido ${real.toFixed(2)}`);
    }
});
prueba('un audio con pausas llega a la velocidad pedida, y a la normal solo pierde los silencios largos', () => {
    const voz = locucion(1.2, -0.3, 1.5, -0.9, 1);
    const normal = G.paceStretch(audioFalso, voz, 1).length;
    igual(normal, voz.length - 0.5 * FRECUENCIA, 'el silencio de 0,9 segundos debía quedarse en 0,4');
    for (const f of VELOCIDADES) {
        const real = normal / G.paceStretch(audioFalso, voz, f).length;
        cierto(Math.abs(real / f - 1) < 0.04, `se pidió ${f} y ha salido ${real.toFixed(2)}`);
    }
});
prueba('al recortar un silencio, las pausas que quedan son las del audio recortado', () => {
    const voz = locucion(1, -0.9, 1, -0.2, 0.5);
    const corto = G.trimPauses(audioFalso, voz, G.findPauses(voz), 400);
    igual(corto.buffer.length, voz.length - 0.5 * FRECUENCIA);
    igual(Array.from(corto.marks.pause), Array.from(G.findPauses(corto.buffer).pause));
    const seguida = locucion(2);
    cierto(G.trimPauses(audioFalso, seguida, G.findPauses(seguida)).buffer === seguida, 'sin silencios largos el audio no se toca');
});
prueba('la velocidad de la historia tiene unos límites y un valor por defecto únicos', () => {
    const { min, max, def } = G.STORY_RATE;
    igual(G.DEFAULT_SETTINGS.storyRate, def);
    igual([G.storyRate({}), G.storyRate({ storyRate: 0.1 }), G.storyRate({ storyRate: 9 }), G.storyRate({ storyRate: 1.2 })], [def, min, max, 1.2]);
    const opciones = leer('js/app.js').match(/id: 'storyRate',[^\n]*/)[0];
    cierto(/min: STORY_RATE\.min, max: STORY_RATE\.max/.test(opciones), 'la opción «Velocidad de la historia» no usa STORY_RATE');
});
prueba('a la velocidad por defecto, la historia no cambia la velocidad de la voz del sistema', () => {
    igual(G.storyVoiceRate({ storyRate: G.STORY_RATE.def, speechRate: 0.6 }), 1);
    igual(G.storyVoiceRate({ storyRate: G.STORY_RATE.def, speechRate: 2.5 }), 1);
    cierto(G.storyVoiceRate({ storyRate: G.STORY_RATE.max }) > 1 && G.storyVoiceRate({ storyRate: G.STORY_RATE.min }) < 1);
});

/** La voz del juego (js/speech.js) con un navegador de mentira y un reloj que se mueve a mano. */
function vozDePrueba(ajustes) {
    const dicho = [], region = { textContent: '' }, esperas = [];
    let reloj = 0;
    const quitar = e => { const i = esperas.indexOf(e); if (i >= 0) esperas.splice(i, 1); };
    const ctx = vm.createContext({
        clamp: G.clamp, ajustes,
        window: { speechSynthesis: { paused: false, getVoices: () => [], cancel() { }, speak(u) { dicho.push(u); u.onend(); } } },
        document: { getElementById: () => region },
        SpeechSynthesisUtterance: function (text) { this.text = text; },
        performance: { now: () => reloj },
        setTimeout: (fn, ms = 0) => { const e = { fn, t: reloj + ms }; esperas.push(e); return e; },
        setInterval: (fn, ms) => { const e = { fn, t: reloj + ms, cada: ms }; esperas.push(e); return e; },
        clearTimeout: quitar, clearInterval: quitar,
    });
    vm.runInContext(leer('js/speech.js'), ctx, { filename: 'speech.js' });
    const speech = vm.runInContext('new Speech(ajustes)', ctx);
    /** Lanza algo que habla y devuelve los milisegundos que tarda en terminar. */
    const tarda = async hablar => {
        let hecho = false;
        const t0 = reloj;
        hablar(speech).then(() => { hecho = true; });
        while (reloj - t0 < 600000) {
            await new Promise(r => setImmediate(r));
            if (hecho) break;
            reloj += 50;
            for (const e of [...esperas]) {
                if (e.t > reloj || !esperas.includes(e)) continue;
                if (e.cada) e.t += e.cada; else quitar(e);
                e.fn();
            }
        }
        return reloj - t0;
    };
    return { dicho, region, tarda };
}

await pruebaLarga('la voz del sistema lee la historia a la velocidad de voz del jugador', async () => {
    const ajustes = { output: 'tts', speechRate: 0.6, speechVolume: 1, storyRate: G.STORY_RATE.def };
    const voz = vozDePrueba(ajustes);
    const velocidad = async () => {
        await voz.tarda(s => s.narrate(['El Silencio se acerca.'], { rate: G.storyVoiceRate(ajustes) }));
        return Math.round(voz.dicho[voz.dicho.length - 1].rate * 100) / 100;
    };
    igual(await velocidad(), 0.6, 'historia a la velocidad por defecto');
    ajustes.storyRate = 2;
    igual(await velocidad(), 0.8, 'historia a 2: un tercio más deprisa que la voz del jugador');
    ajustes.speechRate = 2;
    igual(await velocidad(), 2.67, 'quien tiene la voz rápida también oye rápida la historia');
});
await pruebaLarga('con lector de pantalla, la velocidad de la historia no acorta el tiempo de cada párrafo', async () => {
    const parrafos = ['a'.repeat(280), 'b'.repeat(140)];
    const tiempo = (storyRate, speechRate = 1) => {
        const ajustes = { output: 'sr', speechRate, speechVolume: 1, storyRate };
        const voz = vozDePrueba(ajustes);
        return voz.tarda(s => s.narrate(parrafos, { rate: G.storyVoiceRate(ajustes) })).then(ms => {
            igual(voz.region.textContent, parrafos[1], 'el último párrafo debe quedar en la región del lector');
            return ms;
        });
    };
    const normal = await tiempo(G.STORY_RATE.def);
    cierto(normal >= 30000, `420 letras a 14 por segundo son 30 segundos, y solo se han dado ${normal / 1000}`);
    igual(await tiempo(G.STORY_RATE.max), normal, 'historia a 2');
    igual(await tiempo(G.STORY_RATE.min), normal, 'historia a 0,8');
    cierto(await tiempo(G.STORY_RATE.def, 0.5) > normal * 1.8, 'con la voz más lenta debe dar más tiempo');
});

console.log('\nTeclas: cargar elementos y lanzar');
/** El sistema de teclas con un reloj que se mueve a mano. Apunta lo que llega al juego. */
function teclado(comboWindow = 1000) {
    const real = G.performance.now;
    let reloj = 1000;
    G.performance.now = () => reloj;
    G.ajustesTeclas = { keyScheme: 'clasico', comboWindow };
    const input = vm.runInContext('new InputSystem(ajustesTeclas)', G);
    const visto = [];
    input.handler = {
        onElement: (el, antes) => visto.push(antes.length ? `${el}+${antes.join('+')}` : el),
        onSpell: s => visto.push(`${s.name} ${s.dir}`),
        onAim: d => visto.push(`sin elemento ${d}`),
    };
    const tecla = key => ({ key, preventDefault() { } });
    return {
        input, visto,
        pulsa: key => { input.keydown(tecla(key)); return visto[visto.length - 1]; },
        suelta: key => input.keyup(tecla(key)),
        toca: key => { input.keydown(tecla(key)); input.keyup(tecla(key)); return visto[visto.length - 1]; },
        espera: ms => { reloj += ms; },
        fin: () => { G.performance.now = real; },
    };
}
function conTeclado(fn, comboWindow) { const t = teclado(comboWindow); try { fn(t); } finally { t.fin(); } }

prueba('un elemento queda cargado hasta que se lanza, aunque pase el tiempo', () => conTeclado(t => {
    t.toca('a'); t.espera(6000);
    igual(t.input.armedNow(), ['agua']);
    igual(t.toca('ArrowLeft'), 'Agua left');
    igual(t.toca('ArrowLeft'), 'sin elemento left', 'al lanzar, el elemento se gasta');
}));
prueba('otro elemento pulsado más tarde sustituye al anterior; seguido, se suma (dúo)', () => conTeclado(t => {
    t.toca('a'); t.espera(1500); t.toca('s');
    igual(t.toca('ArrowUp'), 'Fuego up', 'pasada la ventana de combinación, sustituye');
    t.toca('a'); t.espera(400); t.toca('f');
    igual(t.toca('ArrowUp'), 'Tormenta de Hielo up', 'dentro de la ventana, se suman');
    t.pulsa('s'); t.espera(30); t.pulsa('d'); t.espera(3000);
    igual(t.toca('ArrowDown'), 'Lava Ardiente down', 'dos teclas mantenidas son un dúo, tarde lo que tarde la flecha');
}));
prueba('pulsar otra vez un elemento cargado lo deja solo (para corregir un error)', () => conTeclado(t => {
    t.toca('a'); t.espera(300); t.toca('s');
    igual(t.input.armedNow(), ['agua', 'fuego']);
    t.espera(200); t.toca('s');
    igual(t.input.armedNow(), ['fuego']);
    igual(t.toca('ArrowRight'), 'Fuego right');
}));
prueba('al cargar se avisa de los elementos que ya estaban cargados, salvo en un acorde', () => conTeclado(t => {
    t.toca('a'); t.espera(500);
    igual(t.toca('s'), 'fuego+agua', 'debe sonar también el Agua, que ya estaba');
    igual(t.toca('s'), 'fuego', 'al corregir suena solo el que queda');
    t.toca('ArrowUp');
    t.pulsa('a'); t.espera(40);
    igual(t.pulsa('f'), 'viento', 'las dos teclas de un acorde suenan una vez cada una');
}));
prueba('con el elemento mantenido se puede lanzar varias veces (los Gemelos)', () => conTeclado(t => {
    t.pulsa('f');
    igual(t.toca('ArrowLeft'), 'Viento left');
    t.espera(700);
    igual(t.toca('ArrowRight'), 'Viento right');
    t.suelta('f');
    igual(t.toca('ArrowRight'), 'sin elemento right', 'al soltarlo ya no está cargado');
}));
prueba('si la ventana pierde el foco, ninguna tecla se queda pulsada', () => conTeclado(t => {
    t.pulsa('d'); t.toca('ArrowUp');
    t.input.releaseAll();
    igual(t.input.armedNow(), []);
    igual(t.toca('ArrowUp'), 'sin elemento up');
}));
prueba('los toques en pantalla tienen al menos dos segundos y medio para formar un dúo', () => conTeclado(t => {
    t.input.armElement('agua', false, 2500); t.espera(2000); t.input.armElement('viento', false, 2500);
    igual(t.input.armedNow(), ['agua', 'viento']);
    t.input.fireDirection('up');
    igual(t.visto[t.visto.length - 1], 'Tormenta de Hielo up');
    t.input.armElement('agua', false, 2500); t.espera(3000); t.input.armElement('viento', false, 2500);
    igual(t.input.armedNow(), ['viento'], 'pasado ese tiempo, el segundo toque sustituye al primero');
}, 600));
prueba('tres elementos siguen dando un hechizo inestable', () => conTeclado(t => {
    t.pulsa('a'); t.pulsa('s'); t.pulsa('d');
    igual(t.toca('ArrowUp'), 'Hechizo inestable up');
}));

console.log('\nAjustes guardados');
/** Carga los ajustes como si el navegador tuviera guardado ese objeto (o nada). */
function ajustesCon(guardado) {
    G.localStorage = { getItem: k => (guardado && k === G.Storage.SETTINGS ? JSON.stringify(guardado) : null) };
    try { return G.Storage.loadSettings(); } finally { delete G.localStorage; }
}
prueba('sin nada guardado, los ajustes son los de fábrica', () => igual(ajustesCon(null), G.DEFAULT_SETTINGS));
prueba('la velocidad de la historia antigua se pasa a la escala nueva', () => {
    const antes = [0.7, 0.8, 1, 1.2, 1.5].map(v => ajustesCon({ storyRate: v, speechRate: 0.6 }));
    igual(antes.map(s => s.storyRate), [1.1, 1.2, 1.5, 1.8, 2]);
    cierto(antes.every(s => s.speechRate === 0.6 && s.settingsVersion === 2), 'no debía tocar la velocidad de voz');
    igual(ajustesCon({ speechRate: 1.4 }).storyRate, 1.5, 'quien no la había tocado');
    igual(ajustesCon({ storyRate: 'rápida' }).storyRate, 1.5, 'un valor ilegible');
});
prueba('la velocidad de la historia ya guardada en la escala nueva no se vuelve a convertir', () => {
    igual([0.8, 1, 1.5, 2].map(v => ajustesCon({ storyRate: v, settingsVersion: 2 }).storyRate), [0.8, 1, 1.5, 2]);
    igual(ajustesCon({ storyRate: 5, settingsVersion: 2 }).storyRate, 2);
});

console.log('\nPartidas guardadas');
prueba('una partida nueva tiene los campos nuevos', () => {
    const p = G.newProfile('Prueba');
    igual(p.story.medals, {}); igual(p.story.bestScores, {}); igual(p.tutorialStep, 0);
});
prueba('una partida antigua se actualiza sin perder el progreso', () => {
    const vieja = { v: 2, username: 'Vieja', story: { level: 12, routesDone: ['fire'], routeProgress: { fire: 0 } }, achievements: ['act1'], stats: { kills: 80 }, arena: { bestScore: 5000 } };
    const p = G.migrateProfile(JSON.parse(JSON.stringify(vieja)));
    igual(p.story.level, 12); igual(p.story.routesDone, ['fire']); igual(p.achievements, ['act1']);
    igual(p.stats.kills, 80); igual(p.arena.bestScore, 5000);
    igual(p.story.medals, {}); igual(p.story.bestScores, {}); igual(p.tutorialStep, 0);
});
prueba('una partida de la versión 1 se sigue pudiendo abrir', () => {
    const p = G.migrateProfile({ username: 'Uno', currentLevel: 7, introSeen: true, achievements: ['first_kill'], stats: { kills: 3 } });
    igual(p.story.level, 7); cierto(p.tutorialDone); igual(p.story.medals, {});
});

// ═══════════════════════════════════════════════════════

console.log(fallos.length
    ? `\n✖ ${fallos.length} de ${hechas} comprobaciones han fallado:\n   - ${fallos.join('\n   - ')}\n`
    : `\n✔ Las ${hechas} comprobaciones han pasado.\n`);
process.exit(fallos.length ? 1 : 0);
