// riverojsx-engine - Pantalla de Configuración (sensibilidad, FPS, idioma,
// acceso al Modo Desarrollador). Extraído de menu.js sin cambios de lógica.

Object.assign(Menu, {
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
        
        if (input.value === '1000000') {
            App.showScreen('dev_mode');
        } else {
            error.innerHTML = '<div class="error-msg">Clave incorrecta</div>';
        }
    }
});
