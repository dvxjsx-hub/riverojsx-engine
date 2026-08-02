// riverojsx-engine - Render de amigos/solicitudes dentro de Perfil + pantalla
// "Añadir amigo". Extraído de menu.js. Sigue siendo parte del objeto Menu
// (Perfil las invoca como this.renderFriendRequests()/renderFriendsSection()).
// La lógica pura de red de amigos vive aparte en friends.service.js.

Object.assign(Menu, {
    renderFriendRequests() {
        if (!Friends.pendingRequests || Friends.pendingRequests.length === 0) return '';
        return `
            <div class="section-title">Solicitudes pendientes (${Friends.pendingRequests.length})</div>
            ${Friends.pendingRequests.map(r => `
                <div class="friend-request-item">
                    <span class="friend-name">${r.fromName}</span>
                    <div class="friend-request-actions">
                        <button class="small-btn accept" onclick="Friends.acceptRequest('${r.from}')">ACEPTAR</button>
                        <button class="small-btn reject" onclick="Friends.rejectRequest('${r.from}')">RECHAZAR</button>
                    </div>
                </div>
            `).join('')}
            <div class="divider"></div>
        `;
    },

    renderFriendsSection() {
        return `
            <div class="section-title">Amigos (${Friends.list.length})</div>
            <button class="menu-btn sub" onclick="App.showScreen('add_friend')">+ AÑADIR AMIGO</button>
            <div id="friends-list">${this.renderFriendsList()}</div>
        `;
    },
    
    renderFriendsList() {
        if (!Friends.list || Friends.list.length === 0) {
            return '<div class="empty-state">No tienes amigos aún.<br>Añade uno con su ID de 8 dígitos.</div>';
        }
        
        return Friends.list.map(f => `
            <div class="friend-item">
                <span class="friend-name">${f.name}</span>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span class="friend-status ${f.online ? 'online' : 'offline'}">
                        ${f.online ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    <button class="friend-remove-btn" onclick="Friends.removeFriend('${f.id}')" aria-label="Eliminar amigo">✕</button>
                </div>
            </div>
        `).join('');
    },

    // ===== AÑADIR AMIGO =====
    showAddFriend() {
        const app = document.getElementById('app');
        const rawId = App.player.id || '';
        const formattedId = rawId.replace(/(\d{4})(\d{4})/, '$1 $2');
        app.innerHTML = `
            <div class="screen" id="screen-add-friend">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">AÑADIR AMIGO</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="section-title">ID del jugador (8 dígitos)</div>
                    <input type="tel" inputmode="numeric" pattern="[0-9]*" class="add-friend-input" id="friend-id-input" 
                           placeholder="Ej: 48213967" maxlength="8">
                    <button class="menu-btn" onclick="Menu.addFriend()">ENVIAR SOLICITUD</button>
                    <div id="add-friend-result"></div>
                    
                    <div class="divider" style="margin-top:20px;"></div>
                    <div class="section-title">Tu ID</div>
                    <div class="my-id-display">${formattedId}</div>
                    <div style="font-size:10px;color:var(--text-faint);margin-top:4px;">Comparte tu ID para que te agreguen</div>
                </div>
            </div>
        `;
    },
    
    addFriend() {
        const input = document.getElementById('friend-id-input');
        const result = document.getElementById('add-friend-result');
        const friendId = (input.value || '').trim();
        
        if (!/^\d{8}$/.test(friendId)) {
            result.innerHTML = '<div class="error-msg">Ingresa un ID válido de 8 dígitos</div>';
            return;
        }
        if (friendId === App.player.id) {
            result.innerHTML = '<div class="error-msg">Ese es tu propio ID</div>';
            return;
        }
        if (!App.socket || !App.socket.connected) {
            result.innerHTML = '<div class="error-msg">Sin conexión al servidor</div>';
            return;
        }
        
        App.socket.emit('friend_request', {
            fromId: App.player.id,
            fromName: App.player.name,
            toId: friendId
        }, (res) => {
            if (res && res.success) {
                result.innerHTML = '<div style="font-size:11px;color:var(--success);margin-top:8px;">✓ ' + res.message + '</div>';
                App.toast(res.message);
                input.value = '';
                Friends.refresh();
            } else {
                result.innerHTML = '<div class="error-msg">' + ((res && res.message) || 'No se pudo enviar la solicitud') + '</div>';
            }
        });
    }
});
