// riverojsx-engine - Pantalla "Mapas" (listado de la comunidad)
// Extraído de menu.js. Antes usaba App.getSavedMaps(); ahora usa el nuevo
// servicio Maps (features/maps/maps.service.js).

Object.assign(Menu, {
    showMaps() {
        const maps = Maps.getSavedMaps();
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
    }
});
