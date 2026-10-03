/* =============================================
   ECOS DE AETHELGARD — narrator.js
   Narración grabada de la historia (generada con
   tools/generar-narracion.mjs). Cada personaje
   suena con su propio efecto:
     narrador  · voz cálida con eco de catedral
     eco       · grabación antigua (Sylvara, Tomás)
     avatar    · voz grave con coro inquietante
     guardian  · susurro espectral
     furia     · grito distorsionado
   Si falta un audio o el texto ha cambiado, ese
   párrafo se lee con la voz del sistema.
   ============================================= */
'use strict';

/** Mismo hash que tools/generar-narracion.mjs. */
function narrationHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
}

class Narrator {
    #audio; #settings;
    #base = 'audio/narracion/';
    #manifest = null; #loadP = null;
    #chains = null;
    #token = 0;
    #skipPara = false;
    #playing = false;
    #current = null;          // { finish }
    #prefetch = new Map();    // archivo → <audio> precargado
    #cancelTts = null;

    constructor(audio, settings) {
        this.#audio = audio;
        this.#settings = settings;
    }

    get playing() { return this.#playing; }
    get available() { return !!this.#manifest; }

    /** Carga el manifiesto una vez. Sin audios (o abriendo el juego como archivo) devuelve false. */
    load() {
        if (this.#loadP) return this.#loadP;
        this.#loadP = fetch(this.#base + 'manifest.json', { cache: 'no-cache' })
            .then(r => (r.ok ? r.json() : null))
            .then(m => { this.#manifest = m && m.secciones && Object.keys(m.secciones).length ? m : null; return !!this.#manifest; })
            .catch(() => false);
        return this.#loadP;
    }

    /**
     * Plan de una sección: por cada párrafo, sus fragmentos grabados,
     * o null si ese párrafo debe leerlo la voz del sistema.
     * Devuelve null si no hay nada grabado que usar.
     */
    plan(key, paragraphs) {
        if (!key || !this.#manifest || this.#settings.storyVoice === 'sistema' || !this.#audio.ready) return null;
        const sec = this.#manifest.secciones[key];
        if (!sec || sec.length !== paragraphs.length) return null;
        const plan = paragraphs.map((p, i) => (sec[i] && sec[i].h === narrationHash(p) ? sec[i].s : null));
        return plan.some(Boolean) ? plan : null;
    }

    /**
     * Narra los párrafos. tts(texto) lee un párrafo con la voz del sistema
     * (para los que no estén grabados). Devuelve true si terminó.
     */
    async play(paragraphs, plan, { onParagraph = null, gap = 600, tts = null, cancelTts = null } = {}) {
        const token = ++this.#token;
        const alive = () => token === this.#token;
        this.#cancelTts = cancelTts;
        this.#playing = true;
        this.#audio.setVoiceDuck(true);
        this.#prefetchFrom(plan, 0, 0);
        try {
            for (let i = 0; i < paragraphs.length; i++) {
                if (!alive()) return false;
                this.#skipPara = false;
                onParagraph?.(paragraphs[i], i, paragraphs.length);
                const segs = plan[i];
                if (segs) {
                    for (let j = 0; j < segs.length; j++) {
                        if (!alive() || this.#skipPara) break;
                        this.#prefetchFrom(plan, i, j + 1);
                        await this.#playSegment(segs[j], alive);
                    }
                } else if (tts) {
                    await tts(paragraphs[i]);
                }
                if (!alive()) return false;
                if (!this.#skipPara) await this.#wait(gap, () => !alive() || this.#skipPara);
            }
            return alive();
        } finally {
            if (token === this.#token) {
                this.#playing = false;
                this.#audio.setVoiceDuck(false);
            }
        }
    }

    /**
     * Reproduce unos segundos del narrador a la velocidad elegida (para las opciones).
     * Devuelve false si no hay narración grabada que enseñar.
     */
    preview(seconds = 8) {
        if (!this.#manifest || !this.#audio.ready) return false;
        const seg = Object.values(this.#manifest.secciones).flat().flatMap(p => p.s).find(s => s.v === 'narrador');
        if (!seg) return false;
        this.skipAll();
        const token = ++this.#token;
        const alive = () => token === this.#token;
        this.#playing = true;
        this.#audio.setVoiceDuck(true);
        const stop = setTimeout(() => { if (alive()) this.skipAll(); }, seconds * 1000);
        this.#playSegment(seg, alive).finally(() => {
            clearTimeout(stop);
            if (alive()) { this.#playing = false; this.#audio.setVoiceDuck(false); }
        });
        return true;
    }

    skipParagraph() {
        this.#skipPara = true;
        this.#current?.finish();
        this.#cancelTts?.();
    }

    skipAll() {
        this.#token++;
        this.#playing = false;
        this.#current?.finish();
        this.#cancelTts?.();
        this.#audio.setVoiceDuck(false);
    }

    // ── Reproducción ────────────────────────────────────

    #element(file) {
        const pre = this.#prefetch.get(file);
        if (pre) { this.#prefetch.delete(file); return pre; }
        const el = new Audio(this.#base + file);
        el.preload = 'auto';
        return el;
    }

    #prefetchFrom(plan, i, j) {
        // Precarga los dos siguientes fragmentos para que no haya silencios.
        let n = 0;
        for (let a = i; a < plan.length && n < 2; a++) {
            const segs = plan[a] || [];
            for (let b = a === i ? j : 0; b < segs.length && n < 2; b++, n++) {
                const f = segs[b].f;
                if (!this.#prefetch.has(f)) {
                    const el = new Audio(this.#base + f);
                    el.preload = 'auto';
                    this.#prefetch.set(f, el);
                }
            }
        }
        if (this.#prefetch.size > 6) {
            const first = this.#prefetch.keys().next().value;
            this.#prefetch.delete(first);
        }
    }

    #playSegment(seg, alive) {
        return new Promise(resolve => {
            const ctx = this.#audio.ctx;
            const el = this.#element(seg.f);
            el.playbackRate = clamp(this.#settings.storyRate || 1, 0.6, 2);
            el.preservesPitch = true;
            let src;
            try { src = ctx.createMediaElementSource(el); } catch (_) { src = null; }
            const chain = this.#chain(seg.e);
            if (src) src.connect(chain.input);
            const extra = seg.e === 'eco' ? this.#crackle() : null;
            let done = false, iv = null, guard = null;
            const finish = () => {
                if (done) return;
                done = true;
                clearInterval(iv);
                clearTimeout(guard);
                el.onended = el.onerror = null;
                try { el.pause(); } catch (_) { /* nada */ }
                try { src?.disconnect(); } catch (_) { /* nada */ }
                extra?.stop();
                if (this.#current?.finish === finish) this.#current = null;
                resolve();
            };
            this.#current = { finish };
            el.onended = finish;
            el.onerror = finish;
            iv = setInterval(() => { if (!alive() || this.#skipPara) finish(); }, 80);
            // Red de seguridad por si el navegador no avisa del final.
            el.addEventListener('loadedmetadata', () => {
                if (isFinite(el.duration)) guard = setTimeout(finish, (el.duration / el.playbackRate) * 1000 + 3000);
            }, { once: true });
            const p = el.play();
            if (p && p.catch) p.catch(finish);
        });
    }

    #wait(ms, cancelled) {
        return new Promise(resolve => {
            const start = performance.now();
            const iv = setInterval(() => {
                if (cancelled() || performance.now() - start >= ms) { clearInterval(iv); resolve(); }
            }, 50);
        });
    }

    // ── Efectos por personaje ──────────────────────────

    #chain(effect) {
        if (!this.#chains) this.#chains = this.#buildChains();
        return this.#chains[effect] || this.#chains.narrador;
    }

    #buildChains() {
        const c = this.#audio.ctx, out = this.#audio.voiceBus;
        const gain = v => { const g = c.createGain(); g.gain.value = v; return g; };
        const filter = (type, f, q = 0.7, g = 0) => { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; n.gain.value = g; return n; };
        const delay = (t, fb, wet) => {
            const d = c.createDelay(2); d.delayTime.value = t;
            const f = gain(fb), w = gain(wet);
            d.connect(f); f.connect(d); d.connect(w);
            return { input: d, output: w };
        };
        const connectAll = (...nodes) => { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); };
        const shaper = amount => {
            const n = c.createWaveShaper(), k = 1024, curve = new Float32Array(k);
            for (let i = 0; i < k; i++) { const x = i * 2 / k - 1; curve[i] = (1 + amount) * x / (1 + amount * Math.abs(x)); }
            n.curve = curve;
            return n;
        };
        const chains = {};

        // Narrador: cálido, cercano, con la cola de una catedral.
        {
            const input = gain(1), warm = filter('lowshelf', 220, 0.7, 3), air = filter('highshelf', 6000, 0.7, 1.5);
            const rev = this.#audio.makeReverb('nar-hall', 2.8, 2.4), send = gain(0.2);
            connectAll(input, warm, air, out);
            air.connect(send); send.connect(rev); rev.connect(out);
            chains.narrador = { input };
        }
        // Eco del pasado: grabación antigua que resuena.
        {
            const input = gain(1), hp = filter('highpass', 320, 0.7), lp = filter('lowpass', 3600, 0.7), mid = filter('peaking', 1500, 1, 4);
            const sat = shaper(1.5), level = gain(0.5);
            const echo = delay(0.36, 0.3, 0.26);
            const rev = this.#audio.makeReverb('nar-room', 1.6, 3), send = gain(0.25);
            connectAll(input, hp, lp, mid, sat, level, out);
            level.connect(echo.input); echo.output.connect(out);
            level.connect(send); send.connect(rev); rev.connect(out);
            chains.eco = { input };
        }
        // Avatar: grave, con un coro desafinado y una caverna inmensa.
        {
            const input = gain(1), low = filter('lowshelf', 160, 0.7, 6), dry = gain(0.85);
            const cho = c.createDelay(0.1); cho.delayTime.value = 0.024;
            const lfo = c.createOscillator(), depth = gain(0.006);
            lfo.frequency.value = 0.35; lfo.connect(depth); depth.connect(cho.delayTime); lfo.start();
            const choLp = filter('lowpass', 2200, 0.7), choG = gain(0.5);
            const rev = this.#audio.makeReverb('nar-cave', 4.2, 2), send = gain(0.55);
            connectAll(input, low, dry, out);
            low.connect(cho); connectAll(cho, choLp, choG, out);
            low.connect(send); send.connect(rev); rev.connect(out);
            chains.avatar = { input };
        }
        // Guardianes liberados: susurro espectral que flota.
        {
            const input = gain(1), hp = filter('highpass', 140, 0.7), dry = gain(0.8);
            const echo = delay(0.42, 0.32, 0.22);
            const rev = this.#audio.makeReverb('nar-spirit', 3.6, 2.2), send = gain(0.65);
            connectAll(input, hp, dry, out);
            hp.connect(echo.input); echo.output.connect(out);
            hp.connect(send); send.connect(rev); rev.connect(out);
            chains.guardian = { input };
        }
        // Furia: grito saturado y doblado.
        {
            const input = gain(1), sat = shaper(3), low = filter('lowshelf', 200, 0.7, 5), dry = gain(0.38);
            const dbl = c.createDelay(0.1); dbl.delayTime.value = 0.017;
            const dblG = gain(0.22);
            const rev = this.#audio.makeReverb('nar-hall', 2.8, 2.4), send = gain(0.3);
            connectAll(input, sat, low, dry, out);
            low.connect(dbl); connectAll(dbl, dblG, out);
            low.connect(send); send.connect(rev); rev.connect(out);
            chains.furia = { input };
        }
        return chains;
    }

    /** Chisporroteo de disco antiguo bajo las grabaciones de Sylvara y Tomás. */
    #crackle() {
        const c = this.#audio.ctx, kit = this.#audio.kit;
        const src = c.createBufferSource();
        src.buffer = kit.buf.crackle;
        src.loop = true;
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
        const g = c.createGain(); g.gain.value = 0.05;
        src.connect(hp); hp.connect(g); g.connect(this.#audio.voiceBus);
        src.start(c.currentTime, Math.random());
        return { stop: () => { try { src.stop(); src.disconnect(); g.disconnect(); } catch (_) { /* nada */ } } };
    }
}
