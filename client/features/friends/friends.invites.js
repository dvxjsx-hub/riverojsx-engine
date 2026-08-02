// riverojsx-engine - Invitación entrante (puede llegar desde cualquier pantalla)
// Extraído de friends.js sin cambios de lógica.

Object.assign(Friends, {
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
});
