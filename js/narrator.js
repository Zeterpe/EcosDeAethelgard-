/* =============================================
   ECOS DE AETHELGARD — narrator.js
   Narración grabada de la historia (generada con
   tools/generar-narracion.mjs). Cada personaje
   suena con su propio efecto:
     narrador  · voz cálida con eco de catedral
     eco       · grabación antigua (Sylvara, Tomás, Aldara)
     avatar    · voz grave con coro inquietante
     guardian  · susurro espectral
     furia     · grito distorsionado
   Los audios se descargan y se reproducen con Web Audio
   (sin elementos <audio>, que los móviles bloquean y
   limitan). Si un audio falta, no carga o el sonido está
   bloqueado, ese párrafo se lee con la voz del sistema:
   la historia nunca se queda en silencio.
   ============================================= */
'use strict';

/** Mismo hash que tools/generar-narracion.mjs. */
function narrationHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Cambia la velocidad de un audio de voz sin cambiar su tono (WSOLA:
 * se solapan trozos de 40 ms buscando el punto en que encajan mejor).
 * rate puede ser un número o una función rate(muestra) para variarla
 * a lo largo del audio (por ejemplo, más deprisa en las pausas).
 */
function timeStretch(ctx, buffer, rate) {
    const fixed = typeof rate === 'number';
    if (fixed && Math.abs(rate - 1) < 0.01) return buffer;
    const rateAt = fixed ? () => rate : rate;
    const sr = buffer.sampleRate, input = buffer.getChannelData(0);
    const N = Math.round(sr * 0.04) & ~1, Hs = N >> 1;
    const tol = Math.round(sr * 0.012), L = Hs;
    const win = new Float32Array(N);
    for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
    const out = new Float32Array(Math.ceil(input.length * 3.2) + 2 * N);   // las velocidades nunca bajan de 1/3
    let prev = 0, pos = 0, k = 0;
    for (;;) {
        const nominal = Math.round(pos);
        if (nominal + N + tol >= input.length) break;
        let best = nominal;
        let energy = 0;
        for (let j = 0; j < N; j += 16) energy += input[nominal + j] * input[nominal + j];
        if (k > 0 && energy > 1e-6) {          // en los silencios no hace falta buscar
            // Busca el desplazamiento que mejor continúa el trozo anterior.
            const natural = prev + Hs;
            let bestScore = -Infinity;
            const lo = Math.max(0, nominal - tol), hi = Math.min(input.length - N, nominal + tol);
            for (let c = lo; c <= hi; c += 3) {
                let dot = 0, en = 1e-9;
                for (let j = 0; j < L; j += 4) {
                    const v = input[c + j];
                    dot += v * input[natural + j];
                    en += v * v;
                }
                const score = dot / Math.sqrt(en);
                if (score > bestScore) { bestScore = score; best = c; }
            }
        }
        const o = k * Hs;
        for (let i = 0; i < N; i++) out[o + i] += input[best + i] * win[i];
        prev = best;
        k++;
        pos += Hs * rateAt(nominal);
    }
    const len = Math.max(1, k * Hs + N);
    const res = ctx.createBuffer(1, len, sr);
    res.getChannelData(0).set(out.subarray(0, len));
    return res;
}

/** Marca en tramos de 10 ms dónde hay pausa (silencio de 80 ms o más). */
function findPauses(buffer) {
    const sr = buffer.sampleRate, x = buffer.getChannelData(0);
    const hop = Math.round(sr * 0.01), n = Math.max(1, Math.ceil(x.length / hop));
    const rms = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        const a = i * hop, b = Math.min(x.length, a + hop);
        for (let j = a; j < b; j++) sum += x[j] * x[j];
        rms[i] = Math.sqrt(sum / Math.max(1, b - a));
    }
    const loud = Array.from(rms).sort((p, q) => p - q)[Math.floor(n * 0.9)] || 0;
    const thr = Math.max(0.003, loud * 0.08);
    const pause = new Uint8Array(n);
    for (let i = 0; i < n;) {
        if (rms[i] >= thr) { i++; continue; }
        let j = i;
        while (j < n && rms[j] < thr) j++;
        if (j - i >= 8) pause.fill(1, i, j);
        i = j;
    }
    return { hop, n, pause };
}

/**
 * Recorta los silencios largos (Azure deja hasta un segundo entre frases)
 * a maxMs como mucho. Solo se quita aire: la voz no se toca.
 */
function trimPauses(ctx, buffer, maxMs = 400) {
    const sr = buffer.sampleRate, x = buffer.getChannelData(0);
    const { hop, n, pause } = findPauses(buffer);
    const keep = Math.round(maxMs / 10), fade = Math.round(sr * 0.005);
    const cuts = [];                                   // [desde, hasta) en muestras
    for (let i = 0; i < n;) {
        if (!pause[i]) { i++; continue; }
        let j = i;
        while (j < n && pause[j]) j++;
        if (j - i > keep) {
            const a = (i + Math.floor(keep / 2)) * hop, b = Math.min(x.length, (j - Math.ceil(keep / 2)) * hop);
            if (b > a) cuts.push([a, b]);
        }
        i = j;
    }
    if (!cuts.length) return buffer;
    const removed = cuts.reduce((t, [a, b]) => t + (b - a), 0);
    const out = new Float32Array(x.length - removed);
    const joins = [];
    let o = 0, from = 0;
    for (const [a, b] of cuts) {
        out.set(x.subarray(from, a), o);
        o += a - from;
        joins.push(o);
        from = b;
    }
    out.set(x.subarray(from), o);
    for (const j of joins) {                           // fundidos de 5 ms en cada corte (todo es silencio)
        for (let k = 0; k < fade; k++) {
            const g = k / fade;
            if (j - 1 - k >= 0) out[j - 1 - k] *= g;
            if (j + k < out.length) out[j + k] *= g;
        }
    }
    const res = ctx.createBuffer(1, out.length, sr);
    res.getChannelData(0).set(out);
    return res;
}

/**
 * Cambia la velocidad de una narración tocando sobre todo las pausas:
 * primero recorta los silencios demasiado largos y, si además hay que ir
 * más deprisa, acorta mucho las pausas y la voz solo un poco; para ir más
 * despacio, al revés. Así la voz casi no se deforma y el tono no cambia.
 * f: velocidad respecto a la grabación (1 = tal cual, salvo los silencios largos).
 */
function paceStretch(ctx, buffer, f) {
    const base = trimPauses(ctx, buffer, 400);
    if (Math.abs(f - 1) < 0.01) return base;
    if (f < 1) {
        // Para ir más despacio se dejan las pausas algo más largas (la duración final es la misma):
        // así la voz se estira menos.
        const roomy = trimPauses(ctx, buffer, Math.round(400 / Math.sqrt(f)));
        f *= roomy.length / base.length;
        buffer = roomy;
    } else buffer = base;
    const { hop, n, pause } = findPauses(buffer);
    let Ts = 0;
    for (let i = 0; i < n; i++) Ts += pause[i];
    const Tv = n - Ts, target = n / f;
    let fv = f >= 1 ? Math.pow(f, 0.6) : Math.pow(f, 0.5);   // la voz cambia poco…
    let fs = fv;
    if (Ts > 0) {                                             // …y las pausas compensan el resto
        const rest = target - Tv / fv;
        fs = rest > 0 ? Ts / rest : 4;
        fs = clamp(fs, 1 / 3, 4);
        if (Tv > 0) { const r2 = target - Ts / fs; if (r2 > 0) fv = Tv / r2; }
    }
    fv = clamp(fv, 0.5, 2.2);
    const rate = new Float32Array(n);
    for (let i = 0; i < n; i++) {                            // suavizado de 70 ms para no dar saltos
        let sum = 0, c = 0;
        for (let d = -3; d <= 3; d++) { const m = i + d; if (m >= 0 && m < n) { sum += pause[m] ? fs : fv; c++; } }
        rate[i] = sum / c;
    }
    return timeStretch(ctx, buffer, sample => rate[Math.min(n - 1, Math.floor(sample / hop))]);
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
    #buffers = new Map();     // archivo@velocidad → Promise<AudioBuffer>
    #cancelTts = null;
    #failures = 0;            // fallos seguidos
    #broken = false;          // tras varios fallos, se usa la voz del sistema
    #brokenBySound = false;   // el fallo era el sonido bloqueado (se recupera con un gesto)
    lastError = '';
    history = [];             // últimos audios reproducidos (para depurar)

    constructor(audio, settings) {
        this.#audio = audio;
        this.#settings = settings;
    }

    get playing() { return this.#playing; }
    /** Velocidad de la historia a la que se grabaron los audios (la del manifiesto; los antiguos, 1). */
    get nativeRate() { return this.#manifest?.ritmo || 1; }
    get available() { return !!this.#manifest && !this.#broken; }
    get broken() { return this.#broken; }

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
     * offset: los párrafos son solo un tramo de la sección, a partir de ese índice
     * (sin él, deben ser la sección entera).
     */
    plan(key, paragraphs, offset = null) {
        if (!key || !this.available || this.#settings.storyVoice === 'sistema' || !this.#audio.ready) return null;
        const sec = this.#manifest.secciones[key];
        const from = offset ?? 0;
        if (!sec || (offset === null ? sec.length !== paragraphs.length : from + paragraphs.length > sec.length)) return null;
        const plan = paragraphs.map((p, i) => (sec[from + i] && sec[from + i].h === narrationHash(p) ? sec[from + i].s : null));
        return plan.some(Boolean) ? plan : null;
    }

    /**
     * Narra los párrafos. tts(texto) lee un párrafo con la voz del sistema
     * (para los que no estén grabados o no se puedan reproducir). Devuelve true si terminó.
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
                const segs = this.#broken ? null : plan[i];
                let spoken = false;
                if (segs) {
                    try {
                        for (let j = 0; j < segs.length; j++) {
                            if (!alive() || this.#skipPara) break;
                            this.#prefetchFrom(plan, i, j + 1);
                            await this.#playSegment(segs[j], alive);
                        }
                        this.#failures = 0;
                        spoken = true;
                    } catch (e) {
                        this.lastError = String(e && e.message || e);
                        if (++this.#failures >= 3) { this.#broken = true; this.#brokenBySound = !!(e && e.sound); }
                    }
                }
                if (!spoken && tts && alive() && !this.#skipPara) await tts(paragraphs[i]);
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
        if (!this.available || !this.#audio.ready) return false;
        const seg = Object.values(this.#manifest.secciones).flat().flatMap(p => p.s).find(s => s.v === 'narrador');
        if (!seg) return false;
        this.skipAll();
        const token = ++this.#token;
        const alive = () => token === this.#token;
        this.#playing = true;
        this.#audio.setVoiceDuck(true);
        const stop = setTimeout(() => { if (alive()) this.skipAll(); }, seconds * 1000);
        this.#playSegment(seg, alive).catch(e => { this.lastError = String(e && e.message || e); }).finally(() => {
            clearTimeout(stop);
            if (alive()) { this.#playing = false; this.#audio.setVoiceDuck(false); }
        });
        return true;
    }

    /** Comprueba paso a paso si la narración grabada puede sonar en este navegador. */
    async diagnose() {
        const r = { manifest: false, sections: 0, paragraphs: 0, sound: this.#audio.ctx?.state || 'sin iniciar', broken: this.#broken, lastError: this.lastError };
        await this.load();
        if (!this.#manifest) {
            try {
                const res = await fetch(this.#base + 'manifest.json', { cache: 'no-store' });
                r.manifestStatus = res.status;
            } catch (e) { r.manifestStatus = String(e && e.message || e); }
            return r;
        }
        r.manifest = true;
        r.sections = Object.keys(this.#manifest.secciones).length;
        r.paragraphs = Object.values(this.#manifest.secciones).reduce((n, s) => n + s.length, 0);
        const seg = Object.values(this.#manifest.secciones).flat().flatMap(p => p.s).find(s => s.v === 'narrador');
        r.file = seg?.f;
        if (!seg) return r;
        try {
            const res = await fetch(this.#url(seg.f), { cache: 'no-store' });
            r.http = res.status;
            r.type = res.headers.get('content-type') || '';
            if (!res.ok) return { ...r, running: await this.#ensureRunning(), sound: this.#audio.ctx?.state || 'sin iniciar' };
            const data = await res.arrayBuffer();
            r.bytes = data.byteLength;
            if (this.#audio.ctx) {
                const b = await this.#decode(data);
                r.seconds = Math.round(b.duration * 10) / 10;
            }
        } catch (e) {
            const m = String(e && e.message || e);
            r.error = /decode/i.test(m) ? `el navegador no pudo leer el archivo de audio (${r.type || 'tipo desconocido'})` : m;
        }
        r.running = await this.#ensureRunning();
        r.sound = this.#audio.ctx?.state || 'sin iniciar';
        return r;
    }

    /** Tras un gesto del jugador: si el problema era el sonido bloqueado y ya funciona, se vuelve a intentar. */
    recover() {
        if (this.#broken && this.#brokenBySound && this.#audio.ctx?.state === 'running') {
            this.#broken = false;
            this.#failures = 0;
        }
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

    // ── Carga ───────────────────────────────────────────

    /** Velocidad de reproducción respecto a la grabación (1 = tal cual se grabó). */
    #rate() { return Math.round((clamp(this.#settings.storyRate || 1.5, 0.8, 2) / this.nativeRate) * 20) / 20; }

    #decode(data) {
        const ctx = this.#audio.ctx;
        return new Promise((resolve, reject) => {
            const r = ctx.decodeAudioData(data, resolve, reject);   // Safari antiguo solo admite callbacks
            if (r && typeof r.then === 'function') r.then(resolve, reject);
        });
    }

    #cached(key, make) {
        let p = this.#buffers.get(key);
        if (p) { this.#buffers.delete(key); this.#buffers.set(key, p); return p; }   // más reciente al final
        p = make();
        this.#buffers.set(key, p);
        p.catch(() => this.#buffers.delete(key));
        while (this.#buffers.size > 14) this.#buffers.delete(this.#buffers.keys().next().value);
        return p;
    }

    /** La huella del audio en la URL: si se vuelve a generar, el navegador no usa la copia vieja. */
    #url(file) {
        const v = this.#manifest?.cache?.[file];
        return this.#base + file + (v ? `?v=${v}` : '');
    }

    #raw(file) {
        return this.#cached(file, () => fetch(this.#url(file))
            .then(r => { if (!r.ok) throw new Error(`No se pudo descargar ${file} (HTTP ${r.status})`); return r.arrayBuffer(); })
            .then(data => this.#decode(data)));
    }

    #bufferFor(file, rate = this.#rate()) {
        return this.#cached(`${file}@${rate}`, () => this.#raw(file).then(b => paceStretch(this.#audio.ctx, b, rate)));
    }

    #prefetchFrom(plan, i, j) {
        // Prepara los dos fragmentos siguientes para que no haya silencios.
        let n = 0;
        for (let a = i; a < plan.length && n < 2; a++) {
            const segs = plan[a] || [];
            for (let b = a === i ? j : 0; b < segs.length && n < 2; b++, n++) this.#bufferFor(segs[b].f).catch(() => { });
        }
    }

    /** El sonido del navegador debe estar en marcha (los móviles lo pausan). */
    async #ensureRunning() {
        const ctx = this.#audio.ctx;
        if (!ctx) return false;
        if (ctx.state === 'running') return true;
        try { await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 1500))]); } catch (_) { /* nada */ }
        return ctx.state === 'running';
    }

    // ── Reproducción ────────────────────────────────────

    async #playSegment(seg, alive) {
        const buf = await Promise.race([
            this.#bufferFor(seg.f),
            new Promise((_, rej) => setTimeout(() => rej(new Error(`${seg.f} tarda demasiado en cargar`)), 12000)),
        ]);
        if (!alive() || this.#skipPara) return;
        if (!(await this.#ensureRunning())) throw Object.assign(new Error('El sonido del navegador está bloqueado'), { sound: true });
        if (!alive() || this.#skipPara) return;
        const ctx = this.#audio.ctx;
        await new Promise((resolve, reject) => {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(this.#chain(seg.e).input);
            const extra = seg.e === 'eco' ? this.#crackle() : null;
            let done = false, iv = null, guard = null, stalled = 0;
            const finish = (err = null) => {
                if (done) return;
                done = true;
                clearInterval(iv);
                clearTimeout(guard);
                src.onended = null;
                try { src.stop(); } catch (_) { /* ya parado */ }
                try { src.disconnect(); } catch (_) { /* nada */ }
                extra?.stop();
                if (this.#current?.finish === finish) this.#current = null;
                if (err) reject(err); else resolve();
            };
            this.#current = { finish: () => finish() };
            src.onended = () => finish();
            iv = setInterval(() => {
                if (!alive() || this.#skipPara) { finish(); return; }
                // Si el sistema pausa el sonido a mitad (llamada, otra app…), se sigue con la voz del sistema.
                stalled = ctx.state === 'running' ? 0 : stalled + 1;
                if (stalled > 12) finish(Object.assign(new Error('El sonido se ha detenido'), { sound: true }));
            }, 80);
            guard = setTimeout(() => finish(), buf.duration * 1000 + 2500);
            src.start();
            this.history.push(seg.f);
            if (this.history.length > 100) this.history.shift();
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

    /** Chisporroteo de disco antiguo bajo las grabaciones del pasado. */
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
