import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const src = process.argv[2];
if (!src) {
    console.error('Usage: node scripts/build-sky-data.mjs <d3-celestial data folder>');
    process.exit(1);
}

/** Reads and parses a JSON file from the source folder. */
function load(name) {
    return JSON.parse(readFileSync(join(src, name), 'utf8'));
}

/** Normalizes a d3-celestial longitude (-180..180) to a right ascension in degrees (0..360). */
function ra(lon) {
    return +((lon + 360) % 360).toFixed(3);
}

const stars = load('stars.6.json').features;
const starNames = load('starnames.json');
const consts = load('constellations.json').features;
const lines = load('constellations.lines.json').features;

const outStars = [];
const named = [];
for (const f of stars) {
    const [lon, lat] = f.geometry.coordinates;
    const bv = parseFloat(f.properties.bv);
    const idx = outStars.length;
    outStars.push([ra(lon), +lat.toFixed(3), f.properties.mag, Number.isFinite(bv) ? bv : 0.6]);
    const n = starNames[f.id];
    if (n && n.name) {
        named.push({ i: idx, name: n.name, desig: n.desig || n.bayer || '', con: n.c || '' });
    }
}

const linesById = Object.fromEntries(lines.map((f) => [f.id, f.geometry.coordinates]));
const outConsts = consts.map((f) => ({
    id: f.id,
    name: f.properties.name,
    gen: f.properties.gen,
    en: f.properties.en,
    rank: +f.properties.rank,
    ra: ra(f.geometry.coordinates[0]),
    dec: f.geometry.coordinates[1],
    lines: (linesById[f.id] || []).map((seg) => seg.map(([lon, lat]) => [ra(lon), +lat.toFixed(3)])),
}));

mkdirSync('public/data', { recursive: true });
writeFileSync('public/data/sky.json', JSON.stringify({ stars: outStars, named, constellations: outConsts }));
console.log(`stars: ${outStars.length}, named: ${named.length}, constellations: ${outConsts.length}`);
