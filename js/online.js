/* =============================================
   ECOS DE AETHELGARD — online.js
   Pantallas online: cuenta, privacidad, comunidad,
   amigos, duelos, desafío diario, clasificación
   online y panel del creador («control de dios»).
   ============================================= */
'use strict';

const Online = (() => {
    let A = null;              // contexto que entrega app.js
    let incoming = [];         // duelos recibidos pendientes
    let knownIncoming = null;  // ids ya avisados
    let motd = null;
    let registerMode = false;
    let sawSave = false;       // la partida existía en la nube durante esta sesión

    const isCloud = () => !!(A && A.getMode() === 'cloud' && Cloud.signedIn);
    const me = () => A.getProfile();
    const pendingCount = () => incoming.length;

    /** Anuncia un error. Devuelve una promesa que termina cuando se ha dicho (para no pisarlo). */
    function fail(e, where = '') {
        console.warn('[Online]', where, e);
        const msg = cloudErrorText(e);
        A.audio.uiError();
        UI.toast(msg);
        return A.speech.say(msg);
    }

    function dayLabel(day) {
        const [y, m, d] = day.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    }

    // ═══════════════════════════════════════════════════
    // Política de privacidad
    // ═══════════════════════════════════════════════════

    function privacyParagraphs() {
        const contact = Cloud.contactEmail
            ? ` Para cualquier consulta, escribe a ${Cloud.contactEmail}.`
            : ' Para cualquier consulta, contacta con el creador del juego.';
        return [
            'Política de privacidad de Ecos de Aethelgard.',
            'Responsable: el creador del juego, que lo ofrece gratis, sin publicidad y sin ánimo de lucro.' + contact,
            'Sin cuenta, todo se guarda solo en este navegador y no se envía a ningún servidor.',
            'Con una cuenta guardamos: tu correo electrónico, que solo sirve para iniciar sesión y recuperar la contraseña y nunca se muestra a otros jugadores; tu nombre de invocador; y tu progreso de juego: historia, puntuaciones, logros, amigos, duelos y desafíos diarios.',
            'Para qué: para guardar tu partida en la nube y para que puedas competir con otros jugadores. La base legal es tu consentimiento al crear la cuenta.',
            'Quién lo ve: los demás jugadores registrados ven tu nombre, tu progreso, tus puntuaciones, tus logros, tus amigos y tus duelos. El creador del juego puede ver y moderar los datos de juego, por ejemplo borrar una puntuación o suspender una cuenta.',
            'Dónde se guarda: en Firebase, un servicio de Google que actúa como encargado del tratamiento y puede alojar los datos fuera de la Unión Europea con las garantías legales correspondientes.',
            'No hay publicidad, no se venden datos y no se usan cookies de seguimiento. El navegador guarda tus ajustes y tu sesión.',
            'Cuánto tiempo: hasta que borres tu cuenta. Desde Cuenta y privacidad puedes descargar todos tus datos o borrar tu cuenta cuando quieras, y el borrado es inmediato.',
            'Tus derechos: acceso, rectificación, borrado, portabilidad, limitación y oposición. También puedes reclamar ante la Agencia Española de Protección de Datos.',
            'Si tienes menos de 14 años, necesitas el permiso de tus padres o tutores para crear una cuenta.',
        ];
    }

    function readPrivacy() { return Narration.run(privacyParagraphs(), { title: 'Política de privacidad' }); }

    // ═══════════════════════════════════════════════════
    // Pantalla de cuenta (entrar / crear cuenta)
    // ═══════════════════════════════════════════════════

    function setRegisterMode(on) {
        registerMode = on;
        $('form-login').hidden = on;
        $('form-register').hidden = !on;
        $('btn-account-switch').textContent = on ? '¿Ya tienes cuenta? Iniciar sesión' : '¿No tienes cuenta? Crear una';
        $('account-error').textContent = '';
    }

    function showAccountScreen({ register = false, intro = null } = {}) {
        A.newFlow();
        setRegisterMode(register);
        UI.backHandlers.account = () => {
            if (registerMode) { setRegisterMode(false); UI.focus($('login-email'), { polite: true }); UI.say('Iniciar sesión.'); }
            else UI.say('Elige Entrar, Crear una cuenta o Jugar sin cuenta.');
        };
        A.music.play('menu', { intensity: 1 });
        UI.show('account', {
            intro: intro ?? (register
                ? 'Crear cuenta. Escribe tu nombre de invocador, tu correo y una contraseña, y acepta la política de privacidad.'
                : 'Cuenta online. Inicia sesión con tu correo y tu contraseña, crea una cuenta nueva o juega sin cuenta.'),
            focus: register ? 'reg-name' : 'login-email',
        });
    }

    function accountError(msg) {
        $('account-error').textContent = msg;
        A.audio.uiError();
        A.speech.say(msg);
    }

    function setBusy(on) {
        document.querySelectorAll('#screen-account button, #screen-account input').forEach(el => { el.disabled = on; });
    }

    async function doLogin() {
        const email = $('login-email').value.trim(), pass = $('login-pass').value;
        if (!email || !pass) { accountError('Escribe tu correo y tu contraseña.'); return; }
        setBusy(true);
        A.speech.say('Entrando…');
        try {
            await Cloud.login(email, pass);
            $('login-pass').value = '';
            setBusy(false);
            await startCloudSession();
        } catch (e) {
            setBusy(false);
            accountError(cloudErrorText(e));
            UI.focus($('login-email'), { polite: true });
        }
    }

    async function doRegister() {
        const name = cleanName($('reg-name').value);
        const email = $('reg-email').value.trim(), pass = $('reg-pass').value;
        if (name.length < 2) { accountError('El nombre necesita al menos 2 letras o números.'); UI.focus($('reg-name'), { polite: true }); return; }
        if (!email) { accountError('Escribe tu correo.'); UI.focus($('reg-email'), { polite: true }); return; }
        if (pass.length < 6) { accountError('La contraseña necesita al menos 6 caracteres.'); UI.focus($('reg-pass'), { polite: true }); return; }
        if (!$('reg-consent').checked) { accountError('Para crear una cuenta, marca la casilla de la política de privacidad.'); UI.focus($('reg-consent'), { polite: true }); return; }
        setBusy(true);
        A.speech.say('Creando tu cuenta…');
        try {
            await Cloud.register({ name, email, password: pass });
            $('reg-pass').value = '';
            setBusy(false);
            await startCloudSession({ name, fresh: true });
        } catch (e) {
            setBusy(false);
            accountError(cloudErrorText(e));
        }
    }

    async function doForgot() {
        let email = $('login-email').value.trim();
        if (!email) {
            const v = await Dialog.open({
                title: 'Recuperar contraseña', text: 'Te enviaremos un correo para crear una contraseña nueva.',
                fields: [{ id: 'email', label: 'Correo electrónico', type: 'email', autocomplete: 'email' }],
                buttons: [{ label: 'Enviar correo', submit: true }, { label: 'Cancelar', value: null }], cancel: null,
            });
            if (!v || !v.email) return;
            email = v.email.trim();
        }
        try {
            await Cloud.resetPassword(email);
            A.speech.say('Si existe una cuenta con ese correo, te hemos enviado un mensaje para crear una contraseña nueva. Mira también en la carpeta de spam.');
            UI.toast('Correo de recuperación enviado');
        } catch (e) { accountError(cloudErrorText(e)); }
    }

    function bindAccountScreen() {
        $('form-login').addEventListener('submit', e => { e.preventDefault(); doLogin(); });
        $('form-register').addEventListener('submit', e => { e.preventDefault(); doRegister(); });
        $('btn-forgot').addEventListener('click', () => doForgot());
        $('btn-read-privacy').addEventListener('click', () => readPrivacy());
        $('btn-account-switch').addEventListener('click', () => {
            setRegisterMode(!registerMode);
            A.audio.uiSelect();
            UI.say(registerMode ? 'Crear cuenta.' : 'Iniciar sesión.');
            UI.focus($(registerMode ? 'reg-name' : 'login-email'), { polite: true });
        });
        $('btn-account-guest').addEventListener('click', () => { A.audio.uiSelect(); A.goLogin(); });
    }

    // ═══════════════════════════════════════════════════
    // Sesión online
    // ═══════════════════════════════════════════════════

    async function askName(text) {
        for (; ;) {
            const v = await Dialog.open({
                title: 'Elige tu nombre de invocador', text,
                fields: [{ id: 'name', label: 'Nombre de invocador', maxlength: 24, autocomplete: 'nickname' }],
                buttons: [{ label: 'Aceptar', submit: true }, { label: 'Cancelar', value: null }], cancel: null,
            });
            if (!v) return null;
            const name = cleanName(v.name || '');
            if (name.length < 2) { A.speech.say('El nombre necesita al menos 2 letras o números.'); continue; }
            try { await Cloud.claimName(name); return name; } catch (e) { text = cloudErrorText(e); }
        }
    }

    /** Si hay partidas sin cuenta en este dispositivo, ofrece traer una. */
    async function chooseStartingProfile(name) {
        const locals = Storage.listProfiles().filter(p => p.story.level > 1 || p.achievements.length > 0 || p.arena.bestScore > 0);
        if (!locals.length) return newProfile(name);
        const buttons = locals.slice(0, 5).map(p => ({ label: `Traer la partida de ${p.username}: ${progressLabelOf(p)}`, value: p.username }));
        buttons.push({ label: 'Empezar de cero', value: '' });
        const pickName = await Dialog.open({
            title: 'Partidas de este dispositivo',
            text: 'Tienes partidas guardadas sin cuenta. ¿Quieres continuar una de ellas en tu cuenta online?',
            buttons, cancel: '',
        });
        if (!pickName) return newProfile(name);
        const src = locals.find(p => p.username === pickName);
        const copy = migrateProfile(JSON.parse(JSON.stringify(src)));
        copy.username = name;
        return copy;
    }

    async function startCloudSession({ name = null } = {}) {
        const alive = A.newFlow();
        let acc;
        try { acc = await Cloud.loadAccount(); } catch (e) {
            console.warn('[Online] cargar cuenta', e);
            showAccountScreen({ intro: `No se pudo cargar tu cuenta: ${cloudErrorText(e)} Inténtalo de nuevo o juega sin cuenta.` });
            return;
        }
        if (!alive()) return;
        if (acc.player?.banned) {
            await Dialog.open({
                title: 'Cuenta suspendida', text: 'El creador del juego ha suspendido esta cuenta. Puedes seguir jugando sin cuenta.',
                buttons: [{ label: 'Aceptar', value: 1 }], cancel: 1,
            });
            await Cloud.logout();
            A.goLogin();
            return;
        }
        let profile;
        if (acc.save?.data) {
            profile = migrateProfile(acc.save.data);
            profile.adminEditAt = acc.save.adminEditAt || 0;
            if (acc.player?.name) profile.username = acc.player.name;
        } else {
            let finalName = name || acc.player?.name;
            if (!finalName) finalName = await askName('Tu cuenta aún no tiene nombre. Es el nombre que verán tus amigos.');
            if (!finalName) { await Cloud.logout(); showAccountScreen(); return; }
            profile = await chooseStartingProfile(finalName);
            profile.tutorialDone = profile.tutorialDone || false;
            try { await Cloud.createPlayer(profile); } catch (e) { fail(e, 'crear ficha'); }
        }
        if (!alive()) return;
        profile.customAch = [...(acc.player?.customAch || Cloud.player?.customAch || [])];
        A.setSession(profile, 'cloud');
        await Cloud.checkAdmin();
        motd = await Cloud.getMotd();
        let challenges = [];
        try { challenges = await Cloud.listMyChallenges(); } catch (e) { console.warn(e); }
        incoming = challenges.filter(c => c.toUid === Cloud.uid && c.status === 'pending');
        knownIncoming = new Set(incoming.map(c => c.id));
        const results = await resolveFinishedDuels(challenges);
        sawSave = false;
        Cloud.watchOwn({ onSave: onRemoteSave, onPlayer: onRemotePlayer, onIncoming: onIncomingDuels });
        if (!alive()) return;
        let intro = `Bienvenido, ${profile.username}.`;
        if (Cloud.isAdmin) intro += ' Tienes acceso al panel del creador.';
        if (incoming.length) intro += ` Tienes ${plural(incoming.length, 'duelo pendiente', 'duelos pendientes')}.`;
        if (results.length) intro += ' ' + results.join(' ');
        if (motd?.text) intro += ` Aviso del creador: ${motd.text}`;
        A.goMenu(intro);
    }

    function onRemoteSave(remote) {
        const p = me();
        if (!p || !isCloud()) return;
        if (!remote) { if (sawSave) handleWipe(); return; }
        sawSave = true;
        if (!remote.data) return;
        if ((remote.adminEditAt || 0) > (p.adminEditAt || 0)) {
            Cloud.cancelPending();
            const np = migrateProfile(remote.data);
            np.adminEditAt = remote.adminEditAt;
            np.customAch = p.customAch;
            A.replaceProfile(np);
            UI.toast('El creador ha actualizado tu partida');
            A.speech.say('El creador del juego ha actualizado tu partida.', { interrupt: false });
        }
    }

    /** El creador ha borrado los datos de esta cuenta mientras jugabas. */
    async function handleWipe() {
        sawSave = false;
        const uid = Cloud.uid;
        Cloud.cancelPending();
        Cloud.stopWatching();
        if (uid) Storage.deleteCloudCache(uid);
        A.clearSession();
        try { await Cloud.logout(); } catch (_) { /* nada */ }
        A.goLogin();
        await Dialog.open({
            title: 'Datos borrados', text: 'El creador del juego ha borrado los datos de esta cuenta. Si vuelves a entrar, empezarás de cero.',
            buttons: [{ label: 'Aceptar', value: 1 }], cancel: 1,
        });
        showAccountScreen();
    }

    async function onRemotePlayer(card) {
        const p = me();
        if (!p || !card || !isCloud()) return;
        const before = new Set(p.customAch || []);
        const now = card.customAch || [];
        const added = now.filter(id => !before.has(id));
        p.customAch = [...now];
        if (added.length) {
            let names = added;
            try {
                const all = await Cloud.listCustomAchievements({ force: true });
                names = added.map(id => all.find(a => a.id === id)?.name || 'un logro especial');
            } catch (_) { /* nombres genéricos */ }
            A.audio.achievement();
            UI.toast(`🌟 Logro especial: ${names.join(', ')}`);
            A.speech.say(`El creador te ha concedido ${names.length > 1 ? 'los logros especiales' : 'el logro especial'}: ${joinY(names)}.`, { interrupt: false });
        }
        if (card.banned) {
            UI.toast('Tu cuenta ha sido suspendida');
            A.speech.say('El creador ha suspendido tu cuenta online.', { interrupt: false });
        }
        A.refreshMenu();
    }

    function onIncomingDuels(list) {
        incoming = list;
        if (!knownIncoming) knownIncoming = new Set();
        const fresh = list.filter(c => !knownIncoming.has(c.id));
        fresh.forEach(c => knownIncoming.add(c.id));
        if (fresh.length) {
            const who = joinY([...new Set(fresh.map(c => c.fromName))]);
            UI.toast(`⚔️ ${who} te ha desafiado`);
            A.audio.achievement();
            A.speech.say(`${who} te ha desafiado a un duelo. Lo encontrarás en Comunidad y duelos.`, { interrupt: false });
        }
        A.refreshMenu();
    }

    /** Aplica los resultados de los duelos que enviaste y ya se han jugado. */
    async function resolveFinishedDuels(list) {
        const p = me() || null, msgs = [];
        if (!p || !Cloud.uid) return msgs;
        for (const c of list) {
            if (c.fromUid !== Cloud.uid || c.fromSeen || c.status === 'pending') continue;
            if (c.status === 'declined') msgs.push(`${c.toName} rechazó tu duelo.`);
            else {
                const r = c.fromScore > c.toScore ? 'win' : c.fromScore < c.toScore ? 'loss' : 'draw';
                recordDuel(r);
                msgs.push(r === 'win' ? `¡Ganaste tu duelo contra ${c.toName}, ${fmtNum(c.fromScore)} a ${fmtNum(c.toScore)}!`
                    : r === 'loss' ? `${c.toName} te ganó el duelo, ${fmtNum(c.toScore)} a ${fmtNum(c.fromScore)}.`
                        : `Empate con ${c.toName} a ${fmtNum(c.fromScore)} puntos.`);
            }
            try { await Cloud.markChallengeSeen(c.id); c.fromSeen = true; } catch (e) { console.warn(e); }
        }
        if (msgs.length) A.save();
        return msgs;
    }

    function recordDuel(result) {
        const p = me();
        p.duels = p.duels || { wins: 0, losses: 0, draws: 0 };
        if (result === 'win') p.duels.wins++;
        else if (result === 'loss') p.duels.losses++;
        else p.duels.draws++;
        if (p.duels.wins >= 1) A.unlockAch('duel_win');
        if (p.duels.wins >= 5) A.unlockAch('duel_master');
        A.save();
    }

    async function logout() {
        const c = await Dialog.open({
            title: '¿Cerrar sesión?', text: 'Tu progreso está guardado en la nube.',
            buttons: [{ label: 'Cerrar sesión', value: true }, { label: 'Cancelar', value: false }], cancel: false,
        });
        if (!c) return;
        try { await Cloud.logout(); } catch (e) { console.warn(e); }
        incoming = []; knownIncoming = null; motd = null;
        A.clearSession();
        showAccountScreen({ intro: 'Sesión cerrada. Hasta pronto.' });
    }

    function requireCloud(what) {
        if (isCloud()) return true;
        if (!Cloud.enabled) {
            A.speech.say('El modo online todavía no está configurado en este juego.');
            return false;
        }
        Dialog.open({
            title: 'Necesitas una cuenta',
            text: `${what} requiere una cuenta online gratuita. Así tu progreso se guarda en la nube y puedes competir con tus amigos.`,
            buttons: [{ label: 'Iniciar sesión o crear cuenta', value: 'go' }, { label: 'Ahora no', value: null }], cancel: null,
        }).then(v => { if (v === 'go') A.connectCloud(); });
        return false;
    }

    // ═══════════════════════════════════════════════════
    // Fichas de jugadores y amigos
    // ═══════════════════════════════════════════════════

    async function customAchList() {
        try { return await Cloud.listCustomAchievements(); } catch (_) { return []; }
    }

    async function showPlayer(card, back = null) {
        const p = me(), isMe = card.uid === Cloud.uid;
        const friend = (p.friends || []).includes(card.uid);
        const st = card.story || {}, du = card.duels || {}, s = card.stats || {};
        const customs = (card.customAch || []).length;
        const text = [
            `${st.label || 'Nivel 1'}.`,
            `Arena: ${fmtNum(card.arena?.bestScore || 0)} puntos, oleada ${card.arena?.bestWave || 0}.`,
            `Duelos: ${plural(du.wins || 0, 'victoria', 'victorias')}, ${plural(du.losses || 0, 'derrota', 'derrotas')}${du.draws ? `, ${plural(du.draws, 'empate', 'empates')}` : ''}.`,
            `Logros: ${card.achCount || 0} de ${ACHIEVEMENTS_DEF.length}${customs ? `, y ${plural(customs, 'logro especial', 'logros especiales')} del creador` : ''}.`,
            `Enemigos derrotados: ${fmtNum(s.kills || 0)}. Mejor racha: ${s.bestStreak || 0}. Tiempo de juego: ${fmtDuration(s.playTimeS || 0)}.`,
            card.banned ? 'Cuenta suspendida.' : '',
        ].filter(Boolean).join('\n');
        const buttons = [{ label: 'Ver sus logros', value: 'ach' }];
        if (!isMe) {
            buttons.push({ label: 'Desafiar a un duelo', value: 'duel' });
            buttons.push({ label: friend ? 'Quitar de mis amigos' : 'Añadir a mis amigos', value: 'friend' });
        }
        if (Cloud.isAdmin) buttons.push({ label: 'Administrar (panel del creador)', value: 'admin' });
        buttons.push({ label: 'Cerrar', value: 'close' });
        const c = await Dialog.open({ title: `${card.name}${friend ? ' ★' : ''}${isMe ? ' (tú)' : ''}`, text, buttons, cancel: 'close' });
        if (c === 'ach') openPlayerAchievements(card, back);
        else if (c === 'duel') startDuel(card);
        else if (c === 'friend') { toggleFriend(card); showPlayer(card, back); }
        else if (c === 'admin') adminPlayer(card);
    }

    function toggleFriend(card) {
        const p = me();
        p.friends = p.friends || [];
        if (p.friends.includes(card.uid)) {
            p.friends = p.friends.filter(u => u !== card.uid);
            A.speech.say(`${card.name} ya no está en tus amigos.`);
        } else {
            p.friends.push(card.uid);
            A.audio.uiSelect();
            A.speech.say(`${card.name} añadido a tus amigos.`);
            A.unlockAch('friend');
        }
        A.save();
    }

    async function openPlayerAchievements(card, back) {
        const customs = await customAchList();
        const owned = new Set(card.achievements || []);
        const items = ACHIEVEMENTS_DEF.map(a => ({
            label: a.name, sub: a.desc, icon: owned.has(a.id) ? '🏆' : '🔒', cls: owned.has(a.id) ? 'unlocked' : 'locked',
            speak: `${a.name}. ${owned.has(a.id) ? 'Conseguido' : 'Aún no'}. ${a.desc}`,
        }));
        (card.customAch || []).forEach(id => {
            const a = customs.find(x => x.id === id);
            if (a) items.unshift({ label: a.name, sub: `Logro especial del creador · ${a.desc || ''}`, icon: a.icon || '🌟', cls: 'unlocked', speak: `Logro especial del creador: ${a.name}. ${a.desc || ''}` });
        });
        ListScreen.open({
            title: `Logros de ${card.name}`,
            intro: `Logros de ${card.name}: ${card.achCount || 0} de ${ACHIEVEMENTS_DEF.length}.`,
            items, onBack: back || (() => openCommunity()),
        });
    }

    async function openPlayerList(kind = 'all', focusIndex = 0) {
        let players;
        try { players = await Cloud.listPlayers({ force: true }); } catch (e) { fail(e); return; }
        const p = me();
        let list = players.filter(x => x.uid !== Cloud.uid && !x.banned);
        if (kind === 'friends') list = list.filter(x => (p.friends || []).includes(x.uid));
        list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        ListScreen.open({
            title: kind === 'friends' ? 'Mis amigos' : 'Todos los invocadores',
            intro: kind === 'friends'
                ? (list.length ? `Tus amigos: ${list.length}. Enter para ver su ficha, sus logros o desafiarles.` : 'Aún no tienes amigos añadidos. Búscalos en Todos los invocadores.')
                : `${plural(list.length, 'invocador registrado', 'invocadores registrados')}. Enter para ver su ficha.`,
            items: list.map((x, i) => ({
                label: `${x.name}${(p.friends || []).includes(x.uid) ? ' ★' : ''}`,
                sub: `${x.story?.label || 'Nivel 1'} · Arena ${fmtNum(x.arena?.bestScore || 0)} · ${x.achCount || 0} logros`,
                icon: (p.friends || []).includes(x.uid) ? '★' : '👤',
                action: () => showPlayer(x, () => openPlayerList(kind, i)),
            })),
            emptyText: kind === 'friends' ? 'Añade amigos desde Todos los invocadores.' : 'Todavía no hay más invocadores registrados. ¡Pasa el enlace del juego a tus amigos!',
            focusIndex,
            onBack: () => openCommunity(kind === 'friends' ? 1 : 2),
        });
    }

    async function openCommunity(focusIndex = 0) {
        if (!requireCloud('La comunidad')) return;
        A.newFlow();
        let players = [], challenges = [];
        try { [players, challenges] = await Promise.all([Cloud.listPlayers({ force: true }), Cloud.listMyChallenges()]); } catch (e) { fail(e, 'comunidad'); return; }
        const results = await resolveFinishedDuels(challenges);
        const p = me();
        const others = players.filter(x => x.uid !== Cloud.uid && !x.banned);
        const friends = others.filter(x => (p.friends || []).includes(x.uid));
        incoming = challenges.filter(c => c.toUid === Cloud.uid && c.status === 'pending');
        const myCard = players.find(x => x.uid === Cloud.uid) || publicCard(p, Cloud.uid);
        let intro = `Comunidad. ${plural(others.length, 'invocador', 'invocadores')}, ${plural(friends.length, 'amigo', 'amigos')}.`;
        if (incoming.length) intro += ` Tienes ${plural(incoming.length, 'duelo pendiente', 'duelos pendientes')}.`;
        if (results.length) intro += ' ' + results.join(' ');
        ListScreen.open({
            title: 'Comunidad y duelos', intro, focusIndex,
            items: [
                { label: 'Duelos', sub: incoming.length ? `${plural(incoming.length, 'duelo', 'duelos')} esperando tu respuesta` : 'Desafía a tus amigos a las mismas oleadas', icon: '⚔️', action: () => openDuels() },
                { label: 'Mis amigos', sub: plural(friends.length, 'amigo', 'amigos'), icon: '★', action: () => openPlayerList('friends') },
                { label: 'Todos los invocadores', sub: plural(others.length, 'registrado', 'registrados'), icon: '👥', action: () => openPlayerList('all') },
                { label: 'Clasificación online', sub: 'Arena, historia, logros, duelos y desafío de hoy', icon: '🏆', action: () => openRankings(0, () => openCommunity(3)) },
                { label: 'Mi ficha', sub: 'Lo que ven los demás de ti', icon: '🪪', action: () => showPlayer(myCard, () => openCommunity(4)) },
            ],
            onBack: () => A.goMenu('Menú principal.', 'btn-community'),
        });
    }

    // ═══════════════════════════════════════════════════
    // Partidas con semilla (duelos y desafío diario)
    // ═══════════════════════════════════════════════════

    async function playSeeded({ kind, title, subtitle, seed, maxWave = 0, modifier = null, intro }) {
        const alive = A.newFlow();
        A.showCombat(title, subtitle);
        A.music.play('arena', { intensity: 1 });
        A.audio.setReverb('hall');
        await Narration.run([intro], { title });
        if (!alive()) return null;
        const enc = A.arenaEncounter({
            kind, title, seed, maxWave, modifier,
            waveText: (w, bag) => {
                const boss = bag.find(i => i.def.tier === 'boss');
                return `Oleada ${w}${maxWave ? ` de ${maxWave}` : ''}: ${plural(bag.length, 'enemigo', 'enemigos')}.${boss ? ` ¡${boss.def.short} entra en la arena!` : ''}`;
            },
        });
        const result = await A.runEncounter(enc);
        if (!alive()) return null;
        A.applyResult(result, kind);
        return result;
    }

    // ── Duelos ──────────────────────────────────────────

    const DUEL_WAVES = 5;

    async function startDuel(target) {
        if (!requireCloud('Los duelos')) return;
        const ok = await Dialog.open({
            title: `Duelo contra ${target.name}`,
            text: `Jugarás ${DUEL_WAVES} oleadas de la Arena. Después, ${target.name} jugará exactamente las mismas oleadas, con las mismas criaturas. Gana quien consiga más puntos.`,
            buttons: [{ label: '¡Empezar el duelo!', value: true }, { label: 'Cancelar', value: false }], cancel: false,
        });
        if (!ok) return;
        const seed = `duel-${Cloud.uid}-${Date.now()}`;
        const res = await playSeeded({
            kind: 'duel', title: `Duelo contra ${target.name}`, subtitle: `${DUEL_WAVES} oleadas`, seed, maxWave: DUEL_WAVES,
            intro: `Duelo contra ${target.name}. ${DUEL_WAVES} oleadas. Consigue todos los puntos que puedas.`,
        });
        if (!res) return;
        if (res.outcome === 'quit') {
            A.speech.say('Duelo cancelado: no se ha enviado.');
            openCommunity();
            return;
        }
        try {
            await Cloud.createChallenge({ toUid: target.uid, toName: target.name, fromName: me().username, seed, fromScore: res.score, fromWave: res.wave });
        } catch (e) { await fail(e, 'enviar duelo'); openCommunity(); return; }
        await Dialog.open({
            title: 'Duelo enviado',
            text: `Has conseguido ${fmtNum(res.score)} puntos y llegaste a la oleada ${res.wave}.\nCuando ${target.name} juegue, sabrás quién ha ganado.`,
            buttons: [{ label: 'Volver a Comunidad', value: 1 }], cancel: 1,
        });
        openDuels();
    }

    async function answerDuel(c) {
        const v = await Dialog.open({
            title: `${c.fromName} te desafía`,
            text: `${c.fromName} consiguió ${fmtNum(c.fromScore)} puntos y llegó a la oleada ${c.fromWave}.\nJugarás exactamente las mismas ${DUEL_WAVES} oleadas.`,
            buttons: [{ label: 'Aceptar y jugar', value: 'play' }, { label: 'Rechazar', value: 'no' }, { label: 'Ahora no', value: 'back' }],
            cancel: 'back',
        });
        if (v === 'no') {
            try { await Cloud.declineChallenge(c.id); A.speech.say('Duelo rechazado.'); } catch (e) { await fail(e); }
            openDuels();
            return;
        }
        if (v !== 'play') return;
        const res = await playSeeded({
            kind: 'duel', title: `Duelo contra ${c.fromName}`, subtitle: `Supera ${fmtNum(c.fromScore)} puntos`, seed: c.seed, maxWave: DUEL_WAVES,
            intro: `Duelo contra ${c.fromName}. Tienes que superar ${fmtNum(c.fromScore)} puntos.`,
        });
        if (!res) return;
        if (res.outcome === 'quit') { A.speech.say('Has abandonado el duelo. Puedes jugarlo más tarde.'); openDuels(); return; }
        try { await Cloud.answerChallenge(c.id, res.score, res.wave); } catch (e) { await fail(e, 'responder duelo'); openDuels(); return; }
        incoming = incoming.filter(x => x.id !== c.id);
        const r = res.score > c.fromScore ? 'win' : res.score < c.fromScore ? 'loss' : 'draw';
        recordDuel(r);
        if (r === 'win') A.audio.victory(); else if (r === 'loss') A.audio.defeat();
        const title = r === 'win' ? '¡Has ganado el duelo!' : r === 'loss' ? 'Has perdido el duelo' : '¡Empate!';
        const again = await Dialog.open({
            title,
            text: `Tú: ${fmtNum(res.score)} puntos. ${c.fromName}: ${fmtNum(c.fromScore)} puntos.`,
            buttons: [{ label: `Revancha: desafiar a ${c.fromName}`, value: 'rematch' }, { label: 'Volver a los duelos', value: 'back' }],
            cancel: 'back',
        });
        if (again === 'rematch') startDuel({ uid: c.fromUid, name: c.fromName });
        else openDuels();
    }

    async function pickDuelTarget() {
        let players;
        try { players = await Cloud.listPlayers(); } catch (e) { fail(e); return; }
        const p = me();
        const list = players.filter(x => x.uid !== Cloud.uid && !x.banned)
            .sort((a, b) => Number((p.friends || []).includes(b.uid)) - Number((p.friends || []).includes(a.uid)) || a.name.localeCompare(b.name, 'es'));
        ListScreen.open({
            title: 'Desafiar a…', intro: list.length ? 'Elige a quién desafiar. Tus amigos aparecen primero.' : 'No hay nadie más registrado todavía.',
            items: list.map(x => ({
                label: `${x.name}${(p.friends || []).includes(x.uid) ? ' ★' : ''}`,
                sub: `Duelos: ${x.duels?.wins || 0} victorias · Arena ${fmtNum(x.arena?.bestScore || 0)}`,
                icon: '⚔️', action: () => startDuel(x),
            })),
            emptyText: '¡Pasa el enlace del juego a tus amigos!',
            onBack: () => openDuels(),
        });
    }

    async function openDuels(focusIndex = 0) {
        if (!requireCloud('Los duelos')) return;
        A.newFlow();
        let list;
        try { list = await Cloud.listMyChallenges(); } catch (e) { fail(e, 'duelos'); return; }
        const results = await resolveFinishedDuels(list);
        const uid = Cloud.uid, p = me();
        incoming = list.filter(c => c.toUid === uid && c.status === 'pending');
        const items = [{ label: 'Desafiar a alguien', sub: 'Elige rival y juega 5 oleadas', icon: '➕', action: () => pickDuelTarget() }];
        incoming.forEach(c => items.push({
            label: `${c.fromName} te desafía`, sub: `Su puntuación: ${fmtNum(c.fromScore)} · Enter para responder`, icon: '⚔️',
            action: () => answerDuel(c),
        }));
        list.filter(c => c.fromUid === uid && c.status === 'pending').forEach(c => items.push({
            label: `Esperando a ${c.toName}`, sub: `Tu puntuación: ${fmtNum(c.fromScore)}`, icon: '⏳',
            action: async () => {
                const v = await Dialog.open({
                    title: `Duelo con ${c.toName}`, text: `Conseguiste ${fmtNum(c.fromScore)} puntos. ${c.toName} todavía no ha jugado.`,
                    buttons: [{ label: 'Cancelar este duelo', value: 'del' }, { label: 'Volver', value: 'back' }], cancel: 'back',
                });
                if (v === 'del') { try { await Cloud.deleteChallenge(c.id); A.speech.say('Duelo cancelado.'); } catch (e) { fail(e); } openDuels(); }
            },
        }));
        list.filter(c => c.status !== 'pending').slice(0, 20).forEach(c => {
            const mine = c.fromUid === uid;
            const other = mine ? c.toName : c.fromName, otherUid = mine ? c.toUid : c.fromUid;
            const my = mine ? c.fromScore : c.toScore, their = mine ? c.toScore : c.fromScore;
            const r = c.status === 'declined' ? 'Rechazado' : my > their ? 'Victoria' : my < their ? 'Derrota' : 'Empate';
            items.push({
                label: `${r} contra ${other}`, sub: c.status === 'declined' ? '' : `${fmtNum(my)} a ${fmtNum(their ?? 0)}`,
                icon: r === 'Victoria' ? '🏆' : r === 'Derrota' ? '💀' : '🤝',
                action: async () => {
                    const v = await Dialog.open({
                        title: `${r} contra ${other}`, text: c.status === 'declined' ? 'El duelo fue rechazado.' : `Tú: ${fmtNum(my)}. ${other}: ${fmtNum(their ?? 0)}.`,
                        buttons: [{ label: `Revancha contra ${other}`, value: 'rematch' }, { label: 'Borrar del historial', value: 'del' }, { label: 'Volver', value: 'back' }], cancel: 'back',
                    });
                    if (v === 'rematch') startDuel({ uid: otherUid, name: other });
                    else if (v === 'del') { try { await Cloud.deleteChallenge(c.id); } catch (e) { fail(e); } openDuels(); }
                },
            });
        });
        const du = p.duels || {};
        let intro = `Duelos. Tu balance: ${plural(du.wins || 0, 'victoria', 'victorias')} y ${plural(du.losses || 0, 'derrota', 'derrotas')}.`;
        if (incoming.length) intro += ` ${plural(incoming.length, 'duelo espera', 'duelos esperan')} tu respuesta.`;
        if (results.length) intro += ' ' + results.join(' ');
        ListScreen.open({ title: 'Duelos', intro, items, focusIndex, onBack: () => openCommunity(0) });
    }

    // ── Desafío diario ─────────────────────────────────

    function dailyModifier(day) { return pick([null, 'frenzy', 'fog', null, 'frenzy', 'fog', null], makeRng(`mod-${day}`)); }

    async function openDaily() {
        A.newFlow();
        const day = todayId(), mod = dailyModifier(day), p = me();
        const best = p.dailyBest?.day === day ? p.dailyBest.score : 0;
        const lines = [
            `Hoy, ${dayLabel(day)}, todos los invocadores juegan las mismas oleadas${mod ? `, con ${MODIFIERS[mod].name}: ${MODIFIERS[mod].desc}` : ''}.`,
            'Juega hasta caer. Cuenta tu mejor puntuación del día y puedes intentarlo las veces que quieras.',
            best ? `Tu mejor puntuación hoy: ${fmtNum(best)}.` : 'Todavía no lo has jugado hoy.',
        ];
        const streak = dailyStreak(p.dailyDays, day);
        if (streak > 1) lines.push(`Llevas ${streak} días seguidos jugando el desafío.${best ? '' : ' Juega hoy para no perder la racha.'}`);
        if (!isCloud()) lines.push(Cloud.enabled ? 'Inicia sesión para competir con tus amigos en la clasificación del día.' : '');
        const buttons = [{ label: 'Jugar el desafío de hoy', value: 'play' }];
        if (isCloud()) buttons.push({ label: 'Clasificación de hoy', value: 'board' });
        buttons.push({ label: 'Volver', value: 'back' });
        const v = await Dialog.open({ title: 'Desafío diario', text: lines.filter(Boolean).join('\n'), buttons, cancel: 'back' });
        if (v === 'play') playDaily();
        else if (v === 'board') openRankings(4, () => A.goMenu('Menú principal.', 'btn-daily'));
    }

    async function playDaily() {
        const day = todayId(), mod = dailyModifier(day);
        const res = await playSeeded({
            kind: 'daily', title: 'Desafío diario', subtitle: dayLabel(day), seed: `daily-${day}`, modifier: mod,
            intro: `Desafío diario. ${mod ? MODIFIERS[mod].name + '. ' : ''}¡Hasta caer!`,
        });
        if (!res) return;
        const p = me();
        const prevBest = p.dailyBest?.day === day ? p.dailyBest.score : 0;
        if (res.score > prevBest) p.dailyBest = { day, score: res.score };
        p.dailyDays = [...new Set([...(p.dailyDays || []), day])].slice(-90);
        // Los logros se cuentan en el resumen: dichos aparte, el resumen cortaba el anuncio.
        const streak = dailyStreak(p.dailyDays, day), won = [];
        if (res.wave > 1 || res.score > 0) {
            won.push(A.unlockAch('daily'));
            if (streak >= 3) won.push(A.unlockAch('daily3'));
            if (streak >= 7) won.push(A.unlockAch('daily7'));
            if (streak >= 30) won.push(A.unlockAch('daily30'));
        }
        A.save();
        const lines = [
            `Llegaste a la oleada ${res.wave} con ${fmtNum(res.score)} puntos.`,
            res.score > prevBest ? (prevBest ? '¡Has mejorado tu puntuación de hoy!' : '¡Es tu mejor puntuación de hoy!') : `Tu mejor de hoy sigue siendo ${fmtNum(prevBest)}.`,
            streak > 1 ? `Racha: ${streak} días seguidos.` : 'Vuelve mañana para empezar una racha de días.',
        ];
        if (won.some(Boolean)) lines.push(`Logros desbloqueados: ${joinY(won.filter(Boolean))}.`);
        const buttons = [];
        if (isCloud()) {
            try {
                await Cloud.submitDaily(day, { name: p.username, score: res.score, wave: res.wave });
                const board = (await Cloud.listDaily(day)).filter(s => s.score > 0);
                const pos = board.findIndex(s => s.uid === Cloud.uid) + 1;
                if (pos > 0) lines.push(`Vas en la posición ${pos} de ${board.length} hoy.`);
            } catch (e) { lines.push(`No se pudo publicar en la clasificación: ${cloudErrorText(e)}`); }
            buttons.push({ label: 'Clasificación de hoy', value: 'board' });
        }
        buttons.push({ label: 'Jugar otra vez', value: 'again' }, { label: 'Volver al menú', value: 'menu' });
        const v = await Dialog.open({ title: 'Desafío diario terminado', text: lines.join('\n'), buttons, cancel: 'menu' });
        if (v === 'board') openRankings(4, () => A.goMenu('Menú principal.', 'btn-daily'));
        else if (v === 'again') playDaily();
        else A.goMenu('Menú principal.', 'btn-daily');
    }

    // ═══════════════════════════════════════════════════
    // Clasificación online
    // ═══════════════════════════════════════════════════

    const RANK_TABS = ['Arena', 'Historia', 'Logros', 'Duelos', 'Hoy'];

    async function openRankings(tab = 0, back = null) {
        if (!requireCloud('La clasificación online')) return;
        A.newFlow();
        let players, daily;
        try { [players, daily] = await Promise.all([Cloud.listPlayers({ force: true }), Cloud.listDaily(todayId())]); } catch (e) { fail(e, 'clasificación'); return; }
        players = players.filter(x => !x.banned);
        const p = me(), friends = new Set(p.friends || []);
        const tag = x => `${x.uid === Cloud.uid ? ' (tú)' : ''}${friends.has(x.uid) ? ' ★' : ''}`;
        const medal = i => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⚔️');
        const byUid = Object.fromEntries(players.map(x => [x.uid, x]));
        const build = i => {
            if (i === 0) {
                const rows = [
                    ...players.filter(x => (x.arena?.bestScore || 0) > 0).map(x => ({ x, score: x.arena.bestScore, wave: x.arena.bestWave })),
                    ...LEGENDS.map(l => ({ legend: l, score: l.score, wave: l.wave })),
                ].sort((a, b) => b.score - a.score);
                return {
                    intro: 'Clasificación de la Arena.',
                    items: rows.map((r, idx) => r.legend ? {
                        label: `${idx + 1}. ${r.legend.name} · Leyenda`, sub: `${fmtNum(r.score)} puntos · oleada ${r.wave}`, icon: '📜',
                        speak: `Posición ${idx + 1}. ${r.legend.name}, leyenda de la Academia. ${fmtNum(r.score)} puntos.`,
                    } : {
                        label: `${idx + 1}. ${r.x.name}${tag(r.x)}`, sub: `${fmtNum(r.score)} puntos · oleada ${r.wave}`, icon: medal(idx),
                        cls: r.x.uid === Cloud.uid ? 'you' : '',
                        speak: `Posición ${idx + 1}. ${r.x.name}${tag(r.x).replace(' ★', ', amigo').replace(' (tú)', ', tú')}. ${fmtNum(r.score)} puntos, oleada ${r.wave}.`,
                        action: () => showPlayer(r.x, () => openRankings(0, back)),
                    }),
                };
            }
            const sorters = {
                1: { intro: 'Clasificación de la historia.', sort: (a, b) => storyValueOf(b.story || {}) - storyValueOf(a.story || {}), sub: x => `${x.story?.label || 'Nivel 1'} · ${fmtNum(x.story?.score || 0)} puntos` },
                2: { intro: 'Clasificación de logros.', sort: (a, b) => ((b.achCount || 0) + (b.customAch || []).length) - ((a.achCount || 0) + (a.customAch || []).length), sub: x => `${x.achCount || 0} logros${(x.customAch || []).length ? ` + ${x.customAch.length} especiales` : ''}` },
                3: { intro: 'Clasificación de duelos.', sort: (a, b) => (b.duels?.wins || 0) - (a.duels?.wins || 0) || (a.duels?.losses || 0) - (b.duels?.losses || 0), sub: x => `${x.duels?.wins || 0} victorias · ${x.duels?.losses || 0} derrotas` },
            };
            if (i === 4) {
                return {
                    intro: `Desafío de hoy: ${plural(daily.length, 'participante', 'participantes')}.`,
                    items: daily.map((d, idx) => {
                        const x = byUid[d.uid] || { uid: d.uid, name: d.name };
                        return {
                            label: `${idx + 1}. ${d.name}${tag(x)}`, sub: `${fmtNum(d.score)} puntos · oleada ${d.wave} · ${plural(d.attempts || 1, 'intento', 'intentos')}`,
                            icon: medal(idx), cls: d.uid === Cloud.uid ? 'you' : '',
                            speak: `Posición ${idx + 1}. ${d.name}. ${fmtNum(d.score)} puntos.`,
                            action: byUid[d.uid] ? () => showPlayer(byUid[d.uid], () => openRankings(4, back)) : null,
                        };
                    }),
                };
            }
            const s = sorters[i];
            const rows = [...players].sort(s.sort);
            return {
                intro: s.intro,
                items: rows.map((x, idx) => ({
                    label: `${idx + 1}. ${x.name}${tag(x)}`, sub: s.sub(x), icon: medal(idx), cls: x.uid === Cloud.uid ? 'you' : '',
                    speak: `Posición ${idx + 1}. ${x.name}${tag(x).replace(' ★', ', amigo').replace(' (tú)', ', tú')}. ${s.sub(x)}.`,
                    action: () => showPlayer(x, () => openRankings(i, back)),
                })),
            };
        };
        const first = build(tab);
        ListScreen.open({
            title: 'Clasificación online',
            intro: `${first.intro} Izquierda y derecha para cambiar entre ${joinY(RANK_TABS)}.`,
            tabs: RANK_TABS, tabIndex: tab, onTab: i => build(i),
            items: first.items,
            emptyText: 'Nadie ha jugado todavía. ¡Sé el primero!',
            onBack: back || (() => A.goMenu('Menú principal.', 'btn-leaderboard')),
        });
    }

    // ═══════════════════════════════════════════════════
    // Cuenta y privacidad
    // ═══════════════════════════════════════════════════

    function download(filename, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    async function exportData() {
        try {
            const data = isCloud() ? await Cloud.exportMyData(me()) : { exportadoEl: new Date().toISOString(), partidaLocal: me(), ajustes: A.settings };
            download('ecos-de-aethelgard-mis-datos.json', data);
            A.speech.say('Descarga iniciada: archivo ecos de aethelgard mis datos, en formato JSON.');
        } catch (e) { fail(e, 'exportar'); }
    }

    async function deleteAccountFlow() {
        let problem = '';
        for (; ;) {
            const v = await Dialog.open({
                title: '¿Borrar tu cuenta?',
                text: `${problem ? problem + '\n' : ''}Se borrarán tu cuenta, tu partida, tus puntuaciones, tus duelos y tu nombre. No se puede deshacer.\nPara confirmar, escribe tu contraseña.`,
                fields: [{ id: 'pass', label: 'Contraseña', type: 'password', autocomplete: 'current-password' }],
                buttons: [{ label: 'Borrar definitivamente', submit: true, danger: true }, { label: 'Cancelar', value: null }],
                cancel: null,
            });
            if (!v) return;
            if (!v.pass) { problem = 'Escribe tu contraseña para confirmar.'; continue; }
            const uid = Cloud.uid;
            A.speech.say('Borrando tus datos…');
            try {
                await Cloud.deleteAccount(v.pass, me());
                Storage.deleteCloudCache(uid);
                incoming = []; knownIncoming = null;
                A.clearSession();
                showAccountScreen({ intro: 'Tu cuenta y todos tus datos se han borrado. Gracias por jugar.' });
                return;
            } catch (e) {
                console.warn('[Online] borrar cuenta', e);
                A.audio.uiError();
                problem = cloudErrorText(e);
            }
        }
    }

    async function openAccountMenu(focusIndex = 0) {
        A.newFlow();
        const items = [];
        if (isCloud()) {
            const p = me();
            items.push({ label: `Sesión iniciada: ${p.username}`, sub: Cloud.email, icon: '🪪', speak: `Sesión iniciada como ${p.username}, con el correo ${Cloud.email}.` });
            items.push({ label: 'Política de privacidad', icon: '🔒', action: () => readPrivacy() });
            items.push({ label: 'Descargar mis datos', sub: 'Archivo con todo lo que guardamos de ti', icon: '⬇️', action: () => exportData() });
            items.push({
                label: 'Cambiar mi contraseña', sub: 'Te enviamos un correo', icon: '🔑', action: async () => {
                    try { await Cloud.resetPassword(Cloud.email); A.speech.say(`Te hemos enviado un correo a ${Cloud.email} para cambiar la contraseña.`); } catch (e) { fail(e); }
                },
            });
            items.push({
                label: 'Mi identificador de usuario', sub: Cloud.uid, icon: '🆔',
                speak: 'Mi identificador de usuario. Lo necesitas para activar el panel del creador.',
                action: () => Dialog.open({
                    title: 'Tu identificador (UID)', text: `${Cloud.uid}\nEl creador del juego lo usa para activar su panel de control. Consulta CONFIGURAR_ONLINE.md.`,
                    buttons: [
                        { label: 'Copiar al portapapeles', keep: true, action: () => navigator.clipboard?.writeText(Cloud.uid).then(() => A.speech.say('Copiado.'), () => A.speech.say('No se pudo copiar.')) },
                        { label: 'Cerrar', value: 1 },
                    ], cancel: 1,
                }),
            });
            items.push({ label: 'Cerrar sesión', icon: '🚪', action: () => logout() });
            items.push({ label: 'Borrar mi cuenta y todos mis datos', icon: '🗑️', cls: 'danger', action: () => deleteAccountFlow() });
        } else {
            items.push({ label: 'Política de privacidad', icon: '🔒', action: () => readPrivacy() });
            if (Cloud.enabled) items.push({ label: 'Iniciar sesión o crear cuenta', sub: 'Guarda tu progreso en la nube y compite', icon: '☁️', action: () => A.connectCloud() });
            items.push({ label: 'Descargar mis datos', sub: 'Tu partida de este dispositivo', icon: '⬇️', action: () => exportData() });
            items.push({
                label: 'Borrar los datos de este dispositivo', sub: 'Partidas, ajustes y logros locales', icon: '🗑️', cls: 'danger', action: async () => {
                    const c = await Dialog.open({
                        title: '¿Borrar los datos de este dispositivo?', text: 'Se borrarán todas las partidas sin cuenta y los ajustes guardados en este navegador.',
                        buttons: [{ label: 'Cancelar', value: false }, { label: 'Sí, borrarlo todo', value: true, danger: true }], cancel: false,
                    });
                    if (!c) return;
                    Storage.clearAll();
                    A.speech.say('Datos borrados.');
                    setTimeout(() => location.reload(), 900);
                },
            });
        }
        ListScreen.open({
            title: 'Cuenta y privacidad', intro: 'Cuenta y privacidad.', items, focusIndex,
            onBack: () => A.goMenu('Menú principal.', 'btn-account'),
        });
    }

    // ═══════════════════════════════════════════════════
    // Panel del creador («control de dios»)
    // Las reglas de Firestore solo permiten estas acciones
    // a quien tenga un documento en admins/{uid}.
    // ═══════════════════════════════════════════════════

    function requireAdmin() {
        if (Cloud.isAdmin && isCloud()) return true;
        A.speech.say('Solo el creador del juego puede entrar aquí.');
        return false;
    }

    async function adminDo(label, fn) {
        try {
            await fn();
            A.audio.uiSelect();
            UI.toast(`✔ ${label}`);
            A.speech.say(`Hecho: ${label}.`);
            return true;
        } catch (e) { fail(e, label); return false; }
    }

    async function confirm(title, text, okLabel = 'Sí', danger = false) {
        return Dialog.open({ title, text, buttons: [{ label: 'Cancelar', value: false }, { label: okLabel, value: true, danger }], cancel: false });
    }

    async function openAdmin(focusIndex = 0) {
        if (!requireAdmin()) return;
        A.newFlow();
        let players = [], customs = [];
        try { [players, customs] = await Promise.all([Cloud.listPlayers({ force: true }), Cloud.listCustomAchievements({ force: true })]); } catch (e) { fail(e, 'panel'); return; }
        motd = await Cloud.getMotd();
        ListScreen.open({
            title: 'Panel del creador',
            intro: `Panel del creador. ${plural(players.length, 'jugador', 'jugadores')} y ${plural(customs.length, 'logro especial', 'logros especiales')}.`,
            focusIndex,
            items: [
                { label: 'Jugadores', sub: 'Ver, quitar o dar logros, reiniciar récords, suspender o borrar', icon: '👥', action: () => adminPlayers() },
                { label: 'Logros especiales', sub: 'Crea logros propios y dáselos a quien quieras', icon: '🌟', action: () => adminCustom() },
                { label: 'Aviso para todos', sub: motd?.text ? `Actual: ${motd.text}` : 'Sin aviso publicado', icon: '📣', action: () => adminMotd() },
                { label: 'Desafío diario de hoy', sub: 'Revisar y borrar puntuaciones', icon: '📅', action: () => adminDaily() },
                { label: 'Duelos recientes', sub: 'Revisar y borrar duelos', icon: '⚔️', action: () => adminDuels() },
            ],
            onBack: () => A.goMenu('Menú principal.', 'btn-admin'),
        });
    }

    async function adminPlayers(focusIndex = 0) {
        let players;
        try { players = await Cloud.listPlayers({ force: true }); } catch (e) { fail(e); return; }
        players.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        ListScreen.open({
            title: 'Jugadores', intro: `${plural(players.length, 'jugador', 'jugadores')}. Enter para administrar.`, focusIndex,
            items: players.map((x, i) => ({
                label: `${x.name}${x.banned ? ' · SUSPENDIDO' : ''}${x.uid === Cloud.uid ? ' (tú)' : ''}`,
                sub: `${x.story?.label || 'Nivel 1'} · Arena ${fmtNum(x.arena?.bestScore || 0)} · ${x.achCount || 0} logros`,
                icon: x.banned ? '⛔' : '👤',
                action: () => adminPlayer(x, i),
            })),
            emptyText: 'No hay jugadores todavía.',
            onBack: () => openAdmin(0),
        });
    }

    async function adminPlayer(card, listIndex = 0) {
        if (!requireAdmin()) return;
        const fresh = await Cloud.getPlayer(card.uid).catch(() => null);
        if (!fresh) { A.speech.say('Ese jugador ya no existe.'); adminPlayers(); return; }
        card = fresh;
        const v = await Dialog.open({
            title: `Administrar: ${card.name}`,
            text: `${card.story?.label || 'Nivel 1'}. Arena: ${fmtNum(card.arena?.bestScore || 0)} puntos. Logros: ${card.achCount || 0}${(card.customAch || []).length ? ` y ${card.customAch.length} especiales` : ''}. ${card.banned ? 'Cuenta suspendida.' : 'Cuenta activa.'}\nUID: ${card.uid}`,
            buttons: [
                { label: 'Ver su ficha', value: 'view' },
                { label: 'Quitar un logro', value: 'rm' },
                { label: 'Dar un logro', value: 'give' },
                { label: 'Reiniciar su récord de Arena', value: 'arena' },
                { label: 'Cambiar su nivel de historia', value: 'level' },
                { label: card.banned ? 'Quitar la suspensión' : 'Suspender su cuenta', value: 'ban' },
                { label: 'Borrar todos sus datos', value: 'del', danger: true },
                { label: 'Volver', value: 'back' },
            ],
            cancel: 'back',
        });
        if (v === 'view') { showPlayer(card, () => adminPlayers(listIndex)); return; }
        if (v === 'rm') { adminAchList(card, 'remove'); return; }
        if (v === 'give') { adminAchList(card, 'give'); return; }
        if (v === 'arena') {
            if (await confirm('¿Reiniciar su récord?', `La puntuación de Arena de ${card.name} volverá a cero.`, 'Reiniciar')) await adminDo(`récord de ${card.name} reiniciado`, () => Cloud.adminResetArena(card.uid));
        } else if (v === 'level') {
            const f = await Dialog.open({
                title: 'Nivel de historia', text: `Del 1 al 30. El 31 lleva a la selección de rutas. Nivel actual: ${card.story?.level || 1}.`,
                fields: [{ id: 'level', label: 'Nuevo nivel', type: 'number', value: String(card.story?.level || 1) }],
                buttons: [{ label: 'Guardar', submit: true }, { label: 'Cancelar', value: null }], cancel: null,
            });
            const n = f ? parseInt(f.level, 10) : NaN;
            if (Number.isFinite(n)) await adminDo(`nivel de ${card.name} cambiado a ${clamp(n, 1, 31)}`, () => Cloud.adminSetStoryLevel(card.uid, n));
        } else if (v === 'ban') {
            const to = !card.banned;
            if (await confirm(to ? '¿Suspender la cuenta?' : '¿Quitar la suspensión?', to ? `${card.name} desaparecerá de las clasificaciones y no podrá actualizar su ficha.` : `${card.name} volverá a aparecer en las clasificaciones.`, to ? 'Suspender' : 'Quitar suspensión', to)) {
                await adminDo(to ? `${card.name} suspendido` : `suspensión de ${card.name} retirada`, () => Cloud.adminSetBanned(card.uid, to));
            }
        } else if (v === 'del') {
            if (await confirm(`¿Borrar todos los datos de ${card.name}?`, 'Se borrarán su ficha, su partida y su nombre. No se puede deshacer. Su acceso seguirá existiendo, pero empezaría de cero.', 'Borrar', true)) {
                if (await adminDo(`datos de ${card.name} borrados`, () => Cloud.adminDeletePlayer(card.uid))) { adminPlayers(); return; }
            }
        } else { adminPlayers(listIndex); return; }
        adminPlayer(card, listIndex);
    }

    async function adminAchList(card, mode) {
        const fresh = await Cloud.getPlayer(card.uid).catch(() => card) || card;
        const customs = await customAchList();
        const owned = new Set(fresh.achievements || []), ownedC = new Set(fresh.customAch || []);
        const items = [];
        if (mode === 'remove') {
            ACHIEVEMENTS_DEF.filter(a => owned.has(a.id)).forEach(a => items.push({
                label: a.name, sub: a.desc, icon: '🏆',
                action: async () => { if (await adminDo(`logro ${a.name} retirado a ${card.name}`, () => Cloud.adminRemoveAchievement(card.uid, a.id))) adminAchList(card, mode); },
            }));
            customs.filter(a => ownedC.has(a.id)).forEach(a => items.push({
                label: a.name, sub: 'Logro especial', icon: a.icon || '🌟',
                action: async () => { if (await adminDo(`logro especial ${a.name} retirado a ${card.name}`, () => Cloud.adminRevokeCustom(card.uid, a.id))) adminAchList(card, mode); },
            }));
        } else {
            customs.filter(a => !ownedC.has(a.id)).forEach(a => items.push({
                label: a.name, sub: 'Logro especial', icon: a.icon || '🌟',
                action: async () => { if (await adminDo(`logro especial ${a.name} concedido a ${card.name}`, () => Cloud.adminGrantCustom(card.uid, a.id))) adminAchList(card, mode); },
            }));
            ACHIEVEMENTS_DEF.filter(a => !owned.has(a.id)).forEach(a => items.push({
                label: a.name, sub: a.desc, icon: '🔓',
                action: async () => { if (await adminDo(`logro ${a.name} concedido a ${card.name}`, () => Cloud.adminGrantAchievement(card.uid, a.id))) adminAchList(card, mode); },
            }));
        }
        ListScreen.open({
            title: mode === 'remove' ? `Quitar logros a ${card.name}` : `Dar logros a ${card.name}`,
            intro: mode === 'remove' ? `Enter sobre un logro para quitárselo a ${card.name}.` : `Enter sobre un logro para dárselo a ${card.name}.`,
            items, emptyText: mode === 'remove' ? 'No tiene logros.' : 'Ya tiene todos los logros.',
            onBack: () => adminPlayer(card),
        });
    }

    async function adminCustom(focusIndex = 0) {
        let list;
        try { list = await Cloud.listCustomAchievements({ force: true }); } catch (e) { fail(e); return; }
        ListScreen.open({
            title: 'Logros especiales', intro: `Logros especiales: ${list.length}.`, focusIndex,
            items: [
                { label: 'Crear un logro nuevo', icon: '➕', action: () => adminCreateCustom() },
                ...list.map((a, i) => ({ label: a.name, sub: a.desc, icon: a.icon || '🌟', action: () => adminCustomDialog(a, i + 1) })),
            ],
            onBack: () => openAdmin(1),
        });
    }

    async function adminCreateCustom() {
        const v = await Dialog.open({
            title: 'Nuevo logro especial', text: 'Inventa un logro. Después podrás dárselo a quien quieras.',
            fields: [
                { id: 'name', label: 'Nombre del logro', maxlength: 40 },
                { id: 'desc', label: 'Descripción', maxlength: 140 },
                { id: 'icon', label: 'Emoji (opcional)', value: '🌟', maxlength: 4 },
            ],
            buttons: [{ label: 'Crear logro', submit: true }, { label: 'Cancelar', value: null }], cancel: null,
        });
        if (!v || !v.name?.trim()) { adminCustom(); return; }
        await adminDo(`logro ${v.name.trim()} creado`, () => Cloud.adminCreateCustom({ name: v.name.trim(), desc: (v.desc || '').trim(), icon: (v.icon || '🌟').trim() }));
        adminCustom();
    }

    async function adminCustomDialog(a, idx) {
        const v = await Dialog.open({
            title: a.name, text: a.desc || '',
            buttons: [
                { label: 'Dar a un jugador', value: 'one' },
                { label: 'Dar a todos los jugadores', value: 'all' },
                { label: 'Borrar este logro', value: 'del', danger: true },
                { label: 'Volver', value: 'back' },
            ], cancel: 'back',
        });
        if (v === 'one') {
            const players = await Cloud.listPlayers({ force: true }).catch(() => []);
            ListScreen.open({
                title: `Dar «${a.name}»`, intro: 'Elige a quién dárselo.',
                items: players.filter(x => !(x.customAch || []).includes(a.id)).map(x => ({
                    label: x.name, icon: '👤',
                    action: async () => { await adminDo(`${a.name} concedido a ${x.name}`, () => Cloud.adminGrantCustom(x.uid, a.id)); adminCustom(idx); },
                })),
                emptyText: 'Todos los jugadores ya lo tienen.',
                onBack: () => adminCustom(idx),
            });
            return;
        }
        if (v === 'all') {
            const players = await Cloud.listPlayers({ force: true }).catch(() => []);
            if (await confirm(`¿Dar «${a.name}» a todos?`, `Se concederá a ${plural(players.length, 'jugador', 'jugadores')}.`, 'Dar a todos')) {
                await adminDo(`${a.name} concedido a todos`, async () => { for (const x of players) await Cloud.adminGrantCustom(x.uid, a.id); });
            }
        } else if (v === 'del') {
            if (await confirm(`¿Borrar «${a.name}»?`, 'Desaparecerá de todos los perfiles.', 'Borrar', true)) {
                await adminDo(`logro ${a.name} borrado`, async () => {
                    const players = await Cloud.listPlayers({ force: true });
                    for (const x of players.filter(x => (x.customAch || []).includes(a.id))) await Cloud.adminRevokeCustom(x.uid, a.id);
                    await Cloud.adminDeleteCustom(a.id);
                });
            }
        }
        adminCustom(idx);
    }

    async function adminMotd() {
        const v = await Dialog.open({
            title: 'Aviso para todos', text: 'Lo oirán todos los jugadores al entrar. Déjalo vacío para quitarlo.',
            fields: [{ id: 'text', label: 'Aviso', value: motd?.text || '', maxlength: 240 }],
            buttons: [{ label: 'Publicar', submit: true }, { label: 'Cancelar', value: null }], cancel: null,
        });
        if (v) {
            const text = (v.text || '').trim();
            if (await adminDo(text ? 'aviso publicado' : 'aviso retirado', () => Cloud.adminSetMotd(text))) motd = text ? { text } : null;
        }
        openAdmin(2);
    }

    async function adminDaily() {
        const day = todayId();
        let list;
        try { list = await Cloud.listDaily(day); } catch (e) { fail(e); return; }
        ListScreen.open({
            title: `Desafío diario: ${dayLabel(day)}`, intro: `${plural(list.length, 'puntuación', 'puntuaciones')} hoy. Enter para borrar una.`,
            items: list.map((d, i) => ({
                label: `${i + 1}. ${d.name}`, sub: `${fmtNum(d.score)} puntos · oleada ${d.wave}`, icon: '📅',
                action: async () => {
                    if (await confirm(`¿Borrar la puntuación de ${d.name}?`, `${fmtNum(d.score)} puntos de hoy.`, 'Borrar', true)) {
                        await adminDo(`puntuación de ${d.name} borrada`, () => Cloud.adminDeleteDaily(day, d.uid));
                    }
                    adminDaily();
                },
            })),
            emptyText: 'Nadie ha jugado el desafío de hoy.',
            onBack: () => openAdmin(3),
        });
    }

    async function adminDuels() {
        let list;
        try { list = await Cloud.adminListChallenges(); } catch (e) { fail(e); return; }
        ListScreen.open({
            title: 'Duelos recientes', intro: `${plural(list.length, 'duelo', 'duelos')}. Enter para borrar uno.`,
            items: list.map(c => ({
                label: `${c.fromName} contra ${c.toName}`,
                sub: c.status === 'pending' ? `Pendiente · ${fmtNum(c.fromScore)}` : c.status === 'declined' ? 'Rechazado' : `${fmtNum(c.fromScore)} a ${fmtNum(c.toScore ?? 0)}`,
                icon: '⚔️',
                action: async () => {
                    if (await confirm('¿Borrar este duelo?', `${c.fromName} contra ${c.toName}.`, 'Borrar', true)) {
                        await adminDo('duelo borrado', () => Cloud.deleteChallenge(c.id));
                    }
                    adminDuels();
                },
            })),
            emptyText: 'No hay duelos.',
            onBack: () => openAdmin(4),
        });
    }

    // ═══════════════════════════════════════════════════

    function init(ctx) {
        A = ctx;
        bindAccountScreen();
    }

    return {
        init, isCloud, startCloudSession, showAccountScreen, readPrivacy,
        openCommunity, openDuels, openDaily, openRankings, openAccountMenu, openAdmin, logout,
        get pending() { return pendingCount(); },
        get motd() { return motd; },
        flush: () => Cloud.flush(),
    };
})();
