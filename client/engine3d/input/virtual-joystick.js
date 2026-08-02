// riverojsx-engine - Joystick virtual (movimiento, lado izquierdo)
// Antes esta función (setupJoystick) estaba duplicada palabra por palabra
// en game.js y developer.js. Se unifica aquí como fábrica reutilizable:
// cada módulo la llama pasando su propio `onUpdate` para guardar el vector
// resultante (this.joystickVector) en su propio estado, igual que antes.

function createVirtualJoystick(onUpdate) {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    if (!zone || !base || !knob) return;

    const MAX_DIST = 40;
    let touchId = null;
    let center = { x: 0, y: 0 };

    const updateKnob = (cx, cy) => {
        let dx = cx - center.x;
        let dy = cy - center.y;
        const dist = Math.hypot(dx, dy);
        if (dist > MAX_DIST) {
            dx = (dx / dist) * MAX_DIST;
            dy = (dy / dist) * MAX_DIST;
        }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        onUpdate({ x: dx / MAX_DIST, y: dy / MAX_DIST });
    };

    const resetKnob = () => {
        knob.style.transform = 'translate(0px, 0px)';
        onUpdate({ x: 0, y: 0 });
    };

    const start = (e) => {
        if (touchId !== null) return;
        e.preventDefault();
        const t = e.changedTouches[0];
        touchId = t.identifier;
        const rect = base.getBoundingClientRect();
        center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        base.classList.add('active');
        updateKnob(t.clientX, t.clientY);
    };

    const move = (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === touchId) {
                e.preventDefault();
                updateKnob(t.clientX, t.clientY);
            }
        }
    };

    const end = (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === touchId) {
                touchId = null;
                base.classList.remove('active');
                resetKnob();
            }
        }
    };

    zone.addEventListener('touchstart', start, { passive: false });
    zone.addEventListener('touchmove', move, { passive: false });
    zone.addEventListener('touchend', end, { passive: false });
    zone.addEventListener('touchcancel', end, { passive: false });
}
