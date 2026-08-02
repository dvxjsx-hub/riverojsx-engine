// riverojsx-engine (server) - Salas multijugador
// Extraído de server.js: el objeto `rooms`, `handleLeaveRoom` y la limpieza
// periódica vivían sueltos en el archivo principal. Misma lógica exacta,
// ahora con responsabilidad única.

const { generateRoomCode } = require('../utils/id-generator');
const presence = require('./presence.service');

const rooms = {}; // { code: { code, hostId, hostSocket, players, map, kind, gameActive, createdAt } }

function createUniqueRoomCode() {
    let code = generateRoomCode();
    while (rooms[code]) {
        code = generateRoomCode();
    }
    return code;
}

function handleLeaveRoom(io, socket, roomCode, playerId) {
    const room = rooms[roomCode];
    if (!room) return;

    const wasHost = room.players.find(p => p.id === playerId)?.isHost;
    room.players = room.players.filter(p => p.id !== playerId);

    socket.leave(roomCode);

    if (room.players.length === 0) {
        // Eliminar sala si no queda nadie
        delete rooms[roomCode];
        console.log('Sala eliminada (vacía):', roomCode);
    } else {
        io.to(roomCode).emit('player_left', { id: playerId });

        // Si el host se fue, asignar nuevo host
        if (wasHost && room.players.length > 0) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].id;
            room.hostSocket = room.players[0].socketId;
            io.to(roomCode).emit('player_left', {
                id: playerId,
                newHost: room.players[0].id
            });
        }
    }
}

// Elimina salas inactivas (sin partida en curso) después de 30 minutos.
// Se revisa cada 5 minutos, igual que en el server.js original.
function startCleanupTask(io) {
    setInterval(() => {
        const now = Date.now();
        Object.keys(rooms).forEach(code => {
            const room = rooms[code];
            if (!room.gameActive && now - room.createdAt > 30 * 60 * 1000) {
                io.to(code).emit('room_closed');
                delete rooms[code];
                console.log('Sala eliminada por inactividad:', code);
            }
        });
    }, 5 * 60 * 1000);
}

module.exports = {
    rooms,
    createUniqueRoomCode,
    handleLeaveRoom,
    startCleanupTask
};
