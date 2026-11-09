import { Euler, MathUtils, Quaternion, Vector3 } from 'three';

const DEG = MathUtils.DEG2RAD;
const Z_AXIS = new Vector3(0, 0, 1);
const Y_AXIS = new Vector3(0, 1, 0);
const X_AXIS = new Vector3(1, 0, 0);
const CAMERA_FROM_DEVICE = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

export class OrientationTracker {
    /** Sets up the tracker; call start() after a user gesture. */
    constructor(element) {
        this.element = element;
        this.target = new Quaternion();
        this.current = new Quaternion();
        this.mode = 'none';
        this.manualOffset = 0;
        this.declination = 0;
        this.compassOffset = null;
        this.compassSettled = false;
        this.yaw = 180;
        this.pitch = 25;
        this.euler = new Euler();
        this.tmp = new Quaternion();
        this.onSensor = this.onSensor.bind(this);
        this.setDragTarget();
    }

    /** Asks for sensor permission (required on iOS 13+) and starts listening. Must run inside a click handler. */
    async start() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const state = await DeviceOrientationEvent.requestPermission();
                if (state !== 'granted') {
                    this.enableDrag();
                    return;
                }
            } catch {
                this.enableDrag();
                return;
            }
        }
        const absolute = 'ondeviceorientationabsolute' in window;
        window.addEventListener(absolute ? 'deviceorientationabsolute' : 'deviceorientation', this.onSensor);
        setTimeout(() => {
            if (this.mode === 'none') this.enableDrag();
        }, 1500);
    }

    /** Handles one orientation sample from the browser. */
    onSensor(e) {
        if (e.alpha === null || e.beta === null) return;
        let alpha = e.alpha;
        if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
            this.mode = 'ios';
            this.updateCompassOffset(e);
            alpha += this.compassOffset;
        } else if (e.absolute || e.type === 'deviceorientationabsolute') {
            this.mode = 'absolute';
        } else {
            this.mode = 'relative';
        }
        if (this.mode !== 'relative') alpha -= this.declination;
        this.setFromEuler(alpha + this.manualOffset, e.beta, e.gamma);
    }

    /**
     * On iOS alpha has an arbitrary zero, so it is tied to the compass with a smoothed offset.
     * The offset is only updated outside the gimbal-lock zone (phone held straight up), where alpha jumps.
     * If the first sample comes from that zone, the first good sample afterwards replaces it at once.
     */
    updateCompassOffset(e) {
        const sample = (360 - e.webkitCompassHeading) - e.alpha;
        const usable = e.beta > -60 && e.beta < 70 && Math.abs(e.gamma) < 30;
        if (this.compassOffset === null || (usable && !this.compassSettled)) {
            this.compassOffset = sample;
            this.compassSettled = usable;
        } else if (usable) {
            const diff = ((sample - this.compassOffset + 540) % 360) - 180;
            this.compassOffset += diff * 0.05;
        }
    }

    /** Builds the target camera quaternion from W3C device orientation angles (degrees). */
    setFromEuler(alpha, beta, gamma) {
        const screenAngle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
        this.euler.set(beta * DEG, alpha * DEG, -gamma * DEG, 'YXZ');
        this.target.setFromEuler(this.euler);
        this.target.multiply(CAMERA_FROM_DEVICE);
        this.target.multiply(this.tmp.setFromAxisAngle(Z_AXIS, -screenAngle * DEG));
    }

    /** Switches to mouse/touch drag control (laptop or sensors denied). */
    enableDrag() {
        if (this.mode === 'drag') return;
        this.mode = 'drag';
        window.removeEventListener('deviceorientationabsolute', this.onSensor);
        window.removeEventListener('deviceorientation', this.onSensor);
        let last = null;
        this.element.addEventListener('pointerdown', (e) => {
            last = { x: e.clientX, y: e.clientY };
            this.dragDistance = 0;
        });
        window.addEventListener('pointermove', (e) => {
            if (!last) return;
            const k = this.fov / window.innerHeight;
            const dx = e.clientX - last.x;
            const dy = e.clientY - last.y;
            this.dragDistance += Math.abs(dx) + Math.abs(dy);
            this.yaw = (this.yaw - dx * k + 360) % 360;
            this.pitch = MathUtils.clamp(this.pitch + dy * k, -89, 89);
            last = { x: e.clientX, y: e.clientY };
            this.setDragTarget();
        });
        window.addEventListener('pointerup', () => {
            last = null;
        });
        this.element.addEventListener('wheel', (e) => {
            if (this.onZoom) this.onZoom(e.deltaY > 0 ? 1.08 : 1 / 1.08);
        }, { passive: true });
        if (this.onDrag) this.onDrag();
    }

    /** Points the camera at the current yaw (azimuth) and pitch (altitude). */
    setDragTarget() {
        this.target.setFromAxisAngle(Y_AXIS, -this.yaw * DEG);
        this.target.multiply(this.tmp.setFromAxisAngle(X_AXIS, this.pitch * DEG));
    }

    /** Turns the drag camera towards an altitude/azimuth (used by "find in sky"). */
    lookAt(alt, az) {
        if (this.mode !== 'drag') return;
        this.yaw = az;
        this.pitch = MathUtils.clamp(alt, -89, 89);
        this.setDragTarget();
    }

    /** Smoothly moves the camera towards the latest sensor reading and copies it into the camera. */
    apply(camera, fov) {
        this.fov = fov;
        this.current.slerp(this.target, this.mode === 'drag' ? 0.5 : 0.25);
        camera.quaternion.copy(this.current);
    }

    /** True when the drag gesture moved enough to not count as a tap. */
    wasDrag() {
        return this.mode === 'drag' && this.dragDistance > 6;
    }
}
