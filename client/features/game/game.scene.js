// riverojsx-engine - Modo Juego: escena 3D, piso, luces, carga de mapa
// Extraído de game.js. Antes usaba App.createSkyTexture/createGroundTexture
// y una tabla de bloques propia; ahora usa Engine3D (engine3d/textures.js)
// y BlockRegistry (engine3d/world/block-registry.js), compartidos con
// Developer, con los mismos valores exactos que antes.

Object.assign(Game, {
    initThreeJS() {
        const container = document.getElementById('game-canvas-container');
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scene = new THREE.Scene();

        // Cielo con degradado (más bonito, sin luces adicionales)
        this.scene.background = Engine3D.createSkyTexture('#3f8fd6', '#cdeafb');
        this.scene.fog = new THREE.Fog(0xbfe3f7, 35, 130);

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 1.6, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Luces: se mantiene el mismo número que antes (una de ambiente +
        // una direccional), solo se sustituye la de ambiente por una
        // hemisférica para un degradado de color más agradable sin
        // "exagerar" con iluminación extra.
        const hemi = new THREE.HemisphereLight(0xaee2ff, 0x4f8f3d, 0.65);
        this.scene.add(hemi);

        const dir = new THREE.DirectionalLight(0xfff3df, 0.75);
        dir.position.set(50, 100, 50);
        dir.castShadow = true;
        this.scene.add(dir);

        // Piso con textura tipo césped (en vez de gris plano)
        const groundTex = Engine3D.createGroundTexture();
        const planeGeo = new THREE.PlaneGeometry(240, 240);
        const planeMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);

        // Jugador local (cubo azul)
        const playerGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const playerMat = new THREE.MeshStandardMaterial({ color: 0x4488ff });
        this.localPlayerMesh = new THREE.Mesh(playerGeo, playerMat);
        this.localPlayerMesh.position.set(0, 0.9, 0);
        this.localPlayerMesh.castShadow = true;
        this.scene.add(this.localPlayerMesh);

        window.addEventListener('resize', () => this.onResize());
    },

    loadMap(mapName) {
        if (mapName === 'default') {
            // Mundo plano vacío - nada extra
            return;
        }

        const mapData = Maps.getMap(mapName);
        if (mapData && mapData.blocks) {
            mapData.blocks.forEach(b => {
                this.createBlock(b.x, b.y, b.z, b.type);
            });
        }
    },

    createBlock(x, y, z, type) {
        const cfg = BlockRegistry.getConfig(type);
        const geo = new THREE.BoxGeometry(...cfg.size);
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color,
            transparent: cfg.transparent || false,
            opacity: cfg.opacity || 1
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
    }
});
