// riverojsx-engine - Modo Juego (Solo/Multiplayer): estado + ciclo de vida
// Extraído de game.js. Define el objeto global Game; el resto de archivos
// de esta feature (escena, controles, multiplayer, loop) se añaden con
// Object.assign.

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
                    <div class="hud-cluster-row" id="hud-mode-row">
                        <div class="hud-chip">${this.mode === 'multiplayer' ? 'MULTIPLAYER' : 'SOLO'}</div>
                        ${this.roomCode ? `<div class="hud-chip">SALA ${this.roomCode}</div>` : ''}
                    </div>
                    <div class="hud-cluster-row">
                        <button class="creative-toggle-btn" onclick="Friends.openInvitePanel('game')">👥 AMIGOS</button>
                        <button class="exit-game-btn" onclick="Game.exit()">SALIR</button>
                    </div>
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
