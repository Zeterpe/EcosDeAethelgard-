#!/usr/bin/env node
/* =============================================
   ECOS DE AETHELGARD — tools/generar-narracion.mjs

   Genera la narración de la historia con voces neuronales
   de Microsoft Azure (plan gratuito F0: 500.000 caracteres
   al mes; la historia completa ocupa unos 24.000).

   Uso:
     AZURE_SPEECH_KEY=tu_clave AZURE_SPEECH_REGION=westeurope node tools/generar-narracion.mjs
     node tools/generar-narracion.mjs --prueba        (solo muestra el reparto, sin llamar a Azure)
     node tools/generar-narracion.mjs --todo          (regenera aunque no haya cambios)

   También se puede lanzar desde GitHub: pestaña Actions → «Generar narración».
   Los audios se guardan en audio/narracion/ junto con manifest.json.
   Solo se regeneran los fragmentos cuyo texto o voz hayan cambiado.
   ============================================= */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// ═══════════════════════════════════════════════════════
// REPARTO DE VOCES — cámbialo a tu gusto.
// voz: nombre de la voz de Azure (es-ES-…). velocidad / tono: ajustes
// relativos (por ejemplo «-10%»). efecto: cómo suena en el juego
// (narrador · eco · avatar · guardian · furia). pausa: silencio tras cada frase;
// coma: silencio extra en cada coma (en milisegundos).
// ═══════════════════════════════════════════════════════

export const REPARTO = {
    narrador: { nombre: 'Narrador', voz: 'es-ES-AlvaroNeural', genero: 'Male', velocidad: '-15%', tono: '-6%', pausa: 750, coma: 180, efecto: 'narrador' },
    sylvara: { nombre: 'Maestra Sylvara', voz: 'es-ES-ElviraNeural', genero: 'Female', velocidad: '-12%', tono: '-3%', pausa: 600, coma: 140, efecto: 'eco' },
    tomas: { nombre: 'Archivero Tomás', voz: 'es-ES-ArnauNeural', genero: 'Male', velocidad: '-6%', tono: '+3%', pausa: 450, coma: 100, efecto: 'eco' },
    avatar: { nombre: 'Avatar del Silencio', voz: 'es-ES-SaulNeural', genero: 'Male', velocidad: '-22%', tono: '-14%', pausa: 950, coma: 300, efecto: 'avatar' },
    ignar: { nombre: 'Ignar', voz: 'es-ES-EliasNeural', genero: 'Male', velocidad: '-14%', tono: '-8%', pausa: 650, coma: 200, efecto: 'guardian' },
    corriente: { nombre: 'La Gran Corriente', voz: 'es-ES-VeraNeural', genero: 'Female', velocidad: '-18%', tono: '-3%', pausa: 750, coma: 220, efecto: 'guardian' },
    zael: { nombre: 'Zael', voz: 'es-ES-TeoNeural', genero: 'Male', velocidad: '-12%', tono: '+4%', pausa: 700, coma: 200, efecto: 'guardian' },
    rok: { nombre: 'Rok', voz: 'es-ES-DarioNeural', genero: 'Male', velocidad: '-22%', tono: '-16%', pausa: 800, coma: 250, efecto: 'guardian' },
    ignar_furia: { nombre: 'Ignar (furia)', voz: 'es-ES-EliasNeural', genero: 'Male', velocidad: '+4%', tono: '-6%', volumen: 'loud', pausa: 0, efecto: 'furia' },
    corriente_furia: { nombre: 'Leviatán (furia)', voz: 'es-ES-VeraNeural', genero: 'Female', velocidad: '+2%', tono: '-8%', volumen: 'loud', pausa: 0, efecto: 'furia' },
    zael_furia: { nombre: 'Zael (furia)', voz: 'es-ES-TeoNeural', genero: 'Male', velocidad: '+8%', tono: '+2%', volumen: 'loud', pausa: 0, efecto: 'furia' },
    rok_furia: { nombre: 'Rok (furia)', voz: 'es-ES-DarioNeural', genero: 'Male', velocidad: '-6%', tono: '-14%', volumen: 'loud', pausa: 0, efecto: 'furia' },
    // Guardianes corrompidos antes del combate: su voz, poseída por el Silencio
    ignar_corrupto: { nombre: 'Ignar (corrompido)', voz: 'es-ES-EliasNeural', genero: 'Male', velocidad: '-10%', tono: '-14%', pausa: 450, coma: 150, efecto: 'avatar' },
    corriente_corrupta: { nombre: 'Leviatán (corrompido)', voz: 'es-ES-VeraNeural', genero: 'Female', velocidad: '-20%', tono: '-12%', pausa: 650, coma: 220, efecto: 'avatar' },
    rok_corrupto: { nombre: 'Rok (corrompido)', voz: 'es-ES-DarioNeural', genero: 'Male', velocidad: '-24%', tono: '-18%', pausa: 700, coma: 250, efecto: 'avatar' },
    // Crónicas de los Antiguos Ecos
    aldara: { nombre: 'Maestra Aldara', voz: 'es-ES-TrianaNeural', genero: 'Female', velocidad: '-12%', tono: '-2%', pausa: 650, coma: 160, efecto: 'eco' },
    darien: { nombre: 'Darién', voz: 'es-ES-NilNeural', genero: 'Male', velocidad: '-6%', tono: '+2%', pausa: 450, coma: 120, efecto: 'eco' },
    darien_espiritu: { nombre: 'Darién (espíritu)', voz: 'es-ES-NilNeural', genero: 'Male', velocidad: '-14%', tono: '0%', pausa: 700, coma: 200, efecto: 'guardian' },
};

const FORMATOS = {
    mp3: { cabecera: 'audio-24khz-48kbitrate-mono-mp3', ext: 'mp3' },
    wav: { cabecera: 'riff-24khz-16bit-mono-pcm', ext: 'wav' },
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = path.join(ROOT, 'audio', 'narracion');
const MANIFIESTO = path.join(SALIDA, 'manifest.json');

// ═══════════════════════════════════════════════════════
// Textos de la historia (se leen directamente de js/lore.js)
// ═══════════════════════════════════════════════════════

export function cargarTextos() {
    const ctx = { window: {}, console };
    vm.createContext(ctx);
    for (const f of ['data', 'lore']) {
        const code = fs.readFileSync(path.join(ROOT, 'js', `${f}.js`), 'utf8').replace(/^(const|let) /gm, 'var ');
        vm.runInContext(code, ctx, { filename: `${f}.js` });
    }
    return { L: ctx.LORE, X: ctx.LORE_EXTRA };
}

/** Secciones narradas. La clave es la que usa el juego. citas: quién dice lo que va entre comillas. */
export function secciones({ L, X }) {
    const s = [];
    const add = (key, parrafos, hablante, citas = hablante) => s.push({ key, parrafos, hablante, citas });
    add('echo_1', L.echos[1], 'narrador');
    add('echo_10', L.echos[10], 'narrador', 'sylvara');
    add('echo_15_shadow', L.echos['15_shadow'], 'avatar');
    add('echo_20', L.echos[20], 'narrador', 'tomas');
    add('echo_25_shadow', L.echos['25_shadow'], 'avatar');
    add('echo_30', L.echos[30], 'narrador');
    const guardian = { fire: 'ignar', water: 'corriente', wind: 'zael', earth: 'rok' };
    for (const r of ['fire', 'water', 'wind', 'earth']) {
        add(`route_${r}_pre`, L.bosses[r].preRoute, 'narrador');
        add(`route_${r}_rage`, [L.bosses[r].rage], `${guardian[r]}_furia`);
        add(`route_${r}_victory`, L.bosses[r].victory, 'narrador', guardian[r]);
        add(`mech_${r}`, X.bossMechanics[r], 'narrador');
    }
    add('mech_final', X.bossMechanics.final, 'narrador');
    add('final_intro', L.finalBoss.intro, 'avatar');
    add('final_victory', L.finalBoss.victory, 'narrador');
    add('act_11', X.acts[11], 'narrador');
    add('act_21', X.acts[21], 'narrador');
    add('shadow_15', X.shadow[15], 'narrador');
    add('shadow_25', X.shadow[25], 'narrador');
    add('avatar_phase_2', [X.avatarPhases[2]], 'avatar');
    add('avatar_phase_3', [X.avatarPhases[3]], 'avatar');
    add('all_routes', X.allRoutesDone, 'narrador');
    add('credits', X.credits, 'narrador');
    add('cycle', X.cycle, 'narrador');
    // Crónicas de los Antiguos Ecos. citas: quién dice cada cita, en orden (la última se repite).
    const C = L.chronicles;
    add('chron_1', C[1], 'narrador', ['tomas']);
    add('chron_2', C[2], 'narrador', ['tomas']);
    add('chron_3', C[3], 'narrador', ['aldara', 'aldara', 'aldara', 'tomas']);
    add('chron_4', C[4], 'narrador', ['tomas', 'darien', 'tomas']);
    add('chron_5', C[5], 'narrador', ['darien_espiritu', 'tomas']);
    add('chron_6', C[6], 'narrador', ['rok', 'zael', 'corriente', 'ignar']);
    add('chron_epilogue', C.epilogue, 'narrador', ['darien_espiritu']);
    for (const id of Object.keys(L.creatures)) add(`creature_${id}`, L.creatures[id], 'narrador');
    const corrupto = { fire: 'ignar_corrupto', water: 'corriente_corrupta', wind: 'zael_furia', earth: 'rok_corrupto' };
    for (const r of ['fire', 'water', 'wind', 'earth']) {
        add(`route_${r}_legend`, L.bosses[r].legend, 'narrador');
        add(`route_${r}_encounter`, L.bosses[r].encounter, 'narrador', corrupto[r]);
    }
    return s;
}

// ═══════════════════════════════════════════════════════
// Utilidades
// ═══════════════════════════════════════════════════════

/** Mismo hash que usa el juego (js/narrator.js) para comprobar que el audio corresponde al texto. */
export function hashTexto(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0');
}

const NOMBRES = ['Rok', 'Ignar', 'Zael', 'Aethelgard', 'Silencio'];

/** Los gritos en MAYÚSCULAS se pasan a frase normal para que la voz no los deletree. */
function suavizarMayusculas(t) {
    const letras = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
    const mayus = letras.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length;
    if (letras.length < 8 || mayus / letras.length < 0.7) return t;
    let s = t.toLowerCase().replace(/(^|[.!?¡¿]\s*)([a-záéíóúüñ])/g, (m, a, b) => a + b.toUpperCase());
    for (const n of NOMBRES) s = s.replace(new RegExp(`\\b${n.toLowerCase()}\\b`, 'g'), n);
    return s;
}

/** Divide cada párrafo en fragmentos de narrador y de personaje (lo que va entre comillas). */
export function segmentar(sec) {
    let enCita = false, nCita = 0;
    const quienCita = () => (Array.isArray(sec.citas) ? sec.citas[Math.min(nCita, sec.citas.length) - 1] : sec.citas);
    return sec.parrafos.map(p => {
        const trozos = [];
        let buf = '';
        const cerrar = () => {
            const t = buf.replace(/\s+/g, ' ').trim();
            if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(t)) {
                const hablante = enCita ? quienCita() : sec.hablante;
                const prev = trozos[trozos.length - 1];
                if (prev && prev.hablante === hablante) prev.texto += ' ' + t;
                else trozos.push({ texto: t, hablante });
            }
            buf = '';
        };
        for (const ch of p) {
            if (ch === '"' || ch === '«' || ch === '»') { cerrar(); enCita = !enCita; if (enCita) nCita++; }
            else buf += ch;
        }
        cerrar();
        return { texto: p, trozos };
    });
}

function xml(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** SSML para Azure con la voz, el ritmo y las pausas del personaje. */
export function ssml(texto, rol) {
    const r = REPARTO[rol];
    let cuerpo = xml(suavizarMayusculas(texto));
    if (r.pausa) cuerpo = cuerpo.replace(/([.!?…])\s+/g, `$1<break time="${r.pausa}ms"/> `);
    if (r.coma) cuerpo = cuerpo.replace(/([,;:])\s+/g, `$1<break time="${r.coma}ms"/> `);
    const vol = r.volumen ? ` volume="${r.volumen}"` : '';
    return '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ' +
        'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="es-ES">' +
        `<voice name="${r.voz}"><prosody rate="${r.velocidad}" pitch="${r.tono}"${vol}>${cuerpo}</prosody></voice></speak>`;
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════
// Azure
// ═══════════════════════════════════════════════════════

function urlBase(region) { return `https://${region}.tts.speech.microsoft.com/cognitiveservices`; }

async function comprobarVoces(clave, region) {
    const url = process.env.AZURE_VOICES_URL || `${urlBase(region)}/voices/list`;
    let r;
    try {
        r = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': clave } });
    } catch (_) {
        throw new Error(`No se pudo conectar con Azure en la región «${region}». AZURE_SPEECH_REGION debe ser la región del recurso, por ejemplo westeurope.`);
    }
    if (r.status === 401 || r.status === 403) throw new Error('Azure rechaza la clave. Revisa AZURE_SPEECH_KEY y AZURE_SPEECH_REGION.');
    if (!r.ok) throw new Error(`No se pudo obtener la lista de voces (HTTP ${r.status}).`);
    const voces = (await r.json()).filter(v => v.Locale === 'es-ES');
    const nombres = new Set(voces.map(v => v.ShortName));
    for (const [rol, conf] of Object.entries(REPARTO)) {
        if (nombres.has(conf.voz)) continue;
        const alt = voces.find(v => v.Gender === conf.genero) || voces[0];
        if (!alt) throw new Error('Azure no ofrece voces es-ES en esta región.');
        console.warn(`⚠  La voz ${conf.voz} (${rol}) no está disponible; se usará ${alt.ShortName}.`);
        conf.voz = alt.ShortName;
    }
}

async function sintetizar(xmlSsml, clave, region, formato) {
    const url = process.env.AZURE_TTS_URL || `${urlBase(region)}/v1`;
    for (let intento = 1; intento <= 6; intento++) {
        const r = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': clave,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': FORMATOS[formato].cabecera,
                'User-Agent': 'ecos-de-aethelgard',
            },
            body: xmlSsml,
        });
        if (r.ok) return Buffer.from(await r.arrayBuffer());
        if (r.status === 429 || r.status >= 500) {
            const espera = (+r.headers.get('retry-after') || 0) * 1000 || 8000 * intento;
            console.warn(`   Azure pide esperar (HTTP ${r.status}). Reintento en ${Math.round(espera / 1000)} s…`);
            await esperar(espera);
            continue;
        }
        throw new Error(`Azure respondió ${r.status}: ${(await r.text()).slice(0, 300)}`);
    }
    throw new Error('Azure no respondió tras varios intentos.');
}

// ═══════════════════════════════════════════════════════
// Programa
// ═══════════════════════════════════════════════════════

async function main() {
    const args = new Set(process.argv.slice(2));
    const prueba = args.has('--prueba');
    const todo = args.has('--todo') || process.env.FORCE === '1';
    const formato = (process.env.FORMATO || 'mp3').toLowerCase();
    if (!FORMATOS[formato]) throw new Error(`Formato desconocido: ${formato}`);
    const pausaMs = +(process.env.PAUSA_MS ?? 3200);   // plan gratuito: 20 peticiones por minuto

    const secs = secciones(cargarTextos());
    const plan = secs.map(sec => ({ sec, parrafos: segmentar(sec) }));
    for (const { sec, parrafos } of plan) {
        if (parrafos.some(p => typeof p.texto !== 'string')) throw new Error(`La sección ${sec.key} tiene un texto vacío o que no existe en js/lore.js.`);
        for (const p of parrafos) for (const t of p.trozos) {
            if (!REPARTO[t.hablante]) throw new Error(`La sección ${sec.key} usa un personaje que no está en el REPARTO: ${t.hablante}`);
        }
    }
    const totalCaracteres = plan.reduce((n, p) => n + p.parrafos.reduce((m, q) => m + q.trozos.reduce((k, t) => k + t.texto.length, 0), 0), 0);
    const totalTrozos = plan.reduce((n, p) => n + p.parrafos.reduce((m, q) => m + q.trozos.length, 0), 0);

    if (prueba) {
        for (const { sec, parrafos } of plan) {
            console.log(`\n■ ${sec.key}`);
            parrafos.forEach((p, i) => p.trozos.forEach(t => console.log(`  ${i + 1}. [${REPARTO[t.hablante].nombre}] ${t.texto.slice(0, 90)}${t.texto.length > 90 ? '…' : ''}`)));
        }
        console.log(`\n${totalTrozos} fragmentos, ${totalCaracteres} caracteres (el plan gratuito de Azure da 500.000 al mes).`);
        return;
    }

    // Admite la región escrita como en el portal («West Europe» → westeurope).
    const clave = (process.env.AZURE_SPEECH_KEY || '').trim();
    const region = (process.env.AZURE_SPEECH_REGION || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (!clave || !region) {
        throw new Error('Faltan AZURE_SPEECH_KEY y AZURE_SPEECH_REGION. Consulta CONFIGURAR_VOCES.md.');
    }
    fs.mkdirSync(SALIDA, { recursive: true });
    await comprobarVoces(clave, region);

    const previo = fs.existsSync(MANIFIESTO) ? JSON.parse(fs.readFileSync(MANIFIESTO, 'utf8')) : { cache: {} };
    const manifiesto = { version: 1, formato, generado: new Date().toISOString(), secciones: {}, cache: {} };
    const usados = new Set();
    let hechos = 0, reutilizados = 0, caracteres = 0, ultima = 0;
    const ext = FORMATOS[formato].ext;
    console.log(`Generando ${totalTrozos} fragmentos (${totalCaracteres} caracteres)…`);

    for (const { sec, parrafos } of plan) {
        manifiesto.secciones[sec.key] = parrafos.map((p, i) => ({
            h: hashTexto(p.texto),
            s: p.trozos.map((t, j) => {
                const r = REPARTO[t.hablante];
                const archivo = `${sec.key}-${String(i + 1).padStart(2, '0')}-${j + 1}.${ext}`;
                const huella = hashTexto([t.texto, r.voz, r.velocidad, r.tono, r.volumen || '', r.pausa, r.coma || 0, formato].join('|'));
                usados.add(archivo);
                manifiesto.cache[archivo] = huella;
                return { f: archivo, v: t.hablante, e: r.efecto, texto: t.texto, huella };
            }),
        }));
        for (const p of manifiesto.secciones[sec.key]) {
            for (const seg of p.s) {
                const destino = path.join(SALIDA, seg.f);
                if (!todo && previo.cache?.[seg.f] === seg.huella && fs.existsSync(destino)) { reutilizados++; continue; }
                const espera = ultima + pausaMs - Date.now();
                if (espera > 0) await esperar(espera);
                ultima = Date.now();
                const audio = await sintetizar(ssml(seg.texto, seg.v), clave, region, formato);
                fs.writeFileSync(destino, audio);
                hechos++;
                caracteres += seg.texto.length;
                console.log(`  ✔ ${seg.f}  [${REPARTO[seg.v].nombre}]  ${seg.texto.slice(0, 60)}…`);
            }
        }
        // Guardado parcial: si se corta, lo hecho no se pierde.
        fs.writeFileSync(MANIFIESTO, JSON.stringify(limpiar(manifiesto), null, 1));
    }

    for (const f of fs.readdirSync(SALIDA)) {
        if (/\.(mp3|wav)$/.test(f) && !usados.has(f)) fs.unlinkSync(path.join(SALIDA, f));
    }
    fs.writeFileSync(MANIFIESTO, JSON.stringify(limpiar(manifiesto), null, 1));
    console.log(`\nListo: ${hechos} audios nuevos (${caracteres} caracteres), ${reutilizados} reutilizados.`);
}

/** El juego no necesita el texto ni las huellas dentro de cada fragmento. */
function limpiar(m) {
    const out = { version: m.version, formato: m.formato, generado: m.generado, secciones: {}, cache: m.cache };
    for (const [k, ps] of Object.entries(m.secciones)) out.secciones[k] = ps.map(p => ({ h: p.h, s: p.s.map(({ f, v, e }) => ({ f, v, e })) }));
    return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch(e => { console.error(`\n✖ ${e.message}`); process.exit(1); });
}
