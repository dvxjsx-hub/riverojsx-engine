// riverojsx-engine (server) - Amigos: listar, solicitar, aceptar, rechazar, eliminar
// Extraído de server.js sin cambios de lógica.

const accounts = require('../services/accounts.service');
const friends = require('../services/friends.service');
const presence = require('../services/presence.service');

module.exports = function registerFriendsHandlers(io, socket) {
    socket.on('get_friends', (data, callback) => {
        if (typeof callback !== 'function') return;
        const list = friends.friendIds(data.id).map(fid => {
            const acc = accounts.get(fid);
            return {
                id: fid,
                name: acc ? acc.name : 'Jugador',
                online: !!presence.findSocketIdByPlayerId(fid)
            };
        });
        callback({ success: true, friends: list });
    });

    socket.on('get_friend_requests', (data, callback) => {
        if (typeof callback !== 'function') return;
        callback({ success: true, requests: friends.pendingRequests(data.id) });
    });

    socket.on('friend_request', (data, callback) => {
        const cb = typeof callback === 'function' ? callback : () => {};
        const toId = (data.toId || '').trim();

        if (!/^\d{8}$/.test(toId)) {
            cb({ success: false, message: 'ID inválido (deben ser 8 dígitos)' });
            return;
        }
        if (!accounts.exists(toId)) {
            cb({ success: false, message: 'No existe ningún jugador con ese ID' });
            return;
        }

        const result = friends.sendRequest(data.fromId, data.fromName, toId);
        cb(result);

        const targetSocket = presence.findSocketIdByPlayerId(toId);
        if (targetSocket) {
            if (result.friendId) {
                // Solicitud cruzada: se aceptó automáticamente
                io.to(targetSocket).emit('friend_added', { id: data.fromId, name: data.fromName });
            } else if (result.success) {
                io.to(targetSocket).emit('friend_request_received', { fromId: data.fromId, fromName: data.fromName });
            }
        }
    });

    socket.on('friend_request_accept', (data, callback) => {
        const cb = typeof callback === 'function' ? callback : () => {};
        const result = friends.acceptRequest(data.myId, data.fromId);
        cb(result);

        if (result.success) {
            const myAccount = accounts.get(data.myId);
            const fromSocket = presence.findSocketIdByPlayerId(data.fromId);
            if (fromSocket) {
                io.to(fromSocket).emit('friend_added', { id: data.myId, name: myAccount ? myAccount.name : 'Jugador' });
            }
        }
    });

    socket.on('friend_request_reject', (data, callback) => {
        const cb = typeof callback === 'function' ? callback : () => {};
        cb(friends.rejectRequest(data.myId, data.fromId));
    });

    socket.on('remove_friend', (data, callback) => {
        const cb = typeof callback === 'function' ? callback : () => {};
        cb(friends.removeFriend(data.myId, data.friendId));
        const otherSocket = presence.findSocketIdByPlayerId(data.friendId);
        if (otherSocket) io.to(otherSocket).emit('friend_removed', { id: data.myId });
    });
};
