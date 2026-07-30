// riverojsx-engine - Sistema de amigos e invitaciones dentro del mundo
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
    },

    // ===== PANEL "INVITAR AMIGOS" (dentro del juego / modo desarrollador) =====
    openInvitePanel(kind) {
        this.panelKind = kind;
        this.panelOpen = true;

        let overlay = document.getElementById('friends-invite-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'friends-invite-overlay';
            overlay.className = 'creative-panel-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="creative-panel">
                <div class="creative-panel-header">
                    <span>Invitar amigos</span>
                    <button class="panel-close-btn" onclick="Friends.closeInvitePanel()">✕</button>
                </div>
                <div id="invite-friends-list"></div>
            </div>
        `;
        overlay.style.display = 'flex';

        this.renderInvitePanelList();
        this.refresh();
    },

    closeInvitePanel() {
        this.panelOpen = false;
        const overlay = document.getElementById('friends-invite-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    renderInvitePanelList() {
        const container = document.getElementById('invite-friends-list');
        if (!container) return;

        const online = this.list.filter(f => f.online);
        if (online.length === 0) {
            container.innerHTML = '<div class="empty-state">Ninguno de tus amigos está en línea ahora</div>';
            return;
        }

        container.innerHTML = online.map(f => `
            <div class="friend-item">
                <span class="friend-name">${f.name}</span>
                <button class="small-btn" onclick="Friends.sendInvite('${f.id}', '${f.name.replace(/'/g, "\\'")}')">INVITAR</button>
            </div>
        `).join('');
    },

    sendInvite(toId, toName) {
        const kind = this.panelKind;
        let room = null;
        let map = null;

        if (kind === 'game' && App.currentScreen === 'game') {
            room = Game.roomCode;
            map = Game.currentMap;
        } else if (kind === 'dev' && App.currentScreen === 'dev_mode') {
            room = Developer.roomCode;
        }

        App.socket.emit('send_invite', {
            fromId: App.player.id,
            fromName: App.player.name,
            toId, kind, map, room
        }, (res) => {
            if (res && res.success) {
                App.toast('Invitación enviada a ' + toName);
                if (kind === 'game' && Game.mode !== 'multiplayer') {
                    Game.becomeMultiplayerHost(res.room);
                } else if (kind === 'dev' && !Developer.roomCode) {
                    Developer.becomeSharedHost(res.room);
                }
                this.closeInvitePanel();
            } else {
                App.toast((res && res.message) || 'No se pudo invitar');
            }
        });
    },

    // ===== INVITACIÓN ENTRANTE (puede llegar desde cualquier pantalla) =====
    showIncomingInvite(data) {
        this.currentInvite = data;

        let overlay = document.getElementById('invite-incoming-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'invite-incoming-overlay';
            overlay.className = 'creative-panel-overlay';
            document.body.appendChild(overlay);
        }

        const kindLabel = data.kind === 'dev' ? 'a construir en Modo Desarrollador' : 'a jugar';

        overlay.innerHTML = `
            <div class="creative-panel">
                <div class="creative-panel-header">
                    <span>Invitación</span>
                </div>
                <div class="creative-option-row" style="border-bottom:none;">
                    <span>${data.fromName} te invitó ${kindLabel}</span>
                </div>
                <div class="lobby-actions" style="padding-top:6px;">
                    <button class="lobby-btn secondary" onclick="Friends.respondInvite(false)">RECHAZAR</button>
                    <button class="lobby-btn primary" onclick="Friends.respondInvite(true)">ACEPTAR</button>
                </div>
            </div>
        `;
        overlay.style.display = 'flex';
    },

    respondInvite(accepted) {
        const data = this.currentInvite;
        const overlay = document.getElementById('invite-incoming-overlay');
        if (overlay) overlay.style.display = 'none';
        if (!data) return;

        App.socket.emit('respond_invite', {
            room: data.room,
            accepted,
            toId: App.player.id,
            toName: App.player.name,
            fromId: data.fromId,
            kind: data.kind
        }, (res) => {
            if (accepted && res && res.success) {
                if (res.kind === 'dev') {
                    App.showScreen('dev_mode', { joinRoom: res.room });
                } else {
                    App.showScreen('game', { mode: 'multiplayer', room: res.room, map: res.map });
                }
            } else if (accepted) {
                App.toast((res && res.message) || 'No se pudo unir a la invitación');
            }
        });

        this.currentInvite = null;
    }
};
