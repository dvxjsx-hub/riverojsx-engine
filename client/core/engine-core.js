// riverojsx-engine - Núcleo del motor (bootstrap + estado base)
// Antes era la primera parte de app.js. El resto de responsabilidades que
// tenía App (persistencia, socket, router, modo inmersivo) ahora viven en
// sus propios archivos dentro de core/ y se añaden a este mismo objeto
// mediante Object.assign, así que App.xxx sigue funcionando exactamente
// igual que antes en toda la interfaz (los onclick="App.metodo()" no cambian).

const App = {
    currentScreen: null,
    screenHistory: [],
    socket: null,
    serverUrl: window.location.hostname.includes('localhost')
        ? 'http://localhost:3000'
        : 'https://riverosjsxhorror.onrender.com',

    // Datos del jugador
    player: {
        name: '',
        id: null,
        friends: [],
        online: true
    },

    // Configuración
    config: {
        sensitivity: 0.5,
        language: 'es',
        showFPS: false,
        version: 'BETA 1.1'
    },

    init() {
        this.loadData();
        this.initSocket();
        this.lockExperience();
        this.showScreen('home');
    },

    toast(msg) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 2500);
    }
};

// Inicializar cuando el DOM esté listo. Se registra aquí, pero se ejecuta
// después de que TODOS los scripts (core/features) hayan cargado, así que
// para ese momento App ya tiene todos sus métodos añadidos.
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
