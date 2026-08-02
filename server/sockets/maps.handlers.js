// riverojsx-engine (server) - Compartir mapas (modo desarrollador)
// Extraído de server.js. Ver services/maps.service.js para la nota sobre
// el alcance actual (todavía sin sincronización definitiva).

const mapsService = require('../services/maps.service');

module.exports = function registerMapsHandlers(io, socket) {
    socket.on('share_map', (data) => {
        mapsService.upsertSharedMap(data);
        console.log('Mapa compartido:', data.name);
    });
};
