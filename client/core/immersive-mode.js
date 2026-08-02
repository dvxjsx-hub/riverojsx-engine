// riverojsx-engine - Experiencia sin interrupciones + modo inmersivo
// Extraído de app.js: lockExperience() (gestos/zoom/barra del navegador,
// se ejecuta una vez al iniciar) y el modo inmersivo (pantalla completa
// durante una partida). Misma lógica exacta.

Object.assign(App, {
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

        // Pedir pantalla completa en cada toque/click mientras no esté ya
        // activa (requiere gesto del usuario; los navegadores no permiten
        // hacerlo automáticamente). Al recargar la página se pierde el
        // estado de pantalla completa, así que el primer toque tras la
        // recarga vuelve a activarla — sin límite de "una sola vez".
        const tryFullscreen = () => {
            const el = document.documentElement;
            const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
            if (isFullscreen) return;
            const req = el.requestFullscreen || el.webkitRequestFullscreen ||
                        el.mozRequestFullScreen || el.msRequestFullscreen;
            if (req) {
                try {
                    const p = req.call(el);
                    if (p && p.catch) p.catch(() => {});
                } catch (e) { /* no soportado en este navegador */ }
            }
        };
        document.addEventListener('touchend', tryFullscreen, { passive: true });
        document.addEventListener('click', tryFullscreen);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') tryFullscreen();
        });
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
    }
});
