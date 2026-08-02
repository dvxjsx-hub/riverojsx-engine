// riverojsx-engine (server) - Salas: crear, unirse, listo, mapa, iniciar, salir
// Extraído de server.js sin cambios de lógica.

const presence = require('../services/presence.service');
const roomsService = require('../services/rooms.service');
const { rooms, createUniqueRoomCode, handleLeaveRoom } = roomsService;

module.exports = function registerRoomsHandlers(io, socket) {
    // ===== CREAR SALA =====
    socket.on('create_room', (data, callback) => {
        const code = createUniqueRoomCode();

        rooms[code] = {
            code: code,
            hostId: data.hostId,
            hostSocket: socket.id,
            players: [{
                id: data.hostId,
                name: data.hostName,
                socketId: socket.id,
                ready: false,
                isHost: true
            }],
            map: 'default',
            gameActive: false,
            createdAt: Date.now()
        };

        socket.join(code);
        if (presence.onlinePlayers[socket.id]) {
            presence.onlinePlayers[socket.id].room = code;
        }

        console.log('Sala creada:', code);
        callback({ success: true, code: code });
    });

    // ===== UNIRSE A SALA =====
    socket.on('join_room', (data, callback) => {
        const room = rooms[data.code];

        if (!room) {
            callback({ success: false, message: 'Sala no encontrada' });
            return;
        }

        if (room.gameActive) {
            callback({ success: false, message: 'Partida en curso' });
            return;
        }

        if (room.players.length >= 4) {
            callback({ success: false, message: 'Sala llena (max 4)' });
            return;
        }

        // Verificar si ya está en la sala
        if (room.players.find(p => p.id === data.playerId)) {
            callback({ success: false, message: 'Ya estás en esta sala' });
            return;
        }

        const newPlayer = {
            id: data.playerId,
            name: data.playerName,
            socketId: socket.id,
            ready: false,
            isHost: false
        };

        room.players.push(newPlayer);
        socket.join(data.code);

        if (presence.onlinePlayers[socket.id]) {
            presence.onlinePlayers[socket.id].room = data.code;
        }

        // Notificar a todos en la sala
        io.to(data.code).emit('player_joined', {
            id: data.playerId,
            name: data.playerName
        });

        callback({
            success: true,
            players: room.players.map(p => ({ id: p.id, name: p.name, ready: p.ready, isHost: p.isHost }))
        });

        console.log('Jugador', data.playerName, 'se unió a sala', data.code);
    });

    // ===== LISTO / NO LISTO =====
    socket.on('toggle_ready', (data) => {
        const room = rooms[data.room];
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
            player.ready = data.ready;
            io.to(data.room).emit('player_ready', {
                id: player.id,
                ready: data.ready
            });
        }
    });

    // ===== SELECCIONAR MAPA =====
    socket.on('select_map', (data) => {
        const room = rooms[data.room];
        if (!room) return;

        // Solo el host puede cambiar el mapa
        const host = room.players.find(p => p.isHost);
        if (host && host.socketId === socket.id) {
            room.map = data.map;
            io.to(data.room).emit('map_selected', { map: data.map });
        }
    });

    // ===== INICIAR PARTIDA =====
    socket.on('start_game', (data) => {
        const room = rooms[data.room];
        if (!room) return;

        const host = room.players.find(p => p.isHost);
        if (!host || host.socketId !== socket.id) return;

        // Verificar mínimo 2 jugadores y todos listos
        const readyCount = room.players.filter(p => p.ready || p.isHost).length;
        if (room.players.length < 2 || readyCount !== room.players.length) {
            socket.emit('error_msg', { message: 'Todos deben estar listos (min 2 jugadores)' });
            return;
        }

        room.gameActive = true;
        io.to(data.room).emit('game_started', {
            map: room.map,
            players: room.players.map(p => ({ id: p.id, name: p.name }))
        });

        console.log('Partida iniciada en sala', data.room);
    });

    // ===== SALIR DE SALA =====
    socket.on('leave_room', (data) => {
        handleLeaveRoom(io, socket, data.room, data.playerId);
    });
};
