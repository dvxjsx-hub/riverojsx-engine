// riverojsx-engine - Multiplayer: listeners de sala (unirse/salir/listo/mapa/iniciar)
// Extraído de multiplayer.js sin cambios de lógica.

Object.assign(Multiplayer, {
    setupRoomListeners() {
        if (!App.socket) return;
        
        this.clearRoomListeners();
        
        this.socketHandlers.playerJoined = (data) => {
            if (!data) return;
            this.players.push({ id: data.id, name: data.name, ready: false, isHost: false });
            this.updatePlayersList();
            if (App.toast) App.toast(data.name + ' se unió');
        };
        
        this.socketHandlers.playerLeft = (data) => {
            if (!data) return;
            this.players = this.players.filter(p => p.id !== data.id);
            this.updatePlayersList();
        };
        
        this.socketHandlers.playerReady = (data) => {
            if (!data) return;
            const player = this.players.find(p => p.id === data.id);
            if (player) {
                player.ready = data.ready;
                this.updatePlayersList();
            }
        };
        
        this.socketHandlers.mapSelected = (data) => {
            if (data && data.map) {
                this.selectedMap = data.map;
                this.selectMap(data.map);
            }
        };
        
        this.socketHandlers.gameStarted = (data) => {
            if (App.showScreen) {
                App.showScreen('game', { mode: 'multiplayer', room: this.currentRoom, map: this.selectedMap, players: this.players });
            }
        };
        
        this.socketHandlers.roomClosed = () => {
            if (App.toast) App.toast('La sala se cerró');
            this.resetRoom();
            if (App.showScreen) App.showScreen('home');
        };
        
        App.socket.on('player_joined', this.socketHandlers.playerJoined);
        App.socket.on('player_left', this.socketHandlers.playerLeft);
        App.socket.on('player_ready', this.socketHandlers.playerReady);
        App.socket.on('map_selected', this.socketHandlers.mapSelected);
        App.socket.on('game_started', this.socketHandlers.gameStarted);
        App.socket.on('room_closed', this.socketHandlers.roomClosed);
    },
    
    // Función central para no destruir otros eventos ajenos al lobby
    clearRoomListeners() {
        if (!App.socket) return;
        
        if (this.socketHandlers.playerJoined) App.socket.off('player_joined', this.socketHandlers.playerJoined);
        if (this.socketHandlers.playerLeft) App.socket.off('player_left', this.socketHandlers.playerLeft);
        if (this.socketHandlers.playerReady) App.socket.off('player_ready', this.socketHandlers.playerReady);
        if (this.socketHandlers.mapSelected) App.socket.off('map_selected', this.socketHandlers.mapSelected);
        if (this.socketHandlers.gameStarted) App.socket.off('game_started', this.socketHandlers.gameStarted);
        if (this.socketHandlers.roomClosed) App.socket.off('room_closed', this.socketHandlers.roomClosed);
        
        this.socketHandlers = {};
    }
});
