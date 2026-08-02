// riverojsx-engine - Pantalla de Novedades
// Extraído de menu.js. Contenido estático por ahora (hardcodeado), tal cual
// estaba en el original; a futuro puede pasar a venir de un servicio/API.

Object.assign(Menu, {
    showNews() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="screen" id="screen-news">
                <div class="header">
                    <button class="back-btn" onclick="App.goBack()">← VOLVER</button>
                    <span class="screen-title">NOVEDADES</span>
                    <div class="header-right"></div>
                </div>
                <div class="content">
                    <div class="news-card">
                        <div class="news-header">
                            <div class="news-avatar">👥</div>
                            <div>
                                <div class="news-author">riverojsx-engine</div>
                                <div class="news-date">30/07/2026</div>
                            </div>
                        </div>
                        <div class="news-text">
                            Se trabaja en mejorar el sistema de amigos.
                        </div>
                        <div class="news-tag">#AMIGOS</div>
                    </div>
                    
                    <div class="news-card">
                        <div class="news-header">
                            <div class="news-avatar">🚀</div>
                            <div>
                                <div class="news-author">riverojsx-engine</div>
                                <div class="news-date">19/07/2026</div>
                            </div>
                        </div>
                        <div class="news-text">
                            Nace el proyecto, riverojsx run for goals.
                        </div>
                        <div class="news-tag">#INICIO</div>
                    </div>
                </div>
            </div>
        `;
    }
});
