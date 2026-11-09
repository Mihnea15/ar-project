import * as Astronomy from 'astronomy-engine';
import { Matrix4, Vector3 } from 'three';

export const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

const DEG = Math.PI / 180;
const AU_KM = 149597870.7;

/** Creates an observer from latitude/longitude in degrees and height in meters. */
export function makeObserver(lat, lon, height = 0) {
    return new Astronomy.Observer(lat, lon, height);
}

/** Unit vector in J2000 equatorial coordinates (EQJ) for a right ascension and declination in degrees. */
export function eqjVector(raDeg, decDeg, radius = 1) {
    const ra = raDeg * DEG;
    const dec = decDeg * DEG;
    return new Vector3(
        radius * Math.cos(dec) * Math.cos(ra),
        radius * Math.cos(dec) * Math.sin(ra),
        radius * Math.sin(dec),
    );
}

/**
 * Matrix that rotates EQJ vectors into the scene world frame for a given moment and place.
 * Applied to the parent group of all celestial objects, so stars never need recomputing.
 */
export function eqjToWorldMatrix(date, observer) {
    const rot = Astronomy.Rotation_EQJ_HOR(date, observer);
    const time = Astronomy.MakeTime(date);
    const column = (x, y, z) => {
        const v = Astronomy.RotateVector(rot, new Astronomy.Vector(x, y, z, time));
        return new Vector3(-v.y, v.z, -v.x);
    };
    return new Matrix4().makeBasis(column(1, 0, 0), column(0, 1, 0), column(0, 0, 1));
}

/** Converts altitude/azimuth (degrees, azimuth clockwise from north) to a scene-world unit vector. */
export function horizontalToWorld(alt, az, radius = 1) {
    const a = alt * DEG;
    const z = az * DEG;
    return new Vector3(
        radius * Math.cos(a) * Math.sin(z),
        radius * Math.sin(a),
        -radius * Math.cos(a) * Math.cos(z),
    );
}

/** Converts a scene-world direction back to altitude/azimuth in degrees. */
export function worldToHorizontal(v) {
    const n = v.clone().normalize();
    const alt = Math.asin(n.y) / DEG;
    const az = (Math.atan2(n.x, -n.z) / DEG + 360) % 360;
    return { alt, az };
}

/** Topocentric J2000 position of a solar-system body: RA/Dec in degrees and distance in km. */
export function bodyPosition(body, date, observer) {
    const eq = Astronomy.Equator(body, date, observer, false, true);
    return { ra: eq.ra * 15, dec: eq.dec, distKm: eq.dist * AU_KM };
}

/** Altitude/azimuth (degrees, with refraction) of a body at a given moment. */
export function bodyHorizontal(body, date, observer) {
    const eq = Astronomy.Equator(body, date, observer, true, true);
    const hor = Astronomy.Horizon(date, observer, eq.ra, eq.dec, 'normal');
    return { alt: hor.altitude, az: hor.azimuth };
}

/** Apparent magnitude and illuminated fraction of a body (null for the Sun's phase). */
export function bodyIllumination(body, date) {
    const ill = Astronomy.Illumination(body, date);
    return { mag: ill.mag, phase: ill.phase_fraction };
}

/** Next rise and set times of a body within the next 24 hours (Date or null). */
export function riseSet(body, date, observer) {
    const rise = Astronomy.SearchRiseSet(body, observer, +1, date, 1);
    const set = Astronomy.SearchRiseSet(body, observer, -1, date, 1);
    return { rise: rise ? rise.date : null, set: set ? set.date : null };
}

/** Moon phase name in Romanian plus the phase angle (0 = new, 180 = full). */
export function moonPhase(date) {
    const angle = Astronomy.MoonPhase(date);
    const names = ['Lună nouă', 'Semilună crescătoare', 'Primul pătrar', 'Lună crescătoare (gibbous)',
        'Lună plină', 'Lună descrescătoare (gibbous)', 'Ultimul pătrar', 'Semilună descrescătoare'];
    return { angle, name: names[Math.round(angle / 45) % 8] };
}

/** IAU constellation that contains a J2000 position given in degrees. */
export function constellationAt(raDeg, decDeg) {
    return Astronomy.Constellation(raDeg / 15, decDeg);
}

/** Approximate star color (RGB 0..1) from the B-V color index. */
export function bvToColor(bv) {
    const stops = [
        [-0.4, [0.62, 0.72, 1.0]], [0.0, [0.8, 0.86, 1.0]], [0.4, [1.0, 1.0, 0.96]],
        [0.8, [1.0, 0.93, 0.78]], [1.2, [1.0, 0.82, 0.62]], [2.0, [1.0, 0.66, 0.45]],
    ];
    if (bv <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
        if (bv <= stops[i][0]) {
            const [b0, c0] = stops[i - 1];
            const [b1, c1] = stops[i];
            const t = (bv - b0) / (b1 - b0);
            return c0.map((c, k) => c + (c1[k] - c) * t);
        }
    }
    return stops[stops.length - 1][1];
}

/** Surface temperature estimate (Kelvin) from B-V, using the Ballesteros formula. */
export function bvToTemperature(bv) {
    return Math.round(4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)));
}

/** Compass direction name in Romanian for an azimuth in degrees. */
export function compassName(az) {
    const names = ['N', 'NE', 'E', 'SE', 'S', 'SV', 'V', 'NV'];
    return names[Math.round(az / 45) % 8];
}
