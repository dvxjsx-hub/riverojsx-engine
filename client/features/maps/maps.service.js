// riverojsx-engine - Mapas guardados/publicados (cliente)
// Extraído de app.js (getSavedMaps/saveMap/publishMap/getMap). Antes vivían
// en App; se mueven a su propio dominio porque Menu, Multiplayer, Game y
// Developer los usan como una feature propia, no como estado del motor.
//
// Nota: App.getDefaultMap() existía en el original pero no la llamaba
// nadie en todo el proyecto (código muerto) — se elimina en esta migración,
// sin efecto en el comportamiento.

const Maps = {
    getSavedMaps() {
        const maps = localStorage.getItem('riverojsx_maps');
        return maps ? JSON.parse(maps) : [];
    },

    saveMap(name, blocks) {
        const maps = this.getSavedMaps();
        const existing = maps.findIndex(m => m.name === name);
        const mapData = {
            name: name,
            blocks: blocks,
            created: new Date().toISOString(),
            author: App.player.name,
            authorId: App.player.id
        };

        if (existing >= 0) {
            maps[existing] = mapData;
        } else {
            maps.push(mapData);
        }

        localStorage.setItem('riverojsx_maps', JSON.stringify(maps));
        return mapData;
    },

    // Publica el mapa para que aparezca en MAPAS y todos los jugadores
    // puedan verlo/jugarlo. Si ya existía uno publicado con el mismo
    // nombre y autor, el servidor lo actualiza en vez de duplicarlo.
    publishMap(name, blocks) {
        const mapData = {
            name: name,
            blocks: blocks,
            created: new Date().toISOString(),
            author: App.player.name,
            authorId: App.player.id
        };

        if (App.socket && App.socket.connected) {
            App.socket.emit('share_map', mapData);
        }

        return mapData;
    },

    getMap(name) {
        const maps = this.getSavedMaps();
        return maps.find(m => m.name === name);
    }
};
