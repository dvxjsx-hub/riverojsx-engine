// riverojsx-engine - Panel "Invitar amigos" (dentro del juego/modo dev)
// Extraído de friends.js sin cambios de lógica.

Object.assign(Friends, {
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
    }
});
