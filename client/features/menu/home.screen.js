// riverojsx-engine - Pantallas Home / Jugar / Solo / Multiplayer (routing puro)
// Extraído de menu.js. Antes usaba App.getSavedMaps(); ahora usa el nuevo
// servicio Maps (features/maps/maps.service.js) — mismo dato, mismo
// resultado, solo movido de sitio.

const Menu = {
    // ===== PANTALLA DE INICIO =====
    showHome() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-home">
                <button class="config-corner-btn" onclick="App.showScreen('config')" aria-label="Configuración">⚙️</button>

                <button class="profile-btn" onclick="App.showScreen('profile')">
                    <span class="profile-btn-avatar">👤</span>
                    <span class="profile-btn-name">${App.player.name}</span>
                </button>

                <div class="home-layout">
                    <div class="home-brand">
                        <div class="game-title">riverojsx<br>engine</div>
                        <div class="game-tagline">Motor de juego</div>
                    </div>

                    <div class="home-nav">
                        <button class="nav-item nav-item-primary" onclick="App.showScreen('play')">
                            <span class="nav-item-icon">▶</span>
                            <span class="nav-item-label">Jugar</span>
                        </button>
                        <button class="nav-item" onclick="App.showScreen('news')">
                            <span class="nav-item-icon">◆</span>
                            <span class="nav-item-label">Novedades</span>
                        </button>
                        <button class="nav-item" onclick="App.showScreen('maps')">
                            <span class="nav-item-icon">▦</span>
                            <span class="nav-item-label">Mapas</span>
                        </button>
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
        const maps = Maps.getSavedMaps();
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
    }
};
