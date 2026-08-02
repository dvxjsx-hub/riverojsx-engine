// riverojsx-engine (server) - Punto de arranque
// Antes este archivo concentraba también todo Socket.IO, las salas y los
// amigos (500+ líneas). Ahora solo monta Express/HTTP/Socket.IO y delega
// el resto a server/sockets e server/services.

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const { PORT, CORS_OPTIONS } = require('./config/env');
const { attachSocketHandlers } = require('./sockets');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: CORS_OPTIONS });

// Servir archivos estáticos del frontend (ahora en /client)
app.use(express.static(path.join(__dirname, '../client')));

attachSocketHandlers(io);

server.listen(PORT, () => {
    console.log('riverojsx-engine server running on port', PORT);
});
