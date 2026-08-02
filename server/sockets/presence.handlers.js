// riverojsx-engine (server) - Presencia online / desconexión
// Extraído de server.js: player_online, update_name y disconnect.

const accounts = require('../services/accounts.service');
const presence = require('../services/presence.service');
const roomsService = require('../services/rooms.service');
const { generateId } = require('../utils/id-generator');

module.exports = function registerPresenceHandlers(io, socket) {
    // ===== REGISTRO ONLINE =====
    socket.on('player_online', (data) => {
        presence.onlinePlayers[socket.id] = {
            id: data.id || generateId(),
            name: data.name || 'Jugador',
            socketId: socket.id,
            room: null
        };

        // Registrar/actualizar la cuenta persistente (necesario para poder
        // validar el ID al recibir una solicitud de amistad)
        accounts.register(presence.onlinePlayers[socket.id].id, presence.onlinePlayers[socket.id].name);

        // Notificar a amigos que estamos online
        socket.broadcast.emit('friend_status', {
            id: data.id,
            online: true,
            name: data.name
        });
    });

    socket.on('update_name', (data) => {
        if (presence.onlinePlayers[socket.id]) {
            presence.onlinePlayers[socket.id].name = data.name;
        }
    });

    // ===== DESCONECTAR =====
    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);

        const player = presence.onlinePlayers[socket.id];
        if (player) {
            // Notificar amigos offline
            socket.broadcast.emit('friend_status', {
                id: player.id,
                online: false
            });

            // Si estaba en una sala, salir
            if (player.room && roomsService.rooms[player.room]) {
                roomsService.handleLeaveRoom(io, socket, player.room, player.id);
            }

            delete presence.onlinePlayers[socket.id];
        }
    });
};
