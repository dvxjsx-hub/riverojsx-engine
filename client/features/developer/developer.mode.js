// riverojsx-engine - Modo Desarrollador: estado + ciclo de vida
// Extraído de developer.js. Define el objeto global Developer; el resto de
// archivos de esta feature (escena, construcción, controles, herramientas,
// multiplayer, loop) se añaden con Object.assign. Es la parte más
// importante del proyecto (editor del mapa oficial), por eso queda
// subdividida en más archivos que ninguna otra feature.

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
        noclip: false,
        creativeMode: false
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
    jumpHeld: false,
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
        this.player = { x: 0, y: 3, z: 0, velocity: { x: 0, y: 0, z: 0 }, onGround: false, flying: false, noclip: false, creativeMode: false };
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
                        <span>Modo Creativo</span>
                        <button class="toggle-pill" id="panel-creative-btn" onclick="Developer.toggleCreativeMode()">OFF</button>
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
                    <button class="panel-action-btn" onclick="Developer.publishMap()">🌐 PUBLICAR MAPA</button>
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
