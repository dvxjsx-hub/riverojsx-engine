// riverojsx-engine - Pantalla de Perfil (editar nombre + listas de amigos)
// Extraído de menu.js. Las listas de amigos/solicitudes se renderizan aquí
// (this.renderFriendRequests()/this.renderFriendsSection()) porque viven en
// friends.screen.js pero siguen siendo parte del mismo objeto Menu.

Object.assign(Menu, {
    showProfile() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-profile">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">PERFIL</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="profile-card">
                        <div class="profile-avatar">👤</div>
                        <div class="profile-info">
                            <div class="profile-name" id="profile-name-display">${App.player.name}</div>
                            <div class="profile-status">● En línea</div>
                        </div>
                    </div>
                    
                    <div id="edit-name-section" style="display:none; margin-bottom:14px;">
                        <input type="text" class="edit-name-input" id="edit-name-input" 
                               value="${App.player.name}" maxlength="16">
                        <button class="small-btn" onclick="Menu.saveName()">GUARDAR</button>
                        <button class="small-btn" onclick="Menu.toggleEditName()" style="color:#888;margin-left:8px;">CANCELAR</button>
                    </div>
                    
                    <button class="small-btn" id="edit-name-btn" onclick="Menu.toggleEditName()">EDITAR NOMBRE</button>
                    
                    <div class="divider"></div>

                    <div id="requests-section">${this.renderFriendRequests()}</div>
                    <div id="friends-section">${this.renderFriendsSection()}</div>
                </div>
            </div>
        `;
        Friends.refresh();
    },

    // Vuelve a pintar solo las listas de solicitudes/amigos sin recargar
    // toda la pantalla (se usa cuando llegan datos nuevos del servidor)
    renderProfileLists() {
        const req = document.getElementById('requests-section');
        const fr = document.getElementById('friends-section');
        if (req) req.innerHTML = this.renderFriendRequests();
        if (fr) fr.innerHTML = this.renderFriendsSection();
    },

    toggleEditName() {
        const section = document.getElementById('edit-name-section');
        const btn = document.getElementById('edit-name-btn');
        const display = document.getElementById('profile-name-display');
        
        if (section.style.display === 'none') {
            section.style.display = 'block';
            btn.style.display = 'none';
            display.style.display = 'none';
            document.getElementById('edit-name-input').focus();
        } else {
            section.style.display = 'none';
            btn.style.display = 'block';
            display.style.display = 'block';
        }
    },
    
    saveName() {
        const input = document.getElementById('edit-name-input');
        const name = input.value.trim();
        if (name && name.length >= 2 && name.length <= 16) {
            App.player.name = name;
            App.saveProfile();
            if (App.socket) {
                App.socket.emit('update_name', { id: App.player.id, name: name });
            }
            this.toggleEditName();
            document.getElementById('profile-name-display').textContent = name;
            App.toast('Nombre guardado');
        } else {
            App.toast('Nombre inválido (2-16 caracteres)');
        }
    }
});
