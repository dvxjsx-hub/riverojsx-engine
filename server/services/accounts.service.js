// riverojsx-engine - Cuentas de jugador
// Guarda un registro simple de cada ID (8 dígitos) que se ha conectado
// alguna vez: su nombre y última conexión. Esto permite validar un ID al
// enviar una solicitud de amistad, incluso si esa persona no está
// conectada en este momento.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'accounts.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function load() {
    ensureDataDir();
    if (!fs.existsSync(FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch (e) {
        console.warn('No se pudo leer accounts.json:', e.message);
        return {};
    }
}

let accounts = load();
let saveTimer = null;

function persist() {
    // Debounce del guardado en disco para no escribir en cada evento
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveTimer = null;
        ensureDataDir();
        fs.writeFile(FILE, JSON.stringify(accounts, null, 2), (err) => {
            if (err) console.warn('No se pudo guardar accounts.json:', err.message);
        });
    }, 2000);
}

function register(id, name) {
    if (!id) return null;
    const now = Date.now();
    if (!accounts[id]) {
        accounts[id] = { id, name: name || 'Jugador', createdAt: now, lastSeen: now };
    } else {
        accounts[id].name = name || accounts[id].name;
        accounts[id].lastSeen = now;
    }
    persist();
    return accounts[id];
}

function get(id) {
    return accounts[id] || null;
}

function exists(id) {
    return !!accounts[id];
}

module.exports = { register, get, exists };
