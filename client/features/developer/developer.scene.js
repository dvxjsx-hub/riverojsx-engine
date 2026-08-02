// riverojsx-engine - Modo Desarrollador: escena 3D (cielo, luces, piso, luna)
// Extraído de developer.js. Antes usaba App.createSkyTexture/createGroundTexture;
// ahora usa Engine3D (engine3d/textures.js), compartido con Game.
//
// Nota: se elimina createClouds() — existía en el original pero no la
// llamaba nadie (solo se usa createMoon()); es código muerto sin efecto
// en el comportamiento.

Object.assign(Developer, {
    initThreeJS() {
        const container = document.getElementById('game-canvas-container');
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Escena
        this.scene = new THREE.Scene();
        this.scene.background = Engine3D.createSkyTexture('#000000', '#000000', '#000000');
        this.scene.fog = new THREE.Fog(0x000000, 35, 130);

        // Cámara
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 3, 5);
        this.camera.rotation.order = 'YXZ';

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Luces: misma cantidad que antes (ambiente + direccional), con
        // tono frío nocturno acorde al nuevo cielo negro
        const hemi = new THREE.HemisphereLight(0x7f8fa6, 0x2a2a2a, 0.55);
        this.scene.add(hemi);

        const dirLight = new THREE.DirectionalLight(0xcdd8ff, 0.7);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);

        // Cuadrícula gris tipo motor gráfico: cada línea representa 1 metro
        const gridHelper = new THREE.GridHelper(100, 100, 0x777777, 0x444444);
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.5;
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        // Piso gris limpio (sin césped)
        const groundTex = Engine3D.createGroundTexture('#3a3a3a', '#333333', '#434343');
        const planeGeo = new THREE.PlaneGeometry(240, 240);
        const planeMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);
        this.groundMesh = plane;

        // Luna decorativa (en vez de nubes)
        this.createMoon();

        // Personaje simple (cubo rojo)
        this.createPlayerMesh();

        window.addEventListener('resize', () => this.onResize());
    },

    createMoon() {
        const geo = new THREE.SphereGeometry(4, 24, 24);
        const mat = new THREE.MeshBasicMaterial({ color: 0xf2f2e6 });
        const moon = new THREE.Mesh(geo, mat);
        moon.position.set(-40, 45, -70);
        this.scene.add(moon);

        // Halo suave alrededor de la luna
        const glowGeo = new THREE.SphereGeometry(6, 24, 24);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xf2f2e6, transparent: true, opacity: 0.15 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(moon.position);
        this.scene.add(glow);
    },

    createPlayerMesh() {
        const geo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
        this.playerMesh = new THREE.Mesh(geo, mat);
        this.playerMesh.position.set(0, 0.9, 0);
        this.playerMesh.castShadow = true;
        this.scene.add(this.playerMesh);
    },

    onResize() {
        if (!this.camera || !this.renderer) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
});
