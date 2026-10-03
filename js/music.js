/* =============================================
   ECOS DE AETHELGARD — music.js
   Música generativa por zonas (sin archivos):
   pads, bajo, arpegios, motivo melódico, percusión
   y ambiente de fondo. La intensidad sube en
   combate y en la furia de los jefes.
   ============================================= */
'use strict';

const SCALES = {
    aeolian: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11],
    whole: [0, 2, 4, 6, 8, 10],
    dim: [0, 2, 3, 5, 6, 8, 9, 11],
};

/*
 * Patrones de 16 (o 12) pasos: 'x' suena desde la intensidad 2,
 * 'o' solo en intensidad 3 (furia / jefes), '.' silencio.
 * arp.pattern: índice de nota del acorde (0-2, 3+ = octava) o null.
 */
const THEMES = {
    menu: {
        bpm: 64, root: 50, scale: 'aeolian', prog: [0, 5, 2, 6], barsPerChord: 2, padCut: 800,
        bass: 'x...............',
        arp: { pattern: [0, null, null, 2, null, null, 4, null, 3, null, null, 1, null, null, 2, null], inst: 'bell', oct: 1 },
        bed: 'wind', lead: { inst: 'bell', oct: 2, density: 0.25 },
    },
    academy: {
        bpm: 84, root: 45, scale: 'aeolian', prog: [0, 5, 3, 4], barsPerChord: 1, padCut: 900,
        bass: 'x.......x.......',
        arp: { pattern: [0, null, 1, null, 2, null, 1, null, 3, null, 2, null, 1, null, 2, null], inst: 'pluck', oct: 1 },
        drums: { kick: 'x.......x.......', hat: '....x.......x...', snare: '........o.......' },
        bed: 'hall', lead: { inst: 'bell', oct: 2, density: 0.3 },
    },
    fields: {
        bpm: 96, root: 40, scale: 'dorian', prog: [0, 3, 6, 0], barsPerChord: 1, padCut: 1000,
        bass: 'x.....x...x.....',
        arp: { pattern: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 2, 1], inst: 'pluck', oct: 1, every: 2 },
        drums: { kick: 'x.....x...x.....', snare: '....x.......x...', hat: '..x...x...x...x.', shaker: 'o.o.o.o.o.o.o.o.' },
        bed: 'wind', lead: { inst: 'flute', oct: 2, density: 0.4 },
    },
    threshold: {
        bpm: 104, root: 48, scale: 'harmonic', prog: [0, 5, 3, 4], barsPerChord: 1, padCut: 700,
        bass: 'x..x..x.x..x..x.',
        arp: { pattern: [0, 2, 4, 2, 1, 3, 1, 2, 0, 2, 4, 2, 3, 1, 2, 1], inst: 'pluck', oct: 1 },
        drums: { kick: 'x.....x.x.......', tom: '..........x..x..', hat: 'x.x.x.x.x.x.x.x.', snare: '....o.......o...' },
        bed: 'void',
    },
    fire: {
        bpm: 116, root: 40, scale: 'phrygian', prog: [0, 1, 0, 6], barsPerChord: 1, padCut: 1100, bassWave: 'sawtooth',
        bass: 'x..x..x.x..x..x.',
        arp: { pattern: [0, null, 1, 2, null, 1, 0, null, 2, null, 3, 2, 1, null, 0, null], inst: 'pluck', oct: 1 },
        drums: { taiko: 'x.....x...x.....', tom: '...x.....x...x.x', clank: '........x.......', hat: 'o.o.o.o.o.o.o.o.' },
        bed: 'fire',
    },
    water: {
        bpm: 60, root: 37, scale: 'aeolian', prog: [0, 5, 6, 4], barsPerChord: 2, padCut: 600,
        bass: 'x...............',
        arp: { pattern: [4, null, null, null, 2, null, null, null, 3, null, null, null, 1, null, null, null], inst: 'bell', oct: 1 },
        drums: { kick: 'x...............', shaker: 'o.......o.......' },
        bed: 'water', lead: { inst: 'bell', oct: 2, density: 0.2 },
    },
    wind: {
        bpm: 76, steps: 12, stepsPerBeat: 3, root: 43, scale: 'dorian', prog: [0, 3, 0, 6], barsPerChord: 1, padCut: 1200,
        bass: 'x.....x.....',
        arp: { pattern: [0, 1, 2, 3, 2, 1, 0, 1, 2, 4, 2, 1], inst: 'pluck', oct: 1 },
        drums: { kick: 'x.....x.....', shaker: 'x.xx.xx.xx.x', snare: '...o.....o..' },
        bed: 'wind', lead: { inst: 'flute', oct: 2, density: 0.5 },
    },
    earth: {
        bpm: 72, root: 35, scale: 'aeolian', prog: [0, 6, 5, 6], barsPerChord: 2, padCut: 500,
        bass: 'x.......x.......',
        arp: { pattern: [0, null, null, null, null, null, 1, null, null, null, null, null, 2, null, null, null], inst: 'pluck', oct: 0 },
        drums: { taiko: 'x.......x..x....', tom: '.....o.......o..', kick: 'x...............' },
        bed: 'earth',
    },
    shadow: {
        bpm: 90, root: 42, scale: 'whole', prog: [0, 2, 4, 1], barsPerChord: 1, padCut: 700,
        bass: 'x.....x.........',
        arp: { pattern: [0, null, 2, null, 1, null, 3, null, null, 2, null, 4, null, 1, null, null], inst: 'bell', oct: 1 },
        drums: { tom: 'x...x.....x.....', hat: '..o...o...o...o.' },
        bed: 'void',
    },
    final: {
        bpm: 128, root: 36, scale: 'dim', prog: [0, 2, 4, 6], barsPerChord: 1, padWave: 'sine', padCut: 900, choir: true, bassWave: 'sawtooth',
        bass: 'x.x.x.x.x.x.x.x.',
        arp: { pattern: [0, 2, 4, 6, 4, 2, 0, 2, 1, 3, 5, 3, 1, 3, 5, 7], inst: 'pluck', oct: 1 },
        drums: { heart: 'x..x............', kick: '........x.......', hat: 'o.o.o.o.o.o.o.o.', snare: '....o.......o...' },
        bed: 'void',
    },
    arena: {
        bpm: 124, root: 45, scale: 'aeolian', prog: [0, 5, 6, 4], barsPerChord: 1, padCut: 1200, bassWave: 'sawtooth',
        bass: 'x.x.x.x.x.x.x.x.',
        arp: { pattern: [0, 1, 2, 1, 3, 2, 1, 2, 0, 1, 2, 1, 4, 2, 1, 2], inst: 'pluck', oct: 1 },
        drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', shaker: 'o.o.o.o.o.o.o.o.' },
        lead: { inst: 'bell', oct: 2, density: 0.3 },
    },
};

class MusicEngine {
    #audio; #themeId = null; #theme = null; #out = null; #bed = null;
    #timer = null; #nextTime = 0; #step = 0; #intensity = 1; #tempo = 1;
    #delay = null; #motif = []; #pending = null; #paused = false;

    constructor(audio) { this.#audio = audio; }

    get current() { return this.#themeId; }

    play(themeId, { intensity = 1 } = {}) {
        this.#intensity = intensity;
        if (!this.#audio.ready) { this.#pending = { themeId, intensity }; return; }
        if (this.#themeId === themeId && this.#out) return;
        this.#fadeOut(1.6);
        const th = THEMES[themeId];
        if (!th) { this.#themeId = null; this.#theme = null; return; }
        const c = this.#audio.ctx;
        this.#themeId = themeId;
        this.#theme = th;
        this.#tempo = 1;
        this.#out = c.createGain();
        this.#out.gain.setValueAtTime(0, c.currentTime);
        this.#out.gain.linearRampToValueAtTime(1, c.currentTime + 2);
        this.#out.connect(this.#audio.musicIn);
        // Eco rítmico para arpegios y melodía.
        const d = c.createDelay(1.5), fb = c.createGain(), wet = c.createGain();
        d.delayTime.value = 60 / th.bpm * 0.75;
        fb.gain.value = 0.3; wet.gain.value = 0.28;
        d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(this.#out);
        this.#delay = { input: d, nodes: [d, fb, wet] };
        this.#bed = th.bed ? this.#startBed(th.bed) : null;
        this.#makeMotif(themeId);
        this.#step = 0;
        this.#nextTime = c.currentTime + 0.15;
        if (!this.#timer) this.#timer = setInterval(() => this.#schedule(), 25);
    }

    /** Arranca la música pedida antes de que el audio estuviera listo. */
    resumePending() {
        if (this.#pending && this.#audio.ready) {
            const p = this.#pending;
            this.#pending = null;
            this.play(p.themeId, { intensity: p.intensity });
        }
    }

    setIntensity(x) { this.#intensity = x; }
    setTempo(mul) { this.#tempo = mul; }
    setPaused(on) {
        this.#paused = on;
        if (this.#out && this.#audio.ready) this.#out.gain.setTargetAtTime(on ? 0.35 : 1, this.#audio.now, 0.3);
    }

    stop(fade = 1.5) {
        this.#pending = null;
        this.#fadeOut(fade);
        this.#themeId = null;
        this.#theme = null;
        clearInterval(this.#timer);
        this.#timer = null;
    }

    #fadeOut(fade) {
        const out = this.#out, bed = this.#bed, delay = this.#delay;
        this.#out = null; this.#bed = null; this.#delay = null;
        if (!out || !this.#audio.ready) return;
        const now = this.#audio.now;
        try {
            out.gain.cancelScheduledValues(now);
            out.gain.setValueAtTime(out.gain.value, now);
            out.gain.linearRampToValueAtTime(0, now + fade);
        } catch (_) { /* nada */ }
        setTimeout(() => {
            try { out.disconnect(); } catch (_) { /* nada */ }
            bed?.stop();
            delay?.nodes.forEach(n => { try { n.disconnect(); } catch (_) { /* nada */ } });
        }, fade * 1000 + 300);
    }

    #makeMotif(themeId) {
        const rnd = makeRng(themeId);   // el motivo de cada tema siempre es el mismo
        const steps = (this.#theme.steps || 16) * 2;
        this.#motif = Array.from({ length: steps }, (_, i) => {
            if (i % 2 === 1) return null;
            return rnd() < (this.#theme.lead?.density ?? 0) ? Math.floor(rnd() * 5) : null;
        });
    }

    #schedule() {
        const th = this.#theme;
        if (!th || !this.#out) return;
        const c = this.#audio.ctx;
        const stepDur = 60 / (th.bpm * this.#tempo) / (th.stepsPerBeat || 4);
        if (this.#nextTime < c.currentTime - 0.2) this.#nextTime = c.currentTime + 0.05;
        while (this.#nextTime < c.currentTime + 0.15) {
            this.#playStep(this.#step, this.#nextTime, stepDur);
            this.#nextTime += stepDur;
            this.#step++;
        }
    }

    #degree(d) {
        const s = SCALES[this.#theme.scale];
        const oct = Math.floor(d / s.length);
        return this.#theme.root + s[((d % s.length) + s.length) % s.length] + 12 * oct;
    }

    #chord(d) { return [this.#degree(d), this.#degree(d + 2), this.#degree(d + 4)]; }

    #playStep(step, t, sd) {
        const th = this.#theme, I = this.#intensity;
        const spb = th.steps || 16;
        const pos = step % spb, bar = Math.floor(step / spb);
        const bpc = th.barsPerChord || 1;
        const chord = this.#chord(th.prog[Math.floor(bar / bpc) % th.prog.length]);
        const tone = (idx) => chord[idx % 3] + 12 * Math.floor(idx / 3);

        if (pos === 0 && bar % bpc === 0) this.#pad(chord, t, sd * spb * bpc);
        if (I >= 1 && th.bass && th.bass[pos % th.bass.length] === 'x') this.#bass(chord[0] - 12, t, sd * 3);
        if (I >= 1 && th.arp) {
            const idx = th.arp.pattern[pos % th.arp.pattern.length];
            if (idx != null && pos % (th.arp.every || 1) === 0) this.#inst(th.arp.inst, tone(idx) + 12 * (th.arp.oct ?? 1), t, sd);
        }
        if (I >= 1 && th.lead && bar % 4 >= 2) {
            const m = this.#motif[(step % (spb * 2))];
            if (m != null) this.#inst(th.lead.inst, tone(m) + 12 * th.lead.oct, t, sd * 2);
        }
        if (I >= 2 && th.drums) {
            for (const [name, pat] of Object.entries(th.drums)) {
                const ch = pat[pos % pat.length];
                if (ch === 'x' || (ch === 'o' && I >= 3)) this.#drum(name, t);
            }
        }
        if (th.bed === 'water' && Math.random() < 0.04) this.#bubble(t);
    }

    // ── Instrumentos ────────────────────────────────────

    #pad(chord, t, dur) {
        const k = this.#audio.kit, th = this.#theme, out = this.#out;
        const total = dur + 0.8;
        chord.forEach(n => {
            const f = mtof(n);
            [-7, 7].forEach(det => k.tone(out, {
                t, f, type: th.padWave || 'sawtooth', detune: det, dur: total,
                a: Math.min(1.2, dur * 0.3), r: Math.min(1.6, dur * 0.45), peak: 0.032,
                filter: { type: 'lowpass', f: th.padCut || 900, q: 0.5 },
            }));
            if (th.choir) k.tone(out, { t, f: f * 2, dur: total, a: dur * 0.4, r: dur * 0.4, peak: 0.02, vib: { rate: 4.5, depth: 3 } });
        });
    }

    #bass(n, t, dur) {
        const k = this.#audio.kit, th = this.#theme;
        k.tone(this.#out, { t, f: mtof(n), type: th.bassWave || 'triangle', dur, a: 0.01, r: 0.15, peak: th.bassWave ? 0.07 : 0.13, filter: { type: 'lowpass', f: 420 } });
        k.tone(this.#out, { t, f: mtof(n - 12), dur, a: 0.01, r: 0.15, peak: 0.08 });
    }

    #inst(name, n, t, dur) {
        const k = this.#audio.kit, out = this.#out, f = mtof(n);
        const send = this.#delay?.input;
        if (name === 'pluck') {
            k.tone(out, { t, f, type: 'triangle', dur: 0.4, a: 0.003, r: 0.38, exp: true, peak: 0.055 });
            if (send) k.tone(send, { t, f, type: 'triangle', dur: 0.3, a: 0.003, r: 0.28, exp: true, peak: 0.03 });
        } else if (name === 'bell') {
            k.bell(out, { t, f, partials: [[1, 1, 1.4], [2, 0.35, 0.9], [3.01, 0.15, 0.5]], peak: 0.045 });
            if (send) k.bell(send, { t, f, partials: [[1, 1, 0.8]], peak: 0.025 });
        } else if (name === 'flute') {
            k.tone(out, { t, f, dur: Math.max(0.3, dur), a: 0.08, r: 0.2, peak: 0.05, vib: { rate: 5, depth: f * 0.008 } });
            k.noise(out, { t, color: 'white', dur: Math.max(0.3, dur), a: 0.06, r: 0.15, peak: 0.012, filter: { type: 'bandpass', f: f * 2, q: 4 } });
            if (send) k.tone(send, { t, f, dur: 0.3, a: 0.05, r: 0.2, peak: 0.02 });
        }
    }

    #drum(name, t) {
        const k = this.#audio.kit, out = this.#out;
        switch (name) {
            case 'kick': k.thump(out, { t, f0: 110, f1: 42, dur: 0.3, peak: 0.32 }); break;
            case 'snare':
                k.noise(out, { t, color: 'white', dur: 0.14, a: 0.001, r: 0.13, exp: true, peak: 0.11, filter: { type: 'bandpass', f: 1800, q: 0.8 } });
                k.tone(out, { t, f: 190, type: 'triangle', dur: 0.08, a: 0.001, r: 0.07, peak: 0.07 });
                break;
            case 'hat': k.noise(out, { t, color: 'white', dur: 0.04, a: 0.001, r: 0.035, exp: true, peak: 0.045, filter: { type: 'highpass', f: 7500 } }); break;
            case 'shaker': k.noise(out, { t, color: 'white', dur: 0.06, a: 0.02, r: 0.04, peak: 0.03, filter: { type: 'bandpass', f: 6000, q: 2 } }); break;
            case 'tom': k.thump(out, { t, f0: 170, f1: 95, dur: 0.25, peak: 0.2 }); break;
            case 'taiko':
                k.thump(out, { t, f0: 78, f1: 48, dur: 0.5, peak: 0.4 });
                k.noise(out, { t, color: 'brown', dur: 0.2, a: 0.002, r: 0.18, peak: 0.14, filter: { type: 'lowpass', f: 300 } });
                break;
            case 'clank': k.bell(out, { t, f: 880, partials: [[1, 1, 0.4], [2.76, 0.5, 0.25], [5.4, 0.25, 0.15]], peak: 0.05 }); break;
            case 'heart':
                k.thump(out, { t, f0: 62, f1: 38, dur: 0.2, peak: 0.34 });
                break;
        }
    }

    #bubble(t) {
        const f0 = 300 + Math.random() * 500;
        this.#audio.kit.tone(this.#out, { t, f: [[0, f0], [0.06, f0 * 2.2]], dur: 0.08, a: 0.004, r: 0.05, peak: 0.03 });
    }

    #startBed(type) {
        const c = this.#audio.ctx, kit = this.#audio.kit, nodes = [];
        const loop = (color, gain, setup) => {
            const src = c.createBufferSource();
            src.buffer = kit.buf[color]; src.loop = true;
            const f = c.createBiquadFilter();
            const g = c.createGain(); g.gain.value = gain;
            setup(f);
            src.connect(f); f.connect(g); g.connect(this.#out);
            src.start(c.currentTime, Math.random());
            nodes.push(src, f, g);
            return f;
        };
        const lfo = (param, rate, depth) => {
            const o = c.createOscillator(), og = c.createGain();
            o.frequency.value = rate; og.gain.value = depth;
            o.connect(og); og.connect(param); o.start();
            nodes.push(o, og);
        };
        if (type === 'wind') { const f = loop('white', 0.035, f => { f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 3; }); lfo(f.frequency, 0.07, 450); }
        if (type === 'fire') { loop('crackle', 0.14, f => { f.type = 'highpass'; f.frequency.value = 1500; }); loop('brown', 0.07, f => { f.type = 'lowpass'; f.frequency.value = 200; }); }
        if (type === 'water') loop('brown', 0.11, f => { f.type = 'lowpass'; f.frequency.value = 500; });
        if (type === 'earth') loop('brown', 0.16, f => { f.type = 'lowpass'; f.frequency.value = 90; });
        if (type === 'void') { const f = loop('white', 0.025, f => { f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 12; }); lfo(f.frequency, 0.11, 1500); }
        if (type === 'hall') loop('pink', 0.025, f => { f.type = 'lowpass'; f.frequency.value = 300; });
        return {
            stop: () => nodes.forEach(n => {
                try { if (n.stop) n.stop(); } catch (_) { /* nada */ }
                try { n.disconnect(); } catch (_) { /* nada */ }
            }),
        };
    }
}
