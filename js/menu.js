
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
                    
                    <div class="section-title">Amigos (${App.player.friends.length})</div>
                    <button class="menu-btn sub" onclick="App.showScreen('add_friend')">+ AÑADIR AMIGO</button>
                    
                    <div id="friends-list">
                        ${this.renderFriendsList()}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderFriendsList() {
        if (App.player.friends.length === 0) {
            return '<div class="empty-state">No tienes amigos aún</div>';
        }
        
        return App.player.friends.map(f => `
            <div class="friend-item">
                <span class="friend-name">${f.name}</span>
                <span class="friend-status ${f.online ? 'online' : 'offline'}">
                    ${f.online ? 'ACTIVO' : 'INACTIVO'}
                </span>
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
        app.innerHTML = `
            <div class="screen" id="screen-add-friend">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">AÑADIR AMIGO</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="section-title">ID del jugador</div>
                    <input type="text" class="add-friend-input" id="friend-id-input" 
                           placeholder="Ej: usr_abc123def" maxlength="20">
                    <button class="menu-btn" onclick="Menu.addFriend()">BUSCAR Y AÑADIR</button>
                    <div id="add-friend-result"></div>
                    
                    <div class="divider" style="margin-top:20px;"></div>
                    <div class="section-title">Tu ID</div>
                    <div style="font-size:11px;color:#666;font-family:monospace;">${App.player.id}</div>
                    <div style="font-size:10px;color:#444;margin-top:4px;">Comparte tu ID para que te agreguen</div>
                </div>
            </div>
        `;
    },
    
    addFriend() {
        const input = document.getElementById('friend-id-input');
        const friendId = input.value.trim();
        const result = document.getElementById('add-friend-result');
        
        if (!friendId || friendId === App.player.id) {
            result.innerHTML = '<div class="error-msg">ID inválido</div>';
            return;
        }
        
        if (App.player.friends.find(f => f.id === friendId)) {
            result.innerHTML = '<div class="error-msg">Ya es tu amigo</div>';
            return;
        }
        
        // Simular búsqueda (en producción, el servidor validaría)
        // Aquí generamos un nombre basado en el ID para demo
        const fakeName = 'Player_' + friendId.substr(-4);
        
        const newFriend = {
            id: friendId,
            name: fakeName,
            online: false
        };
        
        App.player.friends.push(newFriend);
        App.saveFriends();
        
        result.innerHTML = '<div style="font-size:11px;color:#4caf50;margin-top:8px;">✓ Amigo añadido</div>';
        App.toast('Amigo añadido');
        
        // Notificar al servidor
        if (App.socket) {
            App.socket.emit('add_friend', { friendId: friendId, myId: App.player.id });
        }
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
                            <div class="news-avatar">📢</div>
                            <div>
                                <div class="news-author">riverojsx-engine</div>
                                <div class="news-date">29 Jul 2026</div>
                            </div>
                        </div>
                        <div class="news-text">
                            El proyecto riverojsx está avanzando lentamente y ha traído el modo desarrollador convirtiéndolo en un motor de juego. 
                            Ahora puedes construir tus propios mapas en 3D y compartirlos con todos los jugadores.
                        </div>
                        <div class="news-tag">#VERSION BETA</div>
                    </div>
                    
                    <div class="news-card">
                        <div class="news-header">
                            <div class="news-avatar">🎮</div>
                            <div>
                                <div class="news-author">riverojsx-engine</div>
                                <div class="news-date">28 Jul 2026</div>
                            </div>
                        </div>
                        <div class="news-text">
                            Nueva actualización del motor gráfico. Se ha mejorado el rendimiento en dispositivos móviles y se ha añadido soporte para partidas multijugador hasta 4 jugadores.
                        </div>
                        <div class="news-tag">#MULTIPLAYER</div>
                    </div>
                    
                    <div class="news-card">
                        <div class="news-header">
                            <div class="news-avatar">🛠️</div>
                            <div>
                                <div class="news-author">riverojsx-engine</div>
                                <div class="news-date">25 Jul 2026</div>
                            </div>
                        </div>
                        <div class="news-text">
                            El modo desarrollador ya está disponible. Usa la clave de acceso para entrar y comienza a construir. Guarda tus mapas y otros jugadores podrán jugarlos.
                        </div>
                        <div class="news-tag">#MODO DESARROLLADOR</div>
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
