// App entry: wires the camera feed, sensors, sky scene, labels and info panels together.
import geomagnetism from 'geomagnetism';
import { Vector3 } from 'three';
import {
    BODIES, bodyHorizontal, bodyIllumination, bodyPosition, bvToTemperature, compassName, constellationAt,
    eqjToWorldMatrix, eqjVector, horizontalToWorld, makeObserver, moonPhase, riseSet, worldToHorizontal,
} from './astro.js';
import { issTopocentric, trackIss } from './iss.js';
import { LabelLayer } from './labels.js';
import { OrientationTracker } from './orientation.js';
import {
    SKY_RADIUS, createBodySprites, createConstellationLines, createEcliptic, createHorizon, createScene,
    createStars, drawMoonTexture,
} from './scene.js';
import { BODY_INFO, CONST_RO, CONST_STORY, ISS_INFO, STAR_DIST } from './texts.js';

const $ = (id) => document.getElementById(id);

// Bucharest is used until the GPS answers
const state = {
    lat: 44.4268,
    lon: 26.1025,
    height: 80,
    gps: false,
    observer: makeObserver(44.4268, 26.1025, 80),
    timeOffsetH: 0,
    maxMag: 5,
    fov: 62,
    show: { lines: true, cnames: true, snames: true },
    iss: null,
    target: null,
};

const { renderer, scene, camera, celestial } = createScene($('sky'));
const labels = new LabelLayer($('labels'));
const tracker = new OrientationTracker($('sky'));
tracker.onZoom = (k) => setFov(state.fov * k);
// Manual mode has no AR alignment, and on a laptop the webcam would only show the user, so the feed is hidden
tracker.onDrag = () => {
    $('cam').classList.add('off');
    $('opt-camera').checked = false;
};
updateDeclination();

let stars;
let lines;
let ecliptic;
let sprites;
let lastSkyUpdate = 0;
let lastMoonUpdate = 0;
let lastHint = 0;

/** Current simulated time (real time shifted by the time slider). */
function now() {
    return new Date(Date.now() + state.timeOffsetH * 3600e3);
}

/** Formats a Date as HH:MM in Romanian locale, or a dash when missing. */
function hhmm(d) {
    return d ? d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '—';
}

/** Formats a number with Romanian thousand separators. */
function fmt(n, digits = 0) {
    return n.toLocaleString('ro-RO', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

/** Computes the magnetic declination for the current location (World Magnetic Model) and hands it to the tracker. */
function updateDeclination() {
    tracker.declination = geomagnetism.model(new Date()).point([state.lat, state.lon]).decl;
}

/** Shows a short message at the top of the screen. */
function toast(msg, ms = 3500) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (el.hidden = true), ms);
}

/** Loads the star catalog and builds every scene object and label. */
async function buildSky() {
    const sky = await (await fetch('./data/sky.json')).json();

    stars = createStars(sky.stars);
    lines = createConstellationLines(sky.constellations);
    ecliptic = createEcliptic();
    celestial.add(stars, lines, ecliptic);
    scene.add(createHorizon());

    sprites = createBodySprites(BODIES);
    for (const name of BODIES) {
        celestial.add(sprites[name]);
        labels.add({ kind: 'body', text: BODY_INFO[name].name, local: sprites[name].position, data: { body: name } });
    }
    scene.add(sprites.ISS);
    labels.add({ kind: 'iss', text: 'ISS', local: sprites.ISS.position, frame: 'world', data: {} });

    for (const c of sky.constellations) {
        labels.add({ kind: 'const', text: CONST_RO[c.id] || c.name, local: eqjVector(c.ra, c.dec, SKY_RADIUS), data: c });
    }
    for (const s of sky.named) {
        const [ra, dec, mag, bv] = sky.stars[s.i];
        labels.add({
            kind: 'star', text: s.name, local: eqjVector(ra, dec, SKY_RADIUS),
            label: mag <= 2.1, data: { ...s, ra, dec, mag, bv },
        });
    }
    for (const [text, az] of [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SV', 225], ['V', 270], ['NV', 315]]) {
        labels.add({ kind: 'cardinal', text, local: horizontalToWorld(1.5, az, SKY_RADIUS), frame: 'world', pickable: false });
    }
}

/** Recomputes the sky rotation and the positions of the Sun, Moon, planets and ISS. */
function updateSky(date) {
    celestial.matrix.copy(eqjToWorldMatrix(date, state.observer));
    celestial.matrixWorldNeedsUpdate = true;

    for (const name of BODIES) {
        const p = bodyPosition(name, date, state.observer);
        sprites[name].position.copy(eqjVector(p.ra, p.dec, SKY_RADIUS * 0.98));
    }

    if (date - lastMoonUpdate > 60e3 || Math.abs(date - lastMoonUpdate) > 3600e3) {
        const phase = moonPhase(date);
        drawMoonTexture(sprites.Moon.material.map, bodyIllumination('Moon', date).phase, phase.angle < 180);
        lastMoonUpdate = date;
    }

    // ISS data is always live, so it is hidden while the time slider is moved away from "now"
    const iss = sprites.ISS;
    if (state.iss && state.timeOffsetH === 0) {
        const t = issTopocentric(state.iss, state.lat, state.lon, state.height / 1000);
        iss.position.copy(t.dir).multiplyScalar(SKY_RADIUS * 0.97);
        iss.visible = true;
        state.issRange = t.range;
    } else {
        iss.visible = false;
    }
}

/** Decides which labels are drawn, based on the user settings. */
function isLabelVisible(it) {
    switch (it.kind) {
        case 'const': return state.show.cnames;
        case 'star': return state.show.snames && it.data.mag <= Math.min(state.maxMag, 2.1);
        case 'iss': return sprites.ISS.visible;
        default: return true;
    }
}

/** Decides which objects can be tapped or aimed at. */
function isPickable(it) {
    if (it.kind === 'star') return it.data.mag <= state.maxMag;
    if (it.kind === 'const') return state.show.cnames || state.show.lines;
    if (it.kind === 'iss') return sprites.ISS.visible;
    return true;
}

/** World-space position of a label item. */
function itemWorld(it, out = new Vector3()) {
    out.copy(it.local);
    if (it.frame === 'eqj') out.applyMatrix4(celestial.matrix);
    return out;
}

/** Altitude/azimuth text for a label item, e.g. "32° deasupra orizontului, spre SE (134°)". */
function whereText(it) {
    const { alt, az } = worldToHorizontal(itemWorld(it));
    const pos = alt >= 0 ? `${fmt(alt)}° deasupra orizontului` : `sub orizont (${fmt(alt)}°)`;
    return `${pos}, spre ${compassName(az)} (${fmt(az)}°)`;
}

/** Fills and opens the bottom sheet with details about a tapped object. */
function showInfo(it) {
    const date = now();
    let html = '';
    const facts = {};
    if (it.kind === 'body') {
        const name = it.data.body;
        const info = BODY_INFO[name];
        const pos = bodyPosition(name, date, state.observer);
        const rs = riseSet(name, date, state.observer);
        html += `<h2>${info.name}</h2><div class="sub">în constelația ${CONST_RO[constellationAt(pos.ra, pos.dec).symbol] || ''}</div><p>${info.desc}</p>`;
        facts['Poziție'] = whereText(it);
        facts['Distanță'] = pos.distKm > 1e8 ? `${fmt(pos.distKm / 149597870.7, 3)} UA (${fmt(pos.distKm / 1e6)} mil. km)` : `${fmt(pos.distKm)} km`;
        if (name !== 'Sun') facts['Magnitudine'] = fmt(bodyIllumination(name, date).mag, 1);
        if (name === 'Moon') {
            facts['Fază'] = `${moonPhase(date).name} (${fmt(bodyIllumination('Moon', date).phase * 100)}% iluminată)`;
        }
        facts['Răsare'] = hhmm(rs.rise);
        facts['Apune'] = hhmm(rs.set);
        Object.assign(facts, info.facts);
    } else if (it.kind === 'star') {
        const s = it.data;
        const con = CONST_RO[s.con] || s.con;
        html += `<h2>${s.name}</h2><div class="sub">${s.desig} ${con ? '· constelația ' + con : ''}</div>`;
        facts['Poziție'] = whereText(it);
        facts['Magnitudine'] = fmt(s.mag, 2) + (s.mag < 1 ? ' (foarte strălucitoare)' : '');
        if (STAR_DIST[s.name]) facts['Distanță'] = `${fmt(STAR_DIST[s.name], 1)} ani-lumină`;
        facts['Temperatură'] = `≈ ${fmt(bvToTemperature(s.bv))} K`;
        facts['Culoare'] = s.bv < 0 ? 'albastru-albă' : s.bv < 0.5 ? 'albă' : s.bv < 1 ? 'galbenă' : s.bv < 1.4 ? 'portocalie' : 'roșiatică';
    } else if (it.kind === 'const') {
        const c = it.data;
        html += `<h2>${CONST_RO[c.id] || c.name}</h2><div class="sub">${c.name} (${c.gen}) · ${c.en}</div>`;
        if (CONST_STORY[c.id]) html += `<p>${CONST_STORY[c.id]}</p>`;
        facts['Poziție'] = whereText(it);
    } else if (it.kind === 'iss') {
        const d = state.iss;
        html += `<h2>${ISS_INFO.name}</h2><p>${ISS_INFO.desc}</p>`;
        facts['Poziție'] = whereText(it);
        facts['Distanță de tine'] = `${fmt(state.issRange)} km`;
        facts['Altitudine'] = `${fmt(d.altitude)} km`;
        facts['Viteză'] = `${fmt(d.velocity)} km/h`;
        facts['Deasupra'] = `${fmt(d.latitude, 2)}°, ${fmt(d.longitude, 2)}°`;
        facts['Iluminată de Soare'] = d.visibility === 'eclipsed' ? 'nu (în umbra Pământului)' : 'da';
    }
    html += '<dl class="facts">' + Object.entries(facts).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') + '</dl>';
    html += '<button id="btn-find">🎯 Găsește pe cer</button>';
    $('info-body').innerHTML = html;
    $('btn-find').onclick = () => startGuide(it);
    openSheet('info');
}

/** Builds the "what can I see now" panel: Sun, Moon, planets, ISS and the best constellations. */
function showTonight() {
    const date = now();
    const sun = riseSet('Sun', date, state.observer);
    const moon = moonPhase(date);
    const bodyItem = (name) => labels.items.find((it) => it.kind === 'body' && it.data.body === name);
    let html = `<h2>Ce vezi pe cer</h2><div class="sub">${date.toLocaleString('ro-RO', { dateStyle: 'full', timeStyle: 'short' })}</div>`;
    html += `<dl class="facts"><dt>Apus Soare</dt><dd>${hhmm(sun.set)}</dd><dt>Răsărit Soare</dt><dd>${hhmm(sun.rise)}</dd>`;
    html += `<dt>Luna</dt><dd>${moon.name}, ${fmt(bodyIllumination('Moon', date).phase * 100)}% iluminată</dd></dl>`;

    html += '<h3>Planete și Luna</h3>';
    for (const name of BODIES.slice(1)) {
        const h = bodyHorizontal(name, date, state.observer);
        const rs = riseSet(name, date, state.observer);
        const mag = bodyIllumination(name, date).mag;
        const status = h.alt > 0
            ? `<span class="up">sus, ${fmt(h.alt)}° spre ${compassName(h.az)}</span>`
            : `<span class="down">sub orizont · răsare ${hhmm(rs.rise)}</span>`;
        html += `<div class="list-item"><div>${BODY_INFO[name].name}<div class="meta">${status} · mag ${fmt(mag, 1)}</div></div>`
            + `<button data-find="${name}">🎯</button></div>`;
    }

    html += '<h3>Stația Spațială</h3>';
    if (state.iss && sprites.ISS.visible) {
        const { alt, az } = worldToHorizontal(sprites.ISS.position);
        html += alt > 0
            ? `<p class="up">Este deasupra orizontului acum! ${fmt(alt)}° spre ${compassName(az)} <button data-find="ISS">🎯</button></p>`
            : `<p class="down">Sub orizont, la ${fmt(state.issRange)} km de tine, deasupra ${fmt(state.iss.latitude, 1)}°, ${fmt(state.iss.longitude, 1)}°.</p>`;
    } else {
        html += '<p class="down">Poziția ISS nu e disponibilă (fără internet sau timp simulat).</p>';
    }

    const visible = labels.items
        .filter((it) => it.kind === 'const' && it.data.rank === 1)
        .map((it) => ({ it, alt: worldToHorizontal(itemWorld(it)).alt }))
        .filter((c) => c.alt > 20)
        .sort((a, b) => b.alt - a.alt)
        .slice(0, 8);
    html += '<h3>Constelații ușor de văzut acum</h3>';
    html += visible.map((c) => `<div class="list-item"><div>${c.it.text}<div class="meta">${fmt(c.alt)}° deasupra orizontului</div></div>`
        + `<button data-find-const="${c.it.data.id}">🎯</button></div>`).join('') || '<p class="down">Niciuna sus pe cer acum.</p>';

    $('tonight-body').innerHTML = html;
    $('tonight-body').querySelectorAll('[data-find]').forEach((b) => {
        b.onclick = () => startGuide(b.dataset.find === 'ISS' ? labels.items.find((it) => it.kind === 'iss') : bodyItem(b.dataset.find));
    });
    $('tonight-body').querySelectorAll('[data-find-const]').forEach((b) => {
        b.onclick = () => startGuide(labels.items.find((it) => it.kind === 'const' && it.data.id === b.dataset.findConst));
    });
    openSheet('tonight');
}

/** Starts guiding the user to an object with an on-screen arrow. */
function startGuide(it) {
    if (!it) return;
    state.target = it;
    closeSheets();
    const { alt, az } = worldToHorizontal(itemWorld(it));
    tracker.lookAt(alt, az);
    toast(alt < 0 ? `${it.text} e sub orizont acum, săgeata arată spre el prin Pământ.` : `Urmează săgeata ca să găsești: ${it.text}`);
}

/** Positions the guide arrow (off screen) or the target ring (on screen); clears the target once centered. */
function updateGuide() {
    const arrow = $('target-arrow');
    const it = state.target;
    if (!it) {
        arrow.hidden = true;
        return;
    }
    arrow.hidden = false;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (it.onScreen) {
        arrow.textContent = '◎';
        arrow.style.transform = `translate3d(${it.sx - 15}px, ${it.sy - 20}px, 0)`;
        if (Math.hypot(it.sx - w / 2, it.sy - h / 2) < 50) {
            toast(`Ai găsit: ${it.text}! Atinge-l pentru detalii.`);
            state.target = null;
        }
        return;
    }
    // Direction in camera space: x right, y up; works for objects behind the viewer too
    const v = itemWorld(it).applyMatrix4(camera.matrixWorldInverse);
    let dx = v.x;
    let dy = -v.y;
    if (Math.hypot(dx, dy) < 1e-3) dy = 1;
    const ang = Math.atan2(dy, dx);
    const r = Math.min(w, h) / 2 - 40;
    arrow.textContent = '➤';
    arrow.style.transform = `translate3d(${w / 2 + Math.cos(ang) * r - 15}px, ${h / 2 + Math.sin(ang) * r - 20}px, 0) rotate(${ang}rad)`;
}

/** Shows the name of whatever is under the reticle in the middle of the screen. */
function updateHint() {
    const it = labels.pick(window.innerWidth / 2, window.innerHeight / 2, 45, isPickable);
    $('reticle-hint').textContent = it ? it.text : '';
}

/** Status line: location source and sensor mode. */
function updateStatus() {
    const modes = { absolute: '🧭 busolă', ios: '🧭 busolă', relative: '⚠ fără busolă', drag: '🖱 mod manual', none: '…' };
    $('status').textContent = `📍 ${fmt(state.lat, 2)}°, ${fmt(state.lon, 2)}° ${state.gps ? '' : '(implicit)'} · ${modes[tracker.mode]}`;
    const decl = tracker.declination;
    $('loc-info').textContent = `Locație: ${fmt(state.lat, 4)}°, ${fmt(state.lon, 4)}° — ${state.gps ? 'GPS' : 'implicit (București), GPS indisponibil'}`
        + ` · declinație magnetică ${decl >= 0 ? '+' : ''}${fmt(decl, 1)}° (corectată automat)`;
}

/** Sets the camera field of view (degrees) and scales star sizes with it. */
function setFov(fov) {
    state.fov = Math.min(100, Math.max(15, fov));
    camera.fov = state.fov;
    camera.updateProjectionMatrix();
    stars.material.uniforms.uZoom.value = Math.sqrt(62 / state.fov);
    $('opt-fov').value = state.fov;
    $('val-fov').textContent = `${fmt(state.fov)}°`;
}

/** Matches the canvas and camera to the window size. */
function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    labels.resize(w, h);
}

/** Main render loop. */
function frame(t) {
    requestAnimationFrame(frame);
    if (t - lastSkyUpdate > 1000) {
        updateSky(now());
        lastSkyUpdate = t;
        updateStatus();
    }
    tracker.apply(camera, state.fov);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
    labels.update(camera, celestial.matrix, isLabelVisible);
    updateGuide();
    if (t - lastHint > 150) {
        updateHint();
        lastHint = t;
    }
}

/** Opens one bottom sheet and closes the others. */
function openSheet(id) {
    closeSheets();
    $(id).hidden = false;
}

/** Closes every bottom sheet. */
function closeSheets() {
    for (const id of ['info', 'tonight', 'settings']) $(id).hidden = true;
}

/** Starts the rear camera; on failure the sky is drawn over a dark background. */
async function startCamera() {
    const video = $('cam');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        video.srcObject = stream;
        await video.play();
    } catch {
        video.classList.add('off');
        $('opt-camera').checked = false;
        toast('Camera nu e disponibilă — afișez doar cerul simulat.');
    }
}

/** Requests the GPS position once and refreshes the observer when it arrives. */
function startGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
        state.lat = p.coords.latitude;
        state.lon = p.coords.longitude;
        state.height = p.coords.altitude || 0;
        state.gps = true;
        state.observer = makeObserver(state.lat, state.lon, state.height);
        updateDeclination();
        lastSkyUpdate = 0;
    }, () => toast('Fără GPS — folosesc locația implicită (București).'), { enableHighAccuracy: true, timeout: 15000 });
}

/** Connects the settings panel controls to the app state. */
function bindSettings() {
    const bindCheck = (id, fn) => {
        $(id).onchange = (e) => fn(e.target.checked);
    };
    bindCheck('opt-lines', (v) => {
        state.show.lines = v;
        lines.visible = v;
    });
    bindCheck('opt-cnames', (v) => (state.show.cnames = v));
    bindCheck('opt-snames', (v) => (state.show.snames = v));
    bindCheck('opt-ecliptic', (v) => (ecliptic.visible = v));
    bindCheck('opt-camera', (v) => $('cam').classList.toggle('off', !v));

    const mag = () => {
        state.maxMag = +$('opt-mag').value;
        stars.material.uniforms.uMaxMag.value = state.maxMag;
        $('val-mag').textContent = fmt(state.maxMag, 1);
    };
    const heading = () => {
        tracker.manualOffset = -$('opt-heading').value;
        $('val-heading').textContent = `${$('opt-heading').value}°`;
    };
    const time = () => {
        state.timeOffsetH = +$('opt-time').value;
        $('val-time').textContent = state.timeOffsetH === 0 ? 'acum' : `${state.timeOffsetH > 0 ? '+' : ''}${fmt(state.timeOffsetH, 2)} h (${hhmm(now())})`;
        lastSkyUpdate = 0;
    };
    $('opt-mag').oninput = mag;
    $('opt-heading').oninput = heading;
    $('opt-time').oninput = time;
    $('opt-fov').oninput = () => setFov(+$('opt-fov').value);
    mag();
    heading();
    time();
    setFov(state.fov);
}

/** Bootstraps the app: builds the sky, then waits for the start button (needed for iOS permissions). */
async function main() {
    resize();
    window.addEventListener('resize', resize);
    await buildSky();
    bindSettings();
    requestAnimationFrame(frame);

    $('btn-start').onclick = async () => {
        // Sensor permission must be requested first, while still inside the tap gesture (iOS)
        await tracker.start();
        $('start').hidden = true;
        startGps();
        await startCamera();
        trackIss((d) => (state.iss = d));
    };
    $('btn-tonight').onclick = showTonight;
    $('btn-settings').onclick = () => openSheet('settings');
    document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => ($(b.dataset.close).hidden = true)));

    $('sky').addEventListener('pointerup', (e) => {
        if (tracker.wasDrag()) return;
        const it = labels.pick(e.clientX, e.clientY, 40, isPickable);
        if (it) showInfo(it);
        else closeSheets();
    });
}

main();
