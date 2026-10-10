/* =============================================
   ECOS DE AETHELGARD — cloud.js
   Servicio online con Firebase (plan gratuito Spark):
   cuentas, partida en la nube, fichas públicas,
   amigos, duelos, desafío diario, logros del creador,
   avisos y operaciones de administración.
   La seguridad real la imponen firebase/firestore.rules.
   ============================================= */
'use strict';

const FIREBASE_VERSION = '12.19.0';

function firebaseSdkUrls(name) {
    return [
        `https://cdn.jsdelivr.net/npm/firebase@${FIREBASE_VERSION}/firebase-${name}-compat.js`,
        `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-${name}-compat.js`,
    ];
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = () => { s.remove(); reject(new Error(`No se pudo cargar ${src}`)); };
        document.head.appendChild(s);
    });
}

async function loadFirstScript(urls) {
    let last;
    for (const u of urls) {
        try { await loadScript(u); return; } catch (e) { last = e; }
    }
    throw last;
}

/** Identificador del día del desafío diario (hora de España). */
function todayId(d = new Date()) {
    try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    } catch (_) {
        return d.toISOString().slice(0, 10);
    }
}

function normName(name) { return String(name).trim().toLowerCase(); }

/**
 * Lo que escriben otros jugadores se limpia al leerlo: sus nombres se muestran y se dicen en voz
 * alta, así que nunca deben traer más que un nombre de invocador.
 */
function safeName(raw) { return cleanName(raw) || 'Un invocador'; }
function challengeFrom(d) {
    const c = { id: d.id, ...d.data() };
    c.fromName = safeName(c.fromName);
    c.toName = safeName(c.toName);
    return c;
}

const CLOUD_ERRORS = {
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión con él.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/missing-email': 'Escribe tu correo.',
    'auth/weak-password': 'La contraseña es demasiado corta: usa al menos 6 caracteres.',
    'auth/missing-password': 'Escribe tu contraseña.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/user-not-found': 'No existe ninguna cuenta con ese correo.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
    'auth/network-request-failed': 'No hay conexión con el servidor. Comprueba tu internet.',
    'auth/requires-recent-login': 'Por seguridad, vuelve a escribir tu contraseña.',
    'auth/user-disabled': 'Esta cuenta está desactivada.',
    'permission-denied': 'No tienes permiso para hacer eso.',
    'unavailable': 'No hay conexión con el servidor. Inténtalo de nuevo.',
    'ecos/name-taken': 'Ese nombre de invocador ya está en uso. Elige otro.',
    'ecos/banned': 'El creador ha suspendido esta cuenta.',
    'ecos/sdk': 'No se pudo conectar con el servicio online. Comprueba tu internet.',
};

function cloudErrorText(e) {
    const code = e?.code || '';
    return CLOUD_ERRORS[code] || `Algo ha fallado${e?.message ? ': ' + e.message : '.'}`;
}

function cloudError(code) { const e = new Error(CLOUD_ERRORS[code] || code); e.code = code; return e; }

/** Etiqueta de progreso de historia (también la usa la ficha pública). */
function progressLabelOf(p) {
    const st = p.story;
    if (st.finalDone) return 'Historia completada';
    if (st.level <= COMMON_LEVELS) return `Nivel ${st.level}`;
    return `Guardianes purificados: ${st.routesDone.length} de 4`;
}

/** Valor numérico para ordenar la historia. */
function storyValueOf(story) {
    return Math.min(story.level || 1, COMMON_LEVELS + 1) * 10 + (story.routes || 0) * 100 + (story.finalDone ? 1000 : 0) + (story.score || 0) / 1e7;
}

/** Datos públicos de un jugador, derivados de su partida. */
function publicCard(p, uid) {
    const s = p.stats;
    return {
        uid,
        name: p.username,
        nameLower: normName(p.username),
        updatedAt: Date.now(),
        arena: { bestScore: p.arena.bestScore || 0, bestWave: p.arena.bestWave || 0 },
        story: {
            level: p.story.level, routes: p.story.routesDone.length, finalDone: !!p.story.finalDone,
            score: p.storyScore || 0, label: progressLabelOf(p),
        },
        achievements: [...p.achievements],
        achCount: p.achievements.length,
        stats: { kills: s.kills || 0, crits: s.crits || 0, bestStreak: s.bestStreak || 0, playTimeS: s.playTimeS || 0 },
        duels: { wins: p.duels?.wins || 0, losses: p.duels?.losses || 0, draws: p.duels?.draws || 0 },
        friends: [...(p.friends || [])],
    };
}

class CloudService {
    #cfg;
    #auth = null; #db = null;
    #initP = null;
    #unsubs = [];
    #saveT = null; #pending = null; #retryT = null;
    #playersCache = null; #playersAt = 0;
    #customCache = null;
    user = null;
    isAdmin = false;
    player = null;     // ficha pública propia (con los campos del creador)

    constructor(cfg) { this.#cfg = cfg || {}; }

    get enabled() { return !!(this.#cfg.firebase && this.#cfg.firebase.apiKey); }
    get ready() { return !!this.#db; }
    get uid() { return this.user ? this.user.uid : null; }
    get email() { return this.user ? this.user.email : ''; }
    get signedIn() { return !!this.user; }
    get contactEmail() { return this.#cfg.contactEmail || ''; }

    // ── Arranque ────────────────────────────────────────

    init() {
        if (!this.enabled) return Promise.resolve(false);
        if (this.#initP) return this.#initP;
        this.#initP = (async () => {
            for (const n of ['app', 'auth', 'firestore']) await loadFirstScript(firebaseSdkUrls(n));
            const fb = window.firebase;
            if (!fb.apps.length) fb.initializeApp(this.#cfg.firebase);
            this.#auth = fb.auth();
            this.#db = fb.firestore();
            const emu = this.#cfg.emulator;
            if (emu) {
                this.#auth.useEmulator(emu.auth, { disableWarnings: true });
                this.#db.useEmulator(emu.firestoreHost, emu.firestorePort);
            }
            this.#auth.languageCode = 'es';
            await new Promise(res => { const un = this.#auth.onAuthStateChanged(() => { un(); res(); }); });
            this.user = this.#auth.currentUser;
            return true;
        })().catch(e => {
            console.warn('[Nube]', e);
            this.#initP = null;
            return false;
        });
        return this.#initP;
    }

    #doc(path) { return this.#db.doc(path); }
    #col(path) { return this.#db.collection(path); }

    // ── Cuenta ──────────────────────────────────────────

    async checkAdmin() {
        this.isAdmin = false;
        if (!this.uid) return false;
        try { this.isAdmin = (await this.#doc(`admins/${this.uid}`).get()).exists; } catch (_) { this.isAdmin = false; }
        return this.isAdmin;
    }

    async nameTaken(name) {
        const s = await this.#doc(`names/${normName(name)}`).get();
        return s.exists && s.data().uid !== this.uid;
    }

    async register({ name, email, password }) {
        if (await this.nameTaken(name)) throw cloudError('ecos/name-taken');
        const cred = await this.#auth.createUserWithEmailAndPassword(email.trim(), password);
        this.user = cred.user;
        await this.claimName(name);
        return cred.user;
    }

    /** Reserva el nombre (transacción: nadie puede quitártelo a la vez). */
    async claimName(name) {
        const ref = this.#doc(`names/${normName(name)}`);
        await this.#db.runTransaction(async tx => {
            const s = await tx.get(ref);
            if (s.exists && s.data().uid !== this.uid) throw cloudError('ecos/name-taken');
            if (!s.exists) tx.set(ref, { uid: this.uid, name });
        });
    }

    async login(email, password) {
        const cred = await this.#auth.signInWithEmailAndPassword(email.trim(), password);
        this.user = cred.user;
        return cred.user;
    }

    resetPassword(email) { return this.#auth.sendPasswordResetEmail(email.trim()); }

    async logout() {
        this.stopWatching();
        await this.flush();
        await this.#auth.signOut();
        this.user = null;
        this.isAdmin = false;
        this.player = null;
        this.#playersCache = null;
    }

    /** Carga la partida y la ficha propias. */
    async loadAccount() {
        const [s, p] = await Promise.all([this.#doc(`saves/${this.uid}`).get(), this.#doc(`players/${this.uid}`).get()]);
        this.player = p.exists ? p.data() : null;
        return { save: s.exists ? s.data() : null, player: this.player };
    }

    /** Crea la ficha y la partida de una cuenta nueva. */
    async createPlayer(profile) {
        const card = { ...publicCard(profile, this.uid), createdAt: Date.now() };
        await this.#doc(`players/${this.uid}`).set(card);
        await this.#doc(`saves/${this.uid}`).set({ data: JSON.parse(JSON.stringify(profile)), updatedAt: Date.now(), adminEditAt: 0 });
        this.player = card;
    }

    // ── Guardado (agrupado para no gastar escrituras) ──

    queueSave(profile) {
        if (!this.uid) return;
        this.#pending = profile;
        clearTimeout(this.#saveT);
        this.#saveT = setTimeout(() => this.flush(), 1500);
    }

    cancelPending() { this.#pending = null; clearTimeout(this.#saveT); }

    async flush() {
        clearTimeout(this.#saveT);
        const p = this.#pending;
        if (!p || !this.uid) return;
        this.#pending = null;
        try {
            await this.#doc(`saves/${this.uid}`).set({ data: JSON.parse(JSON.stringify(p)), updatedAt: Date.now(), adminEditAt: p.adminEditAt || 0 });
        } catch (e) {
            console.warn('[Nube] guardado', e);
            if (!this.#pending) this.#pending = p;
            clearTimeout(this.#retryT);
            this.#retryT = setTimeout(() => this.flush(), 10000);
            return;
        }
        if (this.player?.banned) return;
        try {
            await this.#doc(`players/${this.uid}`).set(publicCard(p, this.uid), { merge: true });
            this.#playersCache = null;
        } catch (e) { console.warn('[Nube] ficha', e); }
    }

    /** Escucha cambios del creador en tu partida, en tu ficha y desafíos nuevos. */
    watchOwn({ onSave, onPlayer, onIncoming }) {
        this.stopWatching();
        const uid = this.uid;
        if (!uid) return;
        const warn = e => console.warn('[Nube] escucha', e);
        this.#unsubs.push(this.#doc(`saves/${uid}`).onSnapshot(s => onSave?.(s.exists ? s.data() : null), warn));
        this.#unsubs.push(this.#doc(`players/${uid}`).onSnapshot(s => {
            this.player = s.exists ? s.data() : null;
            onPlayer?.(this.player);
        }, warn));
        this.#unsubs.push(this.#col('challenges').where('toUid', '==', uid).where('status', '==', 'pending')
            .onSnapshot(q => onIncoming?.(q.docs.map(challengeFrom)), warn));
    }

    stopWatching() { this.#unsubs.splice(0).forEach(u => { try { u(); } catch (_) { /* nada */ } }); }

    // ── Comunidad ──────────────────────────────────────

    async listPlayers({ force = false } = {}) {
        if (!force && this.#playersCache && Date.now() - this.#playersAt < 60000) return this.#playersCache;
        const q = await this.#col('players').get();
        this.#playersCache = q.docs.map(d => { const p = d.data(); return { ...p, name: safeName(p.name) }; });
        this.#playersAt = Date.now();
        return this.#playersCache;
    }

    async getPlayer(uid) {
        const s = await this.#doc(`players/${uid}`).get();
        return s.exists ? { ...s.data(), name: safeName(s.data().name) } : null;
    }

    async listCustomAchievements({ force = false } = {}) {
        if (!force && this.#customCache) return this.#customCache;
        const q = await this.#col('customAchievements').get();
        this.#customCache = q.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        return this.#customCache;
    }

    async getMotd() {
        try {
            const s = await this.#doc('config/motd').get();
            return s.exists ? s.data() : null;
        } catch (_) { return null; }
    }

    // ── Duelos ──────────────────────────────────────────

    async createChallenge(c) {
        const ref = await this.#col('challenges').add({
            fromUid: this.uid, fromName: c.fromName, toUid: c.toUid, toName: c.toName,
            seed: c.seed, mode: 'duel5', fromScore: c.fromScore, fromWave: c.fromWave,
            status: 'pending', createdAt: Date.now(), fromSeen: false,
        });
        return ref.id;
    }

    async listMyChallenges() {
        const [a, b] = await Promise.all([
            this.#col('challenges').where('fromUid', '==', this.uid).get(),
            this.#col('challenges').where('toUid', '==', this.uid).get(),
        ]);
        const all = [...a.docs, ...b.docs].map(challengeFrom);
        return all.sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
    }

    answerChallenge(id, toScore, toWave) {
        return this.#doc(`challenges/${id}`).update({ toScore, toWave, status: 'done', finishedAt: Date.now() });
    }
    declineChallenge(id) { return this.#doc(`challenges/${id}`).update({ status: 'declined', finishedAt: Date.now() }); }
    markChallengeSeen(id) { return this.#doc(`challenges/${id}`).update({ fromSeen: true }); }
    deleteChallenge(id) { return this.#doc(`challenges/${id}`).delete(); }

    // ── Desafío diario ─────────────────────────────────

    async submitDaily(day, { name, score, wave }) {
        const ref = this.#doc(`daily/${day}/scores/${this.uid}`);
        const prev = await ref.get();
        const old = prev.exists ? prev.data() : null;
        const attempts = (old?.attempts || 0) + 1;
        const better = !old || score > old.score;
        await ref.set({
            uid: this.uid, name,
            score: better ? score : old.score, wave: better ? wave : old.wave,
            at: better ? Date.now() : old.at, attempts,
        });
        return { best: better ? score : old.score, improved: better };
    }

    async listDaily(day) {
        const q = await this.#col(`daily/${day}/scores`).get();
        return q.docs.map(d => { const s = d.data(); return { ...s, name: safeName(s.name) }; }).sort((a, b) => b.score - a.score);
    }

    // ── Privacidad: exportar y borrar ──────────────────

    async exportMyData(profile) {
        const uid = this.uid;
        const [player, save, challenges] = await Promise.all([
            this.#doc(`players/${uid}`).get(), this.#doc(`saves/${uid}`).get(), this.listMyChallenges(),
        ]);
        const daily = [];
        for (const day of profile.dailyDays || []) {
            const s = await this.#doc(`daily/${day}/scores/${uid}`).get();
            if (s.exists) daily.push({ day, ...s.data() });
        }
        return {
            exportadoEl: new Date().toISOString(),
            cuenta: { uid, correo: this.email },
            fichaPublica: player.exists ? player.data() : null,
            partida: save.exists ? save.data() : null,
            duelos: challenges,
            desafioDiario: daily,
        };
    }

    /** Borra todos tus datos y tu cuenta. Pide la contraseña para confirmar. */
    async deleteAccount(password, profile) {
        const fb = window.firebase, user = this.#auth.currentUser;
        const cred = fb.auth.EmailAuthProvider.credential(user.email, password);
        await user.reauthenticateWithCredential(cred);
        const uid = user.uid;
        this.stopWatching();
        this.cancelPending();
        const mine = await this.listMyChallenges();
        for (const c of mine) { try { await this.deleteChallenge(c.id); } catch (_) { /* ya borrado */ } }
        for (const day of profile?.dailyDays || []) {
            try { await this.#doc(`daily/${day}/scores/${uid}`).delete(); } catch (_) { /* nada */ }
        }
        try {
            const n = await this.#doc(`names/${normName(profile?.username || '')}`).get();
            if (n.exists && n.data().uid === uid) await n.ref.delete();
        } catch (_) { /* nada */ }
        await this.#doc(`players/${uid}`).delete();
        await this.#doc(`saves/${uid}`).delete();
        await user.delete();
        this.user = null;
        this.isAdmin = false;
        this.player = null;
        this.#playersCache = null;
    }

    // ═══════════════════════════════════════════════════
    // Control del creador (las reglas solo lo permiten a admins/{uid})
    // ═══════════════════════════════════════════════════

    /** Modifica la partida y la ficha de un jugador. edit(profile) muta el perfil. */
    async adminEditPlayer(uid, edit, extraCard = {}) {
        const ref = this.#doc(`saves/${uid}`);
        const s = await ref.get();
        const now = Date.now();
        let card = { ...extraCard, adminEditAt: now };
        if (s.exists && s.data().data) {
            const profile = migrateProfile(s.data().data);
            edit?.(profile);
            profile.adminEditAt = now;
            await ref.set({ data: JSON.parse(JSON.stringify(profile)), updatedAt: now, adminEditAt: now });
            card = { ...publicCard(profile, uid), ...card };
        }
        await this.#doc(`players/${uid}`).set(card, { merge: true });
        this.#playersCache = null;
    }

    adminResetArena(uid) {
        return this.adminEditPlayer(uid, p => { p.arena.bestScore = 0; p.arena.bestWave = 0; });
    }

    adminRemoveAchievement(uid, achId) {
        return this.adminEditPlayer(uid, p => { p.achievements = p.achievements.filter(a => a !== achId); });
    }

    adminGrantAchievement(uid, achId) {
        return this.adminEditPlayer(uid, p => { if (!p.achievements.includes(achId)) p.achievements.push(achId); });
    }

    adminSetStoryLevel(uid, level) {
        return this.adminEditPlayer(uid, p => { p.story.level = clamp(level, 1, COMMON_LEVELS + 1); });
    }

    async adminGrantCustom(uid, achId) {
        const fb = window.firebase;
        await this.#doc(`players/${uid}`).set({ customAch: fb.firestore.FieldValue.arrayUnion(achId), adminEditAt: Date.now() }, { merge: true });
        this.#playersCache = null;
    }

    async adminRevokeCustom(uid, achId) {
        const fb = window.firebase;
        await this.#doc(`players/${uid}`).set({ customAch: fb.firestore.FieldValue.arrayRemove(achId), adminEditAt: Date.now() }, { merge: true });
        this.#playersCache = null;
    }

    async adminSetBanned(uid, banned) {
        await this.#doc(`players/${uid}`).set({ banned, adminEditAt: Date.now() }, { merge: true });
        this.#playersCache = null;
    }

    /** Borra la ficha, la partida y el nombre de un jugador (su cuenta de acceso sigue existiendo). */
    async adminDeletePlayer(uid) {
        const p = await this.getPlayer(uid);
        if (p?.nameLower) {
            try {
                const n = await this.#doc(`names/${p.nameLower}`).get();
                if (n.exists && n.data().uid === uid) await n.ref.delete();
            } catch (_) { /* nada */ }
        }
        await this.#doc(`saves/${uid}`).delete();
        await this.#doc(`players/${uid}`).delete();
        this.#playersCache = null;
    }

    async adminCreateCustom({ name, desc, icon }) {
        const ref = await this.#col('customAchievements').add({ name: String(name || '').slice(0, 40), desc: String(desc || '').slice(0, 140), icon: icon || '🌟', createdAt: Date.now() });
        this.#customCache = null;
        return ref.id;
    }

    async adminDeleteCustom(id) {
        await this.#doc(`customAchievements/${id}`).delete();
        this.#customCache = null;
    }

    adminSetMotd(text) {
        return text
            ? this.#doc('config/motd').set({ text, updatedAt: Date.now() })
            : this.#doc('config/motd').delete();
    }

    adminDeleteDaily(day, uid) { return this.#doc(`daily/${day}/scores/${uid}`).delete(); }

    async adminListChallenges() {
        const q = await this.#col('challenges').orderBy('createdAt', 'desc').limit(60).get();
        return q.docs.map(challengeFrom);
    }
}

const Cloud = new CloudService(typeof CLOUD_CONFIG !== 'undefined' ? CLOUD_CONFIG : null);
