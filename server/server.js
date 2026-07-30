
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

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
    socket.on('add_friend', (data) => {
        // En producción: validar que el friendId existe
        // Por ahora solo confirmamos
        socket.emit('friend_added', { friendId: data.friendId });
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
