// riverojsx-engine - Modo Desarrollador: loop de animación, física y colisiones
// Extraído de developer.js. Antes usaba this.getBlockConfig(); ahora usa
// BlockRegistry.getConfig() (misma tabla, compartida con Game).

Object.assign(Developer, {
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const now = performance.now();

        if (App.config.showFPS) {
            const fps = Math.round(1 / delta);
            const el = document.getElementById('fps-counter');
            if (el) el.textContent = fps + ' FPS';
        }

        this.updatePlayer(delta);

        // Enviar posición en sesión compartida (30 veces por segundo)
        if (this.roomCode && App.socket && now - this.lastUpdate > 33) {
            this.lastUpdate = now;
            App.socket.emit('player_move', {
                room: this.roomCode,
                id: App.player.id,
                x: this.player.x,
                z: this.player.z,
                rotation: this.camera.rotation.y
            });
        }

        this.renderer.render(this.scene, this.camera);
    },

    updatePlayer(delta) {
        const p = this.player;

        this.applyJoystickMovement();

        if (p.flying) {
            // Volar: el botón "SUBIR" asciende mientras se mantiene
            // presionado, igual de fluido que "BAJAR"
            let vy = 0;
            if (this.jumpHeld) vy = this.FLY_SPEED;
            else if (this.descendPressed) vy = -this.FLY_SPEED;
            p.velocity.y = vy;

            p.y += p.velocity.y * delta;
            p.x += p.velocity.x * delta;
            p.z += p.velocity.z * delta;
        } else {
            // Salto
            if (this.jumpPressed && p.onGround && !p.noclip) {
                p.velocity.y = this.JUMP_FORCE;
                p.onGround = false;
            }

            if (!p.noclip) {
                p.velocity.y -= this.GRAVITY * delta;
            }

            const prevY = p.y; // altura antes de mover este cuadro

            p.x += p.velocity.x * delta;
            p.z += p.velocity.z * delta;
            p.y += p.velocity.y * delta;

            if (p.y < 0 && !p.noclip) {
                p.y = 0;
                p.velocity.y = 0;
                p.onGround = true;
            } else if (!p.noclip) {
                p.onGround = false;
            }

            // Colisión sólida con todos los bloques (pared, piso, techo,
            // puerta, ventana): se puede caminar encima y no se atraviesan
            if (!p.noclip) {
                this.resolveBlockCollisions(prevY);
            }
        }

        this.jumpPressed = false;

        // Actualizar cámara y mesh del jugador
        this.camera.position.set(p.x, p.y + 1.6, p.z);
        if (this.playerMesh) {
            this.playerMesh.position.set(p.x, p.y + 0.9, p.z);
        }
    },

    // Resuelve colisiones jugador-bloque en dos pasadas: primero vertical
    // (aterrizar encima de un bloque o golpear uno por debajo al saltar),
    // luego horizontal (paredes/puertas/ventanas bloquean el paso).
    // Todos los tipos de bloque son sólidos, sin distinción.
    resolveBlockCollisions(prevY) {
        const p = this.player;
        const RADIUS = 0.32;   // ancho del jugador
        const HEIGHT = 1.8;    // altura del jugador (desde los pies)

        // --- Paso 1: eje vertical ---
        for (const mesh of this.blockMeshes) {
            const config = BlockRegistry.getConfig(mesh.userData.type);
            const [sx, sy, sz] = config.size;
            const bx = mesh.position.x, by = mesh.position.y, bz = mesh.position.z;
            const bMinX = bx - sx / 2, bMaxX = bx + sx / 2;
            const bMinY = by - sy / 2, bMaxY = by + sy / 2;
            const bMinZ = bz - sz / 2, bMaxZ = bz + sz / 2;

            const withinX = p.x + RADIUS > bMinX && p.x - RADIUS < bMaxX;
            const withinZ = p.z + RADIUS > bMinZ && p.z - RADIUS < bMaxZ;
            if (!withinX || !withinZ) continue;

            const feet = p.y, head = p.y + HEIGHT;
            if (feet >= bMaxY || head <= bMinY) continue;

            const prevFeet = prevY;
            if (prevFeet >= bMaxY - 0.05 && p.velocity.y <= 0) {
                // Veníamos de arriba: aterrizar sobre el bloque
                p.y = bMaxY;
                p.velocity.y = 0;
                p.onGround = true;
            } else if (prevFeet + HEIGHT <= bMinY + 0.05 && p.velocity.y > 0) {
                // Veníamos de abajo: golpear el bloque con la cabeza
                p.y = bMinY - HEIGHT;
                p.velocity.y = 0;
            }
        }

        // --- Paso 2: eje horizontal (empuje fuera del bloque) ---
        for (const mesh of this.blockMeshes) {
            const config = BlockRegistry.getConfig(mesh.userData.type);
            const [sx, sy, sz] = config.size;
            const bx = mesh.position.x, by = mesh.position.y, bz = mesh.position.z;

            const feet = p.y, head = p.y + HEIGHT;
            if (feet >= by + sy / 2 - 0.02 || head <= by - sy / 2 + 0.02) continue;

            const dx = p.x - bx, dz = p.z - bz;
            const overlapX = (sx / 2 + RADIUS) - Math.abs(dx);
            const overlapZ = (sz / 2 + RADIUS) - Math.abs(dz);

            if (overlapX > 0 && overlapZ > 0) {
                if (overlapX < overlapZ) {
                    p.x += dx > 0 ? overlapX : -overlapX;
                    p.velocity.x = 0;
                } else {
                    p.z += dz > 0 ? overlapZ : -overlapZ;
                    p.velocity.z = 0;
                }
            }
        }
    }
});
