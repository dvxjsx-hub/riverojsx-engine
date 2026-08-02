// riverojsx-engine - Multiplayer: Lobby (listas, listo, iniciar, salir)
// Extraído de multiplayer.js sin cambios de lógica.

Object.assign(Multiplayer, {
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
});
