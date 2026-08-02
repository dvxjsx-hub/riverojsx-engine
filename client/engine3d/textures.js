// riverojsx-engine - Texturas compartidas (piso y cielo), vía canvas
// Extraído de app.js (App.createSkyTexture / App.createGroundTexture).
// Se usan tanto en Game (solo/online) como en Developer para mantener una
// estética coherente, sin depender de assets externos ni añadir luces extra.
// Antes vivían en App; ahora tienen su propio namespace de motor 3D,
// separado de la lógica de aplicación (perfil, pantallas, red, etc).

const Engine3D = {
    createSkyTexture(topColor, bottomColor, horizonColor) {
        topColor = topColor || '#3f8fd6';
        bottomColor = bottomColor || '#cdeafb';
        horizonColor = horizonColor || '#eaf7ff';
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, topColor);
        grad.addColorStop(0.7, bottomColor);
        grad.addColorStop(1, horizonColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 4, 256);
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    },

    createGroundTexture(baseColor, shadeA, shadeB) {
        baseColor = baseColor || '#5fa04a';
        shadeA = shadeA || '#4f8f3d';
        shadeB = shadeB || '#6fb85a';
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, size, size);

        // Salpicado sutil tipo "pixel art" para un acabado más bonito
        // (sin geometría extra ni luces adicionales)
        let seed = 42;
        const rand = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        for (let i = 0; i < 700; i++) {
            ctx.fillStyle = rand() > 0.5 ? shadeA : shadeB;
            const x = Math.floor(rand() * size);
            const y = Math.floor(rand() * size);
            const s = 1 + Math.floor(rand() * 2);
            ctx.fillRect(x, y, s, s);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(40, 40);
        tex.magFilter = THREE.NearestFilter;
        tex.needsUpdate = true;
        return tex;
    }
};
