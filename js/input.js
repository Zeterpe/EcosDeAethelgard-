/* =============================================
   ECOS DE AETHELGARD — input.js
   Teclas de elemento + flecha = hechizo.
   Un elemento queda «cargado» hasta que se lanza,
   aunque se suelte la tecla. Para un dúo se pulsan
   los dos a la vez o seguidos, dentro de la ventana
   de combinación.
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
    #armed = new Map();    // elemento cargado → { since: desde cuándo cuenta la ventana de combinación, pressed: cuándo se pulsó }
    #held = new Set();     // teclas de elemento que siguen pulsadas: mientras lo estén, cuentan como cargadas
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
            // Si aún no se ha lanzado, sigue cargado; al soltarlo empieza la ventana para sumarle otro.
            const a = this.#armed.get(m.id);
            if (a) a.since = performance.now();
            this.#notify();
        }
    }

    /**
     * Carga un elemento. Queda cargado hasta que se lanza el hechizo: no se apaga solo.
     * · Si los que había siguen pulsados, o se soltaron hace menos que la ventana de combinación, se suma a ellos (dúo).
     * · Si ya ha pasado ese tiempo, los sustituye.
     * · Si ya estaba cargado, se queda él solo: así se corrige un elemento pulsado por error.
     * minWindow: ventana mínima (ms) para sumarle otro; los gestos táctiles son más lentos que las teclas.
     */
    armElement(elId, fromKey = false, minWindow = 0) {
        if (!elId) return;
        const now = performance.now(), win = this.#settings.comboWindow;
        const again = this.#armed.has(elId);
        for (const [id, a] of [...this.#armed]) {
            if (id !== elId && !this.#held.has(id) && (again || now - a.since > win)) this.#armed.delete(id);
        }
        // Los que ya estaban de antes (no los de este mismo acorde) se dicen al manejador para que suenen también.
        const before = this.armedNow().filter(id => id !== elId && now - (this.#armed.get(id)?.pressed ?? 0) > 150);
        if (fromKey) this.#held.add(elId);
        this.#armed.set(elId, { since: now + Math.max(0, minWindow - win), pressed: now });
        this.handler?.onElement?.(elId, before);
        this.#notify();
    }

    fireDirection(dirId) {
        const els = this.armedNow();
        this.#armed.clear();       // lo que sigue pulsado sigue contando: se puede mantener el elemento y lanzar varias veces
        this.#notify();
        if (els.length === 0) this.handler?.onAim?.(dirId);
        else this.handler?.onSpell?.(buildSpell(els, dirId));
    }

    /** Elementos cargados ahora mismo. */
    armedNow() { return [...new Set([...this.#armed.keys(), ...this.#held])]; }

    #notify() { this.onChange?.(this.armedNow()); }

    /** Se da por soltada cualquier tecla (al perder la ventana el foco no llega el aviso de que se soltó). */
    releaseAll() {
        if (!this.#held.size) return;
        this.#held.clear();
        this.#notify();
    }

    reset() {
        this.#armed.clear();
        this.#held.clear();
        this.#notify();
    }
}
