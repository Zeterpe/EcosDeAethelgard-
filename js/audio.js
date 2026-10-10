/* =============================================
   ECOS DE AETHELGARD — audio.js
   Motor de sonido 100 % sintetizado (Web Audio API):
   · Voz única para cada criatura y cada guardián.
   · Posición: izquierda/derecha por panorama estéreo;
     arriba = campanilla aguda y timbre brillante;
     abajo = golpe grave y timbre apagado.
   · Firmas elementales, hechizos que viajan hacia
     su objetivo, efectos de impacto, interfaz, latido.
   ============================================= */
'use strict';

function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

// ═══════════════════════════════════════════════════════
// SynthKit: primitivas de síntesis (sirve también con
// OfflineAudioContext para pruebas).
// ═══════════════════════════════════════════════════════

class SynthKit {
    constructor(ctx) {
        this.ctx = ctx;
        this.buf = SynthKit.makeBuffers(ctx);
        this._curves = {};
    }

    static makeBuffers(ctx) {
        const sr = ctx.sampleRate, len = Math.floor(sr * 2);
        const mk = () => ctx.createBuffer(1, len, sr);
        const white = mk(), pink = mk(), brown = mk(), crackle = mk();
        const w = white.getChannelData(0), p = pink.getChannelData(0);
        const b = brown.getChannelData(0), c = crackle.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
        for (let i = 0; i < len; i++) {
            const x = Math.random() * 2 - 1;
            w[i] = x;
            b0 = 0.99886 * b0 + x * 0.0555179; b1 = 0.99332 * b1 + x * 0.0750759;
            b2 = 0.96900 * b2 + x * 0.1538520; b3 = 0.86650 * b3 + x * 0.3104856;
            b4 = 0.55000 * b4 + x * 0.5329522; b5 = -0.7616 * b5 - x * 0.0168980;
            p[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * 0.5362) * 0.11;
            b6 = x * 0.115926;
            last = (last + 0.02 * x) / 1.02;
            b[i] = last * 3.5;
        }
        // Chisporroteo: impulsos dispersos con decaimiento corto.
        let i = 0;
        while (i < len) {
            i += Math.floor(sr * (0.004 + Math.random() * 0.05));
            const amp = Math.pow(Math.random(), 2) * (Math.random() < 0.5 ? -1 : 1);
            const n = Math.floor(sr * (0.0005 + Math.random() * 0.002));
            for (let k = 0; k < n && i + k < len; k++) c[i + k] += amp * (1 - k / n) * (Math.random() * 2 - 1);
        }
        return { white, pink, brown, crackle };
    }

    /** Programa un parámetro: número fijo o trayectoria [[dt, valor], ...]. */
    path(param, t, spec, mode = 'exp') {
        if (typeof spec === 'number') { param.setValueAtTime(spec, t); return; }
        param.setValueAtTime(spec[0][1], t + spec[0][0]);
        for (let i = 1; i < spec.length; i++) {
            const [dt, v] = spec[i];
            if (mode === 'exp' && v > 0 && spec[i - 1][1] > 0) param.exponentialRampToValueAtTime(v, t + dt);
            else param.linearRampToValueAtTime(v, t + dt);
        }
    }

    _end(t, o) {
        const a = o.a ?? 0.005, r = o.r ?? 0.1, dur = o.dur ?? 0.3;
        return t + Math.max(dur, a + r);
    }

    _envelope(param, t, o, end) {
        const a = o.a ?? 0.005, r = o.r ?? 0.1, peak = o.peak ?? 0.3;
        const rs = end - r;
        param.setValueAtTime(0, t);
        param.linearRampToValueAtTime(peak, t + a);
        if (rs > t + a) param.setValueAtTime(peak, rs);
        if (o.exp) param.setTargetAtTime(0, Math.max(t + a, rs), r / 5);
        else param.linearRampToValueAtTime(0, end);
    }

    makeFilter(spec, t) {
        const f = this.ctx.createBiquadFilter();
        f.type = spec.type || 'lowpass';
        f.Q.value = spec.q ?? 0.7;
        if (spec.gain != null) f.gain.value = spec.gain;
        this.path(f.frequency, t, spec.f ?? 1000, 'exp');
        return f;
    }

    curve(amount) {
        if (this._curves[amount]) return this._curves[amount];
        const n = 1024, c = new Float32Array(n);
        for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + amount) * x / (1 + amount * Math.abs(x)); }
        this._curves[amount] = c;
        return c;
    }

    _chain(src, nodes, out, t, o, end) {
        const c = this.ctx;
        let node = src;
        for (const fs of [o.filter, o.filter2]) {
            if (!fs) continue;
            const f = this.makeFilter(fs, t);
            node.connect(f); node = f; nodes.push(f);
        }
        if (o.drive) {
            const sh = c.createWaveShaper();
            sh.curve = this.curve(o.drive);
            node.connect(sh); node = sh; nodes.push(sh);
        }
        const g = c.createGain();
        node.connect(g); nodes.push(g);
        let tail = g;
        if (o.am) {
            const amg = c.createGain();
            amg.gain.value = 1 - o.am.depth;
            const lfo = c.createOscillator();
            lfo.type = o.am.type || 'sine';
            lfo.frequency.value = o.am.rate;
            const lg = c.createGain();
            lg.gain.value = o.am.depth;
            lfo.connect(lg); lg.connect(amg.gain);
            lfo.start(t); lfo.stop(end + 0.05);
            g.connect(amg); tail = amg;
            nodes.push(amg, lfo, lg);
        }
        if (o.pan != null) {
            const p = c.createStereoPanner();
            this.path(p.pan, t, o.pan, 'lin');
            tail.connect(p); tail = p; nodes.push(p);
        }
        tail.connect(out);
        this._envelope(g.gain, t, o, end);
    }

    _dispose(nodes) { for (const n of nodes) { try { n.disconnect(); } catch (_) { /* ya desconectado */ } } }

    tone(out, o) {
        const c = this.ctx, t = o.t ?? c.currentTime;
        const end = this._end(t, o);
        const osc = c.createOscillator();
        osc.type = o.type || 'sine';
        if (o.detune) osc.detune.value = o.detune;
        this.path(osc.frequency, t, o.f ?? 440, o.glide || 'exp');
        const nodes = [osc];
        if (o.vib) {
            const lfo = c.createOscillator();
            lfo.frequency.value = o.vib.rate;
            const lg = c.createGain();
            lg.gain.value = o.vib.depth;
            lfo.connect(lg); lg.connect(osc.frequency);
            lfo.start(t); lfo.stop(end + 0.05);
            nodes.push(lfo, lg);
        }
        this._chain(osc, nodes, out, t, o, end);
        osc.start(t); osc.stop(end + 0.05);
        osc.onended = () => this._dispose(nodes);
        return end;
    }

    noise(out, o) {
        const c = this.ctx, t = o.t ?? c.currentTime;
        const end = this._end(t, o);
        const src = c.createBufferSource();
        src.buffer = this.buf[o.color || 'white'];
        src.loop = true;
        if (o.rate) src.playbackRate.value = o.rate;
        const nodes = [src];
        this._chain(src, nodes, out, t, o, end);
        src.start(t, Math.random() * 1.5);
        src.stop(end + 0.05);
        src.onended = () => this._dispose(nodes);
        return end;
    }

    fm(out, o) {
        const c = this.ctx, t = o.t ?? c.currentTime;
        const end = this._end(t, o);
        const base = typeof o.f === 'number' ? o.f : o.f[0][1];
        const car = c.createOscillator();
        car.type = o.type || 'sine';
        this.path(car.frequency, t, o.f, 'exp');
        const mod = c.createOscillator();
        mod.frequency.value = base * (o.ratio ?? 2);
        const mg = c.createGain();
        const idx = o.index ?? 1;
        this.path(mg.gain, t, typeof idx === 'number' ? idx * base : idx.map(([dt, v]) => [dt, v * base]), 'lin');
        mod.connect(mg); mg.connect(car.frequency);
        const nodes = [car, mod, mg];
        this._chain(car, nodes, out, t, o, end);
        car.start(t); mod.start(t);
        car.stop(end + 0.05); mod.stop(end + 0.05);
        car.onended = () => this._dispose(nodes);
        return end;
    }

    thump(out, { t, f0 = 120, f1 = 45, dur = 0.3, peak = 0.5 }) {
        return this.tone(out, { t, f: [[0, f0], [dur * 0.6, f1]], type: 'sine', dur, a: 0.002, r: dur, exp: true, peak });
    }

    bell(out, { t, f, partials, peak = 0.3, type = 'sine' }) {
        let end = t;
        for (const [ratio, amp, decay] of partials) {
            end = Math.max(end, this.tone(out, { t, f: f * ratio, type, a: 0.002, r: decay, dur: decay, peak: peak * amp, exp: true }));
        }
        return end;
    }
}

// ═══════════════════════════════════════════════════════
// Voces de las criaturas.  (kit, salida, tiempo, tono) → fin
// ═══════════════════════════════════════════════════════

const VOICES = {
    // Lobo de Fuego: gruñido + aullido + brasas
    wolf(k, out, t, p) {
        k.tone(out, { t, f: 82 * p, type: 'sawtooth', dur: 0.22, a: 0.02, r: 0.08, peak: 0.24, filter: { type: 'lowpass', f: 650, q: 1 }, am: { rate: 26, depth: 0.45 } });
        const ht = t + 0.16;
        const howl = [[0, 360 * p], [0.32, 640 * p], [0.62, 590 * p], [0.85, 470 * p]];
        k.tone(out, { t: ht, f: howl, type: 'triangle', dur: 0.85, a: 0.09, r: 0.28, peak: 0.24, vib: { rate: 5.5, depth: 9 * p }, filter: { type: 'bandpass', f: 1000, q: 0.9 } });
        k.tone(out, { t: ht, f: howl.map(([d, f]) => [d, f * 2.01]), type: 'sine', dur: 0.85, a: 0.12, r: 0.28, peak: 0.07, vib: { rate: 5.5, depth: 18 * p } });
        k.noise(out, { t, color: 'crackle', dur: 1.05, a: 0.05, r: 0.3, peak: 0.36, filter: { type: 'highpass', f: 1400 } });
        return ht + 0.85;
    },

    // Rana de Agua: dos croares + gota
    frog(k, out, t, p) {
        const croak = (t0, f, bp, dur) => {
            k.tone(out, { t: t0, f: f * p, type: 'square', dur, a: 0.01, r: 0.05, peak: 0.6, filter: { type: 'bandpass', f: bp * p, q: 5 }, filter2: { type: 'lowpass', f: 2500 } });
            k.tone(out, { t: t0, f: f * p, type: 'sawtooth', dur, a: 0.01, r: 0.05, peak: 0.25, filter: { type: 'bandpass', f: bp * 2.1 * p, q: 7 } });
        };
        croak(t, 26, 480, 0.17);
        croak(t + 0.25, 31, 560, 0.22);
        k.tone(out, { t: t + 0.58, f: [[0, 320 * p], [0.07, 1150 * p]], dur: 0.1, a: 0.004, r: 0.06, peak: 0.3 });
        k.noise(out, { t, color: 'brown', dur: 0.75, a: 0.1, r: 0.2, peak: 0.12, filter: { type: 'bandpass', f: 320, q: 1.5 } });
        return t + 0.75;
    },

    // Murciélago de Viento: chillidos rápidos + aleteo
    bat(k, out, t, p) {
        for (let i = 0; i < 6; i++) {
            const t0 = t + i * 0.085 + (i % 2) * 0.012;
            k.tone(out, { t: t0, f: [[0, 4300 * p], [0.035, 2300 * p]], dur: 0.04, a: 0.003, r: 0.02, peak: 0.17 });
        }
        k.noise(out, { t, color: 'white', dur: 0.7, a: 0.03, r: 0.12, peak: 0.28, filter: { type: 'bandpass', f: 900, q: 0.9 }, am: { rate: 13, depth: 0.5, type: 'square' } });
        k.noise(out, { t, color: 'pink', dur: 0.65, a: 0.15, r: 0.25, peak: 0.14, filter: { type: 'bandpass', f: [[0, 600], [0.6, 2600]], q: 2 } });
        return t + 0.72;
    },

    // Gólem de Tierra: dos pisadas + roca que rechina
    golem(k, out, t, p) {
        [0, 0.46].forEach(dt => {
            k.thump(out, { t: t + dt, f0: 95 * p, f1: 36 * p, dur: 0.38, peak: 0.8 });
            k.noise(out, { t: t + dt, color: 'brown', dur: 0.22, a: 0.002, r: 0.18, peak: 0.45, filter: { type: 'lowpass', f: 420 } });
            k.noise(out, { t: t + dt + 0.01, color: 'white', dur: 0.14, a: 0.002, r: 0.12, peak: 0.3, filter: { type: 'bandpass', f: 1100, q: 1 } });
        });
        k.noise(out, { t: t + 0.08, color: 'brown', dur: 0.9, a: 0.15, r: 0.3, peak: 0.55, filter: { type: 'bandpass', f: 260 * p, q: 2.5 }, am: { rate: 9, depth: 0.6 } });
        k.noise(out, { t: t + 0.08, color: 'pink', dur: 0.85, a: 0.15, r: 0.3, peak: 0.12, filter: { type: 'bandpass', f: 700 * p, q: 3 }, am: { rate: 9, depth: 0.7 } });
        k.tone(out, { t: t + 0.05, f: 52 * p, type: 'sawtooth', dur: 0.9, a: 0.2, r: 0.3, peak: 0.16, filter: { type: 'lowpass', f: 300 } });
        return t + 1.0;
    },

    // Elemental de Magma: burbujas de lava + rugido distorsionado
    magma(k, out, t, p) {
        for (let i = 0; i < 6; i++) {
            const t0 = t + 0.05 + Math.random() * 0.8, f0 = (70 + Math.random() * 70) * p;
            k.tone(out, { t: t0, f: [[0, f0], [0.08, f0 * 2.6]], dur: 0.1, a: 0.005, r: 0.06, peak: 0.32 });
        }
        k.tone(out, { t, f: [[0, 60 * p], [0.5, 75 * p], [1.0, 55 * p]], type: 'sawtooth', dur: 1.0, a: 0.15, r: 0.3, peak: 0.2, drive: 4, filter: { type: 'lowpass', f: [[0, 400], [0.4, 950], [1.0, 380]], q: 2 } });
        k.noise(out, { t, color: 'crackle', dur: 1.0, a: 0.05, r: 0.3, peak: 0.35, filter: { type: 'highpass', f: 1200 } });
        k.noise(out, { t, color: 'white', dur: 0.9, a: 0.2, r: 0.3, peak: 0.04, filter: { type: 'highpass', f: 3500 } });
        return t + 1.05;
    },

    // Espectro Tormenta: lamento fantasmal + trueno
    storm(k, out, t, p) {
        const wail = [[0, 600 * p], [0.35, 520 * p], [0.9, 720 * p], [1.2, 560 * p]];
        k.tone(out, { t, f: wail, dur: 1.2, a: 0.25, r: 0.4, peak: 0.16, vib: { rate: 4.5, depth: 22 * p } });
        k.tone(out, { t, f: wail.map(([d, f]) => [d, f * 1.5]), dur: 1.2, a: 0.3, r: 0.4, peak: 0.08, detune: 12, vib: { rate: 4.2, depth: 30 * p } });
        k.noise(out, { t: t + 0.32, color: 'white', dur: 0.7, a: 0.002, r: 0.65, exp: true, peak: 0.3, filter: { type: 'lowpass', f: [[0, 4000], [0.6, 300]] } });
        k.noise(out, { t: t + 0.34, color: 'brown', dur: 0.9, a: 0.02, r: 0.8, exp: true, peak: 0.5, filter: { type: 'lowpass', f: 160 } });
        k.noise(out, { t, color: 'pink', dur: 1.2, a: 0.3, r: 0.4, peak: 0.08, filter: { type: 'bandpass', f: [[0, 800], [1.2, 1600]], q: 4 } });
        return t + 1.25;
    },

    // Ent del Bosque: madera que cruje + hojas + zumbido grave
    ent(k, out, t, p) {
        k.tone(out, { t, f: [[0, 32 * p], [0.3, 46 * p], [0.7, 29 * p]], type: 'sawtooth', dur: 0.7, a: 0.04, r: 0.15, peak: 0.95, filter: { type: 'bandpass', f: 640 * p, q: 9 }, filter2: { type: 'lowpass', f: 2000 } });
        k.tone(out, { t: t + 0.62, f: [[0, 26 * p], [0.4, 38 * p]], type: 'sawtooth', dur: 0.5, a: 0.04, r: 0.12, peak: 0.9, filter: { type: 'bandpass', f: 470 * p, q: 9 } });
        k.noise(out, { t, color: 'white', dur: 1.1, a: 0.2, r: 0.4, peak: 0.17, filter: { type: 'highpass', f: 2600 }, am: { rate: 17, depth: 0.6 } });
        k.tone(out, { t: t + 0.05, f: 80 * p, dur: 1.05, a: 0.35, r: 0.35, peak: 0.18 });
        return t + 1.15;
    },

    // Djinn del Desierto: campanillas místicas + remolino de arena
    djinn(k, out, t, p) {
        const notes = shuffle([0, 1, 4, 5, 7, 8, 10, 12], Math.random).slice(0, 4);
        notes.forEach((n, i) => {
            k.fm(out, { t: t + i * 0.12, f: 587 * p * Math.pow(2, n / 12), ratio: 3.5, index: [[0, 2.2], [0.5, 0.1]], dur: 0.55, a: 0.003, r: 0.5, exp: true, peak: 0.14 });
        });
        k.noise(out, { t, color: 'pink', dur: 1.0, a: 0.25, r: 0.35, peak: 0.24, filter: { type: 'bandpass', f: [[0, 400], [0.5, 3000], [1.0, 700]], q: 1.6 } });
        k.tone(out, { t, f: [[0, 150 * p], [1.0, 110 * p]], dur: 1.0, a: 0.25, r: 0.35, peak: 0.1 });
        return t + 1.05;
    },

    // Brasa de la Forja: gemido breve + chisporroteo intenso
    ember(k, out, t, p) {
        k.tone(out, { t, f: [[0, 720 * p], [0.12, 1050 * p], [0.32, 620 * p]], type: 'triangle', dur: 0.34, a: 0.01, r: 0.15, peak: 0.2, filter: { type: 'bandpass', f: 1200, q: 1 } });
        k.noise(out, { t, color: 'crackle', dur: 0.55, a: 0.01, r: 0.2, peak: 0.6, filter: { type: 'highpass', f: 1600 } });
        k.noise(out, { t, color: 'white', dur: 0.45, a: 0.05, r: 0.25, peak: 0.12, filter: { type: 'bandpass', f: [[0, 800], [0.4, 2400]], q: 2 } });
        return t + 0.56;
    },

    // Sombra Imitadora (su voz propia, solo en el bestiario)
    shadow(k, out, t, p) {
        [1, 1.06, 1.414, 1.68].forEach((r, i) => k.tone(out, { t: t + i * 0.04, f: 196 * p * r, dur: 1.0, a: 0.6, r: 0.08, peak: 0.09, vib: { rate: 5 + i, depth: 3 } }));
        k.noise(out, { t, color: 'white', dur: 1.0, a: 0.3, r: 0.3, peak: 0.14, filter: { type: 'bandpass', f: [[0, 1800], [0.5, 3600], [1.0, 2200]], q: 7 } });
        return t + 1.1;
    },

    // Ignar: yunque + bramido de forja + fuego
    ignar(k, out, t, p) {
        [0, 0.36].forEach((dt, i) => {
            k.bell(out, { t: t + dt, f: (i ? 540 : 500) * p, partials: [[1, 1, 0.7], [2.76, 0.6, 0.45], [5.4, 0.35, 0.28], [8.93, 0.2, 0.16]], peak: 0.3 });
            k.noise(out, { t: t + dt, color: 'white', dur: 0.03, a: 0.001, r: 0.03, peak: 0.35, filter: { type: 'highpass', f: 2500 } });
        });
        k.tone(out, { t: t + 0.1, f: [[0, 46 * p], [0.6, 52 * p], [1.3, 44 * p]], type: 'sawtooth', dur: 1.3, a: 0.3, r: 0.4, peak: 0.22, drive: 5, filter: { type: 'lowpass', f: [[0, 300], [0.6, 1200], [1.3, 450]], q: 3 } });
        k.tone(out, { t: t + 0.1, f: 47 * p, type: 'sawtooth', detune: 18, dur: 1.3, a: 0.3, r: 0.4, peak: 0.12, filter: { type: 'lowpass', f: 500 } });
        k.noise(out, { t, color: 'pink', dur: 1.4, a: 0.4, r: 0.45, peak: 0.28, filter: { type: 'lowpass', f: [[0, 400], [0.7, 1400], [1.4, 500]] } });
        k.noise(out, { t, color: 'crackle', dur: 1.4, a: 0.1, r: 0.4, peak: 0.4, filter: { type: 'highpass', f: 1200 } });
        return t + 1.45;
    },

    // Leviatán: canto de ballena + subgrave + burbujas
    leviathan(k, out, t, p) {
        const song = [[0, 150 * p], [0.5, 96 * p], [1.1, 128 * p], [1.6, 110 * p]];
        k.tone(out, { t, f: song, dur: 1.6, a: 0.35, r: 0.5, peak: 0.42, vib: { rate: 3, depth: 4 * p } });
        k.tone(out, { t, f: song.map(([d, f]) => [d, f * 2]), type: 'triangle', dur: 1.6, a: 0.45, r: 0.5, peak: 0.13, filter: { type: 'lowpass', f: 900 }, vib: { rate: 3, depth: 8 * p } });
        k.tone(out, { t, f: 44 * p, dur: 1.6, a: 0.5, r: 0.5, peak: 0.3 });
        for (let i = 0; i < 7; i++) {
            const t0 = t + 0.1 + Math.random() * 1.4, f0 = (220 + Math.random() * 300) * p;
            k.tone(out, { t: t0, f: [[0, f0], [0.06, f0 * 2.2]], dur: 0.08, a: 0.004, r: 0.05, peak: 0.13 });
        }
        k.noise(out, { t, color: 'brown', dur: 1.6, a: 0.4, r: 0.5, peak: 0.25, filter: { type: 'lowpass', f: 450 } });
        return t + 1.65;
    },

    // Zael: vendaval que ruge + grito + silbido
    zael(k, out, t, p) {
        k.noise(out, { t, color: 'white', dur: 1.3, a: 0.12, r: 0.45, peak: 0.42, filter: { type: 'bandpass', f: [[0, 420], [0.5, 2600], [1.3, 850]], q: 6 } });
        k.tone(out, { t: t + 0.05, f: [[0, 700 * p], [0.35, 1350 * p], [1.0, 900 * p]], type: 'sawtooth', dur: 1.0, a: 0.1, r: 0.35, peak: 0.14, vib: { rate: 7, depth: 30 * p }, filter: { type: 'bandpass', f: 1500, q: 2 } });
        k.tone(out, { t: t + 0.3, f: [[0, 1800 * p], [0.8, 2700 * p]], dur: 0.8, a: 0.2, r: 0.3, peak: 0.08 });
        return t + 1.35;
    },

    // Rok: terremoto + tres pisadas colosales + rocas
    rok(k, out, t, p) {
        k.noise(out, { t, color: 'brown', dur: 1.6, a: 0.1, r: 0.5, peak: 0.55, filter: { type: 'lowpass', f: 130 } });
        [0, 0.55, 1.1].forEach(dt => {
            k.thump(out, { t: t + dt, f0: 72 * p, f1: 30 * p, dur: 0.45, peak: 0.8 });
            k.noise(out, { t: t + dt, color: 'brown', dur: 0.25, a: 0.002, r: 0.22, peak: 0.45, filter: { type: 'lowpass', f: 380 } });
        });
        for (let i = 0; i < 6; i++) {
            k.noise(out, { t: t + 0.1 + Math.random() * 1.3, color: 'white', dur: 0.08, a: 0.002, r: 0.07, peak: 0.42, filter: { type: 'bandpass', f: 400 + Math.random() * 900, q: 2 } });
        }
        k.tone(out, { t, f: 38 * p, type: 'sawtooth', dur: 1.5, a: 0.3, r: 0.4, peak: 0.2, filter: { type: 'lowpass', f: 420 } });
        k.noise(out, { t, color: 'brown', dur: 1.5, a: 0.2, r: 0.4, peak: 0.35, filter: { type: 'bandpass', f: 420, q: 2 }, am: { rate: 6, depth: 0.5 } });
        return t + 1.6;
    },

    // Avatar del Silencio: coro disonante que crece y se corta en seco
    avatar(k, out, t, p) {
        [1, 1.0595, 1.4983, 1.5874].forEach((r, i) => k.tone(out, { t, f: 220 * p * r, dur: 1.15, a: 1.0, r: 0.04, peak: 0.11, vib: { rate: 4 + i * 0.7, depth: 2.5 } }));
        k.tone(out, { t, f: 55 * p, dur: 1.15, a: 0.9, r: 0.05, peak: 0.3 });
        k.noise(out, { t, color: 'white', dur: 1.15, a: 0.6, r: 0.05, peak: 0.13, filter: { type: 'bandpass', f: [[0, 2000], [0.6, 4200], [1.15, 2600]], q: 8 } });
        k.noise(out, { t: t + 1.32, color: 'white', dur: 0.025, a: 0.001, r: 0.02, peak: 0.3, filter: { type: 'highpass', f: 3000 } });
        k.tone(out, { t: t + 1.32, f: 1760 * p, dur: 0.05, a: 0.001, r: 0.04, peak: 0.1 });
        return t + 1.4;
    },
};

// ═══════════════════════════════════════════════════════
// Firmas elementales (hechizos y cambios del Avatar)
// ═══════════════════════════════════════════════════════

const ELEMENT_SOUNDS = {
    agua(k, out, t, s = 1) {
        k.tone(out, { t, f: [[0, 420], [0.07, 1250]], dur: 0.09, a: 0.003, r: 0.06, peak: 0.3 * s });
        k.tone(out, { t: t + 0.09, f: [[0, 560], [0.06, 1500]], dur: 0.08, a: 0.003, r: 0.05, peak: 0.22 * s });
        k.noise(out, { t, color: 'pink', dur: 0.35, a: 0.01, r: 0.25, peak: 0.28 * s, filter: { type: 'bandpass', f: [[0, 1400], [0.35, 700]], q: 1.5 } });
        return t + 0.36;
    },
    fuego(k, out, t, s = 1) {
        k.noise(out, { t, color: 'pink', dur: 0.4, a: 0.03, r: 0.25, peak: 0.38 * s, filter: { type: 'bandpass', f: [[0, 600], [0.35, 2600]], q: 1.2 } });
        k.noise(out, { t, color: 'crackle', dur: 0.4, a: 0.01, r: 0.2, peak: 0.6 * s, filter: { type: 'highpass', f: 1500 } });
        k.tone(out, { t, f: [[0, 180], [0.3, 90]], type: 'sawtooth', dur: 0.3, a: 0.01, r: 0.2, peak: 0.09 * s, filter: { type: 'lowpass', f: 700 } });
        return t + 0.42;
    },
    tierra(k, out, t, s = 1) {
        k.thump(out, { t, f0: 130, f1: 48, dur: 0.3, peak: 0.7 * s });
        k.noise(out, { t, color: 'brown', dur: 0.3, a: 0.003, r: 0.25, peak: 0.45 * s, filter: { type: 'lowpass', f: 700 } });
        k.noise(out, { t: t + 0.02, color: 'white', dur: 0.2, a: 0.003, r: 0.15, peak: 0.1 * s, filter: { type: 'bandpass', f: 1800, q: 1 }, am: { rate: 30, depth: 0.7, type: 'square' } });
        return t + 0.33;
    },
    viento(k, out, t, s = 1) {
        k.noise(out, { t, color: 'white', dur: 0.48, a: 0.1, r: 0.3, peak: 0.32 * s, filter: { type: 'bandpass', f: [[0, 500], [0.25, 3200], [0.48, 1100]], q: 3 } });
        k.tone(out, { t: t + 0.05, f: [[0, 900], [0.4, 1400]], dur: 0.4, a: 0.1, r: 0.2, peak: 0.05 * s });
        return t + 0.5;
    },
};

/** Ligero cambio de tono según la altura (arriba agudo, abajo grave). */
const DIR_PITCH = { up: 1.18, down: 0.84, left: 1, right: 1, center: 1 };

// ═══════════════════════════════════════════════════════
// AudioEngine: mezclador, espacialización y efectos
// ═══════════════════════════════════════════════════════

class AudioEngine {
    ctx = null; kit = null;
    #settings;
    #master; #comp; #sfx; #ui; #musicBus; #musicFilter; #musicDuck; #voice;
    #reverb; #reverbOut; #reverbType = null; #irs = {};
    #heartIv = null;

    constructor(settings) { this.#settings = settings; }

    get ready() { return !!this.ctx; }
    get musicIn() { return this.#musicBus; }
    get now() { return this.ctx ? this.ctx.currentTime : 0; }

    init() {
        if (this.ctx) { this.resume(); return true; }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        // iPhone: que el sonido del juego no lo silencie el interruptor de silencio.
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (_) { /* no disponible */ }
        try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch (_) { return false; }
        const c = this.ctx;
        this.kit = new SynthKit(c);
        this.#comp = c.createDynamicsCompressor();
        this.#comp.threshold.value = -14; this.#comp.knee.value = 12; this.#comp.ratio.value = 4;
        this.#comp.attack.value = 0.003; this.#comp.release.value = 0.25;
        this.#master = c.createGain(); this.#master.gain.value = 0.9;
        this.#master.connect(this.#comp); this.#comp.connect(c.destination);
        this.#sfx = c.createGain(); this.#sfx.connect(this.#master);
        this.#ui = c.createGain(); this.#ui.connect(this.#master);
        this.#voice = c.createGain(); this.#voice.connect(this.#master);   // narración grabada
        this.#musicBus = c.createGain();
        this.#musicFilter = c.createBiquadFilter(); this.#musicFilter.type = 'lowpass'; this.#musicFilter.frequency.value = 18000;
        this.#musicDuck = c.createGain();
        this.#musicBus.connect(this.#musicFilter); this.#musicFilter.connect(this.#musicDuck); this.#musicDuck.connect(this.#master);
        this.#reverb = c.createConvolver();
        this.#reverbOut = c.createGain();
        this.#reverb.connect(this.#reverbOut); this.#reverbOut.connect(this.#master);
        this.setReverb('hall');
        this.applySettings();
        this.resume();
        return true;
    }

    resume() {
        // «interrupted» es el estado de Safari tras una llamada o al volver de otra app.
        if (this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume().catch(() => { });
    }

    /** Bus de la narración grabada (volumen = volumen de voz). */
    get voiceBus() { return this.#voice; }

    /** Reverberación independiente (para efectos de voz). */
    makeReverb(type, seconds = 2.4, decay = 2.6) {
        const key = `${type}:${seconds}:${decay}`;
        if (!this.#irs[key]) this.#irs[key] = this.#makeIR(seconds, decay);
        const cv = this.ctx.createConvolver();
        cv.buffer = this.#irs[key];
        return cv;
    }

    /** Baja la música mientras habla un narrador grabado. */
    setVoiceDuck(on) {
        if (!this.ctx) return;
        const g = this.#musicDuck.gain, t = this.ctx.currentTime;
        try { g.cancelScheduledValues(t); } catch (_) { /* nada */ }
        g.setTargetAtTime(on ? 0.3 : 1, t, on ? 0.15 : 0.6);
    }

    applySettings() {
        if (!this.ctx) return;
        const s = this.#settings, t = this.ctx.currentTime;
        this.#voice.gain.setTargetAtTime(clamp(s.speechVolume, 0, 1) * 0.85, t, 0.05);
        this.#sfx.gain.setTargetAtTime(s.sfxVolume, t, 0.05);
        this.#ui.gain.setTargetAtTime(Math.min(1, s.sfxVolume * 0.85 + 0.1), t, 0.05);
        this.#musicBus.gain.setTargetAtTime(Math.pow(s.musicVolume, 1.5) * 0.6, t, 0.1);
        try {
            const d = this.ctx.destination;
            d.channelCount = s.mono ? 1 : Math.min(2, d.maxChannelCount || 2);
            d.channelCountMode = 'explicit';
            d.channelInterpretation = 'speakers';
        } catch (_) { /* el navegador no permite cambiarlo */ }
    }

    #makeIR(seconds, decay) {
        const c = this.ctx, len = Math.floor(c.sampleRate * seconds);
        const ir = c.createBuffer(2, len, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = ir.getChannelData(ch);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
        return ir;
    }

    /** Acústica del lugar: room · hall · cave · open */
    setReverb(type) {
        if (!this.ctx || this.#reverbType === type) return;
        const spec = { room: [0.9, 3, 0.2], hall: [2.4, 2.6, 0.3], cave: [3.4, 2.2, 0.36], open: [1.8, 3.5, 0.22] }[type] || [2, 3, 0.25];
        if (!this.#irs[type]) this.#irs[type] = this.#makeIR(spec[0], spec[1]);
        this.#reverb.buffer = this.#irs[type];
        this.#reverbOut.gain.setTargetAtTime(spec[2], this.ctx.currentTime, 0.2);
        this.#reverbType = type;
    }

    /** Música apagada (niebla) o normal. */
    setMuffled(on) {
        if (!this.ctx) return;
        this.#musicFilter.frequency.setTargetAtTime(on ? 650 : 18000, this.ctx.currentTime, 0.4);
    }

    duck(t, end, depth = 0.4) {
        if (!this.ctx) return;
        const g = this.#musicDuck.gain;
        try {
            if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
        } catch (_) { g.cancelScheduledValues(t); }
        g.setTargetAtTime(depth, t, 0.04);
        g.setTargetAtTime(1, end, 0.35);
    }

    // ── Espacialización ─────────────────────────────────

    #panFor(dirId) {
        if (this.#settings.mono) return 0;
        return (DIRECTIONS[dirId]?.pan ?? 0) * 0.95;
    }

    #spatial(dirId, { gain = 1, far = false, send = 0.22, bus = null } = {}) {
        const c = this.ctx, nodes = [];
        const input = c.createGain();
        input.gain.value = gain;
        nodes.push(input);
        let node = input;
        const add = n => { node.connect(n); node = n; nodes.push(n); };
        if (dirId === 'down') {
            const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1300; f.Q.value = 0.8; add(f);
        } else if (dirId === 'up') {
            const f = c.createBiquadFilter(); f.type = 'highshelf'; f.frequency.value = 2200; f.gain.value = 6; add(f);
            const h = c.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = 150; add(h);
        }
        if (far) {
            const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; add(f);
            const g = c.createGain(); g.gain.value = 0.42; add(g);
        }
        const pan = c.createStereoPanner();
        pan.pan.value = this.#panFor(dirId);
        add(pan);
        node.connect(bus || this.#sfx);
        const sg = c.createGain();
        sg.gain.value = far ? 1.4 : send;
        node.connect(sg); sg.connect(this.#reverb);
        nodes.push(sg);
        return { input, pan, nodes };
    }

    #release(chain, endTime) {
        const ms = Math.max(0, (endTime - this.ctx.currentTime) * 1000) + 4500;
        setTimeout(() => chain.nodes.forEach(n => { try { n.disconnect(); } catch (_) { /* nada */ } }), ms);
    }

    #marker(dirId, out, t, s = 1) {
        const k = this.kit;
        if (dirId === 'up') {
            return k.bell(out, { t, f: 1760, partials: [[1, 1, 0.35], [1.5, 0.5, 0.25], [3, 0.25, 0.15]], peak: 0.14 * s });
        }
        if (dirId === 'down') {
            k.thump(out, { t, f0: 85, f1: 42, dur: 0.3, peak: 0.55 * s });
            return k.noise(out, { t, color: 'brown', dur: 0.15, a: 0.002, r: 0.12, peak: 0.25 * s, filter: { type: 'lowpass', f: 300 } });
        }
        k.tone(out, { t, f: 1150, dur: 0.05, a: 0.001, r: 0.045, exp: true, peak: 0.26 * s });
        return k.noise(out, { t, color: 'white', dur: 0.02, a: 0.001, r: 0.018, peak: 0.2 * s, filter: { type: 'bandpass', f: 2500, q: 1.5 } });
    }

    #ghost(dest, t, nodes) {
        const c = this.ctx;
        const g = c.createGain();
        g.gain.value = 0.55;
        const lfo = c.createOscillator();
        lfo.frequency.value = 7;
        const lg = c.createGain();
        lg.gain.value = 0.45;
        lfo.connect(lg); lg.connect(g.gain);
        lfo.start(t); lfo.stop(t + 3);
        g.connect(dest);
        nodes.push(g, lfo, lg);
        this.kit.noise(dest, { t, color: 'white', dur: 1.0, a: 0.2, r: 0.4, peak: 0.12, filter: { type: 'bandpass', f: [[0, 2400], [1, 3800]], q: 8 } });
        [1, 1.06].forEach(r => this.kit.tone(dest, { t, f: 147 * r, dur: 0.9, a: 0.4, r: 0.3, peak: 0.05 }));
        return g;
    }

    #shieldLayer(out, t) {
        const k = this.kit;
        k.noise(out, { t, color: 'brown', dur: 1.1, a: 0.08, r: 0.3, peak: 0.7, filter: { type: 'bandpass', f: 260, q: 4 }, am: { rate: 14, depth: 0.7, type: 'square' } });
        k.noise(out, { t: t + 0.1, color: 'white', dur: 0.7, a: 0.1, r: 0.3, peak: 0.12, filter: { type: 'bandpass', f: [[0, 1500], [0.7, 2300]], q: 10 } });
        return k.bell(out, { t: t + 0.75, f: 180, partials: [[1, 1, 0.8], [2.3, 0.5, 0.5], [3.9, 0.3, 0.3]], peak: 0.3 });
    }

    // ── Voces de criaturas ──────────────────────────────

    /**
     * Toca la voz de una criatura en una dirección.
     * opciones: delay, gain, pitch, far, ghost, whisper, element, shield, marker, noDuck
     * Devuelve los segundos que dura (desde ahora).
     */
    playVoice(voiceId, dirId = 'center', o = {}) {
        if (!this.ctx) return 0;
        const fn = VOICES[voiceId];
        if (!fn) return 0;
        const t = this.ctx.currentTime + 0.04 + (o.delay || 0);
        const chain = this.#spatial(dirId, { gain: (o.gain ?? 1) * (o.whisper ? 0.3 : 1), far: o.far, send: 0.22 });
        let dest = chain.input;
        const useMarker = o.marker !== false && dirId !== 'center';
        let end = t;
        if (useMarker) end = Math.max(end, this.#marker(dirId, chain.input, t, o.far ? 0.6 : 1));
        const vt = t + (useMarker ? 0.07 : 0);
        let pitch = (o.pitch || 1) * (DIR_PITCH[dirId] || 1);
        if (o.ghost) { dest = this.#ghost(dest, vt, chain.nodes); pitch *= 0.94; }
        end = Math.max(end, fn(this.kit, dest, vt, pitch));
        if (o.element && ELEMENT_SOUNDS[o.element]) {
            const ec = o.whisper ? this.#spatial(dirId, { gain: 0.9 }) : chain;
            end = Math.max(end, ELEMENT_SOUNDS[o.element](this.kit, ec.input, vt + 0.05, 0.9));
            if (ec !== chain) this.#release(ec, end);
        }
        if (o.shield) end = Math.max(end, this.#shieldLayer(chain.input, vt));
        this.#release(chain, end);
        if (!o.noDuck) this.duck(t, end);
        return end - this.ctx.currentTime;
    }

    /** Solo el marcador de posición (entrenamiento y biblioteca). */
    playMarker(dirId) {
        if (!this.ctx) return 0;
        const t = this.ctx.currentTime + 0.03;
        const chain = this.#spatial(dirId);
        const end = this.#marker(dirId, chain.input, t);
        this.#release(chain, end);
        return end - this.ctx.currentTime;
    }

    /** Corriente que se desplaza por varias posiciones (Leviatán). Devuelve el retraso hasta la última. */
    playSweep(path, stepS = 0.4) {
        if (!this.ctx) return 0;
        const c = this.ctx, k = this.kit, t = c.currentTime + 0.04;
        const nodes = [];
        const input = c.createGain(); input.gain.value = 0.9;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass';
        const pan = c.createStereoPanner();
        input.connect(lp); lp.connect(pan); pan.connect(this.#sfx);
        const sg = c.createGain(); sg.gain.value = 0.35; pan.connect(sg); sg.connect(this.#reverb);
        nodes.push(input, lp, pan, sg);
        const pos = d => ({ pan: this.#panFor(d), cut: d === 'down' ? 600 : d === 'up' ? 7000 : 2600 });
        path.forEach((d, i) => {
            const ti = t + i * stepS, ps = pos(d);
            if (i === 0) { pan.pan.setValueAtTime(ps.pan, ti); lp.frequency.setValueAtTime(ps.cut, ti); }
            else { pan.pan.linearRampToValueAtTime(ps.pan, ti); lp.frequency.exponentialRampToValueAtTime(ps.cut, ti); }
        });
        const total = (path.length - 1) * stepS + 0.3;
        k.noise(input, { t, color: 'pink', dur: total, a: 0.1, r: 0.25, peak: 0.5, filter: { type: 'bandpass', f: 800, q: 0.7 } });
        k.noise(input, { t, color: 'brown', dur: total, a: 0.1, r: 0.25, peak: 0.45, filter: { type: 'lowpass', f: 380 } });
        for (let i = 0; i < 6; i++) {
            const t0 = t + Math.random() * total, f0 = 200 + Math.random() * 300;
            k.tone(input, { t: t0, f: [[0, f0], [0.06, f0 * 2.3]], dur: 0.08, a: 0.004, r: 0.05, peak: 0.12 });
        }
        path.forEach((d, i) => { if (i < path.length - 1) this.#marker(d, input, t + i * stepS, 0.5); });
        this.#release({ nodes }, t + total);
        this.duck(t, t + total + 1.5);
        return (path.length - 1) * stepS;
    }

    // ── Hechizos ────────────────────────────────────────

    elementKey(elId) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.005, out = this.#ui;
        if (elId === 'agua') k.tone(out, { t, f: [[0, 700], [0.05, 1300]], dur: 0.07, a: 0.003, r: 0.05, peak: 0.16 });
        if (elId === 'fuego') {
            k.noise(out, { t, color: 'crackle', dur: 0.1, a: 0.003, r: 0.06, peak: 0.45, filter: { type: 'highpass', f: 1500 } });
            k.tone(out, { t, f: 440, type: 'triangle', dur: 0.08, a: 0.003, r: 0.06, peak: 0.08 });
        }
        if (elId === 'tierra') k.thump(out, { t, f0: 170, f1: 70, dur: 0.12, peak: 0.36 });
        if (elId === 'viento') k.noise(out, { t, color: 'white', dur: 0.13, a: 0.02, r: 0.08, peak: 0.16, filter: { type: 'bandpass', f: [[0, 1000], [0.12, 3200]], q: 3 } });
    }

    /** Sonido de un elemento en una posición (biblioteca, entrenamiento, Avatar). */
    playElement(elId, dirId = 'center', s = 1) {
        if (!this.ctx || !ELEMENT_SOUNDS[elId]) return 0;
        const t = this.ctx.currentTime + 0.03;
        const chain = this.#spatial(dirId);
        const end = ELEMENT_SOUNDS[elId](this.kit, chain.input, t, s);
        this.#release(chain, end);
        return end - this.ctx.currentTime;
    }

    /** Hechizo que sale del centro y viaja hacia la dirección elegida. */
    castSpell(elements, dirId) {
        if (!this.ctx) return;
        const c = this.ctx, t = c.currentTime + 0.01, nodes = [];
        const input = c.createGain(); input.gain.value = 0.75;
        const filt = c.createBiquadFilter();
        filt.type = dirId === 'down' ? 'lowpass' : 'highshelf';
        filt.frequency.value = dirId === 'down' ? 1600 : 2500;
        if (dirId === 'up') filt.gain.value = 5;
        const pan = c.createStereoPanner();
        pan.pan.setValueAtTime(0, t);
        pan.pan.linearRampToValueAtTime(this.#panFor(dirId), t + 0.22);
        input.connect(filt); filt.connect(pan); pan.connect(this.#sfx);
        const sg = c.createGain(); sg.gain.value = 0.2; pan.connect(sg); sg.connect(this.#reverb);
        nodes.push(input, filt, pan, sg);
        let end = t;
        elements.forEach((el, i) => { end = Math.max(end, ELEMENT_SOUNDS[el](this.kit, input, t + i * 0.03, elements.length > 1 ? 0.75 : 1)); });
        if (elements.length > 1) {
            end = Math.max(end, this.kit.bell(input, { t: t + 0.05, f: 1318, partials: [[1, 1, 0.4], [1.5, 0.6, 0.3], [2, 0.4, 0.25]], peak: 0.1 }));
        }
        this.#release({ nodes }, end);
    }

    fizzle() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.01, out = this.#sfx;
        k.noise(out, { t, color: 'crackle', dur: 0.25, a: 0.005, r: 0.2, peak: 0.5, filter: { type: 'highpass', f: 2000 } });
        k.tone(out, { t, f: [[0, 600], [0.3, 180]], type: 'triangle', dur: 0.3, a: 0.005, r: 0.2, peak: 0.12 });
    }

    noElement() {
        if (!this.ctx) return;
        this.kit.tone(this.#ui, { t: this.ctx.currentTime + 0.005, f: 380, type: 'triangle', dur: 0.06, a: 0.003, r: 0.05, peak: 0.12 });
    }

    // ── Resultado de un hechizo ─────────────────────────

    hit(dirId, crit = false) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.01;
        const ch = this.#spatial(dirId, { send: 0.25 });
        const out = ch.input;
        k.noise(out, { t, color: 'white', dur: 0.1, a: 0.001, r: 0.09, peak: 0.45, filter: { type: 'lowpass', f: 2600 } });
        k.thump(out, { t, f0: 170, f1: 60, dur: 0.25, peak: 0.5 });
        let end = t + 0.3;
        if (crit) {
            [784, 988, 1175, 1568].forEach((f, i) => k.tone(out, { t: t + 0.04 + i * 0.05, f, type: 'triangle', dur: 0.3, a: 0.003, r: 0.25, exp: true, peak: 0.17 }));
            end = k.bell(out, { t: t + 0.22, f: 2093, partials: [[1, 1, 0.6], [2, 0.4, 0.4], [3, 0.2, 0.3]], peak: 0.1 });
            k.noise(out, { t, color: 'pink', dur: 0.4, a: 0.002, r: 0.35, peak: 0.3, filter: { type: 'bandpass', f: [[0, 3000], [0.4, 800]], q: 1 } });
        } else {
            end = k.tone(out, { t: t + 0.03, f: [[0, 880], [0.12, 660]], dur: 0.16, a: 0.003, r: 0.12, peak: 0.2 });
        }
        this.#release(ch, end);
    }

    kill(dirId, tier = 'basic') {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.12;
        const ch = this.#spatial(dirId, { send: 0.4 });
        const out = ch.input;
        [2093, 1760, 1568, 1319, 1175, 1047].forEach((f, i) => k.tone(out, { t: t + i * 0.045, f, type: 'triangle', dur: 0.2, a: 0.003, r: 0.17, exp: true, peak: 0.1 }));
        let end = k.noise(out, { t, color: 'white', dur: 0.5, a: 0.01, r: 0.45, peak: 0.16, filter: { type: 'highpass', f: [[0, 6000], [0.5, 1500]] } });
        if (tier === 'elite' || tier === 'miniboss') {
            [262, 330, 392].forEach(f => k.tone(out, { t: t + 0.2, f, type: 'triangle', dur: 0.8, a: 0.02, r: 0.6, peak: 0.07 }));
            end = t + 1.0;
        }
        if (tier === 'boss' || tier === 'final' || tier === 'miniboss') {
            end = k.bell(out, { t: t + 0.1, f: 98, partials: [[1, 1, 3.5], [2.01, 0.6, 2.5], [2.98, 0.4, 2], [4.1, 0.25, 1.5]], peak: 0.45 });
            k.noise(out, { t: t + 0.1, color: 'brown', dur: 2.5, a: 0.01, r: 2.4, exp: true, peak: 0.5, filter: { type: 'lowpass', f: 200 } });
        }
        this.#release(ch, end);
    }

    cure(dirId) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.05;
        const ch = this.#spatial(dirId);
        const out = ch.input;
        k.tone(out, { t, f: [[0, 180], [0.45, 620]], dur: 0.5, a: 0.02, r: 0.15, peak: 0.26, vib: { rate: 9, depth: 20 } });
        k.tone(out, { t, f: 90, type: 'sawtooth', dur: 0.5, a: 0.02, r: 0.2, peak: 0.12, filter: { type: 'lowpass', f: 400 } });
        const end = k.tone(out, { t, f: 95, type: 'sawtooth', dur: 0.5, a: 0.02, r: 0.2, peak: 0.12, filter: { type: 'lowpass', f: 400 } });
        this.#release(ch, end);
    }

    miss(dirId) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.05;
        const ch = this.#spatial(dirId);
        const out = ch.input;
        k.thump(out, { t, f0: 140, f1: 90, dur: 0.18, peak: 0.4 });
        k.tone(out, { t, f: 110, type: 'sawtooth', dur: 0.32, a: 0.005, r: 0.15, peak: 0.12, filter: { type: 'lowpass', f: 600 } });
        const end = k.tone(out, { t, f: 116.5, type: 'sawtooth', dur: 0.32, a: 0.005, r: 0.15, peak: 0.12, filter: { type: 'lowpass', f: 600 } });
        this.#release(ch, end);
    }

    wrongDir() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.25, out = this.#sfx;
        k.tone(out, { t, f: 494, type: 'square', dur: 0.12, a: 0.005, r: 0.08, peak: 0.07, filter: { type: 'lowpass', f: 1500 } });
        k.tone(out, { t: t + 0.13, f: 370, type: 'square', dur: 0.18, a: 0.005, r: 0.12, peak: 0.07, filter: { type: 'lowpass', f: 1500 } });
    }

    playerHurt(livesLeft = 3) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.05, out = this.#sfx;
        const low = livesLeft <= 1 ? 0.8 : 1;
        k.noise(out, { t, color: 'white', dur: 0.16, a: 0.002, r: 0.15, peak: 0.5, filter: { type: 'lowpass', f: 900 } });
        k.thump(out, { t, f0: 110 * low, f1: 45 * low, dur: 0.35, peak: 0.8 });
        k.tone(out, { t: t + 0.02, f: [[0, 220 * low], [0.28, 105 * low]], type: 'sawtooth', dur: 0.3, a: 0.005, r: 0.2, peak: 0.13, drive: 3, filter: { type: 'lowpass', f: 900 } });
    }

    heal() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.05, out = this.#sfx;
        [523, 659, 784, 1047].forEach((f, i) => k.tone(out, { t: t + i * 0.08, f, dur: 0.6, a: 0.01, r: 0.5, exp: true, peak: 0.12 }));
        k.noise(out, { t, color: 'white', dur: 0.6, a: 0.2, r: 0.3, peak: 0.04, filter: { type: 'highpass', f: 6000 } });
    }

    streakUp(mult) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.3, out = this.#ui;
        const base = 660 * Math.pow(2, ((mult - 2) * 3) / 12);
        [1, 1.26, 1.5].forEach((r, i) => k.tone(out, { t: t + i * 0.06, f: base * r, type: 'triangle', dur: 0.15, a: 0.003, r: 0.12, peak: 0.1 }));
    }

    /** Respuesta rápida: un destello agudo y breve que avisa de los puntos extra. */
    quick() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.2, out = this.#ui;
        [2637, 3520].forEach((f, i) => k.tone(out, { t: t + i * 0.045, f, dur: 0.07, a: 0.002, r: 0.06, exp: true, peak: 0.07 }));
    }

    // ── La Concordia ────────────────────────────────────

    /** La campana de Ignar: avisa al Oyente de que es hora de soltar el Aliento. */
    greatBell() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.02, out = this.#sfx;
        k.bell(out, { t, f: 196, partials: [[1, 1, 4.5], [2.01, 0.6, 3.4], [2.76, 0.45, 2.6], [4.1, 0.3, 1.8], [5.4, 0.18, 1.2]], peak: 0.5 });
        k.noise(out, { t, color: 'white', dur: 0.04, a: 0.001, r: 0.04, peak: 0.4, filter: { type: 'highpass', f: 2200 } });
        this.duck(t, t + 3, 0.2);
    }

    /** El Aliento sostenido: un soplo que crece mientras se mantiene. Devuelve la función que lo suelta. */
    breath() {
        if (!this.ctx) return () => { };
        const c = this.ctx, t = c.currentTime;
        const src = c.createBufferSource();
        src.buffer = this.kit.buf.pink; src.loop = true;
        const f = c.createBiquadFilter();
        f.type = 'bandpass'; f.Q.value = 1.4;
        f.frequency.setValueAtTime(500, t);
        f.frequency.linearRampToValueAtTime(1500, t + 9);
        const g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.5, t + 1.2);
        const osc = c.createOscillator();
        osc.frequency.value = 110;
        const og = c.createGain();
        og.gain.setValueAtTime(0, t);
        og.gain.linearRampToValueAtTime(0.12, t + 1.5);
        src.connect(f); f.connect(g); g.connect(this.#sfx);
        osc.connect(og); og.connect(this.#sfx);
        src.start(t, Math.random()); osc.start(t);
        let stopped = false;
        return () => {
            if (stopped) return;
            stopped = true;
            const now = c.currentTime;
            for (const x of [g, og]) {
                try { x.gain.cancelScheduledValues(now); x.gain.setTargetAtTime(0, now, 0.12); } catch (_) { /* nada */ }
            }
            setTimeout(() => {
                try { src.stop(); osc.stop(); } catch (_) { /* ya parado */ }
                for (const x of [src, f, g, osc, og]) { try { x.disconnect(); } catch (_) { /* nada */ } }
            }, 900);
        };
    }

    tick(urgency = 0) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.005;
        k.tone(this.#ui, { t, f: 1400 + 900 * urgency, dur: 0.035, a: 0.001, r: 0.03, exp: true, peak: 0.07 + 0.09 * urgency });
    }

    // ── Mecánicas de jefes ──────────────────────────────

    shieldReflect(dirId) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.12;
        const ch = this.#spatial(dirId, { send: 0.4 });
        const end = k.bell(ch.input, { t, f: 320, partials: [[1, 1, 0.9], [2.4, 0.7, 0.6], [4.1, 0.4, 0.4], [6.3, 0.2, 0.25]], peak: 0.32 });
        this.#release(ch, end);
    }

    shieldBlock() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.02, out = this.#sfx;
        k.thump(out, { t, f0: 90, f1: 40, dur: 0.4, peak: 0.6 });
        k.noise(out, { t, color: 'brown', dur: 0.5, a: 0.01, r: 0.45, peak: 0.4, filter: { type: 'lowpass', f: 300 } });
        [659, 880].forEach((f, i) => k.tone(out, { t: t + 0.25 + i * 0.09, f, type: 'triangle', dur: 0.2, a: 0.005, r: 0.15, peak: 0.1 }));
    }

    summon() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.02, out = this.#sfx;
        k.noise(out, { t, color: 'white', dur: 0.7, a: 0.6, r: 0.05, peak: 0.25, filter: { type: 'highpass', f: [[0, 400], [0.65, 3000]] } });
        k.tone(out, { t, f: [[0, 110], [0.65, 440]], type: 'sawtooth', dur: 0.7, a: 0.6, r: 0.05, peak: 0.1, filter: { type: 'lowpass', f: 1200 } });
        k.noise(out, { t: t + 0.7, color: 'crackle', dur: 0.5, a: 0.005, r: 0.4, peak: 0.6, filter: { type: 'highpass', f: 1200 } });
        this.duck(t, t + 1.2);
    }

    shift(elId) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.02, out = this.#sfx;
        for (let i = 0; i < 5; i++) {
            k.tone(out, { t: t + i * 0.045, f: 200 + Math.random() * 1600, type: 'square', dur: 0.03, a: 0.001, r: 0.02, peak: 0.07, filter: { type: 'lowpass', f: 3000 } });
        }
        if (ELEMENT_SOUNDS[elId]) ELEMENT_SOUNDS[elId](k, out, t + 0.3, 1);
        this.duck(t, t + 1);
    }

    rage(voiceId) {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.02, out = this.#sfx;
        [55, 58.3, 82.4].forEach(f => k.tone(out, { t, f, type: 'sawtooth', dur: 1.8, a: 0.3, r: 0.8, peak: 0.13, drive: 3, filter: { type: 'lowpass', f: [[0, 250], [0.8, 1600], [1.8, 500]], q: 2 } }));
        k.noise(out, { t, color: 'brown', dur: 1.8, a: 0.2, r: 1, peak: 0.4, filter: { type: 'lowpass', f: 180 } });
        if (voiceId) this.playVoice(voiceId, 'center', { pitch: 0.75, noDuck: true, gain: 0.8 });
        this.duck(t, t + 2);
    }

    // ── Momentos ────────────────────────────────────────

    fightStart() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.02, out = this.#sfx;
        k.noise(out, { t, color: 'pink', dur: 0.5, a: 0.4, r: 0.08, peak: 0.18, filter: { type: 'bandpass', f: [[0, 300], [0.5, 2500]], q: 1 } });
        k.bell(out, { t: t + 0.48, f: 392, partials: [[1, 1, 1.2], [2, 0.5, 0.8], [3, 0.3, 0.5]], peak: 0.2 });
    }

    levelComplete() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.05, out = this.#sfx;
        [523, 659, 784, 1047, 1319].forEach((f, i) => k.tone(out, { t: t + i * 0.09, f, type: 'triangle', dur: 0.35, a: 0.005, r: 0.3, exp: true, peak: 0.14 }));
        [523, 659, 784].forEach(f => k.tone(out, { t: t + 0.45, f, type: 'sawtooth', dur: 1.3, a: 0.05, r: 0.9, peak: 0.05, filter: { type: 'lowpass', f: 2000 } }));
        this.duck(t, t + 1.8, 0.25);
    }

    victory() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.05, out = this.#sfx;
        const chords = [[392, 494, 587], [440, 523, 659], [523, 659, 784, 1047]];
        chords.forEach((ch, i) => ch.forEach(f => k.tone(out, { t: t + i * 0.55, f, type: 'sawtooth', dur: i === 2 ? 2.2 : 0.6, a: 0.03, r: i === 2 ? 1.5 : 0.2, peak: 0.045, filter: { type: 'lowpass', f: 2500 } })));
        [1047, 1319, 1568, 2093].forEach((f, i) => k.tone(out, { t: t + 1.1 + i * 0.08, f, type: 'triangle', dur: 0.5, a: 0.003, r: 0.45, exp: true, peak: 0.1 }));
        k.bell(out, { t: t + 1.1, f: 131, partials: [[1, 1, 3], [2, 0.5, 2], [3, 0.3, 1.5]], peak: 0.3 });
        this.duck(t, t + 3.2, 0.2);
    }

    defeat() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.05, out = this.#sfx;
        [440, 392, 349, 330].forEach((f, i) => k.tone(out, { t: t + i * 0.28, f, type: 'triangle', dur: 0.5, a: 0.01, r: 0.4, peak: 0.13 }));
        k.tone(out, { t, f: [[0, 110], [2.2, 82]], type: 'sawtooth', dur: 2.2, a: 0.2, r: 1.2, peak: 0.12, filter: { type: 'lowpass', f: 500 } });
        this.duck(t, t + 2.5, 0.15);
    }

    achievement() {
        if (!this.ctx) return;
        const k = this.kit, t = this.ctx.currentTime + 0.05, out = this.#ui;
        [1568, 2093, 2637, 3136].forEach((f, i) => k.bell(out, { t: t + i * 0.07, f, partials: [[1, 1, 0.6], [2, 0.3, 0.4]], peak: 0.07 }));
    }

    // ── Interfaz ────────────────────────────────────────

    uiMove() {
        if (!this.ctx) return;
        this.kit.tone(this.#ui, { t: this.ctx.currentTime + 0.003, f: 1250, dur: 0.03, a: 0.002, r: 0.025, exp: true, peak: 0.06 });
    }
    uiSelect() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + 0.003;
        this.kit.tone(this.#ui, { t, f: 660, type: 'triangle', dur: 0.06, a: 0.002, r: 0.05, peak: 0.1 });
        this.kit.tone(this.#ui, { t: t + 0.06, f: 990, type: 'triangle', dur: 0.08, a: 0.002, r: 0.07, peak: 0.1 });
    }
    uiBack() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + 0.003;
        this.kit.tone(this.#ui, { t, f: 880, type: 'triangle', dur: 0.06, a: 0.002, r: 0.05, peak: 0.09 });
        this.kit.tone(this.#ui, { t: t + 0.06, f: 587, type: 'triangle', dur: 0.08, a: 0.002, r: 0.07, peak: 0.09 });
    }
    uiValue(frac) {
        if (!this.ctx) return;
        this.kit.tone(this.#ui, { t: this.ctx.currentTime + 0.003, f: 400 + 900 * clamp(frac, 0, 1), type: 'triangle', dur: 0.05, a: 0.002, r: 0.045, peak: 0.1 });
    }
    uiError() {
        if (!this.ctx) return;
        this.kit.tone(this.#ui, { t: this.ctx.currentTime + 0.003, f: 150, type: 'square', dur: 0.15, a: 0.003, r: 0.1, peak: 0.07, filter: { type: 'lowpass', f: 900 } });
    }

    // ── Latido con poca vida ────────────────────────────

    setHeartbeat(on) {
        if (!on) { clearInterval(this.#heartIv); this.#heartIv = null; return; }
        if (this.#heartIv || !this.ctx) return;
        const beat = () => {
            const t = this.ctx.currentTime + 0.02;
            this.kit.thump(this.#sfx, { t, f0: 62, f1: 40, dur: 0.18, peak: 0.32 });
            this.kit.thump(this.#sfx, { t: t + 0.24, f0: 55, f1: 36, dur: 0.2, peak: 0.24 });
        };
        beat();
        this.#heartIv = setInterval(beat, 1100);
    }
}
