// riverojsx-engine - Modo Juego: loop de animación, física simple y resize
// Extraído de game.js sin cambios de lógica.

Object.assign(Game, {
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const now = performance.now();

        // FPS
        if (App.config.showFPS) {
            const el = document.getElementById('fps-counter');
            if (el) el.textContent = Math.round(1 / delta) + ' FPS';
        }

        // Actualizar jugador local
        this.updateLocalPlayer(delta);

        // Enviar posición en multiplayer (30 veces por segundo)
        if (this.mode === 'multiplayer' && App.socket && now - this.lastUpdate > 33) {
            this.lastUpdate = now;
            App.socket.emit('player_move', {
                room: this.roomCode,
                id: App.player.id,
                x: this.localPlayer.x,
                z: this.localPlayer.z,
                rotation: this.localPlayer.rotation.y
            });
        }

        this.renderer.render(this.scene, this.camera);
    },

    updateLocalPlayer(delta) {
        const p = this.localPlayer;

        this.applyJoystickMovement();

        // Salto
        if (this.jumpPressed && p.onGround) {
            p.velocity.y = this.JUMP_FORCE;
            p.onGround = false;
        }
        this.jumpPressed = false;

        // Gravedad
        p.velocity.y -= this.GRAVITY * delta;

        p.x += p.velocity.x * delta;
        p.z += p.velocity.z * delta;
        p.y += p.velocity.y * delta;

        // Piso
        if (p.y < 0) {
            p.y = 0;
            p.velocity.y = 0;
            p.onGround = true;
        } else {
            p.onGround = false;
        }

        // Actualizar cámara y mesh
        this.camera.position.set(p.x, p.y + 1.6, p.z);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.x = p.rotation.x;
        this.camera.rotation.y = p.rotation.y;

        if (this.localPlayerMesh) {
            this.localPlayerMesh.position.set(p.x, p.y + 0.9, p.z);
            this.localPlayerMesh.rotation.y = p.rotation.y;
        }
    },

    onResize() {
        if (!this.camera || !this.renderer) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
});
