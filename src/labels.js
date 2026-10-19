// HTML labels that follow sky objects on screen, plus tap picking and the "aim at" hint.
import { Vector3 } from 'three';

export class LabelLayer {
    /** container: element that receives the label nodes. */
    constructor(container) {
        this.container = container;
        this.items = [];
        this.v = new Vector3();
        this.width = 1;
        this.height = 1;
    }

    /**
     * Registers an object. local is its position in the EQJ group (frame 'eqj') or in world space (frame 'world').
     * When label is true an HTML label is shown; pickable objects can be tapped.
     */
    add({ kind, text, local, frame = 'eqj', label = true, pickable = true, data = {} }) {
        const item = { kind, text, local, frame, pickable, data, visible: true, onScreen: false, sx: 0, sy: 0, el: null, shown: false };
        if (label) {
            item.el = document.createElement('div');
            item.el.className = `lbl ${kind}`;
            item.el.textContent = text;
            item.el.style.display = 'none';
            this.container.appendChild(item.el);
        }
        this.items.push(item);
        return item;
    }

    /** Sets the viewport size in CSS pixels. */
    resize(w, h) {
        this.width = w;
        this.height = h;
    }

    /** Projects every object to the screen and moves its label; isLabelVisible decides per item. */
    update(camera, eqjMatrix, isLabelVisible) {
        const half = { x: this.width / 2, y: this.height / 2 };
        for (const it of this.items) {
            this.v.copy(it.local);
            if (it.frame === 'eqj') this.v.applyMatrix4(eqjMatrix);
            this.v.project(camera);
            it.onScreen = it.visible && this.v.z < 1 && Math.abs(this.v.x) < 1.1 && Math.abs(this.v.y) < 1.1;
            it.sx = (this.v.x + 1) * half.x;
            it.sy = (1 - this.v.y) * half.y;
            if (!it.el) continue;
            const show = it.onScreen && isLabelVisible(it);
            if (show !== it.shown) {
                it.el.style.display = show ? '' : 'none';
                it.shown = show;
            }
            if (show) {
                // Label width is measured once, reading layout every frame is expensive
                if (it.w === undefined) it.w = it.el.offsetWidth;
                const dx = it.kind === 'const' || it.kind === 'cardinal' ? -it.w / 2 : 9;
                const dy = it.kind === 'const' || it.kind === 'cardinal' ? -8 : -18;
                it.el.style.transform = `translate3d(${(it.sx + dx).toFixed(1)}px, ${(it.sy + dy).toFixed(1)}px, 0)`;
            }
        }
    }

    /**
     * Returns the pickable object closest to a screen point, within a radius in pixels.
     * Planets, Moon and ISS win over stars, and stars over constellation names, when distances are similar.
     */
    pick(x, y, radius, accept = () => true) {
        const bonus = { body: 25, iss: 25, star: 8, const: 0 };
        let best = null;
        let bestScore = Infinity;
        for (const it of this.items) {
            if (!it.pickable || !it.onScreen || !accept(it)) continue;
            const d = Math.hypot(it.sx - x, it.sy - y);
            if (d > radius) continue;
            const score = d - (bonus[it.kind] || 0);
            if (score < bestScore) {
                bestScore = score;
                best = it;
            }
        }
        return best;
    }
}
