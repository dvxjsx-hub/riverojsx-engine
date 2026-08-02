// riverojsx-engine - Datos de amigos (lista, solicitudes) vía Socket.IO
// Extraído de friends.js. Define el objeto global Friends; los paneles de
// invitación (friends.panel.js) y la invitación entrante (friends.invites.js)
// se añaden a este mismo objeto.

const Friends = {
    list: [],
    pendingRequests: [],
    panelOpen: false,
    panelKind: null,
    currentInvite: null,

    // ===== DATOS (perfil) =====
    refresh() {
        if (!App.socket) return;

        App.socket.emit('get_friends', { id: App.player.id }, (res) => {
            if (res && res.success) {
                this.list = res.friends;
                App.player.friends = res.friends;
                App.saveFriends();
            }
            this._afterUpdate();
        });

        App.socket.emit('get_friend_requests', { id: App.player.id }, (res) => {
            if (res && res.success) {
                this.pendingRequests = res.requests;
            }
            this._afterUpdate();
        });
    },

    _afterUpdate() {
        if (App.currentScreen === 'profile' && typeof Menu !== 'undefined' && Menu.renderProfileLists) {
            Menu.renderProfileLists();
        }
        if (this.panelOpen) {
            this.renderInvitePanelList();
        }
    },

    acceptRequest(fromId) {
        App.socket.emit('friend_request_accept', { myId: App.player.id, fromId }, (res) => {
            if (res && res.success) {
                App.toast('Ahora son amigos');
                this.refresh();
            } else {
                App.toast((res && res.message) || 'No se pudo aceptar la solicitud');
            }
        });
    },

    rejectRequest(fromId) {
        App.socket.emit('friend_request_reject', { myId: App.player.id, fromId }, () => {
            this.refresh();
        });
    },

    removeFriend(friendId) {
        App.socket.emit('remove_friend', { myId: App.player.id, friendId }, (res) => {
            if (res && res.success) {
                App.toast('Amigo eliminado');
                this.refresh();
            }
        });
    }
};
