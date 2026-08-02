// riverojsx-engine (server) - Mapas compartidos por el modo desarrollador
// Extraído de server.js (`sharedMaps` + la lógica del evento share_map).
//
// IMPORTANTE: igual que en el proyecto original, esto solo guarda el mapa
// en memoria del proceso; todavía no se persiste en disco ni se envía de
// vuelta a otros jugadores (eso es la sincronización definitiva mencionada
// en el README, pendiente a propósito). Se deja aquí ya organizado para
// que esa función pueda implementarse más adelante sin tocar el resto.

const sharedMaps = [];

function upsertSharedMap(mapData) {
    const existing = sharedMaps.findIndex(
        m => m.name === mapData.name && m.authorId === mapData.authorId
    );
    if (existing >= 0) {
        sharedMaps[existing] = mapData;
    } else {
        sharedMaps.push(mapData);
    }
    return mapData;
}

module.exports = { sharedMaps, upsertSharedMap };
