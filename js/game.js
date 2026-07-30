
const Game = {
    scene: null,
    camera: null,
    renderer: null,

    // Estado
    mode: 'solo',
    currentMap: null,
    roomCode: null,
    players: {},
    otherPlayerMeshes: {},

    // Física / movimiento
    SPEED: 5,
    RUN_MULTIPLIER: 1.8,
    JUMP_FORCE: 7.2,
    GRAVITY: 20,

    // Jugador local
    localPlayer: {
        x: 0, y: 0, z: 5,
        velocity: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0 },
        onGround: true
    },

    // Controles
    lookTouchId: null,
    lookLast: null,
    joystickVector: { x: 0, y: 0 },
    isRunning: false,
    jumpPressed: false,

    // Loop
    animationId: null,
    clock: new THREE.Clock(),
    lastUpdate: 0,

    start(data) {
        this.mode = data.mode || 'solo';
        this.roomCode = data.room || null;
        this.currentMap = data.map || 'default';

        // Reiniciar estado de controles por si venimos de otra partida
        this.lookTouchId = null;
        this.lookLast = null;
        this.joystickVector = { x: 0, y: 0 };
        this.isRunning = false;
        this.localPlayer = { x: 0, y: 0, z: 5, velocity: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0 }, onGround: true };

        const app = document.getElementById('app');
        app.innerHTML = `
            <div id="game-canvas-container"></div>
            <div class="game-overlay">
                <div class="fps-counter" id="fps-counter" style="display:${App.config.showFPS ? 'block' : 'none'}">60 FPS</div>
                <div class="hud-cluster">
                    <div class="hud-cluster-row">
                        <div class="hud-chip">${this.mode === 'multiplayer' ? 'MULTIPLAYER' : 'SOLO'}</div>
                        ${this.roomCode ? `<div class="hud-chip">SALA ${this.roomCode}</div>` : ''}
                    </div>
                    <button class="exit-game-btn" onclick="Game.exit()">SALIR</button>
                </div>
            </div>

            <div class="joystick-zone" id="joystick-zone">
                <div class="joystick-base" id="joystick-base">
                    <div class="joystick-knob" id="joystick-knob"></div>
                </div>
            </div>

            <div class="action-cluster">
                <button class="action-btn run-btn" id="run-btn">
                    <span class="icon">⚡</span>CORRER
                </button>
                <button class="action-btn" id="jump-btn">
                    <span class="icon">⤒</span>SALTAR
                </button>
            </div>
        `;

        this.initThreeJS();
        this.loadMap(this.currentMap);
        this.setupControls();
        this.setupJoystick();
        this.setupActionButtons();
        this.setupMultiplayer();
        App.enterImmersive();
        this.animate();
    },

    initThreeJS() {
        const container = document.getElementById('game-canvas-container');
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scene = new THREE.Scene();

        // Cielo con degradado (más bonito, sin luces adicionales)
        this.scene.background = App.createSkyTexture('#3f8fd6', '#cdeafb');
        this.scene.fog = new THREE.Fog(0xbfe3f7, 35, 130);

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 1.6, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Luces: se mantiene el mismo número que antes (una de ambiente +
        // una direccional), solo se sustituye la de ambiente por una
        // hemisférica para un degradado de color más agradable sin
        // "exagerar" con iluminación extra.
        const hemi = new THREE.HemisphereLight(0xaee2ff, 0x4f8f3d, 0.65);
        this.scene.add(hemi);

        const dir = new THREE.DirectionalLight(0xfff3df, 0.75);
        dir.position.set(50, 100, 50);
        dir.castShadow = true;
        this.scene.add(dir);

        // Piso con textura tipo césped (en vez de gris plano)
        const groundTex = App.createGroundTexture();
        const planeGeo = new THREE.PlaneGeometry(240, 240);
        const planeMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);

        // Jugador local (cubo azul)
        const playerGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const playerMat = new THREE.MeshStandardMaterial({ color: 0x4488ff });
        this.localPlayerMesh = new THREE.Mesh(playerGeo, playerMat);
        this.localPlayerMesh.position.set(0, 0.9, 0);
        this.localPlayerMesh.castShadow = true;
        this.scene.add(this.localPlayerMesh);

        window.addEventListener('resize', () => this.onResize());
    },

    loadMap(mapName) {
        if (mapName === 'default') {
            // Mundo plano vacío - nada extra
            return;
        }

        const mapData = App.getMap(mapName);
        if (mapData && mapData.blocks) {
            mapData.blocks.forEach(b => {
                this.createBlock(b.x, b.y, b.z, b.type);
            });
        }
    },

    createBlock(x, y, z, type) {
        const configs = {
            wall: { color: 0x8B7355, size: [1, 1, 1] },
            floor: { color: 0x5C4033, size: [1, 0.1, 1] },
            ceiling: { color: 0x696969, size: [1, 0.1, 1] },
            window: { color: 0x87CEEB, size: [1, 1, 0.1], transparent: true, opacity: 0.4 },
            door: { color: 0x4a3728, size: [1, 2, 0.15] }
        };

        const cfg = configs[type] || configs.wall;
        const geo = new THREE.BoxGeometry(...cfg.size);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color,
            transparent: cfg.transparent || false,
            opacity: cfg.opacity || 1
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
    },

    // ===== MULTIPLAYER (sin cambios de lógica, solo mejoras visuales alrededor) =====
    setupMultiplayer() {
        if (this.mode !== 'multiplayer' || !App.socket) return;

        App.socket.on('player_moved', (data) => {
            this.updateOtherPlayer(data);
        });

        App.socket.on('player_joined_game', (data) => {
            App.toast(data.name + ' se unió a la partida');
            this.addOtherPlayer(data);
        });

        App.socket.on('player_left_game', (data) => {
            this.removeOtherPlayer(data.id);
        });

        App.socket.on('game_ended', () => {
            App.toast('La partida terminó');
            this.exit();
        });

        // Notificar que estamos en el juego
        App.socket.emit('join_game', {
            room: this.roomCode,
            id: App.player.id,
            name: App.player.name
        });
    },

    addOtherPlayer(data) {
        if (this.otherPlayerMeshes[data.id]) return;

        const geo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(data.x || 0, 0.9, data.z || 0);
        mesh.castShadow = true;

        this.scene.add(mesh);
        this.otherPlayerMeshes[data.id] = mesh;
        this.players[data.id] = data;
    },

    updateOtherPlayer(data) {
        if (!this.otherPlayerMeshes[data.id]) {
            this.addOtherPlayer(data);
            return;
        }

        const mesh = this.otherPlayerMeshes[data.id];
        mesh.position.set(data.x, 0.9, data.z);
        mesh.rotation.y = data.rotation || 0;
        this.players[data.id] = { ...this.players[data.id], ...data };
    },

    removeOtherPlayer(id) {
        if (this.otherPlayerMeshes[id]) {
            this.scene.remove(this.otherPlayerMeshes[id]);
            delete this.otherPlayerMeshes[id];
            delete this.players[id];
        }
    },

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
            this.joystickVector = { x: dx / MAX_DIST, y: dy / MAX_DIST };
        };

        const resetKnob = () => {
            knob.style.transform = 'translate(0px, 0px)';
            this.joystickVector = { x: 0, y: 0 };
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
    },

    // ===== ANIMACIÓN =====
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
    },

    exit() {
        // Notificar al servidor que salimos
        if (this.mode === 'multiplayer' && App.socket) {
            App.socket.emit('leave_game', { room: this.roomCode, id: App.player.id });
        }

        // Limpiar
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.otherPlayerMeshes = {};
        this.players = {};

        App.exitImmersive();

        // La partida se elimina del servidor (el servidor maneja esto)
        Multiplayer.resetRoom();

        App.showScreen('home');
    }
};
