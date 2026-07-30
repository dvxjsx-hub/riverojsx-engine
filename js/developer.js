// riverojsx-engine - Modo Desarrollador (estilo Minecraft)
const Developer = {
    scene: null,
    camera: null,
    renderer: null,
    raycaster: new THREE.Raycaster(),

    // Mundo
    blocks: [],
    blockMeshes: [],
    groundMesh: null,

    // Sesión compartida (Modo Desarrollador con amigos invitados)
    roomCode: null,
    otherPlayerMeshes: {},
    lastUpdate: 0,
    devSocketHandlers: {},

    // Jugador
    player: {
        x: 0, y: 3, z: 0,
        velocity: { x: 0, y: 0, z: 0 },
        onGround: false,
        flying: false,
        noclip: false
    },

    SPEED: 5,
    JUMP_FORCE: 7.2,
    GRAVITY: 20,
    FLY_SPEED: 4.5,

    // Herramienta seleccionada
    selectedTool: 'wall', // wall, floor, ceiling, window, door, erase

    // Mapa actual
    currentMapName: 'dev_map',

    // Controles
    lookTouchId: null,
    lookLast: null,
    lookStart: null,
    lookMoved: false,
    joystickVector: { x: 0, y: 0 },
    jumpPressed: false,
    descendPressed: false,
    creativePanelOpen: false,

    // Loop
    animationId: null,
    clock: new THREE.Clock(),

    HOTBAR_TOOLS: [
        { id: 'wall', icon: '▮', label: 'Pared' },
        { id: 'floor', icon: '▬', label: 'Piso' },
        { id: 'ceiling', icon: '▭', label: 'Techo' },
        { id: 'window', icon: '▦', label: 'Ventana' },
        { id: 'door', icon: '⬒', label: 'Puerta' },
        { id: 'erase', icon: '✖', label: 'Borrar' }
    ],

    enterDevMode(data) {
        data = data || {};

        // Reiniciar estado de controles por si venimos de otra sesión
        this.player = { x: 0, y: 3, z: 0, velocity: { x: 0, y: 0, z: 0 }, onGround: false, flying: false, noclip: false };
        this.lookTouchId = null;
        this.lookLast = null;
        this.joystickVector = { x: 0, y: 0 };
        this.creativePanelOpen = false;
        this.blocks = [];
        this.blockMeshes = [];
        this.roomCode = data.joinRoom || null;
        this.otherPlayerMeshes = {};

        const app = document.getElementById('app');
        app.innerHTML = `
            <div id="game-canvas-container"></div>
            <div class="crosshair"></div>

            <div class="game-overlay">
                <div class="fps-counter" id="fps-counter" style="display:none;">60 FPS</div>
                <div class="hud-cluster">
                    <div class="hud-cluster-row" id="dev-room-row">
                        ${this.roomCode ? `<div class="hud-chip">COMPARTIDO</div><div class="hud-chip">SALA ${this.roomCode}</div>` : ''}
                    </div>
                    <div class="hud-cluster-row">
                        <button class="creative-toggle-btn" onclick="Friends.openInvitePanel('dev')">👥 AMIGOS</button>
                        <button class="creative-toggle-btn" id="creative-btn" onclick="Developer.toggleCreativePanel()">CREATIVO</button>
                        <button class="exit-game-btn" onclick="Developer.exitDevMode()">SALIR</button>
                    </div>
                </div>
            </div>

            <div class="hotbar" id="hotbar">
                ${this.HOTBAR_TOOLS.map(t => `
                    <button class="hotbar-slot ${t.id === this.selectedTool ? 'active' : ''}" id="tool-${t.id}" onclick="Developer.selectTool('${t.id}')">
                        <span class="hotbar-icon">${t.icon}</span>
                        <span class="hotbar-label">${t.label}</span>
                    </button>
                `).join('')}
            </div>

            <div class="joystick-zone" id="joystick-zone">
                <div class="joystick-base" id="joystick-base">
                    <div class="joystick-knob" id="joystick-knob"></div>
                </div>
            </div>

            <div class="action-cluster">
                <div class="action-stack" id="descend-stack" style="display:none;">
                    <button class="action-mini-btn" id="descend-btn">▼</button>
                </div>
                <button class="action-btn" id="jump-btn">
                    <span class="icon">⤒</span><span id="jump-btn-label">SALTAR</span>
                </button>
            </div>

            <div class="creative-panel-overlay" id="creative-panel" style="display:none;">
                <div class="creative-panel">
                    <div class="creative-panel-header">
                        <span>Modo Creativo</span>
                        <button class="panel-close-btn" onclick="Developer.toggleCreativePanel()">✕</button>
                    </div>
                    <div class="creative-option-row">
                        <span>Volar (Fly)</span>
                        <button class="toggle-pill" id="panel-fly-btn" onclick="Developer.toggleFly()">OFF</button>
                    </div>
                    <div class="creative-option-row">
                        <span>Noclip</span>
                        <button class="toggle-pill" id="panel-noclip-btn" onclick="Developer.toggleNoclip()">OFF</button>
                    </div>
                    <div class="divider-light"></div>
                    <button class="panel-action-btn" onclick="Developer.saveCurrentMap()">💾 GUARDAR MAPA</button>
                    <button class="panel-action-btn" onclick="Developer.loadLastMap()">📂 CARGAR ÚLTIMO</button>
                </div>
            </div>
        `;

        if (App.config.showFPS) {
            document.getElementById('fps-counter').style.display = 'block';
        }

        this.initThreeJS();
        this.setupControls();
        this.setupJoystick();
        this.setupActionButtons();

        if (this.roomCode) {
            this.setupDevMultiplayer();
            App.toast('Conectando con tu amigo...');
        } else {
            this.loadLastMap();
            App.toast('Toca la pantalla para construir · Arrastra para mirar');
        }

        App.enterImmersive();
        this.animate();
    },

    initThreeJS() {
        const container = document.getElementById('game-canvas-container');
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Escena
        this.scene = new THREE.Scene();
        this.scene.background = App.createSkyTexture('#3f8fd6', '#cdeafb');
        this.scene.fog = new THREE.Fog(0xbfe3f7, 25, 110);

        // Cámara
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 3, 5);
        this.camera.rotation.order = 'YXZ';

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Luces: misma cantidad que antes (ambiente + direccional), ahora
        // hemisférica para un degradado de color más agradable, sin sumar
        // luces adicionales.
        const hemi = new THREE.HemisphereLight(0xaee2ff, 0x4f8f3d, 0.65);
        this.scene.add(hemi);

        const dirLight = new THREE.DirectionalLight(0xfff3df, 0.8);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);

        // Cuadrícula sutil para guiar la construcción (sin dominar la escena)
        const gridHelper = new THREE.GridHelper(100, 100, 0xffffff, 0xffffff);
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.08;
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        // Piso con textura tipo césped
        const groundTex = App.createGroundTexture();
        const planeGeo = new THREE.PlaneGeometry(240, 240);
        const planeMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);
        this.groundMesh = plane;

        // Nubes simples
        this.createClouds();

        // Personaje simple (cubo rojo)
        this.createPlayerMesh();

        window.addEventListener('resize', () => this.onResize());
    },

    createClouds() {
        const cloudGeo = new THREE.BoxGeometry(1, 0.5, 1);
        const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });

        for (let i = 0; i < 15; i++) {
            const cloud = new THREE.Mesh(cloudGeo, cloudMat);
            cloud.position.set(
                (Math.random() - 0.5) * 80,
                15 + Math.random() * 10,
                (Math.random() - 0.5) * 80
            );
            cloud.scale.set(
                2 + Math.random() * 4,
                1,
                1 + Math.random() * 2
            );
            this.scene.add(cloud);
        }
    },

    createPlayerMesh() {
        const geo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
        this.playerMesh = new THREE.Mesh(geo, mat);
        this.playerMesh.position.set(0, 0.9, 0);
        this.playerMesh.castShadow = true;
        this.scene.add(this.playerMesh);
    },

    // ===== SESIÓN COMPARTIDA (invitar amigos al Modo Desarrollador) =====
    // Convierte una sesión en solitario en una sesión compartida cuando se
    // invita a un amigo desde dentro del mundo (sin reiniciar la escena).
    becomeSharedHost(room) {
        if (this.roomCode) return;
        this.roomCode = room;

        const row = document.getElementById('dev-room-row');
        if (row) {
            row.innerHTML = `<div class="hud-chip">COMPARTIDO</div><div class="hud-chip">SALA ${room}</div>`;
        }

        this.setupDevMultiplayer();
    },

    setupDevMultiplayer() {
        if (!this.roomCode || !App.socket) return;

        // Evita listeners duplicados si esta función se llama más de una vez
        this.clearDevMultiplayerListeners();

        const handlers = {
            player_moved: (data) => this.updateOtherPlayer(data),
            player_joined_game: (data) => {
                App.toast(data.name + ' se unió a construir');
                this.addOtherPlayer(data);
                // Si ya estábamos en la sala, le mandamos una foto del mapa actual
                App.socket.emit('dev_sync_state', { room: this.roomCode, toId: data.id, blocks: this.blocks });
            },
            player_left_game: (data) => this.removeOtherPlayer(data.id),
            dev_state_sync: (data) => {
                this.clearBlocks();
                (data.blocks || []).forEach(b => this.placeBlock(b.x, b.y, b.z, b.type, true));
                App.toast('Mapa del anfitrión cargado · ' + (data.blocks || []).length + ' bloques');
            },
            dev_block_placed: (data) => this.placeBlock(data.x, data.y, data.z, data.type, true),
            dev_block_removed: (data) => this.removeBlockAt(data.x, data.y, data.z, true),
            game_ended: () => {
                App.toast('La sesión compartida terminó');
                this.roomCode = null;
                this.clearDevMultiplayerListeners();
            }
        };

        Object.entries(handlers).forEach(([event, fn]) => App.socket.on(event, fn));
        this.devSocketHandlers = handlers;

        App.socket.emit('join_game', {
            room: this.roomCode,
            id: App.player.id,
            name: App.player.name
        });
    },

    clearDevMultiplayerListeners() {
        if (!App.socket) return;
        Object.entries(this.devSocketHandlers).forEach(([event, fn]) => App.socket.off(event, fn));
        this.devSocketHandlers = {};
    },

    addOtherPlayer(data) {
        if (this.otherPlayerMeshes[data.id]) return;

        const geo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(data.x || 0, 0.9, data.z || 0);
        mesh.castShadow = true;

        this.scene.add(mesh);
        this.otherPlayerMeshes[data.id] = mesh;
    },

    updateOtherPlayer(data) {
        if (!this.otherPlayerMeshes[data.id]) {
            this.addOtherPlayer(data);
            return;
        }
        const mesh = this.otherPlayerMeshes[data.id];
        mesh.position.set(data.x, 0.9, data.z);
        mesh.rotation.y = data.rotation || 0;
    },

    removeOtherPlayer(id) {
        if (this.otherPlayerMeshes[id]) {
            this.scene.remove(this.otherPlayerMeshes[id]);
            delete this.otherPlayerMeshes[id];
        }
    },

    // ===== BLOQUES =====
    getBlockConfig(type) {
        const configs = {
            wall: { color: 0x8B7355, size: [1, 1, 1], transparent: false },
            floor: { color: 0x5C4033, size: [1, 0.1, 1], transparent: false },
            ceiling: { color: 0x696969, size: [1, 0.1, 1], transparent: false },
            window: { color: 0x87CEEB, size: [1, 1, 0.1], transparent: true, opacity: 0.4 },
            door: { color: 0x4a3728, size: [1, 2, 0.15], transparent: false }
        };
        return configs[type] || configs.wall;
    },

    placeBlock(x, y, z, type, fromNetwork) {
        const config = this.getBlockConfig(type);

        const existing = this.blocks.find(b =>
            Math.abs(b.x - x) < 0.1 && Math.abs(b.y - y) < 0.1 && Math.abs(b.z - z) < 0.1
        );
        if (existing) return;

        const geo = new THREE.BoxGeometry(...config.size);
        const mat = new THREE.MeshStandardMaterial({
            color: config.color,
            transparent: config.transparent || false,
            opacity: config.opacity || 1
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: type, isBlock: true };

        this.scene.add(mesh);
        this.blockMeshes.push(mesh);
        this.blocks.push({ x, y, z, type });

        // Si estamos en una sesión compartida y el bloque lo colocamos
        // nosotros (no llegó ya sincronizado), lo retransmitimos
        if (!fromNetwork && this.roomCode && App.socket) {
            App.socket.emit('dev_block_place', { room: this.roomCode, x, y, z, type });
        }
    },

    removeBlock(mesh, fromNetwork) {
        const idx = this.blockMeshes.indexOf(mesh);
        if (idx > -1) {
            const pos = mesh.position.clone();
            this.blockMeshes.splice(idx, 1);
            const bIdx = this.blocks.findIndex(b =>
                Math.abs(b.x - mesh.position.x) < 0.1 &&
                Math.abs(b.y - mesh.position.y) < 0.1 &&
                Math.abs(b.z - mesh.position.z) < 0.1
            );
            if (bIdx > -1) this.blocks.splice(bIdx, 1);
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();

            if (!fromNetwork && this.roomCode && App.socket) {
                App.socket.emit('dev_block_remove', { room: this.roomCode, x: pos.x, y: pos.y, z: pos.z });
            }
        }
    },

    // Busca el bloque en una posición (usado al recibir una eliminación
    // desde la red, donde solo tenemos las coordenadas, no el mesh)
    removeBlockAt(x, y, z, fromNetwork) {
        const mesh = this.blockMeshes.find(m =>
            Math.abs(m.position.x - x) < 0.1 &&
            Math.abs(m.position.y - y) < 0.1 &&
            Math.abs(m.position.z - z) < 0.1
        );
        if (mesh) this.removeBlock(mesh, fromNetwork);
    },

    clearBlocks() {
        this.blockMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.blockMeshes = [];
        this.blocks = [];
    },

    // ===== CONTROLES =====
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

    // Coloca/quita un bloque usando la mirilla central de la pantalla,
    // igual que la mecánica clásica de Minecraft.
    handleBuildTap() {
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

        const intersects = this.raycaster.intersectObjects(this.blockMeshes);

        if (this.selectedTool === 'erase') {
            if (intersects.length > 0) {
                this.removeBlock(intersects[0].object);
                App.toast('Bloque eliminado');
            }
            return;
        }

        if (intersects.length > 0) {
            const hit = intersects[0];
            const normal = hit.face.normal;
            const pos = hit.object.position.clone().add(
                new THREE.Vector3(normal.x, normal.y, normal.z)
            );
            this.placeBlock(pos.x, pos.y, pos.z, this.selectedTool);
        } else if (this.groundMesh) {
            const floorHit = this.raycaster.intersectObject(this.groundMesh);
            if (floorHit.length > 0) {
                const pos = floorHit[0].point;
                this.placeBlock(
                    Math.round(pos.x),
                    Math.round(pos.y + 0.5),
                    Math.round(pos.z),
                    this.selectedTool
                );
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

    // ===== BOTONES: SALTAR (o ASCENDER/DESCENDER al volar) =====
    setupActionButtons() {
        const jumpBtn = document.getElementById('jump-btn');
        const descendBtn = document.getElementById('descend-btn');

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
    },

    // ===== HERRAMIENTAS (hotbar) =====
    selectTool(tool) {
        this.selectedTool = tool;
        document.querySelectorAll('.hotbar-slot').forEach(btn => btn.classList.remove('active'));
        const btn = document.getElementById('tool-' + tool);
        if (btn) btn.classList.add('active');

        const names = { wall: 'Pared', floor: 'Piso', ceiling: 'Techo', window: 'Ventana', door: 'Puerta', erase: 'Borrar' };
        App.toast('Herramienta: ' + names[tool]);
    },

    // ===== PANEL MODO CREATIVO =====
    toggleCreativePanel() {
        this.creativePanelOpen = !this.creativePanelOpen;
        const panel = document.getElementById('creative-panel');
        const btn = document.getElementById('creative-btn');
        if (panel) panel.style.display = this.creativePanelOpen ? 'flex' : 'none';
        if (btn) btn.classList.toggle('active', this.creativePanelOpen);
    },

    toggleFly() {
        this.player.flying = !this.player.flying;
        this.player.noclip = this.player.flying;

        const flyBtn = document.getElementById('panel-fly-btn');
        const noclipBtn = document.getElementById('panel-noclip-btn');
        if (flyBtn) { flyBtn.textContent = this.player.flying ? 'ON' : 'OFF'; flyBtn.classList.toggle('on', this.player.flying); }
        if (noclipBtn) { noclipBtn.textContent = this.player.noclip ? 'ON' : 'OFF'; noclipBtn.classList.toggle('on', this.player.noclip); }

        // El botón de saltar pasa a ser "ascender" y aparece "descender"
        const jumpLabel = document.getElementById('jump-btn-label');
        const descendStack = document.getElementById('descend-stack');
        if (jumpLabel) jumpLabel.textContent = this.player.flying ? 'SUBIR' : 'SALTAR';
        if (descendStack) descendStack.style.display = this.player.flying ? 'flex' : 'none';

        App.toast(this.player.flying ? 'Modo volar activado' : 'Modo volar desactivado');
    },

    toggleNoclip() {
        this.player.noclip = !this.player.noclip;
        const noclipBtn = document.getElementById('panel-noclip-btn');
        if (noclipBtn) { noclipBtn.textContent = this.player.noclip ? 'ON' : 'OFF'; noclipBtn.classList.toggle('on', this.player.noclip); }
        App.toast(this.player.noclip ? 'Noclip activado' : 'Noclip desactivado');
    },

    // ===== GUARDAR/CARGAR =====
    saveCurrentMap() {
        if (this.blocks.length === 0) {
            App.toast('No hay bloques para guardar');
            return;
        }

        App.saveMap(this.currentMapName, this.blocks);
        App.toast(`Mapa "${this.currentMapName}" guardado · ${this.blocks.length} bloques`);
    },

    loadLastMap() {
        const saved = App.getMap(this.currentMapName);
        if (saved && saved.blocks) {
            this.clearBlocks();
            saved.blocks.forEach(b => {
                this.placeBlock(b.x, b.y, b.z, b.type);
            });
            App.toast(`Mapa "${this.currentMapName}" cargado · ${saved.blocks.length} bloques`);
        }
    },

    // ===== ANIMACIÓN =====
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
            // Volar: el botón "SUBIR" asciende, el botón "▼" desciende
            let vy = 0;
            if (this.jumpPressed) vy = this.FLY_SPEED;
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

            // Colisiones con bloques (simple AABB)
            if (!p.noclip) {
                this.blockMeshes.forEach(mesh => {
                    const dx = Math.abs(p.x - mesh.position.x);
                    const dy = Math.abs(p.y + 0.9 - mesh.position.y);
                    const dz = Math.abs(p.z - mesh.position.z);

                    if (dx < 0.8 && dy < 1 && dz < 0.8) {
                        if (dx > dz) {
                            p.x = p.x > mesh.position.x ? mesh.position.x + 0.8 : mesh.position.x - 0.8;
                        } else {
                            p.z = p.z > mesh.position.z ? mesh.position.z + 0.8 : mesh.position.z - 0.8;
                        }
                        p.velocity.x = 0;
                        p.velocity.z = 0;
                    }
                });
            }
        }

        this.jumpPressed = false;

        // Actualizar cámara y mesh del jugador
        this.camera.position.set(p.x, p.y + 1.6, p.z);
        if (this.playerMesh) {
            this.playerMesh.position.set(p.x, p.y + 0.9, p.z);
        }
    },

    onResize() {
        if (!this.camera || !this.renderer) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    exitDevMode() {
        // Notificar al servidor que salimos de la sesión compartida
        if (this.roomCode && App.socket) {
            App.socket.emit('leave_game', { room: this.roomCode, id: App.player.id });
        }
        this.clearDevMultiplayerListeners();

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
        this.blocks = [];
        this.blockMeshes = [];
        this.roomCode = null;
        this.otherPlayerMeshes = {};

        App.exitImmersive();

        App.showScreen('home');
    }
};
