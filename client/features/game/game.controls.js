// riverojsx-engine - Modo Juego: cámara táctil, joystick, botones de acción
// Extraído de game.js. El joystick ahora usa la fábrica compartida
// createVirtualJoystick (engine3d/input/virtual-joystick.js) en vez de una
// copia propia — misma lógica exacta, antes duplicada con developer.js.

Object.assign(Game, {
    // ===== CÁMARA: arrastrar en el lienzo (fuera del joystick/botones) =====
    setupControls() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('touchstart', (e) => this.onCanvasTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onCanvasTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onCanvasTouchEnd(e), { passive: false });
        canvas.addEventListener('touchcancel', (e) => this.onCanvasTouchEnd(e), { passive: false });
    },

    onCanvasTouchStart(e) {
        if (this.lookTouchId !== null) return;
        const t = e.changedTouches[0];
        this.lookTouchId = t.identifier;
        this.lookLast = { x: t.clientX, y: t.clientY };
    },

    onCanvasTouchMove(e) {
        for (const t of e.changedTouches) {
            if (t.identifier !== this.lookTouchId) continue;
            e.preventDefault();

            const dx = (t.clientX - this.lookLast.x) * App.config.sensitivity * 0.005;
            const dy = (t.clientY - this.lookLast.y) * App.config.sensitivity * 0.005;

            this.localPlayer.rotation.y -= dx;
            this.localPlayer.rotation.x -= dy;
            this.localPlayer.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.localPlayer.rotation.x));

            this.lookLast = { x: t.clientX, y: t.clientY };
        }
    },

    onCanvasTouchEnd(e) {
        for (const t of e.changedTouches) {
            if (t.identifier === this.lookTouchId) {
                this.lookTouchId = null;
                this.lookLast = null;
            }
        }
    },

    // ===== JOYSTICK VIRTUAL (movimiento, lado izquierdo) =====
    setupJoystick() {
        createVirtualJoystick((vec) => { this.joystickVector = vec; });
    },

    // ===== BOTONES DE ACCIÓN: CORRER / SALTAR =====
    setupActionButtons() {
        const runBtn = document.getElementById('run-btn');
        const jumpBtn = document.getElementById('jump-btn');

        if (runBtn) {
            const toggleRun = (e) => {
                e.preventDefault();
                this.isRunning = !this.isRunning;
                runBtn.classList.toggle('active', this.isRunning);
            };
            runBtn.addEventListener('touchstart', toggleRun, { passive: false });
            runBtn.addEventListener('mousedown', toggleRun);
        }

        if (jumpBtn) {
            const press = (e) => {
                e.preventDefault();
                this.jumpPressed = true;
                jumpBtn.classList.add('pressed');
            };
            const release = (e) => {
                if (e) e.preventDefault();
                jumpBtn.classList.remove('pressed');
            };
            jumpBtn.addEventListener('touchstart', press, { passive: false });
            jumpBtn.addEventListener('touchend', release, { passive: false });
            jumpBtn.addEventListener('touchcancel', release, { passive: false });
            jumpBtn.addEventListener('mousedown', press);
            jumpBtn.addEventListener('mouseup', release);
        }
    },

    applyJoystickMovement() {
        const jx = this.joystickVector.x;
        const jy = this.joystickVector.y;
        if (Math.abs(jx) < 0.05 && Math.abs(jy) < 0.05) {
            this.localPlayer.velocity.x = 0;
            this.localPlayer.velocity.z = 0;
            return;
        }

        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
            new THREE.Vector3(0, 1, 0), this.localPlayer.rotation.y
        );
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
            new THREE.Vector3(0, 1, 0), this.localPlayer.rotation.y
        );

        let mx = forward.x * (-jy) + right.x * jx;
        let mz = forward.z * (-jy) + right.z * jx;
        const len = Math.hypot(mx, mz);
        if (len > 1) { mx /= len; mz /= len; }

        const speed = this.SPEED * (this.isRunning ? this.RUN_MULTIPLIER : 1);
        this.localPlayer.velocity.x = mx * speed;
        this.localPlayer.velocity.z = mz * speed;
    }
});
