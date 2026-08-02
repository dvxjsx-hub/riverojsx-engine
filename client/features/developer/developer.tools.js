// riverojsx-engine - Modo Desarrollador: hotbar, panel creativo, guardar/publicar
// Extraído de developer.js. Antes usaba App.saveMap/publishMap/getMap; ahora
// usa el nuevo servicio Maps (features/maps/maps.service.js).

Object.assign(Developer, {
    // ===== HERRAMIENTAS (hotbar) =====
    selectTool(tool) {
        this.selectedTool = tool;
        document.querySelectorAll('.hotbar-slot').forEach(btn => btn.classList.remove('active'));
        const btn = document.getElementById('tool-' + tool);
        if (btn) btn.classList.add('active');

        const names = { wall: 'Pared', floor: 'Piso', ceiling: 'Techo', window: 'Ventana', door: 'Puerta', erase: 'Borrar' };
        App.toast('Herramienta: ' + names[tool]);
    },

    // ===== PANEL MODO CREATIVO =====
    toggleCreativePanel() {
        this.creativePanelOpen = !this.creativePanelOpen;
        const panel = document.getElementById('creative-panel');
        const btn = document.getElementById('creative-btn');
        if (panel) panel.style.display = this.creativePanelOpen ? 'flex' : 'none';
        if (btn) btn.classList.toggle('active', this.creativePanelOpen);
    },

    // Modo Creativo: activa Fly + Noclip juntos con un solo botón.
    // Al desactivarlo, vuelve al movimiento normal.
    toggleCreativeMode() {
        this.player.creativeMode = !this.player.creativeMode;
        this.player.flying = this.player.creativeMode;
        this.player.noclip = this.player.creativeMode;

        const creativeBtn = document.getElementById('panel-creative-btn');
        const flyBtn = document.getElementById('panel-fly-btn');
        const noclipBtn = document.getElementById('panel-noclip-btn');
        if (creativeBtn) { creativeBtn.textContent = this.player.creativeMode ? 'ON' : 'OFF'; creativeBtn.classList.toggle('on', this.player.creativeMode); }
        if (flyBtn) { flyBtn.textContent = this.player.flying ? 'ON' : 'OFF'; flyBtn.classList.toggle('on', this.player.flying); }
        if (noclipBtn) { noclipBtn.textContent = this.player.noclip ? 'ON' : 'OFF'; noclipBtn.classList.toggle('on', this.player.noclip); }

        const jumpLabel = document.getElementById('jump-btn-label');
        const descendStack = document.getElementById('descend-stack');
        if (jumpLabel) jumpLabel.textContent = this.player.flying ? 'SUBIR' : 'SALTAR';
        if (descendStack) descendStack.style.display = this.player.flying ? 'flex' : 'none';

        App.toast(this.player.creativeMode ? 'Modo Creativo activado' : 'Modo Creativo desactivado · movimiento normal');
    },

    toggleFly() {
        this.player.flying = !this.player.flying;
        this.player.noclip = this.player.flying;

        const flyBtn = document.getElementById('panel-fly-btn');
        const noclipBtn = document.getElementById('panel-noclip-btn');
        if (flyBtn) { flyBtn.textContent = this.player.flying ? 'ON' : 'OFF'; flyBtn.classList.toggle('on', this.player.flying); }
        if (noclipBtn) { noclipBtn.textContent = this.player.noclip ? 'ON' : 'OFF'; noclipBtn.classList.toggle('on', this.player.noclip); }

        // El botón de saltar pasa a ser "ascender" y aparece "descender"
        const jumpLabel = document.getElementById('jump-btn-label');
        const descendStack = document.getElementById('descend-stack');
        if (jumpLabel) jumpLabel.textContent = this.player.flying ? 'SUBIR' : 'SALTAR';
        if (descendStack) descendStack.style.display = this.player.flying ? 'flex' : 'none';

        App.toast(this.player.flying ? 'Modo volar activado' : 'Modo volar desactivado');
    },

    toggleNoclip() {
        this.player.noclip = !this.player.noclip;
        const noclipBtn = document.getElementById('panel-noclip-btn');
        if (noclipBtn) { noclipBtn.textContent = this.player.noclip ? 'ON' : 'OFF'; noclipBtn.classList.toggle('on', this.player.noclip); }
        App.toast(this.player.noclip ? 'Noclip activado' : 'Noclip desactivado');
    },

    // ===== GUARDAR/PUBLICAR =====
    saveCurrentMap() {
        if (this.blocks.length === 0) {
            App.toast('No hay bloques para guardar');
            return;
        }

        Maps.saveMap(this.currentMapName, this.blocks);
        App.toast(`Mapa "${this.currentMapName}" guardado · ${this.blocks.length} bloques`);
    },

    // Publica el mapa actual en la sección MAPAS para todos los jugadores.
    // Si ya existía una versión publicada con este nombre, se actualiza
    // en vez de crear un mapa duplicado (lo resuelve el servidor).
    publishMap() {
        if (this.blocks.length === 0) {
            App.toast('No hay bloques para publicar');
            return;
        }
        if (!App.socket || !App.socket.connected) {
            App.toast('Sin conexión al servidor');
            return;
        }

        Maps.publishMap(this.currentMapName, this.blocks);
        App.toast(`Mapa "${this.currentMapName}" publicado en MAPAS`);
    },

    loadLastMap() {
        const saved = Maps.getMap(this.currentMapName);
        if (saved && saved.blocks) {
            this.clearBlocks();
            saved.blocks.forEach(b => {
                this.placeBlock(b.x, b.y, b.z, b.type);
            });
            App.toast(`Mapa "${this.currentMapName}" cargado · ${saved.blocks.length} bloques`);
        }
    }
});
