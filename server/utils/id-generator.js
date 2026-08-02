// riverojsx-engine (server) - Generadores de identificadores
// generateRoomCode: código numérico de 4 dígitos para salas.
// generateId: identificador interno de respaldo para un jugador que se
// conecta sin un ID de perfil todavía (el cliente normalmente ya manda uno).

function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateId() {
    return 'srv_' + Math.random().toString(36).substr(2, 9);
}

module.exports = { generateRoomCode, generateId };
