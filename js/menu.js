
const Menu = {
    
    // ===== PANTALLA DE INICIO =====
    showHome() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-home">
                <button class="config-corner-btn" onclick="App.showScreen('config')" aria-label="Configuración">⚙️</button>

                <div class="home-header">
                    <button class="profile-btn" onclick="App.showScreen('profile')">
                        <span class="profile-btn-avatar">👤</span>
                        <span class="profile-btn-name">${App.player.name}</span>
                    </button>
                </div>

                <div class="home-content">
                    <div class="game-title">riverojsx<br>engine</div>

                    <div class="menu-list">
                        <button class="menu-btn primary" onclick="App.showScreen('play')">Jugar</button>
                        <button class="menu-btn" onclick="App.showScreen('news')">Novedades</button>
                        <button class="menu-btn" onclick="App.showScreen('maps')">Mapas</button>
                    </div>
                </div>

                <div class="home-bottom">
                    <div class="home-hint">👆 Toca para seleccionar</div>
                    <div class="version-tag">${App.config.version}</div>
                </div>
            </div>
        `;
    },
    
    // ===== JUGAR (submenú) =====
    showPlay() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-play">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">JUGAR</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="menu-list">
                        <button class="menu-btn primary" onclick="App.showScreen('play_solo')">Solo</button>
                        <button class="menu-btn" onclick="App.showScreen('play_multi')">Multiplayer</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ===== SOLO - Seleccionar Mapa =====
    showPlaySolo() {
        const maps = App.getSavedMaps();
        const app = document.getElementById('app');
        
        let mapsHtml = `
            <div class="map-card map-default" onclick="App.showScreen('game', {mode:'solo', map:'default'})">
                <div class="map-name">Mundo Plano</div>
                <div class="map-meta">Mapa default · Mundo vacío</div>
            </div>
        `;
        
        maps.forEach(map => {
            mapsHtml += `
                <div class="map-card" onclick="App.showScreen('game', {mode:'solo', map:'${map.name}'})">
                    <div class="map-name">${map.name}</div>
                    <div class="map-meta">Por ${map.author} · ${new Date(map.created).toLocaleDateString()}</div>
                </div>
            `;
        });
        
        app.innerHTML = `
            <div class="screen" id="screen-play-solo">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">SOLO</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="section-title">Seleccionar mapa</div>
                    ${mapsHtml}
                </div>
            </div>
        `;
    },
    
    // ===== MULTIPLAYER =====
    showPlayMulti() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-play-multi">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">MULTIPLAYER</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="menu-list">
                        <button class="menu-btn primary" onclick="App.showScreen('create_room')">Crear sala</button>
                        <button class="menu-btn" onclick="App.showScreen('join_room')">Unirse a sala</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ===== PERFIL =====
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
    },
    
    // ===== NOVEDADES =====
    showNews() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-news">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">NOVEDADES</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="news-card">
                        <div class="news-header">
                            <div class="news-avatar">👥</div>
                            <div>
                                <div class="news-author">riverojsx-engine</div>
                                <div class="news-date">30/07/2026</div>
                            </div>
                        </div>
                        <div class="news-text">
                            Se trabaja en mejorar el sistema de amigos.
                        </div>
                        <div class="news-tag">#AMIGOS</div>
                    </div>
                    
                    <div class="news-card">
                        <div class="news-header">
                            <div class="news-avatar">🚀</div>
                            <div>
                                <div class="news-author">riverojsx-engine</div>
                                <div class="news-date">19/07/2026</div>
                            </div>
                        </div>
                        <div class="news-text">
                            Nace el proyecto, riverojsx run for goals.
                        </div>
                        <div class="news-tag">#INICIO</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ===== MAPAS =====
    showMaps() {
        const maps = App.getSavedMaps();
        const app = document.getElementById('app');
        
        let mapsHtml = '';
        if (maps.length === 0) {
            mapsHtml = '<div class="empty-state">No hay mapas guardados aún.<br>Usa el modo desarrollador para crear uno.</div>';
        } else {
            maps.forEach(map => {
                mapsHtml += `
                    <div class="map-card">
                        <div class="map-name">${map.name}</div>
                        <div class="map-meta">Por ${map.author} · ${new Date(map.created).toLocaleDateString()} · ${map.blocks?.length || 0} bloques</div>
                    </div>
                `;
            });
        }
        
        app.innerHTML = `
            <div class="screen" id="screen-maps">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">MAPAS</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="section-title">Mapas de la comunidad</div>
                    ${mapsHtml}
                </div>
            </div>
        `;
    },
    
    // ===== CONFIGURACIÓN =====
    showConfig() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-config">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">CONFIGURACIÓN</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="section-title">Juego</div>
                    
                    <div class="config-row">
                        <span class="config-label">Sensibilidad de cámara</span>
                        <span class="config-value" id="sens-value">${Math.round(App.config.sensitivity * 100)}%</span>
                    </div>
                    <input type="range" class="config-slider" min="10" max="200" 
                           value="${App.config.sensitivity * 100}" 
                           oninput="Menu.updateSensitivity(this.value)">
                    
                    <div class="config-row">
                        <span class="config-label">Idioma</span>
                        <span class="config-value">ESPAÑOL</span>
                    </div>
                    
                    <div class="config-row">
                        <span class="config-label">Mostrar FPS</span>
                        <button class="toggle-btn" onclick="Menu.toggleFPS()">
                            ${App.config.showFPS ? 'SÍ' : 'NO'}
                        </button>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="section-title">Sistema</div>
                    <div class="config-row">
                        <span class="config-label">Versión</span>
                        <span class="config-value">${App.config.version}</span>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="section-title">Modo Desarrollador</div>
                    <input type="password" class="dev-key-input" id="dev-key-input" 
                           placeholder="Ingresa clave..." maxlength="20">
                    <button class="menu-btn" onclick="Menu.enterDevMode()" style="margin-top:8px;">ACCEDER</button>
                    <div id="dev-key-error"></div>
                </div>
            </div>
        `;
    },
    
    updateSensitivity(val) {
        App.config.sensitivity = val / 100;
        App.saveConfig();
        document.getElementById('sens-value').textContent = val + '%';
    },
    
    toggleFPS() {
        App.config.showFPS = !App.config.showFPS;
        App.saveConfig();
        this.showConfig();
    },
    
    enterDevMode() {
        const input = document.getElementById('dev-key-input');
        const error = document.getElementById('dev-key-error');
        
        if (input.value === 'admin3108') {
            App.showScreen('dev_mode');
        } else {
            error.innerHTML = '<div class="error-msg">Clave incorrecta</div>';
        }
    }
};
