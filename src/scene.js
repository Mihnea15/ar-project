// Three.js objects for the sky: stars, constellation lines, ecliptic, horizon and solar-system bodies.
import * as THREE from 'three';
import { bvToColor, eqjVector } from './astro.js';
import { BODY_INFO } from './texts.js';

export const SKY_RADIUS = 100;

/** Creates the renderer, scene, camera and the "celestial" group that holds everything in EQJ coordinates. */
export function createScene(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1000);

    const celestial = new THREE.Group();
    celestial.matrixAutoUpdate = false;
    scene.add(celestial);

    return { renderer, scene, camera, celestial };
}

/** Builds the star field as one point cloud; size and brightness come from magnitude, color from B-V. */
export function createStars(stars) {
    const n = stars.length;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const mag = new Float32Array(n);
    stars.forEach(([ra, dec, m, bv], i) => {
        eqjVector(ra, dec, SKY_RADIUS).toArray(pos, i * 3);
        col.set(bvToColor(bv), i * 3);
        mag[i] = m;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('mag', new THREE.BufferAttribute(mag, 1));

    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            uMaxMag: { value: 5 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
            uZoom: { value: 1 },
        },
        vertexShader: `
            attribute float mag;
            attribute vec3 color;
            uniform float uMaxMag;
            uniform float uPixelRatio;
            uniform float uZoom;
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                vColor = color;
                vAlpha = mag > uMaxMag ? 0.0 : clamp(1.15 - (mag + 1.5) * 0.09, 0.35, 1.0);
                gl_PointSize = mag > uMaxMag ? 0.0 : max(2.0, (6.8 - mag) * 1.25) * uPixelRatio * uZoom;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                float core = smoothstep(0.5, 0.1, d);
                gl_FragColor = vec4(vColor, core * vAlpha);
            }`,
    });
    return new THREE.Points(geo, material);
}

/** Builds all constellation stick figures as a single line-segment mesh. */
export function createConstellationLines(constellations) {
    const pts = [];
    for (const c of constellations) {
        for (const seg of c.lines) {
            for (let i = 0; i < seg.length - 1; i++) {
                pts.push(eqjVector(seg[i][0], seg[i][1], SKY_RADIUS * 0.999));
                pts.push(eqjVector(seg[i + 1][0], seg[i + 1][1], SKY_RADIUS * 0.999));
            }
        }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x7fa8ff, transparent: true, opacity: 0.5, depthWrite: false });
    return new THREE.LineSegments(geo, mat);
}

/** Builds the ecliptic (apparent yearly path of the Sun) in EQJ coordinates. */
export function createEcliptic() {
    const eps = 23.4393 * THREE.MathUtils.DEG2RAD;
    const pts = [];
    for (let i = 0; i <= 180; i++) {
        const l = (i / 180) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(l), Math.sin(l) * Math.cos(eps), Math.sin(l) * Math.sin(eps)).multiplyScalar(SKY_RADIUS * 0.998));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0xffc85a, dashSize: 1.5, gapSize: 1.5, transparent: true, opacity: 0.6 }));
    line.computeLineDistances();
    line.visible = false;
    return line;
}

/** Builds the horizon circle and a faint tint over the ground, in world coordinates. */
export function createHorizon() {
    const group = new THREE.Group();
    const pts = [];
    for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * SKY_RADIUS, 0, Math.sin(a) * SKY_RADIUS));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xff8a7a, transparent: true, opacity: 0.7 })));

    const ground = new THREE.Mesh(
        new THREE.SphereGeometry(SKY_RADIUS * 1.01, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x1a2a10, transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false }),
    );
    group.add(ground);
    return group;
}

/** Draws a round glowing disc on a canvas, used as a sprite texture for planets. */
function discTexture(color) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, color);
    grad.addColorStop(0.6, color + '66');
    grad.addColorStop(1, color + '00');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}

/** Draws the Moon with its current phase (illuminated fraction 0..1, waxing = lit on the right). */
export function drawMoonTexture(texture, fraction, waxing) {
    const c = texture.image;
    const g = c.getContext('2d');
    const r = 28;
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#3a3d48';
    g.beginPath();
    g.arc(32, 32, r, 0, Math.PI * 2);
    g.fill();
    // Lit half on the sunny side, then an ellipse that cuts it (crescent) or extends it (gibbous)
    g.fillStyle = '#f4f1e6';
    g.beginPath();
    g.arc(32, 32, r, -Math.PI / 2, Math.PI / 2, !waxing);
    g.fill();
    g.fillStyle = fraction < 0.5 ? '#3a3d48' : '#f4f1e6';
    g.beginPath();
    g.ellipse(32, 32, Math.abs(1 - 2 * fraction) * r, r, 0, 0, Math.PI * 2);
    g.fill();
    texture.needsUpdate = true;
}

/** Creates one sprite per Sun/Moon/planet plus the ISS; positions are updated every frame. */
export function createBodySprites(names) {
    const sprites = {};
    for (const name of names) {
        const info = BODY_INFO[name];
        let map;
        if (name === 'Moon') {
            const c = document.createElement('canvas');
            c.width = c.height = 64;
            map = new THREE.CanvasTexture(c);
        } else {
            map = discTexture(info.color);
        }
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, sizeAttenuation: false, depthWrite: false, transparent: true }));
        sprite.scale.setScalar(info.size);
        sprite.userData.baseSize = info.size;
        sprites[name] = sprite;
    }
    const iss = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTexture('#6dffb0'), sizeAttenuation: false, depthWrite: false, transparent: true }));
    iss.scale.setScalar(0.03);
    iss.visible = false;
    sprites.ISS = iss;
    return sprites;
}
