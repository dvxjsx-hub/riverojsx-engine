// riverojsx-engine - Multiplayer: Crear sala + selección de mapa
// Extraído de multiplayer.js. Define el objeto global Multiplayer; el resto
// de archivos de esta feature (socket, join, lobby) se añaden con
// Object.assign. Antes usaba App.getSavedMaps(); ahora usa Maps.getSavedMaps().

const Multiplayer = {
    currentRoom: null,
    isHost: false,
    players: [],
    isReady: false,
    selectedMap: 'default',
    socketHandlers: {}, // Almacena las referencias exactas de los listeners

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
        const maps = (Maps.getSavedMaps && Maps.getSavedMaps()) || [];
        
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
    }
};
