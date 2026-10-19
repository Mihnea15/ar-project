// Live position of the International Space Station (NORAD 25544) from the public wheretheiss.at API.
import { Vector3 } from 'three';

const API = 'https://api.wheretheiss.at/v1/satellites/25544';
const EARTH_R = 6371;
const DEG = Math.PI / 180;

/** Earth-centered cartesian coordinates (km) on a spherical Earth. */
function ecef(lat, lon, heightKm) {
    const r = EARTH_R + heightKm;
    return new Vector3(
        r * Math.cos(lat * DEG) * Math.cos(lon * DEG),
        r * Math.cos(lat * DEG) * Math.sin(lon * DEG),
        r * Math.sin(lat * DEG),
    );
}

/**
 * Direction and distance from the observer to the ISS, in the scene world frame (x = East, y = Up, z = South).
 * Uses a spherical Earth, which is accurate enough for pointing (well under 1 degree).
 */
export function issTopocentric(iss, obsLat, obsLon, obsHeightKm = 0) {
    const d = ecef(iss.latitude, iss.longitude, iss.altitude).sub(ecef(obsLat, obsLon, obsHeightKm));
    const sLat = Math.sin(obsLat * DEG);
    const cLat = Math.cos(obsLat * DEG);
    const sLon = Math.sin(obsLon * DEG);
    const cLon = Math.cos(obsLon * DEG);
    const east = -sLon * d.x + cLon * d.y;
    const north = -sLat * cLon * d.x - sLat * sLon * d.y + cLat * d.z;
    const up = cLat * cLon * d.x + cLat * sLon * d.y + sLat * d.z;
    const range = d.length();
    return { dir: new Vector3(east, up, -north).divideScalar(range), range };
}

/** Polls the ISS position every few seconds and passes each result to the callback. */
export function trackIss(onUpdate, intervalMs = 5000) {
    const poll = async () => {
        try {
            const res = await fetch(API);
            if (res.ok) onUpdate(await res.json());
        } catch {
            // Offline or API down: keep the last known position
        }
    };
    poll();
    return setInterval(poll, intervalMs);
}
