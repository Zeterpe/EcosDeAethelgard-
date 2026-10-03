/* =============================================
   ECOS DE AETHELGARD — storage.js
   Perfiles, ajustes y migración de partidas antiguas.
   Todo se guarda en localStorage (con protección si
   el navegador lo bloquea).
   ============================================= */
'use strict';

const DEFAULT_SETTINGS = {
    output: 'tts',            // tts = voz del juego · sr = lector de pantalla
    speechRate: 1.0,
    speechVolume: 1.0,
    voiceURI: null,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    difficulty: 'invocador',
    verbosity: 'normal',      // completo · normal · breve · sonido
    comboWindow: 1000,
    keyScheme: 'clasico',
    ticks: true,
    mono: false,
    visualAids: true,
    storyVoice: 'grabada',    // grabada: narradores generados · sistema: voz del navegador
};

const Storage = {
    PREFIX: 'aethelgard_user_',
    LAST: 'aethelgard_last_user',
    SETTINGS: 'aethelgard_options',

    _get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    _set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } },
    _del(k) { try { localStorage.removeItem(k); } catch (_) { /* sin almacenamiento */ } },
    _json(raw) { try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; } },

    loadSettings() {
        const raw = this._json(this._get(this.SETTINGS)) || {};
        const s = { ...DEFAULT_SETTINGS, ...raw };
        if (!DIFFICULTIES[s.difficulty]) s.difficulty = DEFAULT_SETTINGS.difficulty;
        if (!KEY_SCHEMES[s.keyScheme]) s.keyScheme = DEFAULT_SETTINGS.keyScheme;
        s.speechRate = clamp(+s.speechRate || 1, 0.5, 2.5);
        return s;
    },
    saveSettings(s) { this._set(this.SETTINGS, JSON.stringify(s)); },
    hasSettings() { return this._get(this.SETTINGS) !== null; },

    profileKey(name) { return this.PREFIX + name.toLowerCase(); },
    loadProfile(name) {
        const raw = this._json(this._get(this.profileKey(name)));
        return raw ? migrateProfile(raw) : null;
    },
    saveProfile(p) {
        if (!p) return;
        p.lastPlayed = Date.now();
        this._set(this.profileKey(p.username), JSON.stringify(p));
        this._set(this.LAST, p.username);
    },
    deleteProfile(name) { this._del(this.profileKey(name)); },

    // Copia local de la partida online (por si se corta la conexión).
    cloudKey(uid) { return 'aethelgard_cloud_' + uid; },
    saveCloudCache(uid, p) { this._set(this.cloudKey(uid), JSON.stringify(p)); },
    loadCloudCache(uid) { const r = this._json(this._get(this.cloudKey(uid))); return r ? migrateProfile(r) : null; },
    deleteCloudCache(uid) { this._del(this.cloudKey(uid)); },

    /** Borra todo lo que el juego guardó en este navegador. */
    clearAll() {
        try {
            Object.keys(localStorage).filter(k => k.startsWith('aethelgard_')).forEach(k => localStorage.removeItem(k));
        } catch (_) { /* sin almacenamiento */ }
    },
    lastUser() { return this._get(this.LAST) || ''; },

    listProfiles() {
        const out = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k || !k.startsWith(this.PREFIX)) continue;
                const raw = this._json(this._get(k));
                if (raw && raw.username) out.push(migrateProfile(raw));
            }
        } catch (_) { /* sin almacenamiento */ }
        return out;
    },
};

function newProfile(username) {
    return {
        v: 2, username, createdAt: Date.now(), lastPlayed: Date.now(),
        introSeen: false, tutorialDone: false, echosSeen: [], loreSeen: [],
        story: {
            level: 1,
            routeProgress: { fire: 0, water: 0, wind: 0, earth: 0 },
            routesDone: [], finalDone: false, defeatsInRow: 0,
        },
        achievements: [], bossesDefeated: [], met: [],
        stats: {
            kills: 0, spells: 0, hits: 0, crits: 0, mistakes: 0,
            damageTaken: 0, deaths: 0, bestStreak: 0, playTimeS: 0, levelsCleared: 0,
        },
        arena: { bestScore: 0, bestWave: 0, games: 0 },
        storyScore: 0,
        // Online
        friends: [], duels: { wins: 0, losses: 0, draws: 0 },
        dailyDays: [], dailyBest: { day: '', score: 0 },
        customAch: [], adminEditAt: 0,
    };
}

/** Convierte partidas de la versión 1 (y rellena campos que falten). */
function migrateProfile(raw) {
    const p = newProfile(raw.username);
    if (raw.v === 2) {
        Object.assign(p, raw);
        p.story = { ...newProfile('').story, ...(raw.story || {}) };
        p.story.routeProgress = { fire: 0, water: 0, wind: 0, earth: 0, ...(raw.story?.routeProgress || {}) };
        p.stats = { ...newProfile('').stats, ...(raw.stats || {}) };
        p.arena = { ...newProfile('').arena, ...(raw.arena || {}) };
        p.duels = { ...newProfile('').duels, ...(raw.duels || {}) };
        p.dailyBest = { ...newProfile('').dailyBest, ...(raw.dailyBest || {}) };
        ['echosSeen', 'loreSeen', 'achievements', 'bossesDefeated', 'met', 'friends', 'dailyDays', 'customAch'].forEach(k => {
            if (!Array.isArray(p[k])) p[k] = [];
        });
        return p;
    }
    // ── Versión 1 ──
    p.createdAt = raw.createdAt || p.createdAt;
    p.lastPlayed = raw.lastPlayed || p.lastPlayed;
    p.introSeen = !!raw.introSeen;
    p.tutorialDone = p.introSeen || (+raw.currentLevel || 1) > 1;   // ya conocía el juego
    p.echosSeen = Array.isArray(raw.echosSeen) ? raw.echosSeen.map(String) : [];
    p.achievements = Array.isArray(raw.achievements) ? raw.achievements.filter(id => ACHIEVEMENTS_DEF.some(a => a.id === id)) : [];
    p.bossesDefeated = Array.isArray(raw.bossesDefeated) ? raw.bossesDefeated : [];
    const lvl = Math.max(1, +raw.currentLevel || 1);
    p.story.level = Math.min(lvl, COMMON_LEVELS + 1);
    if (lvl > COMMON_LEVELS + 1 && raw.branch && ROUTES[raw.branch]) p.story.routeProgress[raw.branch] = 1;
    p.story.routesDone = ROUTE_IDS.filter(r => p.achievements.includes(ROUTES[r].achievement));
    p.story.finalDone = p.achievements.includes('final_boss');
    if (p.story.routesDone.length > 0 && p.story.level <= COMMON_LEVELS) p.story.level = COMMON_LEVELS + 1;
    const st = raw.stats || {};
    p.stats.kills = +st.kills || 0;
    p.stats.spells = +st.spells || 0;
    p.stats.damageTaken = +st.deaths || 0;   // en v1 «deaths» contaba el daño recibido
    return p;
}
