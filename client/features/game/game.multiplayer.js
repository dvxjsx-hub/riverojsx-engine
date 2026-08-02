// riverojsx-engine - Modo Juego: sincronización multijugador
// Extraído de game.js sin cambios de lógica.

Object.assign(Game, {
    // Convierte una partida Solo en curso en una partida compartida cuando
    // se invita a un amigo desde dentro del mundo (sin reiniciar la escena).
    becomeMultiplayerHost(room) {
        if (this.mode === 'multiplayer') return;
        this.mode = 'multiplayer';
        this.roomCode = room;

        const row = document.getElementById('hud-mode-row');
        if (row) {
            row.innerHTML = `<div class="hud-chip">MULTIPLAYER</div><div class="hud-chip">SALA ${room}</div>`;
        }

        this.setupMultiplayer();
    },

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
    }
});
