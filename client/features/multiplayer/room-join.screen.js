// riverojsx-engine - Multiplayer: Unirse a sala (código de 4 dígitos)
// Extraído de multiplayer.js sin cambios de lógica.

Object.assign(Multiplayer, {
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
    }
});
