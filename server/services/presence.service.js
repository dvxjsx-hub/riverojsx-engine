// riverojsx-engine (server) - Jugadores conectados en este momento
// Extraído de server.js: antes era `onlinePlayers` y `findSocketIdByPlayerId`
// declarados directamente en el archivo principal. Misma lógica, mismo
// formato de datos, solo con nombre propio.

const onlinePlayers = {}; // { socketId: { id, name, socketId, room } }

// Busca el socket actualmente conectado de un jugador a partir de su ID
// de 8 dígitos (necesario porque onlinePlayers está indexado por socket.id)
function findSocketIdByPlayerId(id) {
    for (const [socketId, p] of Object.entries(onlinePlayers)) {
        if (p.id === id) return socketId;
    }
    return null;
}

module.exports = { onlinePlayers, findSocketIdByPlayerId };
