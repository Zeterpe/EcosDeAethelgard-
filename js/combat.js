/* =============================================
   ECOS DE AETHELGARD — combat.js
   Motor de combate por turnos en tiempo real:
   bolsa de enemigos, tiempo de reacción con tic-tac,
   rachas, multiplicador, curación por racha, pausa,
   y mecánicas únicas de cada jefe.
   Todo lo asíncrono se invalida al salir (token gen),
   así nunca sigue un combate «fantasma» de fondo.
   ============================================= */
'use strict';

// ═══════════════════════════════════════════════════════
// Temporizadores pausables
// ═══════════════════════════════════════════════════════

class PausableTimers {
    #items = new Set();
    #paused = false;
    scale = 1;   // < 1 acelera el juego (pruebas automáticas)

    set(fn, ms) {
        const it = { fn, remaining: Math.max(0, ms * this.scale), start: 0, id: null };
        this.#items.add(it);
        if (!this.#paused) this.#arm(it);
        return it;
    }
    #arm(it) {
        it.start = performance.now();
        it.id = setTimeout(() => { this.#items.delete(it); it.fn(); }, it.remaining);
    }
    sleep(ms) { return new Promise(r => this.set(r, ms)); }
    clearAll() { for (const it of this.#items) clearTimeout(it.id); this.#items.clear(); }
    pause() {
        if (this.#paused) return;
        this.#paused = true;
        const now = performance.now();
        for (const it of this.#items) { clearTimeout(it.id); it.remaining = Math.max(0, it.remaining - (now - it.start)); }
    }
    resume() {
        if (!this.#paused) return;
        this.#paused = false;
        for (const it of this.#items) this.#arm(it);
    }
}

// ═══════════════════════════════════════════════════════
// Instancias de enemigos y bolsas
// ═══════════════════════════════════════════════════════

function profileOf(def) {
    return { weak: [...def.weak], cure: [...def.cure], critHit: def.critHit, critCure: def.critCure };
}

let _uidCounter = 0;
function makeInstance(defId, o = {}) {
    const def = ENEMIES[defId];
    const lives = o.lives ?? def.lives;
    return {
        uid: `${defId}_${++_uidCounter}`, def, lives, maxLives: lives,
        profile: profileOf(def), main: !!o.main,
        st: { phase: 1, turns: 0, ...(o.st || {}) },
    };
}

function buildBag({ count, pool, elite = 0, ensure = [] }) {
    const basics = pool.filter(id => ENEMIES[id].tier === 'basic');
    const elites = pool.filter(id => ENEMIES[id].tier === 'elite');
    const bag = [];
    for (let i = 0; i < count; i++) {
        const useElite = elites.length > 0 && (basics.length === 0 || rand() < elite);
        bag.push(makeInstance(pick(useElite ? elites : basics)));
    }
    let slot = 0;
    for (const id of ensure) {
        if (!pool.includes(id) || bag.some(x => x.def.id === id) || slot >= bag.length) continue;
        bag[slot++] = makeInstance(id);
    }
    return shuffle(bag);
}

const BOSS_TIERS = ['boss', 'final', 'miniboss'];

// ═══════════════════════════════════════════════════════
// Mecánicas de jefes
// prepare(api, inst, turn): ajusta el turno antes de sonar
// afterTurn(api, inst, turn): invocaciones tras el turno
// phases: umbrales de vida (proporción) que desatan la furia
// ═══════════════════════════════════════════════════════

const MECHANICS = {
    forge: {
        phases: [{
            at: 0.5, react: 0.85,
            text: enc => enc.endless ? '¡Ignar entra en furia! Su forja arde más que nunca.' : LORE.bosses.fire.rage,
        }],
        afterTurn(api, inst) {
            const st = inst.st;
            st.turns++;
            const every = st.phase >= 2 ? 2 : 3;
            if (st.turns % every !== 0) return null;
            const n = st.phase >= 2 ? 3 : 2;
            api.addEnemies('ember', n);
            api.audio.summon();
            return api.say(`¡Ignar golpea el yunque! ${n} brasas vuelan hacia ti. Apágalas con Agua.`);
        },
    },

    current: {
        phases: [{
            at: 0.5, react: 0.85,
            text: enc => enc.endless ? '¡El Leviatán entra en furia! La corriente se vuelve salvaje.' : LORE.bosses.water.rage,
        }],
        prepare(api, inst, turn) {
            const others = shuffle(DIR_IDS.filter(d => d !== turn.dir));
            turn.sweep = [...others.slice(0, inst.st.phase >= 2 ? 2 : 1), turn.dir];
            turn.hideDir = !api.revealDir();
            turn.label = 'El Leviatán se desplaza';
            inst.st.turns++;
        },
    },

    decoy: {
        phases: [{
            at: 0.5, react: 0.9,
            text: enc => enc.endless ? '¡Zael entra en furia! Sus ecos se multiplican.' : LORE.bosses.wind.rage,
        }],
        prepare(api, inst, turn) {
            const others = shuffle(DIR_IDS.filter(d => d !== turn.dir));
            turn.decoys = others.slice(0, inst.st.phase >= 2 ? 2 : 1);
            turn.hideDir = !api.revealDir();
            turn.label = 'Zael grita';
            inst.st.turns++;
        },
    },

    shield: {
        phases: [{
            at: 0.5, react: 0.9,
            text: enc => enc.endless ? '¡Rok entra en furia! La montaña entera tiembla.' : LORE.bosses.earth.rage,
        }],
        prepare(api, inst, turn) {
            const p = inst.st.phase >= 2 ? 0.4 : 0.3;
            if (!inst.st.lastShield && inst.st.turns >= 1 && rand() < p) {
                turn.shield = true;
                turn.warning = '¡Rok alza su escudo de piedra! No ataques.';
                turn.reactOverride = CFG.SHIELD_MS;
            }
            inst.st.lastShield = !!turn.shield;
        },
        afterTurn(api, inst) {
            const st = inst.st;
            st.turns++;
            if (st.phase >= 2 && st.turns % 4 === 0) {
                api.addEnemies('golem_earth', 2);
                api.audio.summon();
                return api.say('¡Rok sacude la montaña! Dos gólems se desprenden de la roca.');
            }
            return null;
        },
    },

    shift: {
        phases: [
            { at: 0.65, react: 0.95, pitch: 0.55, text: () => LORE_EXTRA.avatarPhases[2] },
            { at: 0.3, react: 0.85, pitch: 0.5, text: () => LORE_EXTRA.avatarPhases[3] },
        ],
        async prepare(api, inst, turn) {
            const st = inst.st;
            st.turns++;
            const every = st.phase === 1 ? 3 : st.phase === 2 ? 2 : 1;
            if (!st.element || (st.turns - 1) % every === 0) {
                st.element = pick(ELEMENT_IDS.filter(e => e !== st.element));
                inst.profile = guardianProfile(st.element);
                api.audio.shift(st.element);
                await api.say(`El Avatar se vuelve ${ELEMENTS[st.element].name}.`);
            }
            turn.profile = inst.profile;
            turn.element = st.element;
            turn.whisper = st.phase >= 3;
        },
        afterTurn(api, inst) {
            const st = inst.st;
            if (st.phase >= 2 && st.turns % 4 === 0) {
                api.addEnemies(pick(ELITES), 1);
                api.audio.summon();
                return api.say('El Avatar invoca el eco de una criatura caída.');
            }
            return null;
        },
    },

    mimic: {
        prepare(api, inst, turn) {
            const pool = (inst.st.mimic || BASICS).filter(id => id !== inst.st.lastMimic);
            const def = ENEMIES[pick(pool.length ? pool : BASICS)];
            inst.st.lastMimic = def.id;
            inst.st.turns++;
            turn.profile = profileOf(def);
            turn.voice = def.voice;
            turn.ghost = true;
            turn.mimic = def;
            turn.label = api.hints() ? `La Sombra, imitando a ${nameWithArt(def)}` : 'La Sombra';
        },
    },
};

// ═══════════════════════════════════════════════════════
// CombatEngine
// ═══════════════════════════════════════════════════════

class CombatEngine {
    #d;                       // dependencias: audio, music, speech, input, settings, ui, narrate, onEvent, onPauseRequest
    #enc = null;
    #gen = 0;
    #timers = new PausableTimers();
    #state = 'idle';          // idle · starting · mechanic · turn · resolving · between · narrating · ending
    #paused = false;
    #resumeWaiters = [];
    #bag = [];
    #turn = null;
    #lastUid = null;
    #dirHistory = [];
    #lives = 0; #maxLives = 0;
    #score = 0; #streak = 0; #mult = 1;
    #stats = null;
    #wave = 0;
    #startedAt = 0;
    #loopIv = null; #lastFrame = 0;
    #aimWarned = 0;
    #api;

    constructor(deps) {
        this.#d = deps;
        this.#api = {
            audio: deps.audio,
            revealDir: () => this.#forceReveal(),
            hints: () => this.#hintsOn(),
            say: text => this.#d.speech.say(text),
            addEnemies: (defId, n, o) => {
                for (let i = 0; i < n; i++) this.#bag.push(makeInstance(defId, o));
                this.#hud();
            },
        };
    }

    get active() { return this.#state !== 'idle'; }
    get paused() { return this.#paused; }
    get state() { return this.#state; }
    get encounter() { return this.#enc; }
    set timeScale(v) { this.#timers.scale = v; }

    debugInfo() {
        const t = this.#turn;
        return {
            state: this.#state, paused: this.#paused, lives: this.#lives, maxLives: this.#maxLives,
            score: Math.round(this.#score), streak: this.#streak, mult: this.#mult, wave: this.#wave,
            bag: this.#bag.map(i => ({ id: i.def.id, lives: i.lives })),
            turn: t && {
                enemy: t.inst.def.id, dir: t.dir, profile: t.profile, shield: !!t.shield,
                mimic: t.mimic?.id || null, lives: t.inst.lives, resolved: t.resolved, total: t.total, elapsed: t.elapsed,
            },
        };
    }

    // ── Ciclo de vida ───────────────────────────────────

    start(enc) {
        this.#teardown();
        const gen = ++this.#gen;
        const diff = DIFFICULTIES[this.#d.settings.difficulty];
        this.#enc = enc;
        this.#maxLives = enc.lives ?? diff.lives;
        this.#lives = this.#maxLives;
        this.#score = 0; this.#streak = 0; this.#mult = 1; this.#aimWarned = 0;
        this.#wave = enc.endless ? 1 : 0;
        this.#stats = { kills: 0, hits: 0, crits: 0, mistakes: 0, damage: 0, spells: 0, bestStreak: 0, blocks: 0 };
        this.#bag = enc.makeBag(this.#wave);
        this.#dirHistory = [];
        this.#lastUid = null;
        this.#startedAt = performance.now();
        this.#paused = false;
        const input = this.#d.input;
        input.reset();
        input.handler = {
            onElement: el => this.#onElement(el),
            onSpell: s => this.#onSpell(s),
            onAim: d => this.#onAim(d),
            onCommand: c => this.#onCommand(c),
        };
        this.#d.music.play(enc.theme || 'academy', { intensity: 2 });
        this.#d.music.setIntensity(2);
        this.#d.music.setTempo(1);
        this.#d.audio.setReverb(enc.reverb || 'hall');
        this.#d.audio.setMuffled(enc.modifier === 'fog');
        this.#state = 'starting';
        this.#ui('reset', { enc, lives: this.#lives, maxLives: this.#maxLives });
        this.#hud();
        this.#lastFrame = performance.now();
        this.#loopIv = setInterval(() => this.#loop(), 50);
        this.#d.audio.fightStart();
        this.#timers.sleep(CFG.FIRST_TURN_MS).then(() => this.#nextTurn(gen));
    }

    /** Detiene sin informar (al salir de la pantalla). */
    stop() { this.#teardown(); this.#enc = null; }

    /** Abandona informando del resultado «quit». */
    quit() { if (this.#enc) this.#finish('quit'); }

    #teardown() {
        this.#gen++;
        this.#timers.clearAll();
        this.#timers.resume();
        clearInterval(this.#loopIv);
        this.#loopIv = null;
        this.#turn = null;
        this.#state = 'idle';
        this.#paused = false;
        this.#resumeWaiters.splice(0).forEach(r => r());
        this.#d.audio.setHeartbeat(false);
        this.#d.audio.setMuffled(false);
        this.#d.music.setPaused(false);
        this.#d.input.handler = null;
        this.#d.input.reset();
        this.#ui('clearEnemy');
    }

    #finish(outcome) {
        const enc = this.#enc;
        if (!enc) return;
        const result = {
            outcome,
            score: Math.round(this.#score),
            stats: { ...this.#stats },
            wave: this.#wave,
            durationMs: performance.now() - this.#startedAt,
            livesLeft: this.#lives,
            maxLives: this.#maxLives,
        };
        this.#teardown();
        this.#enc = null;
        enc.onEnd?.(result);
    }

    pause() {
        if (!this.active || this.#paused || this.#state === 'ending') return false;
        this.#paused = true;
        this.#timers.pause();
        this.#d.speech.cancel();
        this.#d.audio.setHeartbeat(false);
        this.#d.music.setPaused(true);
        this.#d.input.reset();
        return true;
    }

    resume() {
        if (!this.#paused) return;
        this.#paused = false;
        this.#lastFrame = performance.now();
        this.#timers.resume();
        this.#d.music.setPaused(false);
        this.#updateLowHealth();
        this.#resumeWaiters.splice(0).forEach(r => r());
        const t = this.#turn;
        if (this.#state === 'turn' && t && !t.resolved) {
            t.elapsed = Math.max(0, t.elapsed - CFG.RESUME_GRACE_MS);
            this.#playCue(t);
            this.#announce(t);
        }
    }

    async #checkpoint(gen) {
        while (gen === this.#gen && this.#paused) {
            await new Promise(r => this.#resumeWaiters.push(r));
        }
        return gen === this.#gen;
    }

    #sleep(ms) { return this.#timers.sleep(ms); }

    // ── Bucle de tiempo de reacción ─────────────────────

    #loop() {
        const now = performance.now();
        const dt = Math.min(200, now - this.#lastFrame) / this.#timers.scale;
        this.#lastFrame = now;
        const t = this.#turn;
        if (this.#paused || this.#state !== 'turn' || !t || t.resolved) return;
        t.elapsed += dt;
        const frac = Math.min(1, t.elapsed / t.total);
        this.#ui('timer', 1 - frac);
        if (this.#d.settings.ticks && frac >= CFG.TICK_FROM && t.elapsed > t.cueMs) {
            const u = (frac - CFG.TICK_FROM) / (1 - CFG.TICK_FROM);
            if (t.elapsed - t.lastTick >= 460 - 320 * u) { t.lastTick = t.elapsed; this.#d.audio.tick(u); }
        }
        if (t.elapsed >= t.total) this.#onTimeout(t);
    }

    // ── Turnos ──────────────────────────────────────────

    #pickInstance() {
        const bag = this.#bag;
        const boss = bag.find(i => BOSS_TIERS.includes(i.def.tier));
        if (boss && bag.length > 1) {
            if (rand() < 0.45 && boss.uid !== this.#lastUid) return boss;
            return pick(bag.filter(i => i !== boss));
        }
        let cands = bag;
        if (bag.length > 1 && this.#lastUid) {
            const f = bag.filter(i => i.uid !== this.#lastUid);
            if (f.length) cands = f;
        }
        return pick(cands);
    }

    #pickDir() {
        const h = this.#dirHistory;
        let options = DIR_IDS;
        if (h.length >= 2 && h[h.length - 1] === h[h.length - 2]) options = DIR_IDS.filter(d => d !== h[h.length - 1]);
        const d = pick(options);
        h.push(d);
        if (h.length > 4) h.shift();
        return d;
    }

    #reaction(inst) {
        const enc = this.#enc, s = this.#d.settings;
        const diff = DIFFICULTIES[s.difficulty];
        const mod = enc.modifier ? MODIFIERS[enc.modifier] : null;
        let ms = enc.practice ? CFG.PRACTICE_REACT_MS : (enc.reactionFor ? enc.reactionFor(this.#wave) : enc.reactionMs);
        if (!enc.practice) ms *= diff.react;
        if (mod) ms *= mod.react;
        ms *= inst.st.reactMult ?? 1;
        // Con una voz más lenta, algo más de margen.
        ms *= Math.max(1, Math.min(1.3, 1 / Math.sqrt(s.speechRate)));
        return Math.max(CFG.MIN_REACT_MS, Math.round(ms));
    }

    async #nextTurn(gen) {
        if (!(await this.#checkpoint(gen))) return;
        if (this.#bag.length === 0) { this.#onBagEmpty(gen); return; }
        const inst = this.#pickInstance();
        this.#lastUid = inst.uid;
        const turn = {
            inst, dir: this.#pickDir(), profile: inst.profile, voice: inst.def.voice,
            elapsed: 0, total: 1, lastTick: 0, resolved: false, cueMs: 0,
        };
        const mech = MECHANICS[inst.def.mechanic];
        if (mech?.prepare) {
            this.#state = 'mechanic';
            await mech.prepare(this.#api, inst, turn);
            if (!(await this.#checkpoint(gen))) return;
        }
        this.#d.onEvent?.('meet', { def: inst.def });
        const cue = this.#playCue(turn);
        turn.cueMs = cue.dur * 1000;
        turn.total = (turn.reactOverride ?? this.#reaction(inst)) + cue.extraMs;
        this.#turn = turn;
        this.#state = 'turn';
        this.#announce(turn);
        this.#ui('enemy', { turn, showDir: this.#dirVisible(turn) });
        this.#hud();
    }

    #playCue(turn) {
        const a = this.#d.audio;
        if (turn.sweep) {
            const delay = a.playSweep(turn.sweep);
            const dur = a.playVoice(turn.voice, turn.dir, { delay });
            return { dur, extraMs: delay * 1000 };
        }
        if (turn.decoys) {
            const seq = turn.decoySeq || (turn.decoySeq = shuffle([...turn.decoys.map(d => ({ d, far: true })), { d: turn.dir, far: false }]));
            let dur = 0;
            seq.forEach((s, i) => { dur = Math.max(dur, a.playVoice(turn.voice, s.d, { delay: i * 0.75, far: s.far })); });
            return { dur, extraMs: (seq.length - 1) * 750 };
        }
        const dur = a.playVoice(turn.voice, turn.dir, {
            ghost: turn.ghost, whisper: turn.whisper, element: turn.element, shield: turn.shield,
        });
        return { dur, extraMs: 0 };
    }

    #forceReveal() {
        const s = this.#d.settings;
        return s.mono || s.difficulty === 'aprendiz';
    }

    #hintsOn() { return DIFFICULTIES[this.#d.settings.difficulty].hints || !!this.#enc?.practice; }

    #dirSpoken(turn) {
        const s = this.#d.settings, forced = this.#forceReveal();
        if (turn.hideDir && !forced) return false;
        if (this.#enc.modifier === 'fog' && !forced) return false;
        if (s.verbosity === 'sonido' && !s.mono) return false;
        return true;
    }

    #dirVisible(turn) {
        const forced = this.#forceReveal();
        if (!this.#d.settings.visualAids) return false;
        if (turn.hideDir && !forced) return false;
        if (this.#enc.modifier === 'fog' && !forced) return false;
        return true;
    }

    #announce(turn) {
        const s = this.#d.settings, v = s.verbosity, def = turn.inst.def;
        let text;
        if (turn.warning) {
            text = turn.warning;
        } else {
            const p = [];
            if (v !== 'sonido') p.push(turn.label || (v === 'breve' ? def.short : def.name));
            if (this.#dirSpoken(turn)) p.push(DIRECTIONS[turn.dir].name);
            const lm = turn.inst.maxLives;
            if (lm > 1 && (v === 'completo' || (v === 'normal' && lm <= 8))) p.push(plural(turn.inst.lives, 'vida', 'vidas'));
            if (v !== 'sonido' && this.#hintsOn()) p.push(this.#hintShort(turn));
            text = p.filter(Boolean).join(', ');
        }
        if (text) this.#d.speech.say(capFirst(text) + (/[.!?…]$/.test(text) ? '' : '.'), { interrupt: true });
    }

    #hintShort(turn) {
        const pr = turn.profile;
        if (!pr.weak.length) return '';
        let t = `débil a ${elementNames(pr.weak)}`;
        if (pr.critHit) t += `, crítico ${pr.critHit}`;
        return t;
    }

    #whoText(turn) {
        if (turn.mimic) return `La Sombra imitaba a ${nameWithArt(turn.mimic)}`;
        return capFirst(nameWithArt(turn.inst.def));
    }

    #lesson(turn) {
        if (turn.shield) return 'Cuando Rok alza su escudo, espera sin atacar.';
        return `${this.#whoText(turn)}: ${weaknessText(turn.profile).replace(/^Débil/, 'débil')}`;
    }

    #hintText(turn) {
        if (turn.shield) return 'Rok tiene el escudo alzado. No ataques: espera.';
        if (turn.mimic && !this.#hintsOn()) return 'La Sombra imita a otra criatura. Escucha bien su voz deformada.';
        return this.#lesson(turn);
    }

    // ── Entrada ─────────────────────────────────────────

    #onElement(el) {
        if (this.#paused) return;
        this.#d.audio.elementKey(el);
    }

    #onAim() {
        if (this.#paused || this.#state !== 'turn') return;
        this.#d.audio.noElement();
        if (this.#aimWarned < 2) {
            this.#aimWarned++;
            const sc = KEY_SCHEMES[this.#d.settings.keyScheme];
            this.#d.speech.say(`Primero un elemento: ${sc.spoken.agua}, ${sc.spoken.fuego}, ${sc.spoken.tierra} o ${sc.spoken.viento}.`);
        }
    }

    #onCommand(cmd) {
        if (cmd === 'pause') { this.#d.onPauseRequest?.(); return; }
        if (this.#paused) return;
        const t = this.#turn;
        if (cmd === 'repeat') {
            if (this.#state === 'turn' && t && !t.resolved) { this.#playCue(t); this.#announce(t); }
            else this.#d.speech.say('Espera al siguiente enemigo.');
        } else if (cmd === 'status') {
            this.#d.speech.say(this.statusText());
        } else if (cmd === 'hint') {
            this.#d.speech.say(t && !t.resolved ? this.#hintText(t) : 'Ahora no hay ningún enemigo.');
        }
    }

    statusText() {
        const p = [];
        if (!this.#enc) return '';
        if (!this.#enc.practice) p.push(`Vidas: ${this.#lives} de ${this.#maxLives}`);
        if (!this.#enc.practice) p.push(`Puntos: ${fmtNum(this.#score)}`);
        if (this.#streak > 0) p.push(`Racha: ${this.#streak}, multiplicador por ${this.#mult}`);
        const boss = this.#bag.find(i => i.main || BOSS_TIERS.includes(i.def.tier));
        if (boss) p.push(`${capFirst(shortWithArt(boss.def))}: ${plural(boss.lives, 'vida', 'vidas')}`);
        if (this.#enc.endless) p.push(`${this.#enc.practice ? 'Ronda' : 'Oleada'} ${this.#wave}`);
        p.push(this.#bag.length === 1 ? 'Queda 1 enemigo' : `Quedan ${this.#bag.length} enemigos`);
        return p.join('. ') + '.';
    }

    #onSpell(spell) {
        const t = this.#turn;
        if (this.#paused || this.#state !== 'turn' || !t || t.resolved) return;
        this.#stats.spells++;
        this.#d.audio.castSpell(spell.elements, spell.dir);
        this.#ui('cast', spell);
        if (spell.kind === 'unstable') {
            this.#d.audio.fizzle();
            this.#d.speech.say('Demasiados elementos: el hechizo se disipa. Usa uno o dos.');
            return;
        }
        t.resolved = true;
        t.reaction = t.elapsed;
        this.#state = 'resolving';
        const gen = this.#gen;
        this.#sleep(170).then(() => { if (gen === this.#gen) this.#resolve(gen, t, spell); });
    }

    #onTimeout(t) {
        if (t.resolved) return;
        t.resolved = true;
        this.#state = 'resolving';
        const gen = this.#gen;
        if (t.shield) {
            this.#stats.blocks++;
            this.#streak++;
            this.#stats.bestStreak = Math.max(this.#stats.bestStreak, this.#streak);
            this.#addScore(SCORE.shieldBlock * this.#mult);
            this.#d.audio.shieldBlock();
            this.#endTurn(gen, t, 'Resistes el golpe. El escudo cae.');
            return;
        }
        const who = t.mimic ? 'la Sombra' : shortWithArt(t.inst.def);
        const msg = this.#enc.practice ? 'Se acabó el tiempo.' : `¡${capFirst(who)} te ataca!`;
        this.#mistake(gen, t, msg, this.#lesson(t));
    }

    // ── Resolución ──────────────────────────────────────

    #resolve(gen, t, spell) {
        if (t.shield) {
            this.#d.audio.shieldReflect(t.dir);
            this.#mistake(gen, t, '¡El escudo de piedra refleja tu hechizo!', this.#lesson(t));
            return;
        }
        if (spell.dir !== t.dir) {
            this.#d.audio.wrongDir();
            this.#mistake(gen, t, `Fallo de dirección: estaba ${DIRECTIONS[t.dir].name}.`, null);
            return;
        }
        const eff = evaluateSpell(spell, t.profile);
        if (eff.type === 'miss') {
            this.#d.audio.miss(t.dir);
            this.#mistake(gen, t, `${spell.name}: ineficaz.`, this.#lesson(t));
            return;
        }
        if (eff.type === 'cure' || eff.type === 'critcure') {
            this.#d.audio.cure(t.dir);
            t.inst.lives = Math.min(t.inst.maxLives, t.inst.lives + eff.delta);
            const pr = (t.mimic || t.inst.def).art === 'la' || t.mimic ? 'la' : 'lo';
            this.#mistake(gen, t, eff.type === 'critcure' ? `¡${spell.name} ${pr} fortalece muchísimo!` : `¡${spell.name} ${pr} cura!`, this.#lesson(t));
            return;
        }
        this.#success(gen, t, eff);
    }

    async #mistake(gen, t, text, lesson) {
        this.#stats.mistakes++;
        this.#streak = 0;
        this.#mult = 1;
        let msg = text;
        if (lesson && this.#hintsOn()) msg += ' ' + lesson + '.';
        this.#d.onEvent?.('mistake', {});
        if (!this.#enc.practice) {
            this.#lives--;
            this.#stats.damage++;
            this.#d.audio.playerHurt(this.#lives);
            this.#ui('hurt');
            this.#hud();
            if (this.#lives <= 0) { this.#defeat(gen, msg); return; }
            msg += ` Te ${this.#lives === 1 ? 'queda 1 vida' : `quedan ${this.#lives} vidas`}.`;
            this.#updateLowHealth();
        }
        this.#endTurn(gen, t, msg.replace(/\.\./g, '.'));
    }

    async #success(gen, t, eff) {
        const inst = t.inst, crit = eff.type === 'crit';
        const diff = DIFFICULTIES[this.#d.settings.difficulty];
        inst.lives = Math.max(0, inst.lives + eff.delta);
        this.#stats.hits++;
        if (crit) this.#stats.crits++;
        this.#streak++;
        this.#stats.bestStreak = Math.max(this.#stats.bestStreak, this.#streak);
        const prevMult = this.#mult;
        this.#mult = Math.min(CFG.MAX_MULT, 1 + Math.floor(this.#streak / CFG.STREAK_MULT_STEP));
        const killed = inst.lives <= 0;
        const fast = t.reaction <= t.total * 0.4;
        let pts = (crit ? SCORE.crit : SCORE.hit) * this.#mult * (fast ? 1 + SCORE.speedBonus : 1);
        if (killed) pts += SCORE.kill[inst.def.tier] ?? 50;
        this.#addScore(pts);
        this.#d.audio.hit(t.dir, crit);
        this.#ui('hit', { crit, killed });
        if (crit) this.#d.onEvent?.('crit', {});
        this.#d.onEvent?.('streak', { streak: this.#streak });

        let msg = crit ? '¡Crítico! ' : '';
        let healed = false;
        if (!this.#enc.practice && this.#streak % diff.healEvery === 0 && this.#lives < this.#maxLives) {
            this.#lives++;
            healed = true;
            this.#d.audio.heal();
            this.#updateLowHealth();
        }
        if (this.#mult > prevMult) this.#d.audio.streakUp(this.#mult);

        if (killed) {
            this.#stats.kills++;
            this.#bag = this.#bag.filter(i => i !== inst);
            this.#d.audio.kill(t.dir, inst.def.tier);
            this.#d.onEvent?.('kill', { def: inst.def });
            const who = t.mimic ? 'Sombra' : inst.def.short;
            msg += `${capFirst(who)} ${defeatedWord(inst.def)}.`;
            if (inst.main && !this.#enc.endless) {
                this.#bag = [];
                this.#hud();
                this.#victory(gen, msg);
                return;
            }
            const n = this.#bag.length;
            if (n > 0 && (n <= 3 || n % 5 === 0)) msg += n === 1 ? ' Queda 1.' : ` Quedan ${n}.`;
        } else {
            msg += `Le ${inst.lives === 1 ? 'queda 1 vida' : `quedan ${inst.lives} vidas`}.`;
            await this.#checkPhase(gen, inst);
            if (gen !== this.#gen) return;
        }
        if (healed) msg += ' ¡Recuperas una vida!';
        if (this.#mult > prevMult) msg += ` Multiplicador por ${this.#mult}.`;
        this.#endTurn(gen, t, msg);
    }

    async #checkPhase(gen, inst) {
        const mech = MECHANICS[inst.def.mechanic];
        if (!mech?.phases) return;
        const ratio = inst.lives / inst.maxLives;
        for (let i = 0; i < mech.phases.length; i++) {
            const ph = mech.phases[i], phaseNo = i + 2;
            if (inst.st.phase >= phaseNo || ratio > ph.at) continue;
            inst.st.phase = phaseNo;
            inst.st.reactMult = (inst.st.reactMult ?? 1) * (ph.react ?? 1);
            this.#d.music.setIntensity(3);
            this.#d.music.setTempo(1 + 0.06 * (phaseNo - 1));
            this.#d.audio.rage(inst.def.voice);
            this.#d.onEvent?.('phase', { def: inst.def, phase: phaseNo });
            const text = ph.text(this.#enc);
            if (text) {
                const prev = this.#state;
                this.#state = 'narrating';
                await this.#sleep(900);
                if (gen !== this.#gen) return;
                await this.#d.narrate([text], { pitch: ph.pitch ?? 0.7, title: inst.def.name });
                if (!(await this.#checkpoint(gen))) return;
                this.#state = prev;
            }
        }
    }

    async #endTurn(gen, t, msg) {
        if (gen !== this.#gen) return;
        this.#turn = null;
        this.#state = 'between';
        this.#ui('clearEnemy');
        this.#hud();
        const sp = msg ? this.#d.speech.say(msg) : Promise.resolve();
        const mod = this.#enc.modifier ? MODIFIERS[this.#enc.modifier] : null;
        const pace = CFG.PACE_MS * (mod?.pace ?? 1);
        await Promise.race([Promise.all([sp, this.#sleep(pace)]), this.#sleep(pace + CFG.PACE_MAX_EXTRA_MS)]);
        if (!(await this.#checkpoint(gen))) return;
        const inst = t.inst, mech = MECHANICS[inst.def.mechanic];
        if (mech?.afterTurn && inst.lives > 0 && this.#bag.includes(inst)) {
            const p = mech.afterTurn(this.#api, inst, t);
            if (p) {
                await Promise.race([p, this.#sleep(5000)]);
                if (!(await this.#checkpoint(gen))) return;
                await this.#sleep(400);
                if (!(await this.#checkpoint(gen))) return;
            }
        }
        this.#nextTurn(gen);
    }

    async #onBagEmpty(gen) {
        const enc = this.#enc;
        if (!enc.endless) { this.#victory(gen); return; }
        const w = this.#wave;
        let msg = enc.practice ? `Ronda ${w} completada.` : `¡Oleada ${w} superada!`;
        if (!enc.practice) {
            this.#addScore(SCORE.wave * w);
            if (this.#lives < this.#maxLives) {
                this.#lives++;
                this.#d.audio.heal();
                msg += ' Recuperas una vida.';
                this.#updateLowHealth();
            }
        }
        this.#d.onEvent?.('wave', { wave: w });
        if (enc.maxWave && w >= enc.maxWave) {
            // Partida de oleadas contadas (duelos): termina con victoria.
            this.#victory(gen, `¡Oleada ${w} superada! Has completado las ${w} oleadas.`);
            return;
        }
        this.#wave++;
        this.#bag = enc.makeBag(this.#wave);
        this.#d.audio.levelComplete();
        this.#hud();
        this.#state = 'between';
        const desc = enc.waveText ? enc.waveText(this.#wave, this.#bag) : '';
        await Promise.race([Promise.all([this.#d.speech.say(`${msg} ${desc}`), this.#sleep(1500)]), this.#sleep(9000)]);
        if (!(await this.#checkpoint(gen))) return;
        await this.#sleep(500);
        this.#nextTurn(gen);
    }

    async #victory(gen, msg = '') {
        if (gen !== this.#gen) return;
        this.#state = 'ending';
        this.#turn = null;
        this.#d.audio.setHeartbeat(false);
        if (!this.#enc.practice) {
            this.#addScore(SCORE.level);
            if (this.#stats.damage === 0) this.#addScore(SCORE.flawless);
        }
        this.#d.music.setIntensity(1);
        this.#d.music.setTempo(1);
        if (this.#enc.bossFight) this.#d.audio.victory(); else this.#d.audio.levelComplete();
        await Promise.race([Promise.all([this.#d.speech.say(msg), this.#sleep(1800)]), this.#sleep(5000)]);
        if (gen !== this.#gen) return;
        this.#finish('victory');
    }

    async #defeat(gen, msg) {
        this.#state = 'ending';
        this.#turn = null;
        this.#d.audio.setHeartbeat(false);
        this.#d.audio.defeat();
        this.#d.music.stop(2);
        await Promise.race([Promise.all([this.#d.speech.say(`${msg} Has caído.`.replace(/\.\./g, '.')), this.#sleep(2500)]), this.#sleep(7000)]);
        if (gen !== this.#gen) return;
        this.#finish('defeat');
    }

    // ── Puntos, vida e interfaz ─────────────────────────

    #addScore(pts) {
        if (this.#enc.practice) return;
        const diff = DIFFICULTIES[this.#d.settings.difficulty];
        const mod = this.#enc.modifier ? MODIFIERS[this.#enc.modifier] : null;
        this.#score += pts * diff.score * (mod?.score ?? 1);
        this.#hud();
    }

    #updateLowHealth() {
        const low = !this.#enc?.practice && this.#lives === 1 && this.#maxLives > 1 && !this.#paused;
        this.#d.audio.setHeartbeat(low);
    }

    #hud() {
        if (!this.#enc) return;
        const boss = this.#bag.find(i => i.main || BOSS_TIERS.includes(i.def.tier));
        this.#ui('hud', {
            lives: this.#lives, maxLives: this.#maxLives, practice: !!this.#enc.practice,
            score: Math.round(this.#score), streak: this.#streak, mult: this.#mult,
            remaining: this.#bag.length, wave: this.#enc.endless ? this.#wave : null,
            boss: boss ? { name: boss.def.name, lives: boss.lives, max: boss.maxLives } : null,
        });
    }

    #ui(name, data) { try { this.#d.ui?.[name]?.(data); } catch (e) { console.warn('[UI]', e); } }
}
