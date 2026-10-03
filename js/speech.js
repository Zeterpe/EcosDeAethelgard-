/* =============================================
   ECOS DE AETHELGARD — speech.js
   Voz del juego (síntesis) o lector de pantalla
   (regiones aria-live). Narraciones cancelables,
   saltables por párrafo y troceadas por frases
   (Chrome corta las frases muy largas).
   ============================================= */
'use strict';

/** Divide un texto en fragmentos cortos que la síntesis lee sin cortarse. */
function splitSpeech(text, max = 220) {
    const sentences = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?…])\s+/);
    const pieces = [];
    for (const s of sentences) {
        if (s.length <= max) { pieces.push(s); continue; }
        let rest = s;
        while (rest.length > max) {
            let cut = Math.max(rest.lastIndexOf(', ', max), rest.lastIndexOf(' ', max));
            if (cut < 40) cut = max;
            pieces.push(rest.slice(0, cut + 1).trim());
            rest = rest.slice(cut + 1).trim();
        }
        if (rest) pieces.push(rest);
    }
    // Junta fragmentos muy cortos para que la lectura sea natural.
    const out = [];
    for (const p of pieces) {
        if (out.length && out[out.length - 1].length + p.length + 1 <= max && out[out.length - 1].length < 90) {
            out[out.length - 1] += ' ' + p;
        } else out.push(p);
    }
    return out.filter(Boolean);
}

class Speech {
    #synth = null; #settings; #unlocked = false;
    #voices = []; #keep = new Set();
    #epoch = 0;            // cambia con cada interrupción
    #narration = 0;        // token de la narración en curso
    #narrating = false;
    #skipPara = false;
    #tail = Promise.resolve();
    #chunkDone = null;     // resolutor del fragmento que suena ahora
    #liveA = null; #liveP = null;
    onCaption = null;
    history = [];          // últimas frases (útil para depurar)

    constructor(settings) {
        this.#settings = settings;
        this.#synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
        this.#liveA = document.getElementById('sr-assertive');
        this.#liveP = document.getElementById('sr-polite');
        if (this.#synth) {
            this.#loadVoices();
            try { this.#synth.onvoiceschanged = () => this.#loadVoices(); } catch (_) { /* opcional */ }
        }
    }

    get available() { return !!this.#synth; }
    get useTTS() { return this.#settings.output !== 'sr' && !!this.#synth; }
    get narrating() { return this.#narrating; }

    unlock() {
        if (this.#unlocked) return;
        this.#unlocked = true;
        if (!this.#synth) return;
        try {
            const u = new SpeechSynthesisUtterance(' ');
            u.volume = 0;
            this.#synth.speak(u);
        } catch (_) { /* sin voz */ }
    }

    // ── Voces ───────────────────────────────────────────
    #loadVoices() {
        try {
            this.#voices = this.#synth.getVoices().filter(v => /^es([-_]|$)/i.test(v.lang));
        } catch (_) { this.#voices = []; }
    }
    get spanishVoices() { return this.#voices; }
    #pickVoice() {
        const s = this.#settings;
        if (s.voiceURI) {
            const v = this.#voices.find(x => x.voiceURI === s.voiceURI);
            if (v) return v;
        }
        return this.#voices.find(v => /es[-_]ES/i.test(v.lang)) || this.#voices[0] || null;
    }
    voiceName() { const v = this.#pickVoice(); return v ? v.name : 'voz predeterminada del sistema'; }

    /** Duración estimada (ms) de un texto hablado. */
    estimate(text, rate = 1) {
        const cps = 14 * this.#settings.speechRate * rate;
        return Math.round(String(text).length / cps * 1000) + 250;
    }

    // ── Habla ───────────────────────────────────────────

    /**
     * Dice un texto. interrupt=true corta lo anterior (y cualquier narración);
     * interrupt=false lo pone a la cola. Devuelve una promesa que se resuelve al terminar.
     */
    say(text, { interrupt = true, pitch = 1, rate = 1 } = {}) {
        if (!text) return Promise.resolve();
        if (interrupt) this.#interrupt();
        const epoch = this.#epoch;
        const valid = () => epoch === this.#epoch;
        const p = this.#tail.then(() => valid() ? this.#speakText(text, { pitch, rate, assertive: interrupt }, valid) : undefined);
        this.#tail = p.catch(() => { });
        return p.then(() => { }, () => { });
    }

    /**
     * Narra varios párrafos. Devuelve true si terminó, false si se saltó o se interrumpió.
     */
    narrate(paragraphs, { gap = 450, pitch = 1, rate = 1, onParagraph = null } = {}) {
        this.#interrupt();
        const token = ++this.#narration;
        const epoch = this.#epoch;
        const alive = () => token === this.#narration && epoch === this.#epoch;
        const run = async () => {
            this.#narrating = true;
            try {
                for (let i = 0; i < paragraphs.length; i++) {
                    if (!alive()) return false;
                    this.#skipPara = false;
                    onParagraph?.(paragraphs[i], i, paragraphs.length);
                    await this.#speakText(paragraphs[i], { pitch, rate, assertive: true }, () => alive() && !this.#skipPara);
                    if (!alive()) return false;
                    if (!this.#skipPara) await this.#waitMs(gap, () => !alive() || this.#skipPara);
                }
                return alive();
            } finally {
                if (token === this.#narration) this.#narrating = false;
            }
        };
        const p = run();
        this.#tail = p.catch(() => { });
        return p.then(r => { if (!alive()) this.#narrating = false; return r; });
    }

    skipParagraph() { this.#skipPara = true; this.#hardCancel(); }
    skipNarration() { this.#narration++; this.#narrating = false; this.#hardCancel(); }
    cancel() { this.#interrupt(); }

    #interrupt() {
        this.#epoch++;
        this.#narration++;
        this.#narrating = false;
        this.#tail = Promise.resolve();
        this.#hardCancel();
    }

    #hardCancel() {
        try { this.#synth?.cancel(); } catch (_) { /* nada */ }
        const r = this.#chunkDone;
        this.#chunkDone = null;
        r?.();
    }

    async #speakText(text, { pitch, rate, assertive }, valid) {
        this.history.push(text);
        if (this.history.length > 300) this.history.splice(0, 100);
        this.onCaption?.(text);
        if (!this.useTTS) {
            this.#announceLive(text, assertive);
            await this.#waitMs(this.estimate(text, rate), () => !valid());
            return;
        }
        for (const chunk of splitSpeech(text)) {
            if (!valid()) return;
            await this.#speakChunk(chunk, pitch, rate);
        }
    }

    #speakChunk(text, pitch, rate) {
        return new Promise(resolve => {
            let done = false, fallback = null;
            const finish = () => {
                if (done) return;
                done = true;
                clearTimeout(fallback);
                this.#keep.delete(u);
                if (this.#chunkDone === finish) this.#chunkDone = null;
                resolve();
            };
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'es-ES';
            const v = this.#pickVoice();
            if (v) { u.voice = v; u.lang = v.lang; }
            u.rate = clamp(this.#settings.speechRate * rate, 0.1, 10);
            u.pitch = clamp(pitch, 0, 2);
            u.volume = clamp(this.#settings.speechVolume, 0, 1);
            u.onend = finish;
            u.onerror = finish;
            // Chrome a veces no dispara onend: red de seguridad.
            fallback = setTimeout(finish, this.estimate(text, rate) * 2 + 4000);
            this.#keep.add(u);   // evita que el recolector elimine la frase a medias
            this.#chunkDone = finish;
            try {
                if (this.#synth.paused) this.#synth.resume();
                this.#synth.speak(u);
            } catch (_) { finish(); }
        });
    }

    #announceLive(text, assertive) {
        const el = assertive ? this.#liveA : this.#liveP;
        if (!el) return;
        el.textContent = '';
        setTimeout(() => { el.textContent = text; }, 40);
    }

    #waitMs(ms, cancelled) {
        return new Promise(resolve => {
            const start = performance.now();
            const iv = setInterval(() => {
                if (cancelled() || performance.now() - start >= ms) { clearInterval(iv); resolve(); }
            }, 50);
        });
    }
}
