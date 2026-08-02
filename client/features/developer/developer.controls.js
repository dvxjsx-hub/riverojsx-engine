// riverojsx-engine - Modo Desarrollador: cámara táctil, joystick, botones
// Extraído de developer.js. El joystick ahora usa la fábrica compartida
// createVirtualJoystick (antes duplicada palabra por palabra con game.js).

Object.assign(Developer, {
    // Estilo Minecraft: arrastrar en cualquier parte del lienzo mueve la
    // cámara; un toque corto (sin arrastre) coloca/quita el bloque que
    // apunta la mirilla central.
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
        this.lookStart = { x: t.clientX, y: t.clientY, time: Date.now() };
        this.lookMoved = false;
    },

    onCanvasTouchMove(e) {
        for (const t of e.changedTouches) {
            if (t.identifier !== this.lookTouchId) continue;
            e.preventDefault();

            const dx = t.clientX - this.lookLast.x;
            const dy = t.clientY - this.lookLast.y;
            if (Math.abs(t.clientX - this.lookStart.x) > 10 || Math.abs(t.clientY - this.lookStart.y) > 10) {
                this.lookMoved = true;
            }

            this.camera.rotation.y -= dx * App.config.sensitivity * 0.005;
            this.camera.rotation.x -= dy * App.config.sensitivity * 0.005;
            this.camera.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.camera.rotation.x));

            this.lookLast = { x: t.clientX, y: t.clientY };
        }
    },

    onCanvasTouchEnd(e) {
        for (const t of e.changedTouches) {
            if (t.identifier !== this.lookTouchId) continue;

            const dt = Date.now() - this.lookStart.time;
            if (!this.lookMoved && dt < 350) {
                this.handleBuildTap();
            }

            this.lookTouchId = null;
            this.lookLast = null;
        }
    },

    // ===== JOYSTICK VIRTUAL (movimiento, lado izquierdo) =====
    setupJoystick() {
        createVirtualJoystick((vec) => { this.joystickVector = vec; });
    },

    // ===== BOTONES: SALTAR (o ASCENDER/DESCENDER al volar) =====
    setupActionButtons() {
        const jumpBtn = document.getElementById('jump-btn');
        const descendBtn = document.getElementById('descend-btn');

        if (jumpBtn) {
            const press = (e) => {
                e.preventDefault();
                this.jumpPressed = true;
                this.jumpHeld = true;
                jumpBtn.classList.add('pressed');
            };
            const release = (e) => {
                if (e) e.preventDefault();
                this.jumpHeld = false;
                jumpBtn.classList.remove('pressed');
            };
            jumpBtn.addEventListener('touchstart', press, { passive: false });
            jumpBtn.addEventListener('touchend', release, { passive: false });
            jumpBtn.addEventListener('touchcancel', release, { passive: false });
            jumpBtn.addEventListener('mousedown', press);
            jumpBtn.addEventListener('mouseup', release);
        }

        if (descendBtn) {
            const press = (e) => {
                e.preventDefault();
                this.descendPressed = true;
                descendBtn.classList.add('pressed');
            };
            const release = (e) => {
                if (e) e.preventDefault();
                this.descendPressed = false;
                descendBtn.classList.remove('pressed');
            };
            descendBtn.addEventListener('touchstart', press, { passive: false });
            descendBtn.addEventListener('touchend', release, { passive: false });
            descendBtn.addEventListener('touchcancel', release, { passive: false });
            descendBtn.addEventListener('mousedown', press);
            descendBtn.addEventListener('mouseup', release);
        }
    },

    applyJoystickMovement() {
        const jx = this.joystickVector.x;
        const jy = this.joystickVector.y;
        if (Math.abs(jx) < 0.05 && Math.abs(jy) < 0.05) {
            this.player.velocity.x = 0;
            this.player.velocity.z = 0;
            return;
        }

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();

        let mx = forward.x * (-jy) + right.x * jx;
        let mz = forward.z * (-jy) + right.z * jx;
        const len = Math.hypot(mx, mz);
        if (len > 1) { mx /= len; mz /= len; }

        this.player.velocity.x = mx * this.SPEED;
        this.player.velocity.z = mz * this.SPEED;
    }
});
