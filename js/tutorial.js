/* =============================================
   ECOS DE AETHELGARD — tutorial.js
   Entrenamiento guiado, sin tiempo ni daño:
   auriculares, direcciones, elementos, ciclo
   elemental, hechizos simples, dúos y controles.
   ============================================= */
'use strict';

class Tutorial {
    #d;                 // audio, speech, input, settings, ui, confirmExit, onEvent
    #gen = 0;
    #eventWaiter = null;
    #running = false;
    debugExpect = null;   // respuesta esperada (solo para pruebas automáticas)

    constructor(deps) { this.#d = deps; }

    get running() { return this.#running; }

    /** Devuelve una promesa: 'done' si se completa, 'exit' si se abandona. */
    start() {
        this.stop();
        const gen = ++this.#gen;
        this.#running = true;
        const input = this.#d.input;
        input.reset();
        input.handler = {
            onElement: el => { this.#d.audio.elementKey(el); this.#emit({ type: 'element', id: el }); },
            onSpell: s => this.#emit({ type: 'spell', spell: s }),
            onAim: d => this.#emit({ type: 'aim', dir: d }),
            onCommand: c => this.#emit({ type: 'command', id: c }),
        };
        return this.#run(gen).then(ok => {
            if (gen === this.#gen) { this.#running = false; this.#d.input.handler = null; }
            return ok ? 'done' : 'exit';
        });
    }

    stop() {
        this.#gen++;
        this.#running = false;
        const w = this.#eventWaiter;
        this.#eventWaiter = null;
        w?.(null);
    }

    #emit(evt) {
        const w = this.#eventWaiter;
        if (!w) return;
        this.#eventWaiter = null;
        w(evt);
    }

    #nextEvent(gen) {
        if (gen !== this.#gen) return Promise.resolve(null);
        return new Promise(r => { this.#eventWaiter = r; });
    }

    async #say(gen, text) {
        if (gen !== this.#gen || !text) return;
        this.#d.ui?.tutorialText?.(text);
        await this.#d.speech.say(text);
    }

    #wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    #keys() { return KEY_SCHEMES[this.#d.settings.keyScheme] || KEY_SCHEMES.clasico; }

    /**
     * Ejercicio: presenta (texto + sonido) y espera la respuesta correcta.
     * accept(evt) → null (ignorar) · {ok:true, msg} · {ok:false, msg}
     */
    async #exercise(gen, { text, play, accept, target = null, expect = null }) {
        this.debugExpect = expect;
        const present = async () => {
            this.#d.ui?.tutorialTarget?.(target);
            await this.#say(gen, text);
            if (gen === this.#gen) play?.();
        };
        await present();
        while (gen === this.#gen) {
            const evt = await this.#nextEvent(gen);
            if (!evt || gen !== this.#gen) return false;
            if (evt.type === 'command' && evt.id === 'pause') {
                const exit = await this.#d.confirmExit();
                if (exit || gen !== this.#gen) return false;
                await present();
                continue;
            }
            const r = accept(evt);
            if (!r) {
                if (evt.type === 'command') await present();   // Espacio, Enter o H repiten
                continue;
            }
            if (r.ok) {
                this.debugExpect = null;
                this.#d.ui?.tutorialTarget?.(null);
                await this.#say(gen, r.msg || '¡Muy bien!');
                return gen === this.#gen;
            }
            this.#d.audio.uiError();
            await this.#say(gen, r.msg);
            if (gen === this.#gen) play?.();
        }
        return false;
    }

    /** Tramo de explicación: frases seguidas, Espacio no hace falta. */
    async #explain(gen, lines, playAfter = []) {
        for (let i = 0; i < lines.length; i++) {
            if (gen !== this.#gen) return false;
            await this.#say(gen, lines[i]);
            if (playAfter[i]) { playAfter[i](); await this.#wait(1700); }
            await this.#wait(250);
        }
        return gen === this.#gen;
    }

    async #run(gen) {
        const a = this.#d.audio, k = this.#keys();
        const ok = () => gen === this.#gen;

        // 1. Bienvenida y auriculares
        if (!await this.#explain(gen, [
            'Bienvenido al entrenamiento de la Academia de los Ecos. Aquí nada puede hacerte daño y no hay prisa.',
            'Si en algún momento quieres repetir una instrucción, pulsa Espacio. Para salir, pulsa Escape.',
            'Primero, comprueba tus auriculares. Ahora sonará algo a tu izquierda.',
        ])) return false;
        a.playVoice('frog', 'left');
        await this.#wait(1500);
        if (!ok()) return false;
        await this.#say(gen, 'Y ahora, a tu derecha.');
        a.playVoice('frog', 'right');
        await this.#wait(1500);
        if (!await this.#explain(gen, [
            'Si lo has oído al revés, gira tus auriculares. Si solo oyes por un oído, activa el audio mono en Opciones: la voz te dirá siempre la dirección.',
        ])) return false;

        // 2. Direcciones
        if (!await this.#explain(gen, [
            'Los enemigos aparecen en cuatro posiciones. Izquierda y derecha suenan en cada oído, con un chasquido de madera.',
            'Arriba suena más agudo y brillante, y lo anuncia una campanilla.',
            'Abajo suena más grave y apagado, y lo anuncia un golpe sordo.',
        ], [null, () => a.playVoice('golem', 'up'), () => a.playVoice('golem', 'down')])) return false;

        if (!await this.#explain(gen, [
            `Practiquemos. Cuando oigas un sonido, pulsa la flecha de su dirección. Solo la flecha, sin elementos.`,
        ])) return false;
        const dirRounds = [...shuffle(DIR_IDS), ...shuffle(DIR_IDS).slice(0, 2)];
        for (let i = 0; i < dirRounds.length; i++) {
            const dir = dirRounds[i];
            const voice = pick(['golem', 'wolf', 'bat', 'frog']);
            const res = await this.#exercise(gen, {
                text: i === 0 ? 'Escucha.' : pick(['Escucha.', 'Otro.', '¿Y este?', 'Atento.']),
                target: dir, expect: { kind: 'aim', dir },
                play: () => a.playVoice(voice, dir),
                accept: evt => {
                    const got = evt.type === 'aim' ? evt.dir : evt.type === 'spell' ? evt.spell.dir : null;
                    if (!got) return null;
                    if (got === dir) { a.hit(dir); return { ok: true, msg: pick(['¡Bien!', '¡Exacto!', '¡Eso es!', '¡Perfecto!']) }; }
                    return { ok: false, msg: `No: era ${DIRECTIONS[dir].name}. Escucha otra vez.` };
                },
            });
            if (!res) return false;
        }

        // 3. Elementos
        if (!await this.#explain(gen, [
            'Ahora, los elementos. Cada uno tiene su tecla y su sonido.',
        ])) return false;
        for (const el of ELEMENT_IDS) {
            const res = await this.#exercise(gen, {
                text: `Pulsa ${k.spoken[el]}: ${ELEMENTS[el].name}.`, expect: { kind: 'element', id: el },
                accept: evt => {
                    if (evt.type !== 'element') return null;
                    if (evt.id === el) { a.playElement(el); return { ok: true, msg: `${ELEMENTS[el].name}.` }; }
                    return { ok: false, msg: `Esa es ${ELEMENTS[evt.id].name}. Busca la tecla ${k.spoken[el]}.` };
                },
            });
            if (!res) return false;
            await this.#wait(300);
        }

        // 4. Ciclo elemental
        if (!await this.#explain(gen, LORE_EXTRA.cycle.slice(0, 4))) return false;
        const quiz = [
            { q: '¿Qué elemento vence al Fuego? Pulsa su tecla.', a: 'agua' },
            { q: '¿Y a una criatura de Tierra?', a: 'viento' },
            { q: '¿Y a una criatura de Agua?', a: 'tierra' },
            { q: '¿Y a una de Viento?', a: 'fuego' },
        ];
        for (const item of quiz) {
            const res = await this.#exercise(gen, {
                text: item.q, expect: { kind: 'element', id: item.a },
                accept: evt => {
                    if (evt.type !== 'element') return null;
                    if (evt.id === item.a) { a.playElement(evt.id); return { ok: true, msg: `¡Correcto! ${ELEMENTS[item.a].name}.` }; }
                    const victim = ELEMENTS[item.a].beats, art = id => (id === 'tierra' ? 'la' : 'el');
                    return { ok: false, msg: `No. Recuerda: ${art(item.a)} ${ELEMENTS[item.a].name} ${ELEMENTS[item.a].verb} ${art(victim)} ${ELEMENTS[victim].name}. Inténtalo de nuevo.` };
                },
            });
            if (!res) return false;
        }

        // 5. Hechizos simples
        if (!await this.#explain(gen, [
            'Ya puedes lanzar hechizos. Pulsa la tecla del elemento y, enseguida, la flecha hacia el enemigo.',
            'Puedes mantener el elemento pulsado mientras pulsas la flecha, o soltarlo justo antes.',
        ])) return false;
        const guided = [
            { id: 'wolf_fire', dir: 'left', text: `Un Lobo de Fuego a tu izquierda. El Agua apaga el Fuego: pulsa ${k.spoken.agua} y luego ${k.spoken.left}.` },
            { id: 'frog_water', dir: 'right', text: `Una Rana de Agua a tu derecha. La Tierra la detiene: pulsa ${k.spoken.tierra} y luego ${k.spoken.right}.` },
            { id: 'bat_wind', dir: 'up', text: `Un Murciélago de Viento arriba. El Fuego lo doma: pulsa ${k.spoken.fuego} y luego ${k.spoken.up}.` },
            { id: 'golem_earth', dir: 'down', text: `Un Gólem de Tierra abajo. El Viento lo mueve: pulsa ${k.spoken.viento} y luego ${k.spoken.down}.` },
        ];
        for (const g of guided) if (!await this.#spellExercise(gen, g)) return false;

        if (!await this.#explain(gen, ['Ahora sin ayuda. Escucha a la criatura y su posición, y responde.'])) return false;
        for (const id of shuffle(BASICS).slice(0, 3)) {
            const dir = pick(DIR_IDS);
            if (!await this.#spellExercise(gen, { id, dir, text: `${ENEMIES[id].name}, ${DIRECTIONS[dir].name}.` })) return false;
        }

        // 6. Dúos
        if (!await this.#explain(gen, [
            'Las criaturas élite tienen dos elementos y dos debilidades.',
            'Para herirlas de verdad, combina sus dos debilidades: pulsa las dos teclas de elemento a la vez y después la flecha. Es un golpe crítico: quita dos vidas.',
        ])) return false;
        const d1 = pick(DIR_IDS), d2 = pick(DIR_IDS);
        if (!await this.#spellExercise(gen, {
            id: 'magma_elem', dir: d1,
            text: `Un Elemental de Magma, de Fuego y Tierra, ${DIRECTIONS[d1].name}. Es débil al Agua y al Viento. Lanza la Tormenta de Hielo: ${k.spoken.agua} y ${k.spoken.viento} a la vez, y luego ${k.spoken[d1]}.`,
            requireCrit: true,
        })) return false;
        if (!await this.#spellExercise(gen, {
            id: 'storm_spec', dir: d2,
            text: `Un Espectro Tormenta, de Agua y Viento, ${DIRECTIONS[d2].name}. La Tierra vence al Agua y el Fuego vence al Viento. ¿Qué dúo usarás?`,
            requireCrit: true,
        })) return false;

        // 7. Controles y consejos
        if (!await this.#explain(gen, [
            'Durante el combate tienes un tiempo limitado para responder. Cuando se esté acabando, oirás un tic-tac cada vez más rápido.',
        ])) return false;
        for (let i = 0; i < 8; i++) { a.tick(i / 8); await this.#wait(420 - i * 35); }
        if (!await this.#explain(gen, [
            'Si se agota el tiempo, el enemigo te ataca. Cada error te quita una vida.',
            'Cada cinco aciertos seguidos sube tu multiplicador de puntos, y las rachas largas te devuelven vidas.',
            'Espacio repite el enemigo actual. H te da una pista sobre su debilidad. Escape pausa el juego.',
        ])) return false;
        if (!await this.#exercise(gen, {
            text: 'Y Enter te dice tus vidas y tus puntos. Pulsa Enter ahora.', expect: { kind: 'command', id: 'status' },
            accept: evt => (evt.type === 'command' && evt.id === 'status')
                ? { ok: true, msg: 'Así siempre sabrás cómo vas. En la Biblioteca puedes volver a escuchar a todas las criaturas, y en la Práctica libre puedes entrenar sin perder vidas.' }
                : null,
        })) return false;
        await this.#say(gen, 'Entrenamiento completado. Ya eres un invocador de la Academia. Que los ecos te guíen.');
        return ok();
    }

    async #spellExercise(gen, { id, dir, text, requireCrit = false }) {
        const a = this.#d.audio, def = ENEMIES[id], profile = profileOf(def);
        const best = def.critHit ? dualByName(def.critHit).elements : [def.weak[0]];
        return this.#exercise(gen, {
            text, target: dir, expect: { kind: 'spell', elements: best, dir },
            play: () => a.playVoice(def.voice, dir),
            accept: evt => {
                if (evt.type === 'aim') return { ok: false, msg: 'Falta el elemento. Pulsa primero la tecla del elemento y, enseguida, la flecha.' };
                if (evt.type !== 'spell') return null;
                const s = evt.spell;
                a.castSpell(s.elements, s.dir);
                if (s.kind === 'unstable') { a.fizzle(); return { ok: false, msg: 'Demasiados elementos a la vez. Usa uno o dos.' }; }
                if (s.dir !== dir) return { ok: false, msg: `${s.name} hacia ${s.dirName}, pero estaba ${DIRECTIONS[dir].name}. Otra vez.` };
                const eff = evaluateSpell(s, profile);
                if (eff.type === 'crit') { a.hit(dir, true); a.kill(dir, def.tier); return { ok: true, msg: `¡Crítico! ${s.name} lo destroza.` }; }
                if (eff.type === 'hit') {
                    if (requireCrit) { a.hit(dir); return { ok: false, msg: `Le haces daño, pero no es crítico. Combina sus dos debilidades: ${def.critHit}, ${elementNames(dualByName(def.critHit).elements)} a la vez.` }; }
                    a.hit(dir); a.kill(dir, def.tier);
                    return { ok: true, msg: pick(['¡Derrotado!', '¡Muy bien!', '¡Impacto perfecto!']) };
                }
                if (eff.type === 'cure' || eff.type === 'critcure') { a.cure(dir); return { ok: false, msg: `¡Cuidado! ${s.name} lo cura: tiene ese elemento. ${weaknessText(profile)}` }; }
                a.miss(dir);
                return { ok: false, msg: `${s.name} no le hace nada. ${weaknessText(profile)}` };
            },
        });
    }
}
