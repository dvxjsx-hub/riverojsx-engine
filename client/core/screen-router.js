// riverojsx-engine - Router de pantallas + historial de navegación
// Extraído de app.js: showScreen()/goBack(). Mismo switch, mismos nombres
// de pantalla; solo depende de que las features (Menu, Multiplayer,
// Developer, Game) ya estén cargadas cuando se invoque.

Object.assign(App, {
    showScreen(screenName, data = null) {
        if (this.currentScreen && this.currentScreen !== 'game' && this.currentScreen !== 'dev') {
            this.screenHistory.push(this.currentScreen);
        }

        this.currentScreen = screenName;

        switch (screenName) {
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
            case 'dev_mode': Developer.enterDevMode(data); break;
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
    }
});
