
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const accounts = require('./accounts');
const friends = require('./friends');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../')));

// ===== ESTADO DEL SERVIDOR =====
const rooms = {};       // { code: { host, players, map, gameActive } }
const onlinePlayers = {}; // { socketId: { id, name, room } }
const sharedMaps = [];  // Mapas compartidos por desarrolladores

// ===== UTILIDADES =====
function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateId() {
    return 'srv_' + Math.random().toString(36).substr(2, 9);
}

// Busca el socket actualmente conectado de un jugador a partir de su ID
// de 8 dígitos (necesario porque onlinePlayers está indexado por socket.id)
function findSocketIdByPlayerId(id) {
    for (const [socketId, p] of Object.entries(onlinePlayers)) {
        if (p.id === id) return socketId;
    }
    return null;
}

// ===== SOCKET.IO =====
io.on('connection', (socket) => {
    console.log('Jugador conectado:', socket.id);
    
    // ===== REGISTRO ONLINE =====
    socket.on('player_online', (data) => {
        onlinePlayers[socket.id] = {
            id: data.id || generateId(),
            name: data.name || 'Jugador',
            socketId: socket.id,
            room: null
        };

        // Registrar/actualizar la cuenta persistente (necesario para poder
        // validar el ID al recibir una solicitud de amistad)
        accounts.register(onlinePlayers[socket.id].id, onlinePlayers[socket.id].name);
        
        // Notificar a amigos que estamos online
        socket.broadcast.emit('friend_status', {
            id: data.id,
            online: true,
            name: data.name
        });
    });
    
    socket.on('update_name', (data) => {
        if (onlinePlayers[socket.id]) {
            onlinePlayers[socket.id].name = data.name;
        }
    });
    
    // ===== CREAR SALA =====
    socket.on('create_room', (data, callback) => {
        let code = generateRoomCode();
        while (rooms[code]) {
            code = generateRoomCode();
        }
        
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
        if (onlinePlayers[socket.id]) {
            onlinePlayers[socket.id].room = code;
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
        
        if (onlinePlayers[socket.id]) {
            onlinePlayers[socket.id].room = data.code;
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
    
    // ===== SALIR DE SALA =====
    socket.on('leave_room', (data) => {
        handleLeaveRoom(socket, data.room, data.playerId);
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
    
    // ===== COMPARTIR MAPA =====
    socket.on('share_map', (data) => {
        // Guardar o actualizar mapa compartido
        const existing = sharedMaps.findIndex(m => m.name === data.name && m.authorId === data.authorId);
        if (existing >= 0) {
            sharedMaps[existing] = data;
        } else {
            sharedMaps.push(data);
        }
        console.log('Mapa compartido:', data.name);
    });
    
    // ===== AMIGOS =====
    socket.on('get_friends', (data, callback) => {
        if (typeof callback !== 'function') return;
        const list = friends.friendIds(data.id).map(fid => {
            const acc = accounts.get(fid);
            return {
                id: fid,
                name: acc ? acc.name : 'Jugador',
                online: !!findSocketIdByPlayerId(fid)
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

        const targetSocket = findSocketIdByPlayerId(toId);
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
            const fromSocket = findSocketIdByPlayerId(data.fromId);
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
        const otherSocket = findSocketIdByPlayerId(data.friendId);
        if (otherSocket) io.to(otherSocket).emit('friend_removed', { id: data.myId });
    });

    // ===== INVITACIONES DENTRO DEL MUNDO =====
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

        const targetSocket = findSocketIdByPlayerId(toId);
        if (!targetSocket) {
            cb({ success: false, message: 'Tu amigo no está en línea' });
            return;
        }

        let room = data.room;
        if (!room || !rooms[room]) {
            room = generateRoomCode();
            while (rooms[room]) room = generateRoomCode();

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
            if (onlinePlayers[socket.id]) onlinePlayers[socket.id].room = room;
        }

        io.to(targetSocket).emit('invite_received', {
            fromId, fromName, room, kind: kind || 'game', map: rooms[room].map
        });

        cb({ success: true, room });
    });

    socket.on('respond_invite', (data, callback) => {
        const cb = typeof callback === 'function' ? callback : () => {};
        const { room, accepted, toId, toName, fromId, kind } = data;
        const inviterSocket = findSocketIdByPlayerId(fromId);

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
        if (onlinePlayers[socket.id]) onlinePlayers[socket.id].room = room;

        if (inviterSocket) io.to(inviterSocket).emit('invite_accepted', { toId, toName, room });

        cb({ success: true, room, kind: roomData.kind || kind, map: roomData.map });
    });

    // ===== MODO DESARROLLADOR COMPARTIDO =====
    // Los bloques no se guardan en el servidor: viajan como un simple relay
    // entre los jugadores de la misma sala (el anfitrión envía una foto del
    // estado actual a quien se une, y luego cada edición se retransmite).
    socket.on('dev_block_place', (data) => {
        socket.to(data.room).emit('dev_block_placed', { x: data.x, y: data.y, z: data.z, type: data.type });
    });

    socket.on('dev_block_remove', (data) => {
        socket.to(data.room).emit('dev_block_removed', { x: data.x, y: data.y, z: data.z });
    });

    socket.on('dev_sync_state', (data) => {
        const targetSocket = findSocketIdByPlayerId(data.toId);
        if (targetSocket) {
            io.to(targetSocket).emit('dev_state_sync', { blocks: data.blocks });
        }
    });
    
    // ===== DESCONECTAR =====
    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        
        const player = onlinePlayers[socket.id];
        if (player) {
            // Notificar amigos offline
            socket.broadcast.emit('friend_status', {
                id: player.id,
                online: false
            });
            
            // Si estaba en una sala, salir
            if (player.room && rooms[player.room]) {
                handleLeaveRoom(socket, player.room, player.id);
            }
            
            delete onlinePlayers[socket.id];
        }
    });
});

function handleLeaveRoom(socket, roomCode, playerId) {
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

// ===== LIMPIEZA PERIÓDICA =====
setInterval(() => {
    const now = Date.now();
    Object.keys(rooms).forEach(code => {
        const room = rooms[code];
        // Eliminar salas inactivas después de 30 minutos
        if (!room.gameActive && now - room.createdAt > 30 * 60 * 1000) {
            io.to(code).emit('room_closed');
            delete rooms[code];
            console.log('Sala eliminada por inactividad:', code);
        }
    });
}, 5 * 60 * 1000); // Cada 5 minutos

// ===== INICIAR SERVIDOR =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('riverojsx-engine server running on port', PORT);
});
