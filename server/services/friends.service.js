// riverojsx-engine - Sistema de amigos
// Persistencia simple en JSON: relaciones de amistad (mutuas) y
// solicitudes pendientes, indexadas por ID de 8 dígitos.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'friends.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function load() {
    ensureDataDir();
    if (!fs.existsSync(FILE)) return { friends: {}, requests: {} };
    try {
        const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
        return { friends: data.friends || {}, requests: data.requests || {} };
    } catch (e) {
        console.warn('No se pudo leer friends.json:', e.message);
        return { friends: {}, requests: {} };
    }
}

let state = load();
let saveTimer = null;

function persist() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveTimer = null;
        ensureDataDir();
        fs.writeFile(FILE, JSON.stringify(state, null, 2), (err) => {
            if (err) console.warn('No se pudo guardar friends.json:', err.message);
        });
    }, 2000);
}

function friendIds(id) {
    return state.friends[id] || [];
}

function areFriends(a, b) {
    return friendIds(a).includes(b);
}

function pendingRequests(id) {
    return state.requests[id] || [];
}

function hasPendingRequest(toId, fromId) {
    return pendingRequests(toId).some(r => r.from === fromId);
}

function sendRequest(fromId, fromName, toId) {
    if (fromId === toId) return { success: false, message: 'No puedes agregarte a ti mismo' };
    if (areFriends(fromId, toId)) return { success: false, message: 'Ya son amigos' };
    if (hasPendingRequest(toId, fromId)) return { success: false, message: 'Ya enviaste una solicitud' };

    // Si el otro ya te había enviado una solicitud, se aceptan mutuamente
    if (hasPendingRequest(fromId, toId)) {
        return acceptRequest(fromId, toId);
    }

    if (!state.requests[toId]) state.requests[toId] = [];
    state.requests[toId].push({ from: fromId, fromName: fromName || 'Jugador', sentAt: Date.now() });
    persist();
    return { success: true, message: 'Solicitud enviada' };
}

function acceptRequest(myId, fromId) {
    const list = pendingRequests(myId);
    const idx = list.findIndex(r => r.from === fromId);
    if (idx === -1) return { success: false, message: 'No hay solicitud pendiente' };

    const fromName = list[idx].fromName;
    list.splice(idx, 1);

    if (!state.friends[myId]) state.friends[myId] = [];
    if (!state.friends[fromId]) state.friends[fromId] = [];
    if (!state.friends[myId].includes(fromId)) state.friends[myId].push(fromId);
    if (!state.friends[fromId].includes(myId)) state.friends[fromId].push(myId);

    persist();
    return { success: true, friendId: fromId, friendName: fromName };
}

function rejectRequest(myId, fromId) {
    const list = pendingRequests(myId);
    const idx = list.findIndex(r => r.from === fromId);
    if (idx === -1) return { success: false, message: 'No hay solicitud pendiente' };
    list.splice(idx, 1);
    persist();
    return { success: true };
}

function removeFriend(a, b) {
    if (state.friends[a]) state.friends[a] = state.friends[a].filter(id => id !== b);
    if (state.friends[b]) state.friends[b] = state.friends[b].filter(id => id !== a);
    persist();
    return { success: true };
}

module.exports = {
    friendIds, areFriends, pendingRequests,
    sendRequest, acceptRequest, rejectRequest, removeFriend
};
