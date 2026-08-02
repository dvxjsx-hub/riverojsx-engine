// riverojsx-engine - Modo Desarrollador: sesión compartida (invitar amigos)
// Extraído de developer.js sin cambios de lógica.

Object.assign(Developer, {
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
    }
});
