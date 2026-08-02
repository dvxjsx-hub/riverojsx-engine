// riverojsx-engine (server) - Modo desarrollador compartido (relay de bloques)
// Extraído de server.js sin cambios de lógica.
//
// Los bloques no se guardan en el servidor: viajan como un simple relay
// entre los jugadores de la misma sala (el anfitrión envía una foto del
// estado actual a quien se une, y luego cada edición se retransmite).

const presence = require('../services/presence.service');

module.exports = function registerDeveloperHandlers(io, socket) {
    socket.on('dev_block_place', (data) => {
        socket.to(data.room).emit('dev_block_placed', { x: data.x, y: data.y, z: data.z, type: data.type });
    });

    socket.on('dev_block_remove', (data) => {
        socket.to(data.room).emit('dev_block_removed', { x: data.x, y: data.y, z: data.z });
    });

    socket.on('dev_sync_state', (data) => {
        const targetSocket = presence.findSocketIdByPlayerId(data.toId);
        if (targetSocket) {
            io.to(targetSocket).emit('dev_state_sync', { blocks: data.blocks });
        }
    });
};
