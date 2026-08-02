// riverojsx-engine - Conexión Socket.IO y eventos globales de presencia/amigos
// Extraído de app.js: initSocket() y updateFriendStatus(). Misma lógica,
// mismos nombres de evento, mismo comportamiento.

Object.assign(App, {
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

                // Refrescar amigos/solicitudes reales apenas hay conexión,
                // para que la lista quede al día (y no solo al abrir Perfil)
                if (typeof Friends !== 'undefined') Friends.refresh();
            });

            this.socket.on('disconnect', () => {
                console.log('Desconectado del servidor');
            });

            this.socket.on('friend_status', (data) => {
                this.updateFriendStatus(data);
            });

            // ===== AMIGOS =====
            this.socket.on('friend_request_received', (data) => {
                this.toast(data.fromName + ' te envió una solicitud de amistad');
                if (typeof Friends !== 'undefined') Friends.refresh();
            });

            this.socket.on('friend_added', (data) => {
                this.toast(data.name + ' ahora es tu amigo');
                if (typeof Friends !== 'undefined') Friends.refresh();
            });

            this.socket.on('friend_removed', () => {
                if (typeof Friends !== 'undefined') Friends.refresh();
            });

            // ===== INVITACIONES DENTRO DEL MUNDO =====
            // Puede llegar estando en cualquier pantalla (menú, perfil, etc.)
            this.socket.on('invite_received', (data) => {
                if (typeof Friends !== 'undefined') Friends.showIncomingInvite(data);
            });

            this.socket.on('invite_declined', (data) => {
                this.toast(data.toName + ' rechazó tu invitación');
            });

            this.socket.on('invite_accepted', (data) => {
                this.toast(data.toName + ' se unió a la partida');
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
    }
});
