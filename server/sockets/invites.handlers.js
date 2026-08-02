// riverojsx-engine (server) - Invitaciones dentro del mundo (Solo/Multiplayer/Dev)
// Extraído de server.js sin cambios de lógica.

const friends = require('../services/friends.service');
const presence = require('../services/presence.service');
const roomsService = require('../services/rooms.service');
const { rooms, createUniqueRoomCode } = roomsService;

module.exports = function registerInvitesHandlers(io, socket) {
    // Un jugador que ya está jugando (Solo, Multiplayer o Modo Desarrollador)
    // puede invitar a un amigo en línea a unirse. Si no existía una sala
    // (caso de Solo o Desarrollador en solitario), se crea una sobre la
    // marcha para alojar la sesión compartida.
    socket.on('send_invite', (data, callback) => {
        const cb = typeof callback === 'function' ? callback : () => {};
        const { fromId, fromName, toId, kind, map } = data;

        if (!friends.areFriends(fromId, toId)) {
            cb({ success: false, message: 'Solo puedes invitar a tus amigos' });
            return;
        }

        const targetSocket = presence.findSocketIdByPlayerId(toId);
        if (!targetSocket) {
            cb({ success: false, message: 'Tu amigo no está en línea' });
            return;
        }

        let room = data.room;
        if (!room || !rooms[room]) {
            room = createUniqueRoomCode();

            rooms[room] = {
                code: room,
                hostId: fromId,
                hostSocket: socket.id,
                players: [{ id: fromId, name: fromName, socketId: socket.id, ready: true, isHost: true }],
                map: map || 'default',
                kind: kind || 'game',
                gameActive: true,
                createdAt: Date.now()
            };
            socket.join(room);
            if (presence.onlinePlayers[socket.id]) presence.onlinePlayers[socket.id].room = room;
        }

        io.to(targetSocket).emit('invite_received', {
            fromId, fromName, room, kind: kind || 'game', map: rooms[room].map
        });

        cb({ success: true, room });
    });

    socket.on('respond_invite', (data, callback) => {
        const cb = typeof callback === 'function' ? callback : () => {};
        const { room, accepted, toId, toName, fromId, kind } = data;
        const inviterSocket = presence.findSocketIdByPlayerId(fromId);

        if (!accepted) {
            if (inviterSocket) io.to(inviterSocket).emit('invite_declined', { toName });
            cb({ success: true });
            return;
        }

        const roomData = rooms[room];
        if (!roomData) {
            cb({ success: false, message: 'La invitación ya no está disponible' });
            return;
        }

        if (!roomData.players.find(p => p.id === toId)) {
            if (roomData.players.length >= 4) {
                cb({ success: false, message: 'La sala está llena' });
                return;
            }
            roomData.players.push({ id: toId, name: toName, socketId: socket.id, ready: true, isHost: false });
        }
        socket.join(room);
        if (presence.onlinePlayers[socket.id]) presence.onlinePlayers[socket.id].room = room;

        if (inviterSocket) io.to(inviterSocket).emit('invite_accepted', { toId, toName, room });

        cb({ success: true, room, kind: roomData.kind || kind, map: roomData.map });
    });
};
