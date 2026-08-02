// riverojsx-engine (server) - Relay de partida (posición, unirse, salir)
// Extraído de server.js sin cambios de lógica.

const { rooms } = require('../services/rooms.service');

module.exports = function registerGameHandlers(io, socket) {
    // ===== JUEGO: UNIRSE =====
    socket.on('join_game', (data) => {
        const room = rooms[data.room];
        if (!room) return;

        socket.to(data.room).emit('player_joined_game', {
            id: data.id,
            name: data.name,
            x: 0,
            z: 0
        });
    });

    // ===== JUEGO: MOVIMIENTO =====
    socket.on('player_move', (data) => {
        socket.to(data.room).emit('player_moved', {
            id: data.id,
            x: data.x,
            z: data.z,
            rotation: data.rotation
        });
    });

    // ===== SALIR DE JUEGO =====
    socket.on('leave_game', (data) => {
        socket.to(data.room).emit('player_left_game', { id: data.id });

        const room = rooms[data.room];
        if (room) {
            // Si la partida termina, eliminar la sala completamente
            const remaining = room.players.filter(p => p.id !== data.id);
            if (remaining.length <= 1) {
                // Cerrar sala
                io.to(data.room).emit('game_ended');
                delete rooms[data.room];
                console.log('Sala eliminada:', data.room);
            } else {
                room.players = remaining;
            }
        }
    });
};
