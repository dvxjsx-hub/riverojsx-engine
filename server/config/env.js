// riverojsx-engine (server) - Configuración centralizada de entorno
// Antes disperso dentro de server.js (PORT) y dentro del CORS de Socket.IO.

const PORT = process.env.PORT || 3000;

const CORS_OPTIONS = {
    origin: '*',
    methods: ['GET', 'POST']
};

module.exports = { PORT, CORS_OPTIONS };
