// riverojsx-engine - Bus de eventos interno (pub/sub)
// NUEVO: no existía en el proyecto original. Reduce el acoplamiento directo
// entre módulos (hoy App/Friends/Menu/Game/Developer se llaman entre sí
// como objetos globales conocidos). No sustituye ninguna llamada existente
// todavía -- se deja disponible para que las próximas features se
// comuniquen sin tener que conocerse entre sí directamente.

const EventBus = {
    _listeners: {},

    on(event, handler) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(handler);
        return handler;
    },

    off(event, handler) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(h => h !== handler);
    },

    emit(event, payload) {
        (this._listeners[event] || []).forEach(handler => {
            try {
                handler(payload);
            } catch (e) {
                console.error('EventBus handler error for "' + event + '":', e);
            }
        });
    }
};
