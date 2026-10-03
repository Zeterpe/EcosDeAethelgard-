/* =============================================
   ECOS DE AETHELGARD — ui.js
   Pantallas, navegación con flechas, lectura del
   foco, diálogos modales, narraciones saltables,
   listas genéricas, opciones y HUD de combate.
   ============================================= */
'use strict';

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════════
// UI: pantallas y foco
// ═══════════════════════════════════════════════════════

const UI = {
    speech: null, audio: null, settings: null, narrator: null,
    screens: {},
    current: 'splash',
    backHandlers: {},
    _polite: false,
    _silent: false,
    _captionT: null,
    _toastT: null,

    init({ speech, audio, settings, narrator = null }) {
        this.speech = speech; this.audio = audio; this.settings = settings; this.narrator = narrator;
        document.querySelectorAll('.screen').forEach(el => { this.screens[el.id.replace('screen-', '')] = el; });
        document.addEventListener('focusin', e => this._onFocus(e));
        speech.onCaption = text => this.caption(text);
    },

    show(name, { focus = null, intro = null, silent = false } = {}) {
        Narration.cancel();   // cambiar de pantalla corta la narración que siguiera sonando
        for (const [k, el] of Object.entries(this.screens)) el.classList.toggle('active', k === name);
        this.current = name;
        document.body.dataset.screen = name;
        window.scrollTo(0, 0);
        if (intro) this.say(intro);
        const scr = this.screens[name];
        // El foco se calcula después de mostrar la pantalla (antes los elementos están ocultos).
        if (typeof focus === 'function') focus = focus();
        const target = typeof focus === 'string' ? $(focus) : (focus || this.navItems(scr)[0] || scr.querySelector('h1,h2'));
        if (target) this.focus(target, { polite: !!intro, silent });
    },

    say(text, opts) { return this.speech.say(text, opts); },

    /** Enfoca un elemento. polite: su lectura espera a lo que se esté diciendo. silent: no se lee. */
    focus(el, { polite = false, silent = false } = {}) {
        if (!el) return;
        if (!el.matches('button, input, select, textarea, a[href], [tabindex]')) el.setAttribute('tabindex', '-1');
        this._polite = polite;
        this._silent = silent;
        const already = document.activeElement === el;
        el.focus({ preventScroll: false });
        if (already && !silent) this._speakEl(el, polite);
        this._polite = false;
        this._silent = false;
        el.scrollIntoView?.({ block: 'nearest' });
    },

    _onFocus(e) {
        if (this._silent) return;
        this._speakEl(e.target, this._polite);
    },

    _speakEl(el, polite) {
        if (this.settings.output !== 'tts' || Narration.active) return;
        const text = this.describe(el);
        if (text) this.speech.say(text, { interrupt: !polite });
    },

    describe(el) {
        if (!el || el === document.body) return '';
        if (el.dataset.speak) return el.dataset.speak;
        const role = el.getAttribute('role');
        let label = el.getAttribute('aria-label') || '';
        if (!label) {
            if (el.tagName === 'INPUT') {
                const l = (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('label');
                const name = l ? l.textContent.replace(/\s+/g, ' ').trim() : '';
                if (el.type === 'checkbox') label = `${name}, casilla, ${el.checked ? 'marcada' : 'sin marcar'}. Espacio para cambiar`;
                else if (el.type === 'password') label = `${name}, campo de contraseña${el.value ? `, ${plural(el.value.length, 'carácter', 'caracteres')}` : ', vacío'}`;
                else label = `${name}, cuadro de texto${el.value ? ': ' + el.value : ', vacío'}`;
            } else label = el.textContent.replace(/\s+/g, ' ').trim();
        }
        if (role === 'slider') label += `: ${el.getAttribute('aria-valuetext')}`;
        if (role === 'switch') label += `: ${el.getAttribute('aria-checked') === 'true' ? 'activado' : 'desactivado'}`;
        if (el.dataset.desc) label += `. ${el.dataset.desc}`;
        return label;
    },

    /** Eco de teclado para quien juega sin lector de pantalla. */
    echoKey(e) {
        const el = e.target;
        if (this.settings.output !== 'tts' || !el || el.tagName !== 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
        if (el.type === 'checkbox') {
            if (e.key === ' ') setTimeout(() => this.say(el.checked ? 'Marcada' : 'Sin marcar'), 0);
            return;
        }
        if (el.type === 'password') {
            if (e.key.length === 1) this.audio.uiMove();
            else if (e.key === 'Backspace') this.say(el.value ? 'borrado' : 'vacío');
            return;
        }
        if (e.key.length === 1) this.say(e.key === ' ' ? 'espacio' : e.key === '@' ? 'arroba' : e.key === '.' ? 'punto' : e.key);
        else if (e.key === 'Backspace') this.say(el.value ? `${el.value.slice(-1)} borrada` : 'vacío');
    },

    navItems(container) {
        if (!container) return [];
        return [...container.querySelectorAll('[data-nav]')].filter(el =>
            !el.disabled && !el.closest('[hidden]') && el.offsetParent !== null);
    },

    moveFocus(delta, container = this.screens[this.current]) {
        const items = this.navItems(container);
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement);
        let next;
        if (delta === 'first') next = 0;
        else if (delta === 'last') next = items.length - 1;
        else next = idx === -1 ? 0 : (idx + delta + items.length) % items.length;
        this.audio.uiMove();
        this.focus(items[next]);
    },

    back() {
        const h = this.backHandlers[this.current];
        if (h) { this.audio.uiBack(); h(); return true; }
        return false;
    },

    caption(text) {
        const el = $('caption');
        if (!el) return;
        el.textContent = text;
        el.classList.add('show');
        clearTimeout(this._captionT);
        this._captionT = setTimeout(() => el.classList.remove('show'), Math.max(3500, text.length * 70));
        if (this.current === 'combat') CombatView.log(text);
    },

    toast(text) {
        const el = $('toast');
        el.textContent = text;
        el.classList.add('show');
        clearTimeout(this._toastT);
        this._toastT = setTimeout(() => el.classList.remove('show'), 4000);
    },
};

// ═══════════════════════════════════════════════════════
// Diálogo modal
// ═══════════════════════════════════════════════════════

const Dialog = {
    active: false,
    _resolve: null,
    _cancel: undefined,
    _prevFocus: null,

    /**
     * buttons: [{ label, desc, value, action, keep }]
     * cancel: valor devuelto con Escape (undefined = Escape no cierra)
     */
    open({ title, text = '', speak = null, buttons, cancel = undefined, focusIndex = 0, fields = null }) {
        if (this.active) this.close(this._cancel);
        return new Promise(resolve => {
            this._resolve = resolve;
            this._cancel = cancel;
            this._prevFocus = document.activeElement;
            $('dialog-title').textContent = title;
            const textEl = $('dialog-text');
            textEl.innerHTML = '';
            String(text).split('\n').filter(Boolean).forEach(line => {
                const p = document.createElement('p');
                p.textContent = line;
                textEl.appendChild(p);
            });
            this._fields = fields || null;
            if (fields) {
                const wrap = document.createElement('div');
                wrap.className = 'form-group dialog-fields';
                fields.forEach((f, i) => {
                    const id = `dlg-field-${i}`;
                    const lab = document.createElement('label');
                    lab.setAttribute('for', id);
                    lab.textContent = f.label;
                    const inp = document.createElement('input');
                    inp.id = id;
                    inp.type = f.type || 'text';
                    inp.value = f.value ?? '';
                    inp.autocomplete = f.autocomplete || 'off';
                    if (f.maxlength) inp.maxLength = f.maxlength;
                    inp.dataset.nav = '';
                    inp.dataset.field = f.id;
                    wrap.append(lab, inp);
                });
                textEl.appendChild(wrap);
            }
            const box = $('dialog-buttons');
            box.innerHTML = '';
            buttons.forEach(b => {
                const btn = document.createElement('button');
                btn.className = 'menu-btn' + (b.danger ? ' danger' : '');
                btn.dataset.nav = '';
                btn.textContent = b.label;
                if (b.desc) btn.dataset.desc = b.desc;
                btn.addEventListener('click', () => {
                    UI.audio.uiSelect();
                    if (b.action) b.action(btn);
                    if (b.submit) { this.close(this.fieldValues()); return; }
                    if (!b.keep) this.close(b.value);
                });
                if (b.submit) btn.dataset.submit = '';
                box.appendChild(btn);
            });
            $('dialog').hidden = false;
            this.active = true;
            // Con lector de pantalla, el propio lector lee el diálogo (aria-describedby) al recibir el foco.
            if (UI.settings.output === 'tts') UI.say(`${title}. ${speak ?? String(text).replace(/\n/g, ' ')}`.trim());
            const first = fields ? UI.navItems(textEl)[0] : null;
            const btns = UI.navItems(box);
            UI.focus(first || btns[focusIndex] || btns[0], { polite: true });
        });
    },

    fieldValues() {
        const out = {};
        $('dialog-text').querySelectorAll('[data-field]').forEach(inp => { out[inp.dataset.field] = inp.value; });
        return out;
    },

    close(value) {
        if (!this.active) return;
        this.active = false;
        $('dialog').hidden = true;
        const r = this._resolve;
        this._resolve = null;
        const prev = this._prevFocus;
        if (prev && document.contains(prev) && prev.offsetParent !== null) UI.focus(prev, { silent: true });
        r?.(value);
    },

    onKey(e) {
        const box = $('dialog-buttons'), panel = $('dialog');
        const inInput = e.target?.tagName === 'INPUT';
        UI.echoKey(e);
        if (e.key === 'ArrowDown' || (!inInput && e.key === 'ArrowRight')) { e.preventDefault(); UI.moveFocus(1, panel); return true; }
        if (e.key === 'ArrowUp' || (!inInput && e.key === 'ArrowLeft')) { e.preventDefault(); UI.moveFocus(-1, panel); return true; }
        if (e.key === 'Tab') { e.preventDefault(); UI.moveFocus(e.shiftKey ? -1 : 1, panel); return true; }
        if (e.key === 'Enter' && inInput) {
            e.preventDefault();
            box.querySelector('[data-submit]')?.click();
            return true;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            if (this._cancel !== undefined) { UI.audio.uiBack(); this.close(this._cancel); }
            return true;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            if (inInput) return true;
            if (!panel.contains(document.activeElement)) {
                e.preventDefault();
                UI.focus(UI.navItems(box)[0]);
            }
            return true;   // el botón enfocado se activa de forma nativa
        }
        return true;       // el resto de teclas no atraviesa el diálogo
    },
};

// ═══════════════════════════════════════════════════════
// Narración (ecos, historia, furia de los jefes)
// ═══════════════════════════════════════════════════════

const Narration = {
    active: false,
    _prevFocus: null,
    _recorded: false,
    _token: 0,

    /** key: sección de la historia con narración grabada (si existe). */
    async run(paragraphs, { title = '', pitch = 1, gap = 450, key = null } = {}) {
        if (!paragraphs || !paragraphs.length) return true;
        const token = ++this._token;
        const current = () => token === this._token;
        if (this.active) this._stopSound();          // otra narración seguía sonando: la sustituye
        else this._prevFocus = document.activeElement;
        this.active = true;
        $('narration-title').textContent = title;
        $('narration-text').textContent = '';
        $('narration-progress').textContent = '';
        $('narration').hidden = false;
        UI.focus($('narration-text'), { silent: true });
        let ok;
        const onParagraph = (p, i, n) => {
            if (!current()) return;
            $('narration-text').textContent = p;
            $('narration-progress').textContent = n > 1 ? `${i + 1} de ${n}` : '';
        };
        const plan = UI.narrator ? UI.narrator.plan(key, paragraphs) : null;
        // Solo la historia (las narraciones con clave) usa la «Velocidad de la historia».
        const rate = key ? clamp(UI.settings.storyRate || 1, 0.7, 1.5) : 1;
        this._recorded = !!plan;
        try {
            if (plan) {
                UI.speech.cancel();
                ok = await UI.narrator.play(paragraphs, plan, {
                    gap: Math.round((gap + 500) / rate), onParagraph,
                    tts: p => UI.speech.say(p, { pitch, rate }),
                    cancelTts: () => UI.speech.cancel(),
                });
            } else {
                ok = await UI.speech.narrate(paragraphs, { pitch, gap: Math.round(gap / rate), rate, onParagraph });
            }
        } finally {
            // Si otra narración la ha sustituido, la pantalla ya es de esa otra.
            if (current()) {
                this._recorded = false;
                this.active = false;
                $('narration').hidden = true;
                const prev = this._prevFocus;
                if (prev && document.contains(prev) && prev.offsetParent !== null) UI.focus(prev, { silent: true });
            }
        }
        return ok && current();
    },

    _stopSound() {
        if (this._recorded) UI.narrator?.skipAll(); else UI.speech.skipNarration();
    },

    /** Corta la narración en curso, si la hay (al cambiar de pantalla). */
    cancel() {
        if (!this.active) return;
        this._token++;
        this._stopSound();
        this._recorded = false;
        this.active = false;
        $('narration').hidden = true;
    },

    onKey(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!e.repeat) { UI.audio.uiMove(); if (this._recorded) UI.narrator.skipParagraph(); else UI.speech.skipParagraph(); }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            UI.audio.uiBack();
            if (this._recorded) UI.narrator.skipAll(); else UI.speech.skipNarration();
        }
        return true;
    },
};

// ═══════════════════════════════════════════════════════
// Pantalla de lista genérica
// ═══════════════════════════════════════════════════════

const ListScreen = {
    _opts: null,

    /**
     * items: [{ label, sub, speak, action, icon, cls }]
     * tabs: ['Arena', 'Historia'] con onTab(index) → { items, intro }
     */
    open(opts) {
        this._opts = opts;
        $('list-title').textContent = opts.title;
        $('list-hint').textContent = opts.hint || 'Flechas arriba y abajo para recorrer · Enter para elegir · Escape para volver';
        $('btn-list-back').textContent = opts.backLabel || 'Volver';
        UI.backHandlers.list = opts.onBack;
        this._renderTabs();
        this.render(opts.items);
        UI.show('list', {
            intro: opts.intro,
            focus: () => {
                const items = UI.navItems($('list-items'));
                return items[Math.min(opts.focusIndex || 0, items.length - 1)] || $('btn-list-back');
            },
        });
    },

    _renderTabs() {
        const o = this._opts, el = $('list-tabs');
        if (!o.tabs) { el.hidden = true; return; }
        el.hidden = false;
        el.innerHTML = o.tabs.map((t, i) => `<span class="tab${i === o.tabIndex ? ' active' : ''}">${escapeHtml(t)}</span>`).join('<span aria-hidden="true"> · </span>') +
            '<span class="hint"> (izquierda y derecha para cambiar)</span>';
    },

    render(items) {
        const ul = $('list-items');
        ul.innerHTML = '';
        if (!items.length) {
            const li = document.createElement('li');
            li.className = 'empty';
            li.textContent = this._opts.emptyText || 'No hay nada aquí todavía.';
            ul.appendChild(li);
            return;
        }
        items.forEach(it => {
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.className = 'list-item' + (it.cls ? ' ' + it.cls : '');
            b.dataset.nav = '';
            b.innerHTML = `${it.icon ? `<span class="li-icon" aria-hidden="true">${it.icon}</span>` : ''}` +
                `<span class="li-body"><span class="li-label">${escapeHtml(it.label)}</span>` +
                `${it.sub ? `<span class="li-sub">${escapeHtml(it.sub)}</span>` : ''}</span>`;
            if (it.speak) b.dataset.speak = it.speak;
            b.setAttribute('aria-label', it.speak || it.label + (it.sub ? '. ' + it.sub : ''));
            b.addEventListener('click', () => {
                if (it.action) { UI.audio.uiSelect(); it.action(); }
                else if (UI.settings.output === 'tts') UI.say(it.speak || it.label);
            });
            li.appendChild(b);
            ul.appendChild(li);
        });
    },

    onKey(e) {
        const o = this._opts;
        if (o?.tabs && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
            const n = o.tabs.length;
            o.tabIndex = (o.tabIndex + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
            const res = o.onTab(o.tabIndex);
            this._renderTabs();
            this.render(res.items);
            UI.audio.uiMove();
            UI.say(res.intro);
            const first = UI.navItems($('list-items'))[0];
            if (first) UI.focus(first, { polite: true });
            return true;
        }
        return false;
    },
};

// ═══════════════════════════════════════════════════════
// Opciones
// ═══════════════════════════════════════════════════════

const OptionsScreen = {
    _defs: [], _settings: null, _onChange: null,

    open(defs, settings, onChange) {
        this._defs = defs; this._settings = settings; this._onChange = onChange;
        this.render();
        UI.show('options', { intro: 'Opciones.' });
    },

    _value(def) { return def.get ? def.get() : this._settings[def.id]; },

    _text(def) {
        const v = this._value(def);
        if (def.type === 'range') return def.fmt ? def.fmt(v) : String(v);
        if (def.type === 'choice') return def.labels[v] ?? String(v);
        if (def.type === 'voice') return def.label2();
        return '';
    },

    render() {
        const ul = $('options-list');
        ul.innerHTML = '';
        this._defs.forEach(def => {
            const li = document.createElement('li');
            li.className = 'option-row';
            const el = document.createElement('div');
            el.className = 'option' + (def.danger ? ' danger' : '');
            el.dataset.nav = '';
            el.dataset.opt = def.id;
            el.tabIndex = 0;
            this._fill(el, def);
            el.addEventListener('click', ev => {
                const btn = ev.target.closest('[data-step]');
                if (btn) this.adjust(def, +btn.dataset.step, el);
                else if (def.type === 'bool' || def.type === 'action') this.activate(def, el);
            });
            li.appendChild(el);
            ul.appendChild(li);
        });
    },

    _fill(el, def) {
        const isAdj = def.type === 'range' || def.type === 'choice' || def.type === 'voice';
        el.setAttribute('role', isAdj ? 'slider' : def.type === 'bool' ? 'switch' : 'button');
        el.setAttribute('aria-label', def.label);
        if (isAdj) {
            const txt = this._text(def);
            el.setAttribute('aria-valuetext', txt);
            if (def.type === 'range') {
                el.setAttribute('aria-valuemin', def.min); el.setAttribute('aria-valuemax', def.max);
                el.setAttribute('aria-valuenow', this._value(def));
            }
            el.innerHTML = `<span class="opt-label">${escapeHtml(def.label)}</span>` +
                `<span class="opt-ctrl"><button tabindex="-1" class="key-btn" data-step="-1" aria-hidden="true">◀</button>` +
                `<span class="opt-value">${escapeHtml(txt)}</span>` +
                `<button tabindex="-1" class="key-btn" data-step="1" aria-hidden="true">▶</button></span>`;
        } else if (def.type === 'bool') {
            const on = !!this._value(def);
            el.setAttribute('aria-checked', String(on));
            el.innerHTML = `<span class="opt-label">${escapeHtml(def.label)}</span><span class="opt-value toggle ${on ? 'on' : ''}">${on ? 'Activado' : 'Desactivado'}</span>`;
        } else {
            el.innerHTML = `<span class="opt-label">${escapeHtml(def.label)}</span><span class="opt-value">Enter</span>`;
        }
        const desc = typeof def.desc === 'function' ? def.desc(this._value(def)) : def.desc;
        if (desc) el.dataset.desc = desc; else delete el.dataset.desc;
    },

    adjust(def, step, el) {
        if (def.type === 'range') {
            const v = clamp(Math.round((this._value(def) + step * def.step) * 100) / 100, def.min, def.max);
            this._settings[def.id] = v;
            UI.audio.uiValue((v - def.min) / (def.max - def.min));
        } else if (def.type === 'choice') {
            const vals = def.values, i = vals.indexOf(this._value(def));
            const ni = clamp(i + step, 0, vals.length - 1);
            this._settings[def.id] = vals[ni];
            UI.audio.uiValue(ni / Math.max(1, vals.length - 1));
        } else if (def.type === 'voice') {
            def.cycle(step);
            UI.audio.uiMove();
        } else if (def.type === 'bool') { this.activate(def, el); return; }
        else return;
        this._onChange(def);
        this._fill(el, def);
        const desc = typeof def.desc === 'function' ? def.desc(this._value(def)) : '';
        UI.say(`${this._text(def)}${desc && def.type === 'choice' ? '. ' + desc : ''}`, { rate: def.id === 'speechRate' ? 1 : 1 });
    },

    activate(def, el) {
        if (def.type === 'bool') {
            this._settings[def.id] = !this._value(def);
            UI.audio.uiValue(this._settings[def.id] ? 1 : 0);
            this._onChange(def);
            this._fill(el, def);
            UI.say(this._settings[def.id] ? 'Activado' : 'Desactivado');
        } else if (def.type === 'action') {
            UI.audio.uiSelect();
            def.run();
        }
    },

    onKey(e) {
        const el = document.activeElement?.closest?.('[data-opt]');
        if (!el) return false;
        const def = this._defs.find(d => d.id === el.dataset.opt);
        if (!def) return false;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            this.adjust(def, e.key === 'ArrowRight' ? 1 : -1, el);
            return true;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (def.type === 'bool' || def.type === 'action') this.activate(def, el);
            else UI.say(`${def.label}: ${this._text(def)}. Usa izquierda y derecha para cambiar.`);
            return true;
        }
        return false;
    },
};

// ═══════════════════════════════════════════════════════
// Vista de combate (HUD, radar, temporizador, registro)
// ═══════════════════════════════════════════════════════

const CombatView = {
    _logMax: 7,

    setMode(mode, title, subtitle = '') {
        const scr = $('screen-combat');
        scr.dataset.mode = mode;
        $('combat-title').textContent = title;
        $('combat-subtitle').textContent = subtitle;
        $('combat-log').innerHTML = '';
        this.clearEnemy();
        this.timer(1);
        $('boss-bar').hidden = true;
    },

    updateKeyLabels(scheme) {
        document.querySelectorAll('[data-keylabel]').forEach(el => { el.textContent = scheme.labels[el.dataset.keylabel]; });
        const dl = { up: scheme.labels.up, down: scheme.labels.down, left: scheme.labels.left, right: scheme.labels.right };
        document.querySelectorAll('.radar .slot[data-dir] .slot-key').forEach(el => { el.textContent = dl[el.parentElement.dataset.dir]; });
    },

    reset({ enc }) {
        // El título y el subtítulo ya los puso la pantalla; aquí solo se limpia el campo.
        $('screen-combat').dataset.mode = enc.practice ? 'practice' : 'combat';
        $('combat-log').innerHTML = '';
        this.clearEnemy();
        this.timer(1);
    },

    hud({ lives, maxLives, practice, score, streak, mult, remaining, wave, boss }) {
        const hearts = $('hud-lives');
        if (practice) hearts.textContent = '∞';
        else hearts.textContent = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, maxLives - lives));
        hearts.setAttribute('aria-label', practice ? 'Sin límite' : `${lives} de ${maxLives}`);
        $('hud-score').textContent = practice ? '—' : fmtNum(score);
        $('hud-streak').textContent = streak > 0 ? `${streak} ×${mult}` : '0';
        $('hud-remaining-label').textContent = wave ? `${practice ? 'Ronda' : 'Oleada'} ${wave}` : 'Quedan';
        $('hud-remaining').textContent = String(remaining);
        $('screen-combat').classList.toggle('low-health', !practice && lives === 1 && maxLives > 1);
        const bb = $('boss-bar');
        if (boss) {
            bb.hidden = false;
            $('boss-name').textContent = `${boss.name} · ${boss.lives}/${boss.max}`;
            $('boss-fill').style.width = `${Math.max(0, boss.lives / boss.max * 100)}%`;
        } else bb.hidden = true;
    },

    enemy({ turn, showDir }) {
        const def = turn.inst.def;
        const visual = UI.settings.visualAids;
        const name = turn.mimic && !DIFFICULTIES[UI.settings.difficulty].hints ? 'Sombra Imitadora' : (turn.mimic ? `Sombra (imita: ${turn.mimic.name})` : def.name);
        $('enemy-name').textContent = visual ? `${def.icon} ${name}` : '¿…?';
        const info = [];
        if (turn.warning) info.push(turn.warning);
        if (turn.inst.maxLives > 1) info.push(`Vidas: ${turn.inst.lives}/${turn.inst.maxLives}`);
        if (showDir) info.push(`${DIRECTIONS[turn.dir].label} ${DIRECTIONS[turn.dir].name}`);
        else if (visual) info.push('Posición oculta: ¡escucha!');
        $('enemy-info').textContent = info.join(' · ');
        document.querySelectorAll('.radar .slot[data-dir]').forEach(s => {
            const on = showDir && s.dataset.dir === turn.dir;
            s.classList.toggle('active', on);
            s.querySelector('.slot-icon').textContent = on ? def.icon : '';
        });
        $('combat-stage').classList.toggle('shielded', !!turn.shield);
    },

    clearEnemy() {
        $('enemy-name').textContent = '—';
        $('enemy-info').textContent = '';
        document.querySelectorAll('.radar .slot[data-dir]').forEach(s => {
            s.classList.remove('active', 'target');
            s.querySelector('.slot-icon').textContent = '';
        });
        $('combat-stage').classList.remove('shielded');
    },

    timer(frac) {
        const f = $('timer-fill');
        f.style.width = `${Math.max(0, frac * 100)}%`;
        f.className = 'timer-fill' + (frac < 0.3 ? ' danger' : frac < 0.6 ? ' warn' : '');
    },

    cast(spell) {
        const s = document.querySelector(`.radar .slot[data-dir="${spell.dir}"]`);
        if (s) { s.classList.remove('cast'); void s.offsetWidth; s.classList.add('cast'); }
    },

    _flash(cls) {
        const st = $('combat-stage');
        st.classList.remove(cls); void st.offsetWidth; st.classList.add(cls);
        setTimeout(() => st.classList.remove(cls), 600);
    },
    hurt() { this._flash('flash-hurt'); },
    hit({ crit }) { this._flash(crit ? 'flash-crit' : 'flash-hit'); },

    armed(list) {
        document.querySelectorAll('.pad-btn[data-el]').forEach(b => b.classList.toggle('armed', list.includes(b.dataset.el)));
    },

    log(text) {
        const ol = $('combat-log');
        if (!ol) return;
        const li = document.createElement('li');
        li.textContent = text;
        ol.appendChild(li);
        while (ol.children.length > this._logMax) ol.removeChild(ol.firstChild);
    },

    // Entrenamiento
    tutorialText(text) { $('enemy-info').textContent = text; },
    tutorialTarget(dir) {
        document.querySelectorAll('.radar .slot[data-dir]').forEach(s => s.classList.toggle('target', UI.settings.visualAids && s.dataset.dir === dir));
    },
};
