/* =============================================
   ECOS DE AETHELGARD — app.js
   Coordinador: arranque, perfiles, menús, flujo
   de la historia (con puntos de control), rutas,
   guardianes, Avatar, Arena, Práctica, Biblioteca,
   logros, clasificación y opciones.
   ============================================= */
'use strict';

const App = (() => {
    const settings = Storage.loadSettings();
    const speech = new Speech(settings);
    const audio = new AudioEngine(settings);
    const music = new MusicEngine(audio);
    const input = new InputSystem(settings);
    const narrator = new Narrator(audio, settings);

    let profile = null;
    let mode = 'guest';         // guest: solo este navegador · cloud: cuenta online
    let flow = 0;              // token de flujo: cambia al navegar, invalida lo pendiente
    let pendingAch = [];       // logros conseguidos durante un combate (se leen al final)

    const combat = new CombatEngine({
        audio, music, speech, input, settings,
        ui: CombatView,
        narrate: (lines, o) => Narration.run(lines, o),
        onEvent: (type, data) => onCombatEvent(type, data),
        onPauseRequest: () => openPause(),
        onToggleAnnounce: () => toggleAnnounce(),
    });

    const tutorial = new Tutorial({
        audio, speech, input, settings, ui: CombatView,
        confirmExit: () => confirmTutorialExit(),
    });

    input.onChange = list => CombatView.armed(list);

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function save() {
        if (!profile) return;
        if (mode === 'cloud' && Cloud.uid) {
            profile.lastPlayed = Date.now();
            Storage.saveCloudCache(Cloud.uid, profile);
            Cloud.queueSave(profile);
        } else Storage.saveProfile(profile);
    }
    const newFlow = () => { const tok = ++flow; return () => tok === flow; };

    // ═══════════════════════════════════════════════════
    // Arranque de audio (los navegadores exigen un gesto)
    // ═══════════════════════════════════════════════════

    function unlock() {
        if (audio.ready) { audio.resume(); return; }
        if (audio.init()) music.resumePending();
        speech.unlock();
    }

    // ═══════════════════════════════════════════════════
    // Teclado global
    // ═══════════════════════════════════════════════════

    function onKeyDown(e) {
        unlock();
        if (Dialog.active) { Dialog.onKey(e); return; }
        if (Narration.active) { Narration.onKey(e); return; }
        const scr = UI.current;
        if (scr === 'combat') {
            // Entre narraciones no se hace nada: un Escape de más no debe abortar el nivel.
            if (combat.active || tutorial.running) input.keydown(e);
            else if (e.key === 'Escape' || e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
            return;
        }
        if (scr === 'options') {
            if (narrator.playing) narrator.skipAll();   // cualquier tecla corta la muestra de la historia
            if (OptionsScreen.onKey(e)) return;
        }
        if (scr === 'list' && ListScreen.onKey(e)) return;
        if (scr === 'route' && routeKey(e)) return;
        if (scr === 'login' || scr === 'account') UI.echoKey(e);
        defaultKeys(e);
    }

    function defaultKeys(e) {
        const inText = e.target && e.target.tagName === 'INPUT';
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); UI.moveFocus(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); UI.moveFocus(-1); }
        else if (e.key === 'Home' && !inText) { e.preventDefault(); UI.moveFocus('first'); }
        else if (e.key === 'End' && !inText) { e.preventDefault(); UI.moveFocus('last'); }
        else if (e.key === 'Escape') { if (UI.back()) e.preventDefault(); }
    }

    // ═══════════════════════════════════════════════════
    // Inicio y sesión
    // ═══════════════════════════════════════════════════

    function initSplash() {
        $('btn-start-tts').addEventListener('click', () => startWith('tts'));
        $('btn-start-sr').addEventListener('click', () => startWith('sr'));
        const first = Storage.hasSettings() && settings.output === 'sr' ? $('btn-start-sr') : $('btn-start-tts');
        UI.show('splash', { focus: first, silent: true });
    }

    function startWith(mode) {
        unlock();
        settings.output = mode;
        Storage.saveSettings(settings);
        music.play('menu', { intensity: 1 });
        if (Cloud.enabled) connectCloud(true);
        else goLogin(true);
    }

    /** Conecta con el servicio online y entra en la cuenta (o muestra la pantalla de cuenta). */
    async function connectCloud(first = false) {
        const alive = newFlow();
        speech.say('Conectando con el servidor…');
        const ok = await Cloud.init();
        if (!alive()) return;
        if (!ok) {
            goLogin(first, 'No se pudo conectar con el servidor online. Puedes jugar sin cuenta; tu progreso se guardará en este dispositivo.');
            return;
        }
        if (Cloud.signedIn) Online.startCloudSession();
        else Online.showAccountScreen({
            intro: first ? 'Ecos de Aethelgard. Inicia sesión o crea una cuenta gratuita para guardar tu progreso en la nube y competir con tus amigos. También puedes jugar sin cuenta.' : null,
        });
    }

    function goLogin(first = false, introOverride = null) {
        flow++;
        combat.stop(); tutorial.stop();
        $('btn-go-online').hidden = !Cloud.enabled;
        renderSavedProfiles();
        const inp = $('input-username');
        inp.value = Storage.lastUser();
        $('login-error').textContent = '';
        music.play('menu', { intensity: 1 });
        UI.backHandlers.login = null;
        UI.show('login', {
            focus: inp,
            intro: introOverride || (first
                ? 'Ecos de Aethelgard. Escribe tu nombre de invocador y pulsa Enter. Con las flechas puedes elegir un invocador guardado.'
                : 'Jugar sin cuenta. Elige o escribe un nombre de invocador. Tu progreso se guardará solo en este dispositivo.'),
        });
    }

    function renderSavedProfiles() {
        const list = Storage.listProfiles().sort((a, b) => b.lastPlayed - a.lastPlayed).slice(0, 8);
        const ul = $('saved-profiles');
        ul.innerHTML = '';
        $('saved-wrap').hidden = list.length === 0;
        list.forEach(p => {
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.className = 'menu-btn small';
            b.dataset.nav = '';
            b.textContent = `${p.username} · ${progressLabel(p)}`;
            b.dataset.speak = `Invocador guardado: ${p.username}. ${progressLabel(p)}.`;
            b.addEventListener('click', () => login(p.username));
            li.appendChild(b);
            ul.appendChild(li);
        });
    }

    function login(raw) {
        const name = String(raw).replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
        if (name.length < 2) {
            $('login-error').textContent = 'El nombre necesita al menos 2 letras o números.';
            audio.uiError();
            speech.say('El nombre necesita al menos 2 letras o números.');
            return;
        }
        let p = Storage.loadProfile(name);
        const isNew = !p;
        if (isNew) p = newProfile(name);
        profile = p;
        mode = 'guest';
        save();
        audio.uiSelect();
        goMenu(isNew
            ? `Bienvenido, ${name}. Si es tu primera vez, empieza por el Entrenamiento.`
            : `Bienvenido de nuevo, ${name}. ${progressLabel(p)}.`);
    }

    // ═══════════════════════════════════════════════════
    // Menú principal
    // ═══════════════════════════════════════════════════

    function goMenu(intro = 'Menú principal.', focusId = null) {
        flow++;
        combat.stop();
        tutorial.stop();
        GameRandom.clear();
        if (Dialog.active) Dialog.close(undefined);
        audio.setHeartbeat(false);
        audio.setMuffled(false);
        audio.setReverb('hall');
        music.play('menu', { intensity: 1 });
        if (!profile) { goLogin(); return; }
        refreshMenu();
        const def = !profile.tutorialDone && profile.story.level === 1 ? 'btn-tutorial' : 'btn-story';
        UI.show('menu', { intro, focus: focusId || def });
    }

    function progressLabel(p) {
        const st = p.story;
        if (st.finalDone) return 'Historia completada';
        if (st.level <= COMMON_LEVELS) return `Nivel ${st.level}`;
        return `Guardianes purificados: ${st.routesDone.length} de 4`;
    }

    function storyDesc() {
        const st = profile.story;
        if (st.level <= COMMON_LEVELS) return `Continúa tu aventura: nivel ${st.level} de ${COMMON_LEVELS}. ${actFor(st.level).name}.`;
        const n = st.routesDone.length;
        if (st.finalDone) return 'Has completado la historia. Puedes volver a cualquier ruta o al Avatar.';
        if (n === 4) return 'Los cuatro guardianes descansan. El Avatar del Silencio te espera.';
        return `Elige tu ruta. Guardianes purificados: ${n} de 4.`;
    }

    function refreshMenu() {
        $('menu-welcome').textContent = `Invocador: ${profile.username}`;
        $('btn-story').dataset.desc = storyDesc();
        $('btn-tutorial').dataset.desc = profile.tutorialDone
            ? 'Repasa cómo jugar: direcciones, elementos y hechizos.'
            : 'Recomendado para empezar. Aprende a jugar paso a paso.';
        $('btn-arena').dataset.desc = 'Oleadas infinitas, cada vez más rápidas. ' +
            (profile.arena.bestScore > 0 ? `Tu récord: ${fmtNum(profile.arena.bestScore)} puntos, oleada ${profile.arena.bestWave}.` : 'Consigue el mejor récord.');
        $('btn-practice').dataset.desc = 'Combate sin perder vidas, con explicación de cada error.';
        $('btn-library').dataset.desc = 'Bestiario con los sonidos de cada criatura, hechizos, sonidos de dirección y archivo de la historia.';
        $('btn-achievements').dataset.desc = `${profile.achievements.length} de ${ACHIEVEMENTS_DEF.length} desbloqueados.`;
        $('btn-leaderboard').dataset.desc = 'Récords de los invocadores de este dispositivo y de las leyendas de la Academia.';
        $('btn-options').dataset.desc = `Dificultad: ${DIFFICULTIES[settings.difficulty].name}. Voz, volumen, controles y accesibilidad.`;
        $('btn-help').dataset.desc = 'Reglas, teclas y consejos.';
        const online = mode === 'cloud' && Cloud.signedIn;
        $('btn-daily').dataset.desc = 'Las mismas oleadas para todos durante el día. ' +
            (profile.dailyBest?.day === todayId() ? `Tu mejor puntuación hoy: ${fmtNum(profile.dailyBest.score)}.` : 'Aún no lo has jugado hoy.');
        $('btn-community').closest('li').hidden = !Cloud.enabled;
        const pend = online ? Online.pending : 0;
        $('btn-community').textContent = pend ? `Comunidad y duelos (${pend})` : 'Comunidad y duelos';
        $('btn-community').dataset.desc = online
            ? (pend ? `Tienes ${plural(pend, 'duelo pendiente', 'duelos pendientes')}. ` : '') + 'Amigos, fichas, logros de los demás, duelos y clasificación online.'
            : 'Necesitas una cuenta online gratuita para competir con tus amigos.';
        $('btn-leaderboard').dataset.desc = online
            ? 'Clasificación online: arena, historia, logros, duelos y desafío diario.'
            : 'Récords de los invocadores de este dispositivo y de las leyendas de la Academia.';
        $('btn-account').dataset.desc = online
            ? `Sesión iniciada como ${profile.username}. Privacidad, descargar tus datos, cerrar sesión o borrar tu cuenta.`
            : 'Política de privacidad, tus datos' + (Cloud.enabled ? ' e iniciar sesión online.' : '.');
        $('admin-item').hidden = !(online && Cloud.isAdmin);
        $('btn-admin').dataset.desc = 'Control total: jugadores, logros, puntuaciones, avisos y duelos.';
        $('btn-logout').textContent = online ? 'Cerrar sesión' : 'Cambiar de invocador';
        $('btn-logout').dataset.desc = online ? 'Tu progreso está guardado en la nube.' : 'Tu progreso está guardado.';
        const m = online ? Online.motd : null;
        $('menu-motd').hidden = !m?.text;
        $('menu-motd').textContent = m?.text ? `📣 ${m.text}` : '';
        const last = new Date(profile.lastPlayed).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        $('save-info').textContent = `${progressLabel(profile)} · ${profile.achievements.length} logros · Última sesión: ${last}`;
    }

    function initMenu() {
        const actions = {
            story: () => startStory(),
            tutorial: () => startTutorial(),
            arena: () => startArena(),
            practice: () => openPracticeMenu(),
            library: () => openLibrary(),
            achievements: () => openAchievements(),
            leaderboard: () => (Online.isCloud() ? Online.openRankings() : openLeaderboard()),
            options: () => openOptions(),
            help: () => openHelp(),
            daily: () => Online.openDaily(),
            community: () => Online.openCommunity(),
            account: () => Online.openAccountMenu(),
            admin: () => Online.openAdmin(),
            logout: () => {
                if (Online.isCloud()) { Online.logout(); return; }
                speech.say('Hasta pronto, ' + profile.username + '.');
                profile = null;
                goLogin();
            },
        };
        document.querySelectorAll('#main-menu [data-action]').forEach(b => {
            b.addEventListener('click', () => {
                if (!profile) { goLogin(); return; }
                audio.uiSelect();
                actions[b.dataset.action]?.();
            });
        });
        UI.backHandlers.menu = () => UI.say('Estás en el menú principal. Para salir, elige Cerrar sesión o Cambiar de invocador, o cierra la pestaña.');
    }

    // ═══════════════════════════════════════════════════
    // Logros y eventos de combate
    // ═══════════════════════════════════════════════════

    function unlockAch(id) {
        if (!profile || profile.achievements.includes(id)) return;
        const a = ACHIEVEMENTS_DEF.find(x => x.id === id);
        if (!a) return;
        profile.achievements.push(id);
        save();
        audio.achievement();
        UI.toast(`🏆 Logro: ${a.name}`);
        if (combat.active) pendingAch.push(a.name);
        else speech.say(`Logro desbloqueado: ${a.name}.`, { interrupt: false });
    }

    function onCombatEvent(type, data) {
        if (!profile) return;
        const st = profile.stats;
        switch (type) {
            case 'meet':
                if (!profile.met.includes(data.def.id)) {
                    profile.met.push(data.def.id);
                    if (ALL_COMMON.every(id => profile.met.includes(id))) unlockAch('bestiary');
                    save();
                }
                break;
            case 'kill':
                st.kills++;
                unlockAch('first_kill');
                if (data.def.id === 'shadow') unlockAch('shadow');
                save();
                break;
            case 'crit':
                st.crits++;
                unlockAch('first_crit');
                if (st.crits >= 50) unlockAch('crits50');
                break;
            case 'streak':
                if (data.streak > st.bestStreak) st.bestStreak = data.streak;
                if (data.streak >= 10) unlockAch('streak10');
                if (data.streak >= 25) unlockAch('streak25');
                break;
            case 'wave':
                if (combat.encounter?.kind === 'arena') {
                    if (data.wave + 1 >= 10) unlockAch('arena10');
                    if (data.wave + 1 >= 20) unlockAch('arena20');
                }
                break;
        }
    }

    function applyResult(result, mode) {
        if (!profile) return;
        const s = result.stats, st = profile.stats;
        st.spells += s.spells; st.hits += s.hits; st.mistakes += s.mistakes; st.damageTaken += s.damage;
        st.playTimeS += Math.round(result.durationMs / 1000);
        if (result.outcome === 'defeat') st.deaths++;
        if (mode === 'story' && result.outcome === 'victory') profile.storyScore += result.score;
        save();
    }

    function resultLines(result) {
        const s = result.stats;
        const tries = s.hits + s.mistakes;
        const acc = tries > 0 ? Math.round(100 * s.hits / tries) : 100;
        const lines = [
            `Puntos: ${fmtNum(result.score)}.`,
            `Aciertos: ${s.hits}. Críticos: ${s.crits}. Errores: ${s.mistakes}. Precisión: ${acc} por ciento.`,
            `Mejor racha: ${s.bestStreak}.`,
        ];
        if (s.damage === 0 && result.outcome === 'victory') lines.push('¡Sin recibir ni un golpe!');
        if (pendingAch.length) { lines.push(`Logros desbloqueados: ${joinY(pendingAch)}.`); pendingAch = []; }
        return lines.join('\n');
    }

    function runEncounter(enc) {
        pendingAch = [];
        GameRandom.clear();
        if (enc.seed) GameRandom.seed(enc.seed);   // duelos y desafío diario: mismas oleadas para todos
        return new Promise(resolve => {
            enc.onEnd = r => { GameRandom.clear(); resolve(r); };
            combat.start(enc);
        });
    }

    /** Encuentro de Arena (también lo usan los duelos y el desafío diario). */
    function arenaEncounter(o = {}) {
        return {
            kind: 'arena', endless: true, title: 'Arena de los Ecos', theme: 'arena', reverb: 'hall',
            reactionFor: w => Math.max(2000, 4800 - 170 * (w - 1)),
            makeBag: w => arenaWave(w),
            waveText: (w, bag) => {
                const boss = bag.find(i => i.def.tier === 'boss');
                return `Oleada ${w}: ${plural(bag.length, 'enemigo', 'enemigos')}.${boss ? ` ¡${boss.def.short} entra en la arena!` : ''}`;
            },
            ...o,
        };
    }

    function showCombat(title, subtitle = '', mode = 'combat') {
        CombatView.setMode(mode, title, subtitle);
        CombatView.updateKeyLabels(input.scheme);
        UI.backHandlers.combat = null;
        UI.show('combat', { focus: $('combat-stage'), silent: true });
    }

    async function openPause() {
        if (!combat.active || Dialog.active || Narration.active) return;
        if (!combat.pause()) return;
        const enc = combat.encounter;
        const quitDesc = enc?.kind === 'arena' ? 'Tu puntuación se guardará.'
            : enc?.practice ? '' : 'Repetirás este nivel desde el principio.';
        const choice = await Dialog.open({
            title: 'Pausa',
            text: combat.statusText(),
            buttons: [
                { label: 'Continuar', value: 'resume' },
                { label: 'Escuchar los controles', keep: true, action: () => speech.say(controlsText()) },
                { label: announceLabel(), keep: true, action: btn => { toggleAnnounce(); btn.textContent = announceLabel(); } },
                { label: enc?.practice ? 'Terminar la práctica' : 'Abandonar y volver', value: 'quit', desc: quitDesc },
            ],
            cancel: 'resume',
        });
        if (!combat.active) return;
        if (choice === 'quit') combat.quit();
        else { UI.focus($('combat-stage'), { silent: true }); combat.resume(); }
    }

    function announceLabel() {
        return settings.verbosity === 'sonido' ? 'Activar los anuncios de enemigos (tecla V)' : 'Desactivar los anuncios de enemigos (tecla V)';
    }

    /** Tecla V: apaga o enciende la voz que dice qué criatura viene y por dónde. */
    function toggleAnnounce() {
        if (settings.verbosity === 'sonido') {
            settings.verbosity = settings.verbosityPrev && settings.verbosityPrev !== 'sonido' ? settings.verbosityPrev : 'normal';
            speech.say('Anuncios de enemigos activados.');
        } else {
            settings.verbosityPrev = settings.verbosity;
            settings.verbosity = 'sonido';
            speech.say('Anuncios de enemigos desactivados: solo oirás a las criaturas. Espacio te dice cuál es, y la V los vuelve a activar.');
        }
        Storage.saveSettings(settings);
    }

    function controlsText() {
        const k = input.scheme.spoken;
        return `Elementos: ${k.agua}, Agua. ${k.fuego}, Fuego. ${k.tierra}, Tierra. ${k.viento}, Viento. ` +
            `Pulsa el elemento y luego la flecha hacia el enemigo. Para un dúo, dos elementos a la vez y la flecha. ` +
            `Espacio repite el enemigo. Enter dice tu estado. H da una pista. V activa o desactiva los anuncios de enemigos. Escape pausa.`;
    }

    async function afterDefeat(retry, title) {
        const alive = newFlow();
        profile.story.defeatsInRow++;
        save();
        let text = pick(LORE_EXTRA.defeatLines, Math.random);
        if (profile.story.defeatsInRow >= 3 && settings.difficulty !== 'aprendiz') {
            text += '\nConsejo: puedes bajar la dificultad a Aprendiz en Opciones, o entrenar sin riesgo en la Práctica libre.';
        }
        const c = await Dialog.open({
            title: `Has caído · ${title}`, text,
            buttons: [{ label: 'Reintentar', value: 'retry' }, { label: 'Volver al menú', value: 'menu' }],
            cancel: 'menu',
        });
        if (!alive()) return;
        if (c === 'retry') retry(); else goMenu();
    }

    /** Presenta las criaturas que el jugador aún no conoce. */
    async function introduceEnemies(ids, alive) {
        for (const id of ids) {
            const def = ENEMIES[id];
            if (!profile.met.includes(id)) profile.met.push(id);
            const loreKey = `creature_${id}`;
            const tellLore = LORE.creatures[id] && !profile.loreSeen.includes(loreKey);
            if (tellLore) profile.loreSeen.push(loreKey);
            save();
            if (tellLore) {
                await Narration.run(LORE.creatures[id], { title: def.name, gap: 600, key: loreKey });
                if (!alive()) return false;
            }
            await Narration.run([`¡Nueva criatura! ${def.name}. ${def.desc} Escucha.`], { title: 'Bestiario' });
            if (!alive()) return false;
            audio.playVoice(def.voice, 'center');
            await sleep(1900);
            if (!alive()) return false;
            await Narration.run([`${weaknessText(profileOf(def))} Nunca uses ${elementNames(def.cure)}: la curarías. Escucha otra vez.`], { title: def.name });
            if (!alive()) return false;
            audio.playVoice(def.voice, 'center');
            await sleep(1900);
            if (!alive()) return false;
        }
        if (ALL_COMMON.every(id => profile.met.includes(id))) unlockAch('bestiary');
        return true;
    }

    // ═══════════════════════════════════════════════════
    // Crónicas, leyendas y encuentros
    // ═══════════════════════════════════════════════════

    const ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };

    function chronicleTitle(n) {
        const t = LORE.chronicles.titles[n];
        return n === 'epilogue' ? t : `Crónica ${ROMAN[n]}: ${t}`;
    }

    function markLore(id) {
        if (!profile.loreSeen.includes(id)) { profile.loreSeen.push(id); save(); }
    }

    function playChronicle(n) {
        markLore(`chron_${n}`);
        if (n !== 'epilogue' && n !== 6) music.play('menu', { intensity: 1 });
        return Narration.run(LORE.chronicles[n], { title: chronicleTitle(n), gap: 700, key: `chron_${n}` });
    }

    function playLegend(r) {
        markLore(`legend_${r}`);
        return Narration.run(LORE.bosses[r].legend, { title: LORE.bosses[r].legendTitle, gap: 700, key: `route_${r}_legend` });
    }

    function playEncounter(r) {
        markLore(`encounter_${r}`);
        return Narration.run(LORE.bosses[r].encounter, { title: ENEMIES[ROUTES[r].boss].name, gap: 700, key: `route_${r}_encounter` });
    }

    /** Capítulos que ya le corresponderían por su progreso y aún no ha escuchado (partidas anteriores a las Crónicas). */
    function missedStory() {
        const st = profile.story, heard = id => profile.loreSeen.includes(id);
        const out = [];
        for (const [lvl, n] of Object.entries(CHRONICLE_AT_END)) {
            if (st.level > +lvl && !heard(`chron_${n}`)) out.push(() => playChronicle(n));
        }
        for (const r of ROUTE_IDS) {
            const done = st.routesDone.includes(r), prog = st.routeProgress[r] || 0;
            if ((done || prog > LEGEND_AT_ROUTE_LEVEL) && !heard(`legend_${r}`)) out.push(() => playLegend(r));
            if (done && !heard(`encounter_${r}`)) out.push(() => playEncounter(r));
        }
        if (st.finalDone && !heard('chron_6')) out.push(() => playChronicle(6));
        if (st.finalDone && !heard('chron_epilogue')) out.push(() => playChronicle('epilogue'));
        return out;
    }

    let missedOffered = false;
    /** Una vez por sesión, ofrece escuchar lo que se perdió. Devuelve false si se ha navegado a otra parte. */
    async function offerMissedStory() {
        const missed = missedStory();
        if (!missed.length || missedOffered) return true;
        missedOffered = true;
        const alive = newFlow();
        const c = await Dialog.open({
            title: 'Nuevos capítulos de la historia',
            text: `La historia ha crecido: hay ${plural(missed.length, 'capítulo', 'capítulos')} de lo que ya has jugado que aún no has escuchado. ` +
                '¿Quieres escucharlos ahora? Si no, estarán en Biblioteca, Archivo de ecos, y la historia de cada criatura, en el Bestiario.',
            buttons: [{ label: 'Escucharlos ahora', value: 'yes' }, { label: 'Ahora no, ir a jugar', value: 'no' }],
            cancel: 'no',
        });
        if (!alive()) return false;
        if (c !== 'yes') return true;
        for (const play of missed) {
            const ok = await play();
            if (!alive()) return false;
            if (!ok) break;      // Escape salta el resto
        }
        return alive();
    }

    // ═══════════════════════════════════════════════════
    // Historia: niveles 1–30
    // ═══════════════════════════════════════════════════

    async function startStory() {
        if (!await offerMissedStory()) return;
        const st = profile.story;
        if (st.level > COMMON_LEVELS) { showRouteSelect(); return; }
        if (st.level === 1 && !profile.tutorialDone && !profile.introSeen) {
            const c = await Dialog.open({
                title: 'Antes de empezar',
                text: 'Si es tu primera vez, el entrenamiento te enseña a jugar en pocos minutos.',
                buttons: [
                    { label: 'Hacer el entrenamiento', value: 'tut' },
                    { label: 'Empezar la historia', value: 'story' },
                ],
                cancel: null,
            });
            if (c === null || c === undefined) return;
            if (c === 'tut') { startTutorial(); return; }
        }
        playCampaignLevel(st.level);
    }

    function campaignEncounter(n) {
        const def = CAMPAIGN[n], act = actFor(n);
        const prev = CAMPAIGN[n - 1]?.pool || [];
        return {
            kind: 'story', title: `Nivel ${n}`,
            theme: def.miniboss ? 'shadow' : act.theme, reverb: act.reverb,
            modifier: def.modifier || null, reactionMs: def.react,
            makeBag: () => {
                const bag = buildBag({ count: def.count, pool: def.pool, elite: def.elite || 0, ensure: def.pool.filter(id => !prev.includes(id)) });
                if (def.miniboss) bag.push(makeInstance('shadow', { lives: def.miniboss.lives, st: { mimic: def.miniboss.mimic } }));
                return bag;
            },
        };
    }

    async function playCampaignLevel(n) {
        const alive = newFlow();
        const def = CAMPAIGN[n], act = actFor(n);
        const mod = def.modifier ? MODIFIERS[def.modifier] : null;
        showCombat(`Nivel ${n}`, act.name + (mod ? ` · ${mod.name}` : ''));
        music.play(def.miniboss ? 'shadow' : act.theme, { intensity: 1 });
        audio.setReverb(act.reverb);

        const echoKey = ECHO_AT_START[n];
        if (echoKey && !profile.echosSeen.includes(echoKey)) {
            profile.echosSeen.push(echoKey);
            if (n === 1) profile.introSeen = true;
            save();
            await Narration.run(LORE.echos[echoKey], { title: LORE_EXTRA.echoTitles[echoKey], pitch: echoKey.includes('shadow') ? 0.5 : 1, gap: 600, key: `echo_${echoKey}` });
            if (!alive()) return;
        }
        if (LORE_EXTRA.acts[n] && !profile.loreSeen.includes(`act${n}`)) {
            profile.loreSeen.push(`act${n}`); save();
            await Narration.run(LORE_EXTRA.acts[n], { title: act.name, key: `act_${n}` });
            if (!alive()) return;
        }
        if (def.miniboss && !profile.loreSeen.includes(`shadow${n}`)) {
            profile.loreSeen.push(`shadow${n}`); save();
            await Narration.run(LORE_EXTRA.shadow[n], { title: 'Sombra Imitadora', key: `shadow_${n}` });
            if (!alive()) return;
        }
        if (!await introduceEnemies(def.pool.filter(id => !profile.met.includes(id)), alive)) return;

        const count = def.count + (def.miniboss ? 1 : 0);
        let intro = `Nivel ${n}. `;
        if (mod) intro += `${mod.name}: ${mod.desc} `;
        if (def.miniboss) intro += 'La Sombra Imitadora acecha entre los enemigos. ';
        intro += `${plural(count, 'enemigo', 'enemigos')}. ¡Prepárate!`;
        await Narration.run([intro], { title: `Nivel ${n}` });
        if (!alive()) return;

        const result = await runEncounter(campaignEncounter(n));
        if (!alive()) return;
        applyResult(result, 'story');
        if (result.outcome === 'quit') { goMenu(); return; }
        if (result.outcome === 'defeat') { afterDefeat(() => playCampaignLevel(n), `Nivel ${n}`); return; }

        profile.story.level = Math.max(profile.story.level, n + 1);
        profile.story.defeatsInRow = 0;
        profile.stats.levelsCleared++;
        if (n >= 10) unlockAch('act1');
        if (n >= 20) unlockAch('act2');
        if (result.stats.damage === 0) unlockAch('flawless');
        if (def.modifier === 'fog') unlockAch('fog');
        save();

        if (n === COMMON_LEVELS) {
            unlockAch('threshold');
            await Dialog.open({ title: `Nivel ${n} superado`, text: resultLines(result), buttons: [{ label: 'Continuar', value: 'ok' }], cancel: 'ok' });
            if (!alive()) return;
            if (!profile.echosSeen.includes('30')) { profile.echosSeen.push('30'); save(); }
            await Narration.run(LORE.echos[30], { title: LORE_EXTRA.echoTitles['30'], gap: 600, key: 'echo_30' });
            if (!alive()) return;
            showRouteSelect();
            return;
        }
        const chron = CHRONICLE_AT_END[n];
        const newPage = chron && !profile.loreSeen.includes(`chron_${chron}`);
        const c = await Dialog.open({
            title: `Nivel ${n} superado`,
            text: resultLines(result) + (newPage ? '\nHas encontrado una página de las Crónicas de los Antiguos Ecos.' : ''),
            buttons: [{ label: `Continuar al nivel ${n + 1}`, value: 'next' }, { label: 'Volver al menú', value: 'menu' }],
            cancel: 'menu',
        });
        if (!alive()) return;
        if (newPage) {
            await playChronicle(chron);
            if (!alive()) return;
        }
        if (c === 'next') playCampaignLevel(n + 1); else goMenu();
    }

    // ═══════════════════════════════════════════════════
    // Rutas y guardianes
    // ═══════════════════════════════════════════════════

    function routeStatus(r) {
        const st = profile.story, prog = st.routeProgress[r] || 0;
        if (st.routesDone.includes(r) && prog === 0) return 'Purificada';
        if (prog === 0) return 'Sin explorar';
        if (prog > ROUTE_LEVELS) return 'Ante el guardián';
        return `Nivel ${prog} de ${ROUTE_LEVELS}`;
    }

    function renderRoutes() {
        const st = profile.story;
        for (const r of ROUTE_IDS) {
            const R = ROUTES[r], btn = $(`route-${r}`), status = routeStatus(r);
            const done = st.routesDone.includes(r);
            btn.innerHTML = `<span class="route-key" aria-hidden="true">${DIRECTIONS[R.dir].label}</span>` +
                `<span class="route-icon" aria-hidden="true">${R.icon}</span>` +
                `<span class="route-name">${R.name}</span><span class="route-status">${status}</span>`;
            btn.dataset.speak = `Ruta de ${R.name}: ${R.place}. Guardián: ${ENEMIES[R.boss].name}. ${status}.` +
                (done ? ' Puedes volver a recorrerla.' : '');
            btn.classList.toggle('done', done);
        }
        const allDone = ROUTE_IDS.every(r => st.routesDone.includes(r));
        const fb = $('route-final');
        fb.hidden = !allDone;
        fb.innerHTML = `<span class="route-key" aria-hidden="true">Espacio</span><span class="route-icon" aria-hidden="true">👁️</span>` +
            `<span class="route-name">El Avatar</span><span class="route-status">${st.finalDone ? 'Derrotado' : 'Combate final'}</span>`;
        fb.dataset.speak = `El centro: el Avatar del Silencio. ${st.finalDone ? 'Ya lo derrotaste; puedes enfrentarte a él otra vez.' : 'El combate final.'}`;
        $('route-subtitle').textContent = allDone
            ? 'Los cuatro guardianes descansan. El centro te espera.'
            : `Guardianes purificados: ${st.routesDone.length} de 4.`;
    }

    function showRouteSelect(focusRoute = null) {
        flow++;
        combat.stop();
        music.play('threshold', { intensity: 1 });
        audio.setReverb('cave');
        renderRoutes();
        const st = profile.story;
        const allDone = ROUTE_IDS.every(r => st.routesDone.includes(r));
        const pending = ROUTE_IDS.find(r => (st.routeProgress[r] || 0) > 0) || ROUTE_IDS.find(r => !st.routesDone.includes(r));
        let intro = 'Elige tu destino. Arriba: Fuego. Abajo: Agua. Izquierda: Viento. Derecha: Tierra. Pulsa Enter para entrar.';
        if (allDone) intro += ' Espacio: el Avatar del Silencio, en el centro.';
        const focusEl = focusRoute ? $(`route-${focusRoute}`) : (allDone && !st.finalDone ? $('route-final') : $(`route-${pending || 'fire'}`));
        UI.backHandlers.route = () => goMenu('Menú principal.', 'btn-story');
        UI.show('route', { intro, focus: focusEl });
    }

    function routeKey(e) {
        const map = { ArrowUp: 'fire', ArrowDown: 'water', ArrowLeft: 'wind', ArrowRight: 'earth' };
        if (map[e.key]) {
            e.preventDefault();
            audio.uiMove();
            UI.focus($(`route-${map[e.key]}`));
            return true;
        }
        if (e.key === ' ' && !$('route-final').hidden && document.activeElement?.dataset.route !== 'final') {
            e.preventDefault();
            audio.uiMove();
            UI.focus($('route-final'));
            return true;
        }
        if (e.key === 'Escape') { e.preventDefault(); UI.back(); return true; }
        return false;
    }

    function initRoutes() {
        document.querySelectorAll('.route-btn').forEach(b => b.addEventListener('click', () => {
            audio.uiSelect();
            if (b.dataset.route === 'final') playFinal(); else playRoute(b.dataset.route);
        }));
        $('btn-route-back').addEventListener('click', () => UI.back());
    }

    async function playRoute(r) {
        const st = profile.story, R = ROUTES[r];
        if (!st.routeProgress[r]) {
            const alive = newFlow();
            st.routeProgress[r] = 1;
            if (!profile.loreSeen.includes(`pre_${r}`)) profile.loreSeen.push(`pre_${r}`);
            save();
            showCombat(R.place, `Ruta de ${R.name}`);
            music.play(R.theme, { intensity: 1 });
            audio.setReverb(R.reverb);
            await Narration.run(LORE.bosses[r].preRoute, { title: R.place, gap: 600, key: `route_${r}_pre` });
            if (!alive()) return;
        }
        const lvl = st.routeProgress[r];
        if (lvl > ROUTE_LEVELS) playGuardian(r); else playRouteLevel(r, lvl);
    }

    async function playRouteLevel(r, n) {
        const alive = newFlow();
        const R = ROUTES[r], def = routeLevelDef(r, n);
        const mod = def.modifier ? MODIFIERS[def.modifier] : null;
        const title = `${R.place}`;
        showCombat(title, `Ruta de ${R.name} · Nivel ${n} de ${ROUTE_LEVELS}${mod ? ' · ' + mod.name : ''}`);
        music.play(R.theme, { intensity: 1 });
        audio.setReverb(R.reverb);
        if (!await introduceEnemies(def.pool.filter(id => !profile.met.includes(id)), alive)) return;
        await Narration.run([`Ruta de ${R.name}, nivel ${n} de ${ROUTE_LEVELS}. ${mod ? `${mod.name}: ${mod.desc} ` : ''}${plural(def.count, 'enemigo', 'enemigos')}.`], { title });
        if (!alive()) return;
        const result = await runEncounter({
            kind: 'route', title, theme: R.theme, reverb: R.reverb,
            modifier: def.modifier, reactionMs: def.react,
            makeBag: () => buildBag(def),
        });
        if (!alive()) return;
        applyResult(result, 'story');
        if (result.outcome === 'quit') { goMenu(); return; }
        if (result.outcome === 'defeat') { afterDefeat(() => playRouteLevel(r, n), `${R.place}, nivel ${n}`); return; }
        profile.story.routeProgress[r] = n + 1;
        profile.story.defeatsInRow = 0;
        profile.stats.levelsCleared++;
        if (result.stats.damage === 0) unlockAch('flawless');
        if (def.modifier === 'fog') unlockAch('fog');
        save();
        const boss = ENEMIES[R.boss];
        const next = n === ROUTE_LEVELS
            ? { label: `Enfrentarte a ${boss.short}`, value: 'next', desc: boss.name }
            : { label: `Continuar al nivel ${n + 1}`, value: 'next' };
        const legend = n === LEGEND_AT_ROUTE_LEVEL && !profile.loreSeen.includes(`legend_${r}`);
        const c = await Dialog.open({
            title: `${R.place}: nivel ${n} superado`,
            text: resultLines(result) + (legend ? `\nHas encontrado una leyenda de ${R.guardian}.` : ''),
            buttons: [next, { label: 'Volver al mapa de rutas', value: 'routes' }, { label: 'Volver al menú', value: 'menu' }],
            cancel: 'menu',
        });
        if (!alive()) return;
        if (legend) {
            await playLegend(r);
            if (!alive()) return;
        }
        if (c === 'next') { if (n === ROUTE_LEVELS) playGuardian(r); else playRouteLevel(r, n + 1); }
        else if (c === 'routes') showRouteSelect(r);
        else goMenu();
    }

    async function playGuardian(r) {
        const alive = newFlow();
        const R = ROUTES[r], def = ENEMIES[R.boss];
        showCombat(def.name, `Guardián de ${R.place}`);
        music.play(R.theme, { intensity: 1 });
        audio.setReverb(R.reverb);
        if (!profile.met.includes(def.id)) { profile.met.push(def.id); save(); }
        if (!profile.loreSeen.includes(`encounter_${r}`)) {
            await playEncounter(r);
            if (!alive()) return;
        }
        await Narration.run(LORE_EXTRA.bossMechanics[r], { title: def.name, key: `mech_${r}` });
        if (!alive()) return;
        audio.playVoice(def.voice, 'center');
        await sleep(2200);
        if (!alive()) return;
        const result = await runEncounter({
            kind: 'boss', bossFight: true, title: def.name, theme: R.theme, reverb: R.reverb, reactionMs: 3000,
            makeBag: () => [makeInstance(R.boss, { main: true })],
        });
        if (!alive()) return;
        applyResult(result, 'story');
        if (result.outcome === 'quit') { goMenu(); return; }
        if (result.outcome === 'defeat') { afterDefeat(() => playGuardian(r), def.name); return; }
        await Narration.run(LORE.bosses[r].victory, { title: 'Purificación', gap: 700, key: `route_${r}_victory` });
        if (!alive()) return;
        const st = profile.story;
        if (!st.routesDone.includes(r)) st.routesDone.push(r);
        st.routeProgress[r] = 0;
        st.defeatsInRow = 0;
        if (!profile.bossesDefeated.includes(def.id)) profile.bossesDefeated.push(def.id);
        unlockAch(R.achievement);
        if (settings.difficulty === 'archimago') unlockAch('archimago');
        save();
        const allDone = ROUTE_IDS.every(x => st.routesDone.includes(x));
        if (allDone && !st.finalDone) {
            await Narration.run(LORE_EXTRA.allRoutesDone, { title: 'El centro', key: 'all_routes' });
            if (!alive()) return;
        }
        const left = ROUTE_IDS.filter(x => !st.routesDone.includes(x)).length;
        const c = await Dialog.open({
            title: `${def.short} ha sido purificado`,
            text: resultLines(result) + (left > 0 ? `\nQuedan ${plural(left, 'guardián', 'guardianes')} por liberar.` : ''),
            buttons: [{ label: 'Volver al mapa de rutas', value: 'routes' }, { label: 'Volver al menú', value: 'menu' }],
            cancel: 'routes',
        });
        if (!alive()) return;
        if (c === 'routes') showRouteSelect(); else goMenu();
    }

    async function playFinal() {
        const alive = newFlow();
        showCombat('Avatar del Silencio', 'El centro de todo');
        music.play('final', { intensity: 1 });
        audio.setReverb('cave');
        if (!profile.met.includes('final_boss')) { profile.met.push('final_boss'); save(); }
        if (!profile.loreSeen.includes('chron_6')) {
            await playChronicle(6);
            if (!alive()) return;
        }
        await Narration.run(LORE.finalBoss.intro, { title: 'Avatar del Silencio', pitch: 0.6, gap: 700, key: 'final_intro' });
        if (!alive()) return;
        await Narration.run(LORE_EXTRA.bossMechanics.final, { title: 'Advertencia', key: 'mech_final' });
        if (!alive()) return;
        const result = await runEncounter({
            kind: 'final', bossFight: true, title: 'Avatar del Silencio', theme: 'final', reverb: 'cave', reactionMs: 2900,
            makeBag: () => [makeInstance('final_boss', { main: true })],
        });
        if (!alive()) return;
        applyResult(result, 'story');
        if (result.outcome === 'quit') { goMenu(); return; }
        if (result.outcome === 'defeat') { afterDefeat(() => playFinal(), 'Avatar del Silencio'); return; }
        await Narration.run(LORE.finalBoss.victory, { title: 'Ecos Eternos', gap: 800, key: 'final_victory' });
        if (!alive()) return;
        profile.story.finalDone = true;
        profile.story.defeatsInRow = 0;
        if (!profile.bossesDefeated.includes('final_boss')) profile.bossesDefeated.push('final_boss');
        if (!profile.loreSeen.includes('final')) profile.loreSeen.push('final');
        unlockAch('final_boss');
        if (settings.difficulty === 'archimago') unlockAch('archimago');
        save();
        if (!profile.loreSeen.includes('chron_epilogue')) {
            await playChronicle('epilogue');
            if (!alive()) return;
        }
        await Narration.run(LORE_EXTRA.credits, { title: 'Fin', key: 'credits' });
        if (!alive()) return;
        await Dialog.open({
            title: '¡Has derrotado al Avatar del Silencio!', text: resultLines(result),
            buttons: [{ label: 'Volver al menú', value: 'menu' }], cancel: 'menu',
        });
        if (!alive()) return;
        goMenu('Menú principal. Gracias a ti, los ecos de Aethelgard permanecen.');
    }

    // ═══════════════════════════════════════════════════
    // Entrenamiento
    // ═══════════════════════════════════════════════════

    async function startTutorial() {
        const alive = newFlow();
        showCombat('Entrenamiento', 'Aprende a escuchar y a lanzar hechizos', 'tutorial');
        music.play('academy', { intensity: 1 });
        audio.setReverb('hall');
        const res = await tutorial.start();
        if (!alive()) return;
        if (res === 'done') {
            profile.tutorialDone = true;
            save();
            unlockAch('tutorial');
            const c = await Dialog.open({
                title: 'Entrenamiento completado',
                text: 'Ya conoces todo lo necesario. La historia te espera.',
                buttons: [{ label: profile.story.level === 1 ? 'Comenzar la historia' : 'Continuar la historia', value: 'story' }, { label: 'Volver al menú', value: 'menu' }],
                cancel: 'menu',
            });
            if (!alive()) return;
            if (c === 'story') { startStory(); return; }
        }
        goMenu('Menú principal.', 'btn-story');
    }

    function confirmTutorialExit() {
        return Dialog.open({
            title: '¿Salir del entrenamiento?',
            buttons: [{ label: 'Seguir entrenando', value: false }, { label: 'Salir al menú', value: true }],
            cancel: false,
        }).then(exit => {
            if (exit) { tutorial.stop(); goMenu('Menú principal.', 'btn-tutorial'); }
            else UI.focus($('combat-stage'), { silent: true });
            return !!exit;
        });
    }

    // ═══════════════════════════════════════════════════
    // Arena
    // ═══════════════════════════════════════════════════

    function arenaWave(w) {
        const count = Math.min(20, 4 + w);
        const pool = w < 3 ? BASICS : w < 6 ? [...BASICS, 'magma_elem', 'storm_spec'] : ALL_COMMON;
        const bag = buildBag({ count, pool, elite: Math.min(0.5, 0.06 * w) });
        if (w % CFG.ARENA_BOSS_EVERY === 0) {
            const r = ROUTE_IDS[(w / CFG.ARENA_BOSS_EVERY - 1) % ROUTE_IDS.length];
            bag.push(makeInstance(ROUTES[r].boss, { lives: 4 + 2 * (w / CFG.ARENA_BOSS_EVERY) }));
        }
        return bag;
    }

    async function startArena() {
        const alive = newFlow();
        showCombat('Arena de los Ecos', 'Oleadas sin fin');
        music.play('arena', { intensity: 1 });
        audio.setReverb('hall');
        const rec = profile.arena;
        await Narration.run([
            'Arena de los Ecos. Oleadas sin fin, cada vez más rápidas. Cada oleada superada te devuelve una vida, y cada cinco oleadas aparece un guardián.' +
            (rec.bestScore > 0 ? ` Tu récord: ${fmtNum(rec.bestScore)} puntos, oleada ${rec.bestWave}.` : ' ¿Hasta dónde llegarás?'),
        ], { title: 'Arena' });
        if (!alive()) return;
        const result = await runEncounter(arenaEncounter());
        if (!alive()) return;
        applyResult(result, 'arena');
        const isRecord = result.score > rec.bestScore;
        rec.games++;
        if (isRecord) rec.bestScore = result.score;
        rec.bestWave = Math.max(rec.bestWave, result.wave);
        save();
        const board = Online.isCloud() ? [] : arenaBoard();
        const pos = board.findIndex(e => e.you && e.score === rec.bestScore) + 1;
        const text = [
            `Llegaste a la oleada ${result.wave}.`,
            isRecord ? `¡Nuevo récord! ${fmtNum(result.score)} puntos.` : `Puntos: ${fmtNum(result.score)}. Tu récord: ${fmtNum(rec.bestScore)}.`,
            pos > 0 ? `Posición en la clasificación: ${pos} de ${board.length}.` : '',
        ].filter(Boolean).join('\n') + '\n' + resultLines(result).split('\n').slice(1).join('\n');
        const c = await Dialog.open({
            title: 'Fin de la Arena', text,
            buttons: [{ label: 'Jugar otra vez', value: 'again' }, { label: 'Ver la clasificación', value: 'board' }, { label: 'Volver al menú', value: 'menu' }],
            cancel: 'menu',
        });
        if (!alive()) return;
        if (c === 'again') startArena();
        else if (c === 'board') {
            goMenu();
            if (Online.isCloud()) { await Cloud.flush(); Online.openRankings(0); } else openLeaderboard();
        } else goMenu('Menú principal.', 'btn-arena');
    }

    // ═══════════════════════════════════════════════════
    // Práctica libre
    // ═══════════════════════════════════════════════════

    function openPracticeMenu(focusIndex = 0) {
        flow++;
        combat.stop();
        music.play('menu', { intensity: 1 });
        const items = [
            { label: 'Criaturas básicas', sub: 'Lobo, Rana, Murciélago y Gólem', icon: '🐺', action: () => startPractice('Criaturas básicas', BASICS, 0) },
            { label: 'Criaturas élite', sub: 'Practica los dúos críticos', icon: '🌋', action: () => startPractice('Criaturas élite', ELITES, 1) },
            { label: 'Todas las criaturas comunes', sub: 'Básicas y élite mezcladas', icon: '🌀', action: () => startPractice('Todas las criaturas', ALL_COMMON, 2) },
        ];
        const special = ['shadow', ...GUARDIANS, 'final_boss'].filter(id => profile.met.includes(id));
        special.forEach(id => {
            const d = ENEMIES[id];
            items.push({ label: d.name, sub: TIER_LABELS[d.tier], icon: d.icon, action: () => startPractice(d.name, [id], items.length) });
        });
        ListScreen.open({
            title: 'Práctica libre',
            intro: 'Práctica libre. Sin vidas ni puntos: cada error se explica. Elige contra qué practicar. Los guardianes aparecerán aquí cuando los conozcas.',
            items, focusIndex,
            onBack: () => goMenu('Menú principal.', 'btn-practice'),
        });
    }

    function practiceBag(ids) {
        if (ids.length === 1 && BOSS_TIERS.includes(ENEMIES[ids[0]].tier)) {
            return [makeInstance(ids[0], { st: ids[0] === 'shadow' ? { mimic: ALL_COMMON } : {} })];
        }
        const hasElite = ids.some(id => ENEMIES[id].tier === 'elite'), hasBasic = ids.some(id => ENEMIES[id].tier === 'basic');
        return buildBag({ count: 8, pool: ids, elite: hasElite && hasBasic ? 0.4 : 0 });
    }

    async function startPractice(title, ids, backIndex = 0) {
        const alive = newFlow();
        showCombat(`Práctica: ${title}`, 'Sin vidas ni puntos · Escape para pausar o salir', 'practice');
        music.play('fields', { intensity: 1 });
        audio.setReverb('hall');
        speech.say(`Práctica: ${title}. Pulsa Escape cuando quieras terminar.`);
        await sleep(1200);
        if (!alive()) return;
        const result = await runEncounter({
            kind: 'practice', practice: true, endless: true, title: `Práctica: ${title}`, theme: 'fields', reverb: 'hall',
            makeBag: () => practiceBag(ids),
            waveText: w => `Ronda ${w}.`,
        });
        if (!alive()) return;
        applyResult(result, 'practice');
        const s = result.stats;
        speech.say(`Práctica terminada. Aciertos: ${s.hits}. Errores: ${s.mistakes}.`);
        openPracticeMenu(backIndex);
    }

    // ═══════════════════════════════════════════════════
    // Biblioteca
    // ═══════════════════════════════════════════════════

    function visibleInBestiary(id) {
        const t = ENEMIES[id].tier;
        return t === 'basic' || t === 'elite' || profile.met.includes(id);
    }

    function openLibrary(focusIndex = 0) {
        flow++;
        const known = BESTIARY_ORDER.filter(id => profile.met.includes(id)).length;
        ListScreen.open({
            title: 'Biblioteca', intro: 'Biblioteca de la Academia.', focusIndex,
            items: [
                { label: 'Bestiario', sub: `${known} de ${BESTIARY_ORDER.length} criaturas encontradas`, icon: '📖', action: () => openBestiary() },
                { label: 'Grimorio de hechizos', sub: 'Los cuatro elementos y los seis dúos', icon: '✨', action: () => openGrimoire() },
                { label: 'El ciclo elemental', sub: 'Quién vence a quién', icon: '🔄', action: () => Narration.run(LORE_EXTRA.cycle, { title: 'El ciclo elemental', key: 'cycle' }) },
                { label: 'Sonidos de posición', sub: 'Escucha cómo suena cada dirección', icon: '🎧', action: () => openDirections() },
                { label: 'Archivo de ecos', sub: 'Vuelve a escuchar la historia', icon: '📜', action: () => openArchive() },
            ],
            onBack: () => goMenu('Menú principal.', 'btn-library'),
        });
    }

    function bestiaryWeakText(def) {
        if (def.mechanic === 'mimic') return 'Su debilidad es la de la criatura que imita.';
        if (def.mechanic === 'shift') return 'Cambia de elemento: respóndele cada vez como a un guardián de ese elemento.';
        return `${weaknessText(profileOf(def))} Nunca uses ${elementNames(def.cure)}.` +
            (def.critCure ? ` Y nunca ${def.critCure}: la curación crítica.` : '');
    }

    function openBestiary(focusIndex = 0) {
        const ids = BESTIARY_ORDER;
        ListScreen.open({
            title: 'Bestiario',
            intro: `Bestiario. ${ids.filter(id => profile.met.includes(id)).length} de ${ids.length} criaturas encontradas. Enter para escucharlas.`,
            focusIndex,
            items: ids.map((id, i) => {
                const d = ENEMIES[id];
                if (!visibleInBestiary(id)) {
                    return { label: '¿Criatura desconocida?', sub: TIER_LABELS[d.tier], icon: '❔', speak: `Criatura desconocida. ${TIER_LABELS[d.tier]}. Sigue avanzando para encontrarla.` };
                }
                const seen = profile.met.includes(id);
                return {
                    label: d.name, sub: `${TIER_LABELS[d.tier]}${seen ? '' : ' · aún no encontrada'}`, icon: d.icon,
                    speak: `${d.name}. ${TIER_LABELS[d.tier]}. ${bestiaryWeakText(d)}`,
                    action: () => bestiaryDetail(id, i),
                };
            }),
            onBack: () => openLibrary(0),
        });
    }

    function playAllDirections(voice) {
        ['up', 'right', 'down', 'left'].forEach((d, i) => {
            setTimeout(() => {
                if (!Dialog.active && UI.current !== 'list') return;
                speech.say(DIRECTIONS[d].name);
                setTimeout(() => audio.playVoice(voice, d), 650);
            }, i * 2400);
        });
    }

    async function bestiaryDetail(id) {
        const d = ENEMIES[id];
        const c = await Dialog.open({
            title: d.name,
            text: `${TIER_LABELS[d.tier]}. ${d.desc}\n${bestiaryWeakText(d)}`,
            buttons: [
                { label: 'Escuchar', keep: true, action: () => audio.playVoice(d.voice, 'center') },
                { label: 'Escuchar en las cuatro posiciones', keep: true, action: () => playAllDirections(d.voice) },
                ...(LORE.creatures[id] && profile.met.includes(id) ? [{ label: 'Escuchar su historia', value: 'lore' }] : []),
                { label: 'Practicar contra esta criatura', value: 'practice' },
                { label: 'Volver', value: 'back' },
            ],
            cancel: 'back',
        });
        if (c === 'practice') startPractice(d.name, [id]);
        else if (c === 'lore') {
            markLore(`creature_${id}`);
            await Narration.run(LORE.creatures[id], { title: d.name, gap: 600, key: `creature_${id}` });
            if (UI.current === 'list') bestiaryDetail(id);
        }
    }

    function openGrimoire() {
        const k = input.scheme;
        const items = ELEMENT_IDS.map(el => {
            const E = ELEMENTS[el], beats = ELEMENTS[E.beats], loser = ELEMENTS[weaknessOf(el)];
            return {
                label: `${E.name} · tecla ${k.labels[el]}`, sub: `Vence a ${beats.name} · le vence ${loser.name}`, icon: E.icon,
                speak: `${E.name}. Tecla ${k.spoken[el]}. Vence a las criaturas de ${beats.name}. Las criaturas de ${loser.name} lo resisten... y las de ${E.name} se curan con él.`,
                action: () => { audio.playElement(el); },
            };
        });
        Object.entries(DUAL_SPELLS).forEach(([key, sp]) => {
            const els = key.split('+');
            const crits = Object.values(ENEMIES).filter(e => e.critHit === sp.name && (e.tier !== 'boss' || profile.met.includes(e.id))).map(e => e.name);
            const heals = Object.values(ENEMIES).filter(e => e.critCure === sp.name && (e.tier !== 'boss' || profile.met.includes(e.id))).map(e => e.name);
            items.push({
                label: `${sp.name} · ${els.map(e => k.labels[e]).join(' + ')}`, sub: `${elementNames(els)} a la vez`, icon: sp.icon,
                speak: `${sp.name}: ${elementNames(els)} a la vez, teclas ${els.map(e => k.spoken[e]).join(' y ')}.` +
                    (crits.length ? ` Golpe crítico contra: ${joinY(crits)}.` : '') +
                    (heals.length ? ` Cura muchísimo a: ${joinY(heals)}.` : ''),
                action: () => audio.castSpell(els, 'up'),
            });
        });
        ListScreen.open({
            title: 'Grimorio de hechizos', intro: 'Grimorio. Enter para escuchar cada hechizo.',
            items, onBack: () => openLibrary(1),
        });
    }

    function openDirections() {
        const items = DIR_IDS.map(d => ({
            label: `${DIRECTIONS[d].label} ${capFirst(DIRECTIONS[d].name)}`,
            sub: { up: 'Agudo y brillante, con campanilla', down: 'Grave y apagado, con golpe sordo', left: 'En tu oído izquierdo', right: 'En tu oído derecho' }[d],
            icon: '🎧',
            action: () => audio.playVoice(pick(['wolf', 'golem', 'bat', 'frog']), d),
        }));
        items.push({ label: 'Prueba de auriculares', sub: 'Izquierda y luego derecha', icon: '🎚️', action: () => {
            speech.say('Izquierda.');
            setTimeout(() => audio.playVoice('frog', 'left'), 700);
            setTimeout(() => speech.say('Derecha.'), 2200);
            setTimeout(() => audio.playVoice('frog', 'right'), 2900);
        } });
        ListScreen.open({
            title: 'Sonidos de posición', intro: 'Sonidos de posición. Enter para escuchar cada dirección.',
            items, onBack: () => openLibrary(3),
        });
    }

    function openArchive() {
        const items = [];
        const st = profile.story, heard = id => profile.loreSeen.includes(id);
        // Las crónicas y leyendas aparecen en cuanto el progreso las alcanza, aunque aún no se hayan escuchado.
        const chronItem = n => ({
            label: chronicleTitle(n), sub: heard(`chron_${n}`) ? 'Crónicas de los Antiguos Ecos' : 'Crónicas de los Antiguos Ecos · sin escuchar',
            icon: '📖', action: () => playChronicle(n),
        });
        const echoAfter = { '1': [], '10': [1], '15_shadow': [2], '20': [3], '25_shadow': [4], '30': [5] };
        const echoOrder = ['1', '10', '15_shadow', '20', '25_shadow', '30'];
        const chronOpen = n => heard(`chron_${n}`) || Object.entries(CHRONICLE_AT_END).some(([lvl, c]) => c === n && st.level > +lvl);
        const listed = new Set();
        echoOrder.forEach(k => {
            for (const n of echoAfter[k]) if (chronOpen(n)) { items.push(chronItem(n)); listed.add(n); }
            if (profile.echosSeen.includes(k)) items.push({
                label: LORE_EXTRA.echoTitles[k], sub: 'Eco', icon: k.includes('shadow') ? '🌑' : '📜',
                action: () => Narration.run(LORE.echos[k], { title: LORE_EXTRA.echoTitles[k], pitch: k.includes('shadow') ? 0.5 : 1, key: `echo_${k}` }),
            });
        });
        [1, 2, 3, 4, 5].filter(n => !listed.has(n) && chronOpen(n)).forEach(n => items.push(chronItem(n)));
        ROUTE_IDS.forEach(r => {
            const R = ROUTES[r], done = st.routesDone.includes(r), prog = st.routeProgress[r] || 0;
            if (profile.loreSeen.includes(`pre_${r}`)) items.push({ label: R.place, sub: `La historia de ${R.guardian}`, icon: R.icon, action: () => Narration.run(LORE.bosses[r].preRoute, { title: R.place, key: `route_${r}_pre` }) });
            if (heard(`legend_${r}`) || done || prog > LEGEND_AT_ROUTE_LEVEL) items.push({ label: LORE.bosses[r].legendTitle, sub: `Leyenda de ${R.guardian}`, icon: '📖', action: () => playLegend(r) });
            if (heard(`encounter_${r}`) || done) items.push({ label: `Encuentro: ${ENEMIES[R.boss].name}`, sub: 'Antes del combate', icon: R.icon, action: () => playEncounter(r) });
            if (done) items.push({ label: `Purificación: ${ENEMIES[R.boss].name}`, sub: 'Victoria', icon: '🕊️', action: () => Narration.run(LORE.bosses[r].victory, { title: 'Purificación', key: `route_${r}_victory` }) });
        });
        if (heard('chron_6') || st.finalDone) items.push(chronItem(6));
        if (st.finalDone) {
            items.push({ label: 'El Avatar del Silencio', sub: 'El encuentro final', icon: '👁️', action: () => Narration.run(LORE.finalBoss.intro, { title: 'Avatar del Silencio', pitch: 0.6, key: 'final_intro' }) });
            items.push({ label: 'Ecos Eternos', sub: 'El final', icon: '✨', action: () => Narration.run(LORE.finalBoss.victory, { title: 'Ecos Eternos', key: 'final_victory' }) });
            items.push({ ...chronItem('epilogue'), sub: 'Crónicas de los Antiguos Ecos' });
        }
        ListScreen.open({
            title: 'Archivo de ecos', intro: items.length ? `Archivo de ecos. ${plural(items.length, 'grabación', 'grabaciones')}.` : 'Archivo de ecos. Aún no has escuchado ningún eco.',
            items, emptyText: 'Avanza en la historia para llenar el archivo.',
            onBack: () => openLibrary(4),
        });
    }

    // ═══════════════════════════════════════════════════
    // Logros y clasificación
    // ═══════════════════════════════════════════════════

    async function openAchievements() {
        const alive = newFlow();
        const n = profile.achievements.length;
        let specials = [];
        if (Online.isCloud() && (profile.customAch || []).length) {
            try {
                const all = await Cloud.listCustomAchievements();
                specials = all.filter(a => profile.customAch.includes(a.id));
            } catch (_) { /* sin conexión */ }
            if (!alive()) return;
        }
        ListScreen.open({
            title: `Logros de ${profile.username}`,
            intro: `Logros: ${n} de ${ACHIEVEMENTS_DEF.length} desbloqueados.` + (specials.length ? ` Y ${plural(specials.length, 'logro especial', 'logros especiales')} del creador.` : ''),
            items: [
                ...specials.map(a => ({
                    label: a.name, sub: `Logro especial del creador · ${a.desc || ''}`, icon: a.icon || '🌟', cls: 'unlocked',
                    speak: `Logro especial del creador: ${a.name}. ${a.desc || ''}`,
                })),
                ...ACHIEVEMENTS_DEF.map(a => {
                    const got = profile.achievements.includes(a.id);
                    return {
                        label: a.name, sub: a.desc, icon: got ? '🏆' : '🔒', cls: got ? 'unlocked' : 'locked',
                        speak: `${a.name}. ${got ? 'Desbloqueado' : 'Bloqueado'}. ${a.desc}`,
                    };
                }),
            ],
            onBack: () => goMenu('Menú principal.', 'btn-achievements'),
        });
    }

    function arenaBoard() {
        const players = Storage.listProfiles().filter(p => p.arena.bestScore > 0).map(p => ({
            name: p.username, score: p.arena.bestScore, wave: p.arena.bestWave, you: profile && p.username.toLowerCase() === profile.username.toLowerCase(), profile: p,
        }));
        const legends = LEGENDS.map(l => ({ name: l.name, score: l.score, wave: l.wave, legend: true, note: l.note }));
        return [...players, ...legends].sort((a, b) => b.score - a.score);
    }

    function storyValue(p) {
        const st = p.story;
        return Math.min(st.level, COMMON_LEVELS + 1) * 10 + st.routesDone.length * 100 + (st.finalDone ? 1000 : 0) + p.storyScore / 1e7;
    }

    function leaderboardTab(i) {
        if (i === 0) {
            const board = arenaBoard();
            return {
                intro: 'Clasificación de la Arena.',
                items: board.map((e, idx) => ({
                    label: `${idx + 1}. ${e.name}${e.you ? ' (tú)' : ''}${e.legend ? ' · Leyenda' : ''}`,
                    sub: `${fmtNum(e.score)} puntos · oleada ${e.wave}${e.note ? ' · ' + e.note : ''}`,
                    icon: e.legend ? '📜' : idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⚔️',
                    cls: e.you ? 'you' : '',
                    speak: `Posición ${idx + 1}. ${e.name}${e.you ? ', tú' : ''}${e.legend ? ', leyenda de la Academia' : ''}. ${fmtNum(e.score)} puntos. Oleada ${e.wave}.`,
                    action: e.profile ? () => profileDetail(e.profile) : null,
                })),
            };
        }
        const players = Storage.listProfiles().sort((a, b) => storyValue(b) - storyValue(a));
        return {
            intro: 'Clasificación de la historia.',
            items: players.map((p, idx) => ({
                label: `${idx + 1}. ${p.username}${profile && p.username.toLowerCase() === profile.username.toLowerCase() ? ' (tú)' : ''}`,
                sub: `${progressLabel(p)} · ${fmtNum(p.storyScore)} puntos`,
                icon: p.story.finalDone ? '👁️' : '📖',
                speak: `Posición ${idx + 1}. ${p.username}. ${progressLabel(p)}. ${fmtNum(p.storyScore)} puntos de historia.`,
                action: () => profileDetail(p),
            })),
        };
    }

    function openLeaderboard() {
        flow++;
        const tab = leaderboardTab(0);
        ListScreen.open({
            title: 'Clasificación', intro: tab.intro + ' Izquierda y derecha para cambiar entre Arena e Historia.',
            tabs: ['Arena', 'Historia'], tabIndex: 0, onTab: i => leaderboardTab(i),
            items: tab.items,
            onBack: () => goMenu('Menú principal.', 'btn-leaderboard'),
        });
    }

    function profileDetail(p) {
        const s = p.stats;
        const bosses = p.bossesDefeated.map(id => ENEMIES[id]?.name).filter(Boolean);
        Dialog.open({
            title: p.username,
            text: [
                `${progressLabel(p)}.`,
                `Arena: ${fmtNum(p.arena.bestScore)} puntos, oleada ${p.arena.bestWave}.`,
                `Enemigos derrotados: ${fmtNum(s.kills)}. Críticos: ${fmtNum(s.crits)}. Mejor racha: ${s.bestStreak}.`,
                `Guardianes: ${bosses.length ? joinY(bosses) : 'ninguno todavía'}.`,
                `Logros: ${p.achievements.length} de ${ACHIEVEMENTS_DEF.length}. Tiempo de juego: ${fmtDuration(s.playTimeS)}.`,
            ].join('\n'),
            buttons: [{ label: 'Cerrar', value: 'close' }], cancel: 'close',
        });
    }

    // ═══════════════════════════════════════════════════
    // Ayuda
    // ═══════════════════════════════════════════════════

    function helpSections() {
        const k = input.scheme.spoken;
        return [
            { t: 'Objetivo', x: 'Eres el último invocador de la Academia de los Ecos. Las criaturas del Silencio te atacan desde cuatro posiciones: izquierda, derecha, arriba y abajo. Escucha su sonido, reconoce a la criatura y respóndele con el elemento que la vence, en su dirección.' },
            { t: 'Teclas', x: controlsText() },
            { t: 'El ciclo elemental', x: LORE_EXTRA.cycle.join(' ') },
            { t: 'Sonidos de posición', x: 'Izquierda y derecha suenan en cada oído, con un chasquido de madera. Arriba suena agudo y brillante, con una campanilla. Abajo suena grave y apagado, con un golpe sordo. En la Biblioteca puedes escuchar cada posición.' },
            { t: 'Vidas, rachas y puntos', x: 'Cada error te quita una vida: dirección equivocada, elemento ineficaz, curar al enemigo o dejar que se agote el tiempo. Cada cinco aciertos seguidos sube tu multiplicador de puntos, hasta por cuatro, y las rachas largas te devuelven vidas. Responder rápido da puntos extra. Si caes, repites el nivel: nunca pierdes tu progreso.' },
            { t: 'Niveles especiales', x: 'Frenesí: los enemigos llegan más rápido. Niebla: no se anuncia la posición, solo la oyes. Élite: solo criaturas de dos elementos. En los niveles 15 y 25 acecha la Sombra Imitadora: imita a otras criaturas y debes responderle como a la criatura que imita.' },
            { t: 'Guardianes', x: 'Cada guardián tiene una mecánica propia. Ignar lanza brasas: apágalas con Agua. El Leviatán se desplaza antes de atacar: apunta a donde termina. Zael lanza ecos falsos y lejanos: apunta al grito cercano. Rok alza un escudo de piedra: cuando lo oigas, no ataques. El Avatar del Silencio cambia de elemento sin parar.' },
            { t: 'Modos de juego', x: 'Historia: treinta niveles, cuatro rutas con sus guardianes y un enemigo final. Arena: oleadas infinitas con récord. Práctica libre: sin vidas ni puntos. Entrenamiento: aprende paso a paso.' },
            { t: 'Accesibilidad', x: `En Opciones puedes cambiar la dificultad, la velocidad, el volumen y la voz, cuánto se anuncia de cada enemigo, la ventana de combinación, el esquema de teclas para zurdos, el audio mono, si usas lector de pantalla y la voz de la historia: narradores grabados, con una voz para cada personaje, o la voz del sistema. La historia tiene su propia velocidad, aparte de la del resto del juego. Con el esquema zurdo, los elementos son ${KEY_SCHEMES.zurdo.spoken.agua}, ${KEY_SCHEMES.zurdo.spoken.fuego}, ${KEY_SCHEMES.zurdo.spoken.tierra} y ${KEY_SCHEMES.zurdo.spoken.viento}, y las direcciones W, A, S y D. Ahora usas: tecla ${k.agua} para el Agua.` },
        ];
    }

    function openHelp() {
        flow++;
        ListScreen.open({
            title: 'Cómo jugar', intro: 'Cómo jugar. Enter para escuchar cada apartado.',
            items: helpSections().map(s => ({ label: s.t, sub: s.x.length > 90 ? s.x.slice(0, 88) + '…' : s.x, speak: s.t, action: () => Narration.run([s.x], { title: s.t }) })),
            onBack: () => goMenu('Menú principal.', 'btn-help'),
        });
    }

    // ═══════════════════════════════════════════════════
    // Opciones
    // ═══════════════════════════════════════════════════

    const pct = v => `${Math.round(v * 100)} por ciento`;

    function optionDefs() {
        return [
            { id: 'difficulty', label: 'Dificultad', type: 'choice', values: DIFFICULTY_IDS, labels: { aprendiz: 'Aprendiz', invocador: 'Invocador', archimago: 'Archimago' }, desc: v => DIFFICULTIES[v].desc },
            { id: 'speechRate', label: 'Velocidad de voz', type: 'range', min: 0.5, max: 2.5, step: 0.1, fmt: v => fmtDecimal(v) },
            { id: 'speechVolume', label: 'Volumen de voz', type: 'range', min: 0.1, max: 1, step: 0.1, fmt: pct },
            {
                id: 'voiceURI', label: 'Voz', type: 'voice', label2: () => speech.voiceName(),
                desc: 'Elige entre las voces en español instaladas en tu sistema.',
                cycle: step => {
                    const vs = speech.spanishVoices;
                    if (vs.length < 2) return;
                    const i = vs.findIndex(v => v.voiceURI === settings.voiceURI);
                    settings.voiceURI = vs[((i < 0 ? 0 : i) + step + vs.length) % vs.length].voiceURI;
                },
            },
            { id: 'musicVolume', label: 'Volumen de música', type: 'range', min: 0, max: 1, step: 0.1, fmt: pct },
            { id: 'sfxVolume', label: 'Volumen de efectos', type: 'range', min: 0.1, max: 1, step: 0.1, fmt: pct },
            {
                id: 'verbosity', label: 'Anuncio de enemigos', type: 'choice', values: ['completo', 'normal', 'breve', 'sonido'],
                labels: { completo: 'Completo', normal: 'Normal', breve: 'Breve', sonido: 'Solo sonido' },
                desc: v => ({
                    completo: 'Nombre, posición y vidas de cada enemigo.',
                    normal: 'Nombre y posición, y vidas de las criaturas élite.',
                    breve: 'Nombre corto y posición.',
                    sonido: 'Solo sonido: la voz no dice qué criatura viene ni por dónde, ni la nombra al derrotarla. Para quien ya reconoce a las criaturas. En combate, la tecla V lo activa y desactiva.',
                }[v]),
            },
            {
                id: 'comboWindow', label: 'Ventana de combinación', type: 'choice', values: [600, 1000, 1500, 2500],
                labels: { 600: 'Corta, 0,6 segundos', 1000: 'Normal, 1 segundo', 1500: 'Amplia, 1,5 segundos', 2500: 'Muy amplia, 2,5 segundos' },
                desc: 'Tiempo que un elemento queda cargado tras pulsarlo. Amplíala si te cuesta pulsar varias teclas a la vez.',
            },
            { id: 'keyScheme', label: 'Esquema de teclas', type: 'choice', values: ['clasico', 'zurdo'], labels: { clasico: KEY_SCHEMES.clasico.name, zurdo: KEY_SCHEMES.zurdo.name } },
            { id: 'ticks', label: 'Tic-tac del tiempo', type: 'bool', desc: 'Avisa con un tic-tac cuando se acaba el tiempo para responder.' },
            { id: 'mono', label: 'Audio mono', type: 'bool', desc: 'Para quien oye por un solo oído: mezcla el sonido en mono y la voz anuncia siempre la posición.' },
            { id: 'visualAids', label: 'Radar visual', type: 'bool', desc: 'Muestra en pantalla la posición del enemigo. Desactívalo para jugar de verdad a ciegas.' },
            {
                id: 'output', label: 'Salida de voz', type: 'choice', values: ['tts', 'sr'], labels: { tts: 'Voz del juego', sr: 'Lector de pantalla' },
                desc: v => v === 'tts' ? 'El juego habla con su propia voz.' : 'Los anuncios se envían a tu lector de pantalla.',
            },
            {
                id: 'storyVoice', label: 'Voz de la historia', type: 'choice', values: ['grabada', 'sistema'],
                labels: { grabada: 'Narradores grabados', sistema: 'Voz del sistema' },
                desc: v => v === 'grabada'
                    ? (narrator.available ? 'Cada personaje tiene su propia voz y sus efectos.' : 'Aún no se han generado los audios: mientras tanto se usa la voz del sistema.')
                    : 'La historia la lee la misma voz que el resto del juego.',
            },
            { id: 'storyRate', label: 'Velocidad de la historia', type: 'range', min: 0.7, max: 1.5, step: 0.1, fmt: v => fmtDecimal(v) },
            { id: 'storyTest', label: 'Escuchar la voz de la historia', type: 'action', run: () => testStory() },
            { id: 'test', label: 'Probar sonido y voz', type: 'action', run: () => testSound() },
            { id: 'reset', label: 'Borrar el progreso de este invocador', type: 'action', danger: true, run: () => confirmReset() },
        ];
    }

    function onSettingChange(def) {
        Storage.saveSettings(settings);
        audio.applySettings();
        if (def.id === 'keyScheme') CombatView.updateKeyLabels(input.scheme);
        document.body.classList.toggle('no-visual', !settings.visualAids);
    }

    function testStory() {
        speech.cancel();
        if (settings.storyVoice !== 'sistema' && narrator.preview()) return;
        speech.say('Así sonará la historia. Escucha: el Silencio se acerca, y solo tu voz puede despertar los ecos.', { rate: settings.storyRate });
    }

    function testSound() {
        speech.say(`Así suena la voz. Y así, una criatura a tu izquierda... y a tu derecha.`);
        setTimeout(() => audio.playVoice('wolf', 'left'), 2600);
        setTimeout(() => audio.playVoice('wolf', 'right'), 4100);
    }

    async function confirmReset() {
        const c = await Dialog.open({
            title: '¿Borrar todo el progreso?',
            text: `Se borrarán la historia, los logros y los récords de ${profile.username}. No se puede deshacer.`,
            buttons: [{ label: 'Cancelar', value: false }, { label: 'Sí, borrarlo todo', value: true, danger: true }],
            cancel: false,
        });
        if (c) {
            profile = newProfile(profile.username);
            save();
            speech.say('Progreso borrado. Empiezas de nuevo.');
        }
    }

    function openOptions() {
        flow++;
        UI.backHandlers.options = () => goMenu('Menú principal.', 'btn-options');
        OptionsScreen.open(optionDefs(), settings, onSettingChange);
    }

    // ═══════════════════════════════════════════════════
    // Arranque
    // ═══════════════════════════════════════════════════

    function init() {
        UI.init({ speech, audio, settings, narrator });
        narrator.load();
        document.body.classList.toggle('no-visual', !settings.visualAids);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', e => { if (UI.current === 'combat') input.keyup(e); });
        document.addEventListener('pointerdown', unlock, { capture: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && combat.active && !combat.paused) openPause();
            if (document.hidden) Cloud.flush();
        });
        window.addEventListener('pagehide', () => Cloud.flush());
        $('btn-go-online').addEventListener('click', () => { audio.uiSelect(); connectCloud(); });

        Online.init({
            speech, audio, music, settings, input,
            getProfile: () => profile,
            getMode: () => mode,
            setSession: (p, m) => { profile = p; mode = m; save(); },
            replaceProfile: p => { profile = p; if (mode === 'cloud' && Cloud.uid) Storage.saveCloudCache(Cloud.uid, p); if (UI.current === 'menu') refreshMenu(); },
            clearSession: () => { profile = null; mode = 'guest'; },
            save, goMenu, goLogin, connectCloud, newFlow, runEncounter, arenaEncounter, showCombat,
            applyResult, resultLines, unlockAch,
            refreshMenu: () => { if (profile && UI.current === 'menu') refreshMenu(); },
        });

        $('login-form').addEventListener('submit', e => { e.preventDefault(); login($('input-username').value); });
        $('btn-list-back').addEventListener('click', () => UI.back());
        $('btn-options-back').addEventListener('click', () => UI.back());

        // Controles táctiles (no roban el foco).
        document.querySelectorAll('.pad-btn').forEach(b => {
            b.tabIndex = -1;
            b.addEventListener('mousedown', e => e.preventDefault());
            b.addEventListener('click', () => {
                unlock();
                if (!combat.active && !tutorial.running) return;
                if (b.dataset.el) input.armElement(b.dataset.el);
                else if (b.dataset.dir) input.fireDirection(b.dataset.dir);
            });
        });

        initSplash();
        initMenu();
        initRoutes();
        console.info(`[Aethelgard] Versión ${GAME_VERSION} lista.`);
    }

    return {
        init,
        // Acceso para depuración y pruebas automáticas.
        debug: {
            settings, speech, audio, music, input, combat, tutorial, narrator,
            get profile() { return profile; },
            get flow() { return flow; },
            get mode() { return mode; },
            cloud: Cloud, online: Online,
            setTimeScale(v) { combat.timeScale = v; },
            login, goMenu, startStory, playCampaignLevel, playRouteLevel, playGuardian, playFinal,
            startArena, startPractice, startTutorial, showRouteSelect,
        },
    };
})();

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', () => App.init())
    : App.init();

window.Aethelgard = App;
