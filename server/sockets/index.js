// riverojsx-engine (server) - Registro central de todos los handlers de Socket.IO
// Antes todo esto vivía junto dentro de un único io.on('connection', ...)
// en server.js. Ahora cada dominio tiene su propio archivo; este índice
// solo los conecta, en el mismo orden en que existían originalmente.

const registerPresenceHandlers = require('./presence.handlers');
const registerRoomsHandlers = require('./rooms.handlers');
const registerGameHandlers = require('./game.handlers');
const registerMapsHandlers = require('./maps.handlers');
const registerFriendsHandlers = require('./friends.handlers');
const registerInvitesHandlers = require('./invites.handlers');
const registerDeveloperHandlers = require('./developer.handlers');
const roomsService = require('../services/rooms.service');

function attachSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Jugador conectado:', socket.id);

        registerPresenceHandlers(io, socket);
        registerRoomsHandlers(io, socket);
        registerGameHandlers(io, socket);
        registerMapsHandlers(io, socket);
        registerFriendsHandlers(io, socket);
        registerInvitesHandlers(io, socket);
        registerDeveloperHandlers(io, socket);
    });

    // Limpieza periódica de salas inactivas (antes al final de server.js)
    roomsService.startCleanupTask(io);
}

module.exports = { attachSocketHandlers };
