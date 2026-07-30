
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
        version: 'BETA 1.0'
    },
    
    init() {
        this.loadData();
        this.initSocket();
        this.lockExperience();
        this.showScreen('home');
    },

    // ===== EXPERIENCIA SIN INTERRUPCIONES =====
    // Evita que la barra de navegación/direcciones del navegador y otros
    // gestos del sistema (zoom, menú contextual, rebote de scroll) interfieran
    // con el juego. No todos los navegadores permiten ocultar del todo la
    // barra de sistema: esto la oculta cuando es posible y minimiza el resto.
    lockExperience() {
        // Evitar zoom por pellizco (pinch) con dos dedos
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });

        // Evitar zoom por doble toque
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) e.preventDefault();
            lastTouchEnd = now;
        }, { passive: false });

        // Evitar menú contextual al mantener pulsado (copiar/guardar imagen, etc.)
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        // Intentar ocultar la barra de direcciones en navegadores móviles
        // que lo soportan (Chrome/Android sobre todo)
        const hideAddressBar = () => window.scrollTo(0, 1);
        window.addEventListener('load', () => setTimeout(hideAddressBar, 50));
        window.addEventListener('orientationchange', () => setTimeout(hideAddressBar, 100));
        window.addEventListener('resize', () => setTimeout(hideAddressBar, 50));

        // Pedir pantalla completa en el primer toque/click (requiere gesto
        // del usuario; los navegadores no permiten hacerlo automáticamente)
        const tryFullscreen = () => {
            const el = document.documentElement;
            const req = el.requestFullscreen || el.webkitRequestFullscreen ||
                        el.mozRequestFullScreen || el.msRequestFullscreen;
            if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
                try {
                    const p = req.call(el);
                    if (p && p.catch) p.catch(() => {});
                } catch (e) { /* no soportado en este navegador */ }
            }
        };
        document.addEventListener('touchend', tryFullscreen, { once: true });
        document.addEventListener('click', tryFullscreen, { once: true });
    },
    
    loadData() {
        // Cargar perfil
        const savedProfile = localStorage.getItem('riverojsx_profile');
        if (savedProfile) {
            this.player = JSON.parse(savedProfile);
        } else {
            this.player.name = this.generateRandomName();
            this.player.id = this.generateId();
            this.saveProfile();
        }
        
        // Cargar config
        const savedConfig = localStorage.getItem('riverojsx_config');
        if (savedConfig) {
            this.config = { ...this.config, ...JSON.parse(savedConfig) };
        }
        
        // Cargar amigos
        const savedFriends = localStorage.getItem('riverojsx_friends');
        if (savedFriends) {
            this.player.friends = JSON.parse(savedFriends);
        }
    },
    
    saveProfile() {
        localStorage.setItem('riverojsx_profile', JSON.stringify(this.player));
    },
    
    saveConfig() {
        localStorage.setItem('riverojsx_config', JSON.stringify(this.config));
    },
    
    saveFriends() {
        localStorage.setItem('riverojsx_friends', JSON.stringify(this.player.friends));
    },
    
    generateRandomName() {
        const prefixes = ['River', 'Jsx', 'Pixel', 'Cube', 'Block', 'Voxel', 'Mesh', 'Poly'];
        const suffixes = ['X', 'Pro', '99', 'Dev', 'One', 'Zero', 'Max', 'Mini'];
        const num = Math.floor(Math.random() * 999);
        return prefixes[Math.floor(Math.random() * prefixes.length)] + 
               suffixes[Math.floor(Math.random() * suffixes.length)] + num;
    },
    
    generateId() {
        return 'usr_' + Math.random().toString(36).substr(2, 9);
    },
    
    generateRoomCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },
    
    initSocket() {
        try {
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000
            });
            
            this.socket.on('connect', () => {
                console.log('Conectado al servidor');
                this.socket.emit('player_online', { 
                    id: this.player.id, 
                    name: this.player.name 
                });
            });
            
            this.socket.on('disconnect', () => {
                console.log('Desconectado del servidor');
            });
            
            this.socket.on('friend_status', (data) => {
                this.updateFriendStatus(data);
            });
            
        } catch (e) {
            console.warn('No se pudo conectar al servidor:', e);
        }
    },
    
    updateFriendStatus(data) {
        const friend = this.player.friends.find(f => f.id === data.id);
        if (friend) {
            friend.online = data.online;
            this.saveFriends();
            // Refrescar pantalla si está en perfil
            if (this.currentScreen === 'profile') {
                Menu.showProfile();
            }
        }
    },
    
    showScreen(screenName, data = null) {
        const app = document.getElementById('app');
        
        if (this.currentScreen && this.currentScreen !== 'game' && this.currentScreen !== 'dev') {
            this.screenHistory.push(this.currentScreen);
        }
        
        this.currentScreen = screenName;
        
        switch(screenName) {
            case 'home': Menu.showHome(); break;
            case 'play': Menu.showPlay(); break;
            case 'play_solo': Menu.showPlaySolo(); break;
            case 'play_multi': Menu.showPlayMulti(); break;
            case 'create_room': Multiplayer.showCreateRoom(); break;
            case 'join_room': Multiplayer.showJoinRoom(); break;
            case 'lobby': Multiplayer.showLobby(data); break;
            case 'news': Menu.showNews(); break;
            case 'maps': Menu.showMaps(); break;
            case 'config': Menu.showConfig(); break;
            case 'profile': Menu.showProfile(); break;
            case 'add_friend': Menu.showAddFriend(); break;
            case 'dev_mode': Developer.enterDevMode(); break;
            case 'game': Game.start(data); break;
        }
    },
    
    goBack() {
        if (this.screenHistory.length > 0) {
            const prev = this.screenHistory.pop();
            this.currentScreen = null; // Reset para que no se guarde de nuevo
            this.showScreen(prev);
        } else {
            this.showScreen('home');
        }
    },
    
    toast(msg) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2500);
    },
    
    // Mapas guardados
    getSavedMaps() {
        const maps = localStorage.getItem('riverojsx_maps');
        return maps ? JSON.parse(maps) : [];
    },
    
    saveMap(name, blocks) {
        const maps = this.getSavedMaps();
        const existing = maps.findIndex(m => m.name === name);
        const mapData = {
            name: name,
            blocks: blocks,
            created: new Date().toISOString(),
            author: this.player.name,
            authorId: this.player.id
        };
        
        if (existing >= 0) {
            maps[existing] = mapData;
        } else {
            maps.push(mapData);
        }
        
        localStorage.setItem('riverojsx_maps', JSON.stringify(maps));
        
        // Enviar al servidor para compartir
        if (this.socket && this.socket.connected) {
            this.socket.emit('share_map', mapData);
        }
        
        return mapData;
    },
    
    getMap(name) {
        const maps = this.getSavedMaps();
        return maps.find(m => m.name === name);
    },
    
    getDefaultMap() {
        return {
            name: 'Mundo Plano',
            blocks: [],
            isDefault: true
        };
    },

    // ===== MODO INMERSIVO =====
    // Al entrar al juego: pantalla completa, sin ventanas emergentes ni
    // anuncios superpuestos, ocupando la totalidad del espacio disponible.
    immersive: {
        active: false,
        originalOpen: null
    },

    enterImmersive() {
        if (this.immersive.active) return;
        this.immersive.active = true;
        document.body.classList.add('immersive');

        // Bloquear ventanas emergentes / anuncios mientras se juega
        this.immersive.originalOpen = window.open;
        window.open = function () { return null; };

        // Pantalla completa (requiere gesto de usuario, ya lo tenemos)
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (req) {
            try {
                const p = req.call(el);
                if (p && p.catch) p.catch(() => {});
            } catch (e) { /* no soportado, seguimos igual */ }
        }

        // Preferir horizontal si el navegador lo permite
        if (screen.orientation && screen.orientation.lock) {
            try {
                const lockP = screen.orientation.lock('landscape');
                if (lockP && lockP.catch) lockP.catch(() => {});
            } catch (e) { /* no soportado en este navegador */ }
        }
    },

    exitImmersive() {
        if (!this.immersive.active) return;
        this.immersive.active = false;
        document.body.classList.remove('immersive');

        if (this.immersive.originalOpen) {
            window.open = this.immersive.originalOpen;
            this.immersive.originalOpen = null;
        }

        if (document.fullscreenElement || document.webkitFullscreenElement) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exit) {
                try {
                    const p = exit.call(document);
                    if (p && p.catch) p.catch(() => {});
                } catch (e) { /* ignorar */ }
            }
        }

        if (screen.orientation && screen.orientation.unlock) {
            try { screen.orientation.unlock(); } catch (e) { /* ignorar */ }
        }
    },

    // ===== TEXTURAS COMPARTIDAS (piso y cielo) =====
    // Generadas por canvas para no depender de assets externos.
    // Se usan tanto en el juego (solo/online) como en el modo desarrollador
    // para mantener una estética coherente, sin añadir luces extra.
    createSkyTexture(topColor, bottomColor) {
        topColor = topColor || '#3f8fd6';
        bottomColor = bottomColor || '#cdeafb';
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, topColor);
        grad.addColorStop(0.7, bottomColor);
        grad.addColorStop(1, '#eaf7ff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 4, 256);
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    },

    createGroundTexture(baseColor, shadeA, shadeB) {
        baseColor = baseColor || '#5fa04a';
        shadeA = shadeA || '#4f8f3d';
        shadeB = shadeB || '#6fb85a';
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, size, size);

        // Salpicado sutil tipo "pixel art" para un acabado más bonito
        // (sin geometría extra ni luces adicionales)
        let seed = 42;
        const rand = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        for (let i = 0; i < 700; i++) {
            ctx.fillStyle = rand() > 0.5 ? shadeA : shadeB;
            const x = Math.floor(rand() * size);
            const y = Math.floor(rand() * size);
            const s = 1 + Math.floor(rand() * 2);
            ctx.fillRect(x, y, s, s);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(40, 40);
        tex.magFilter = THREE.NearestFilter;
        tex.needsUpdate = true;
        return tex;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
