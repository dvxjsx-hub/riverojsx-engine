// riverojsx-engine - Persistencia local del jugador (perfil, config, amigos)
// Extraído de app.js: loadData/saveProfile/saveConfig/saveFriends y los
// generadores de nombre/ID aleatorios usados la primera vez que se abre
// la app. Misma lógica exacta, ahora en su propio archivo.

Object.assign(App, {
    loadData() {
        // Cargar perfil
        const savedProfile = localStorage.getItem('riverojsx_profile');
        if (savedProfile) {
            this.player = JSON.parse(savedProfile);
            // Migrar IDs del formato antiguo (letras+números) al nuevo de 8 dígitos
            if (!/^\d{8}$/.test(this.player.id || '')) {
                this.player.id = this.generateId();
                this.saveProfile();
            }
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

        // Mostrar de inmediato la lista guardada (sin esperar al servidor)
        // para que no "desaparezca" un instante al recargar la página
        if (typeof Friends !== 'undefined') {
            Friends.list = this.player.friends || [];
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
        // ID de 8 dígitos numéricos (sin letras), usado para agregar amigos
        return String(Math.floor(10000000 + Math.random() * 90000000));
    },

    generateRoomCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }
});
