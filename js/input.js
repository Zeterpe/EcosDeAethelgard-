/* =============================================
   ECOS DE AETHELGARD — input.js
   Teclas de elemento + flecha = hechizo.
   Los elementos quedan «cargados» durante la
   ventana de combinación aunque se suelten,
   así se puede mantener o pulsar en secuencia.
   ============================================= */
'use strict';

/** Construye un hechizo a partir de elementos y dirección. */
function buildSpell(elIds, dirId) {
    const ids = [...new Set(elIds)].sort();
    const dir = DIRECTIONS[dirId];
    if (ids.length === 1) {
        return { kind: 'simple', elements: ids, name: ELEMENTS[ids[0]].name, dir: dirId, dirName: dir.name, icons: ELEMENTS[ids[0]].icon };
    }
    if (ids.length === 2) {
        const d = DUAL_SPELLS[spellKey(ids)];
        return { kind: 'dual', elements: ids, name: d.name, dir: dirId, dirName: dir.name, icons: ids.map(i => ELEMENTS[i].icon).join('') };
    }
    return { kind: 'unstable', elements: ids, name: 'Hechizo inestable', dir: dirId, dirName: dir.name, icons: '✖' };
}

/**
 * Efecto de un hechizo sobre un perfil {weak, cure, critHit, critCure}.
 * Devuelve { type: 'crit'|'hit'|'critcure'|'cure'|'miss', delta }
 */
function evaluateSpell(spell, profile) {
    if (spell.kind === 'dual') {
        if (profile.critHit && spell.name === profile.critHit) return { type: 'crit', delta: -2 };
        if (profile.critCure && spell.name === profile.critCure) return { type: 'critcure', delta: 2 };
        if (spell.elements.some(e => profile.cure.includes(e))) return { type: 'cure', delta: 1 };
        if (spell.elements.some(e => profile.weak.includes(e))) return { type: 'hit', delta: -1 };
        return { type: 'miss', delta: 0 };
    }
    const e = spell.elements[0];
    if (profile.weak.includes(e)) return { type: 'hit', delta: -1 };
    if (profile.cure.includes(e)) return { type: 'cure', delta: 1 };
    return { type: 'miss', delta: 0 };
}

class InputSystem {
    #settings;
    #armed = new Map();    // elemento → instante en que se pulsó
    #held = new Set();
    handler = null;        // { onElement, onSpell, onAim, onCommand }
    viaTouch = false;      // el último hechizo se lanzó con un gesto táctil (para dar los avisos adecuados)
    onChange = null;       // (armedIds) → para la interfaz

    constructor(settings) { this.#settings = settings; }

    get scheme() { return KEY_SCHEMES[this.#settings.keyScheme] || KEY_SCHEMES.clasico; }

    /** Traduce una tecla a {kind, id} o null. */
    map(e) {
        const k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const sc = this.scheme;
        if (sc.elements[k]) return { kind: 'element', id: sc.elements[k] };
        if (sc.directions[k] || sc.directions[e.key]) return { kind: 'direction', id: sc.directions[k] || sc.directions[e.key] };
        if (e.key === ' ' || e.code === 'Space') return { kind: 'command', id: 'repeat' };
        if (e.key === 'Enter') return { kind: 'command', id: 'status' };
        if (k === 'h') return { kind: 'command', id: 'hint' };
        if (k === 'v') return { kind: 'command', id: 'announce' };
        if (e.key === 'Escape' || k === 'p') return { kind: 'command', id: 'pause' };
        return null;
    }

    keydown(e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return false;
        const m = this.map(e);
        if (!m) return false;
        e.preventDefault();
        if (e.repeat) return true;
        this.viaTouch = false;
        if (m.kind === 'element') this.armElement(m.id, true);
        else if (m.kind === 'direction') this.fireDirection(m.id);
        else this.handler?.onCommand?.(m.id);
        return true;
    }

    keyup(e) {
        const m = this.map(e);
        if (m && m.kind === 'element') {
            this.#held.delete(m.id);
            // Si aún no se ha usado, sigue cargado durante la ventana de combinación.
            if (this.#armed.has(m.id)) this.#armed.set(m.id, performance.now());
            this.#notify();
        }
    }

    /** minWindow: tiempo mínimo (ms) que queda cargado; los gestos táctiles son más lentos que las teclas. */
    armElement(elId, fromKey = false, minWindow = 0) {
        if (!elId) return;
        if (fromKey) this.#held.add(elId);
        this.#armed.set(elId, performance.now() + Math.max(0, minWindow - this.#settings.comboWindow));
        this.handler?.onElement?.(elId);
        this.#notify();
    }

    fireDirection(dirId) {
        const now = performance.now(), win = this.#settings.comboWindow;
        const els = [...this.#armed.entries()]
            .filter(([id, ts]) => this.#held.has(id) || now - ts <= win)
            .map(([id]) => id);
        this.#armed.clear();
        this.#notify();
        if (els.length === 0) this.handler?.onAim?.(dirId);
        else this.handler?.onSpell?.(buildSpell(els, dirId));
    }

    armedNow() {
        const now = performance.now(), win = this.#settings.comboWindow;
        return [...this.#armed.entries()].filter(([id, ts]) => this.#held.has(id) || now - ts <= win).map(([id]) => id);
    }

    #notify() { this.onChange?.(this.armedNow()); }

    reset() {
        this.#armed.clear();
        this.#held.clear();
        this.#notify();
    }
}
