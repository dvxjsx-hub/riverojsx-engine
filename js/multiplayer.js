// riverojsx-engine - Multiplayer System
const Multiplayer = {
    currentRoom: null,
    isHost: false,
    players: [],
    isReady: false,
    selectedMap: 'default',
    socketHandlers: {}, // NUEVO: Almacena las referencias exactas de los listeners
    
    // ===== CREAR SALA =====
    showCreateRoom() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-create-room">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">CREAR SALA</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="lobby-status">CÓDIGO DE SALA</div>
                    <div class="lobby-code" id="room-code">----</div>
                    <div class="lobby-status" id="room-status">Generando...</div>
                    
                    <div class="section-title" style="margin-top:20px;">Seleccionar mapa</div>
                    <div id="map-selector">
                        ${this.renderMapSelector()}
                    </div>
                    
                    <div class="players-list" id="players-list">
                        <!-- Lista generada dinámicamente -->
                    </div>
                    
                    <div class="lobby-actions">
                        <button class="lobby-btn secondary" onclick="Multiplayer.toggleReady()" id="ready-btn">LISTO</button>
                        <button class="lobby-btn primary" onclick="Multiplayer.startGame()" id="start-btn" disabled>INICIAR</button>
                    </div>
                </div>
            </div>
        `;
        
        this.createRoom();
        this.updatePlayersList(); // Renderizar lista vacía inicialmente
    },
    
    renderMapSelector() {
        // Prevención de crasheo si la función no existe o retorna nulo
        const maps = (App.getSavedMaps && App.getSavedMaps()) || [];
        
        let html = `
            <div class="map-card map-default" onclick="Multiplayer.selectMap('default')" id="map-default">
                <div class="map-name">Mundo Plano (Default)</div>
                <div class="map-meta">Mapa vacío</div>
            </div>
        `;
        maps.forEach(map => {
            html += `
                <div class="map-card" onclick="Multiplayer.selectMap('${map.name}')" id="map-${map.name.replace(/\s/g, '_')}">
                    <div class="map-name">${map.name}</div>
                    <div class="map-meta">Por ${map.author || 'Desconocido'}</div>
                </div>
            `;
        });
        return html;
    },
    
    selectMap(mapName) {
        if (!mapName) return;
        this.selectedMap = mapName;
        
        // Quitar selección anterior
        document.querySelectorAll('.map-card').forEach(el => {
            el.style.borderColor = '#1a1a1a';
        });
        
        // Seleccionar nuevo (Diseño dark/minimal)
        const id = mapName === 'default' ? 'map-default' : 'map-' + mapName.replace(/\s/g, '_');
        const el = document.getElementById(id);
        if (el) el.style.borderColor = '#ffffff'; 
        
        if (App.socket && this.currentRoom) {
            App.socket.emit('select_map', { room: this.currentRoom, map: mapName });
        }
    },
    
    createRoom() {
        this.isHost = true;
        this.isReady = false;
        
        const playerId = App.player?.id || 'host-1';
        const playerName = App.player?.name || 'Jugador 1';
        
        this.players = [{ id: playerId, name: playerName, ready: false, isHost: true }];
        
        if (App.socket && App.socket.connected) {
            App.socket.emit('create_room', { 
                hostId: playerId, 
                hostName: playerName 
            }, (response) => {
                if (response && response.code) {
                    this.currentRoom = response.code;
                    const codeEl = document.getElementById('room-code');
                    const statusEl = document.getElementById('room-status');
                    if (codeEl) codeEl.textContent = response.code;
                    if (statusEl) statusEl.textContent = 'ESPERANDO JUGADORES (MIN 2 - MAX 4)';
                    this.setupRoomListeners();
                }
            });
        } else {
            const code = App.generateRoomCode ? App.generateRoomCode() : '1234';
            this.currentRoom = code;
            const codeEl = document.getElementById('room-code');
            const statusEl = document.getElementById('room-status');
            if (codeEl) codeEl.textContent = code;
            if (statusEl) statusEl.textContent = 'MODO LOCAL - Esperando jugadores';
        }
    },
    
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
    },
    
    updatePlayersList() {
        const container = document.getElementById('players-list');
        if (!container) return;
        
        const playerId = App.player?.id || 'host-1';
        let html = '';
        
        this.players.forEach(p => {
            const status = p.isHost ? 'ANFITRIÓN' : (p.ready ? 'LISTO ✓' : '');
            html += `
                <div class="player-slot ${p.ready ? 'ready' : ''}">
                    <span class="player-name">${p.name} ${p.id === playerId ? '(Tú)' : ''}</span>
                    <span class="player-ready">${status}</span>
                </div>
            `;
        });
        
        // Uso de Math.max evita crasheos de ciclo infinito si length sobrepasa 4 por error de conexión
        const emptySlots = Math.max(0, 4 - this.players.length);
        for (let i = 0; i < emptySlots; i++) {
            html += `
                <div class="player-slot empty">
                    <span class="player-name">Esperando jugador...</span>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        const startBtn = document.getElementById('start-btn');
        if (startBtn && this.isHost) {
            const readyCount = this.players.filter(p => p.ready || p.isHost).length;
            const canStart = this.players.length >= 2 && readyCount === this.players.length;
            startBtn.disabled = !canStart;
        }
    },
    
    toggleReady() {
        if (this.isHost) return; 
        
        this.isReady = !this.isReady;
        const btn = document.getElementById('ready-btn');
        if (btn) {
            btn.textContent = this.isReady ? 'NO LISTO' : 'LISTO';
            btn.style.color = this.isReady ? '#f44336' : '#cccccc';
        }
        
        if (App.socket && this.currentRoom) {
            App.socket.emit('toggle_ready', { room: this.currentRoom, ready: this.isReady });
        }
    },
    
    startGame() {
        if (!this.isHost) return;
        
        if (App.socket && this.currentRoom) {
            App.socket.emit('start_game', { room: this.currentRoom, map: this.selectedMap });
        }
    },
    
    // ===== UNIRSE A SALA =====
    showJoinRoom() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-join-room">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">UNIRSE A SALA</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="lobby-status" style="margin-top:30px;">INGRESA EL CÓDIGO</div>
                    <div class="code-input-container">
                        <input type="tel" class="code-digit" maxlength="1" id="code-1" oninput="Multiplayer.handleCodeInput(1)" onkeydown="Multiplayer.handleCodeKeydown(event, 1)">
                        <input type="tel" class="code-digit" maxlength="1" id="code-2" oninput="Multiplayer.handleCodeInput(2)" onkeydown="Multiplayer.handleCodeKeydown(event, 2)">
                        <input type="tel" class="code-digit" maxlength="1" id="code-3" oninput="Multiplayer.handleCodeInput(3)" onkeydown="Multiplayer.handleCodeKeydown(event, 3)">
                        <input type="tel" class="code-digit" maxlength="1" id="code-4" oninput="Multiplayer.handleCodeInput(4)" onkeydown="Multiplayer.handleCodeKeydown(event, 4)">
                    </div>
                    <button class="menu-btn" onclick="Multiplayer.joinRoom()" style="text-align:center;margin-top:20px;">UNIRSE</button>
                    <div id="join-error"></div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const firstCode = document.getElementById('code-1');
            if (firstCode) firstCode.focus();
        }, 100);
    },
    
    handleCodeInput(index) {
        const input = document.getElementById('code-' + index);
        if (input && input.value.length === 1 && index < 4) {
            const nextInput = document.getElementById('code-' + (index + 1));
            if (nextInput) nextInput.focus();
        }
    },
    
    handleCodeKeydown(e, index) {
        if (e.key === 'Backspace' && !e.target.value && index > 1) {
            const prevInput = document.getElementById('code-' + (index - 1));
            if (prevInput) prevInput.focus();
        }
    },
    
    joinRoom() {
        const codeArray = ['code-1','code-2','code-3','code-4']
            .map(id => document.getElementById(id)?.value || '');
            
        const code = codeArray.join('');
        const error = document.getElementById('join-error');
        
        if (code.length !== 4) {
            if (error) error.innerHTML = '<div class="error-msg">Código incompleto</div>';
            return;
        }
        
        const playerId = App.player?.id || 'player-2';
        const playerName = App.player?.name || 'Jugador';
        
        if (App.socket && App.socket.connected) {
            App.socket.emit('join_room', { 
                code: code, 
                playerId: playerId, 
                playerName: playerName 
            }, (response) => {
                if (response && response.success) {
                    this.currentRoom = code;
                    this.isHost = false;
                    this.isReady = false;
                    this.players = response.players || [];
                    this.showLobby(code);
                } else {
                    if (error) error.innerHTML = '<div class="error-msg">' + (response?.message || 'Sala no encontrada') + '</div>';
                }
            });
        } else {
            if (error) error.innerHTML = '<div class="error-msg">Sin conexión al servidor</div>';
        }
    },
    
    // ===== LOBBY (para unidos) =====
    showLobby(code) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-lobby">
                <div class="header">
                    <button class="back-btn" onclick="Multiplayer.leaveRoom()">← SALIR</button>
                    <span class="screen-title">SALA</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="lobby-status">CÓDIGO</div>
                    <div class="lobby-code">${code}</div>
                    <div class="lobby-status" id="room-status">ESPERANDO ANFITRIÓN...</div>
                    
                    <div class="section-title" style="margin-top:20px;">Mapa seleccionado</div>
                    <div id="selected-map-name" style="font-size:12px;color:#888;">Mundo Plano</div>
                    
                    <div class="players-list" id="players-list">
                        ${this.renderLobbyPlayers()}
                    </div>
                    
                    <div class="lobby-actions">
                        <button class="lobby-btn secondary" onclick="Multiplayer.toggleReady()" id="ready-btn">LISTO</button>
                    </div>
                </div>
            </div>
        `;
        
        this.setupRoomListeners();
    },
    
    renderLobbyPlayers() {
        let html = '';
        const playerId = App.player?.id || 'player-2';
        
        this.players.forEach(p => {
            const status = p.isHost ? 'ANFITRIÓN' : (p.ready ? 'LISTO ✓' : '');
            html += `
                <div class="player-slot ${p.ready ? 'ready' : ''}">
                    <span class="player-name">${p.name} ${p.id === playerId ? '(Tú)' : ''}</span>
                    <span class="player-ready">${status}</span>
                </div>
            `;
        });
        
        const emptySlots = Math.max(0, 4 - this.players.length);
        for (let i = 0; i < emptySlots; i++) {
            html += `<div class="player-slot empty"><span class="player-name">Esperando...</span></div>`;
        }
        return html;
    },
    
    leaveRoom() {
        const playerId = App.player?.id || 'player-2';
        if (App.socket && this.currentRoom) {
            App.socket.emit('leave_room', { room: this.currentRoom, playerId: playerId });
        }
        this.resetRoom();
        if (App.showScreen) App.showScreen('home');
    },
    
    resetRoom() {
        this.currentRoom = null;
        this.isHost = false;
        this.players = [];
        this.isReady = false;
        this.selectedMap = 'default';
        
        // En lugar de borrar todos los eventos del programa de golpe, llamamos al limpiador seguro.
        this.clearRoomListeners();
    }
};
