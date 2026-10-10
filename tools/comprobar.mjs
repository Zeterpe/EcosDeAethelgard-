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
     rachas, medallas y partidas guardadas.

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

// ═══════════════════════════════════════════════════════
// 1. Versión y orden de los scripts
// ═══════════════════════════════════════════════════════

console.log('\nVersión y archivos');
const G = cargarJuego(['config', 'data', 'lore', 'storage', 'input', 'combat', 'cloud']);
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
