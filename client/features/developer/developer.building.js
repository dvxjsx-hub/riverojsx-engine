// riverojsx-engine - Modo Desarrollador: colocar/quitar bloques (mecánica tipo Minecraft)
// Extraído de developer.js. Antes tenía su propia tabla de tipos de bloque
// (getBlockConfig); ahora usa BlockRegistry (engine3d/world/block-registry.js),
// compartida con Game, con exactamente los mismos valores.

Object.assign(Developer, {
    placeBlock(x, y, z, type, fromNetwork) {
        const config = BlockRegistry.getConfig(type);

        const existing = this.blocks.find(b =>
            Math.abs(b.x - x) < 0.1 && Math.abs(b.y - y) < 0.1 && Math.abs(b.z - z) < 0.1
        );
        if (existing) return;

        const geo = new THREE.BoxGeometry(...config.size);
        const mat = new THREE.MeshStandardMaterial({
            color: config.color,
            transparent: config.transparent || false,
            opacity: config.opacity || 1
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: type, isBlock: true };

        this.scene.add(mesh);
        this.blockMeshes.push(mesh);
        this.blocks.push({ x, y, z, type });

        // Si estamos en una sesión compartida y el bloque lo colocamos
        // nosotros (no llegó ya sincronizado), lo retransmitimos
        if (!fromNetwork && this.roomCode && App.socket) {
            App.socket.emit('dev_block_place', { room: this.roomCode, x, y, z, type });
        }
    },

    removeBlock(mesh, fromNetwork) {
        const idx = this.blockMeshes.indexOf(mesh);
        if (idx > -1) {
            const pos = mesh.position.clone();
            this.blockMeshes.splice(idx, 1);
            const bIdx = this.blocks.findIndex(b =>
                Math.abs(b.x - mesh.position.x) < 0.1 &&
                Math.abs(b.y - mesh.position.y) < 0.1 &&
                Math.abs(b.z - mesh.position.z) < 0.1
            );
            if (bIdx > -1) this.blocks.splice(bIdx, 1);
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();

            if (!fromNetwork && this.roomCode && App.socket) {
                App.socket.emit('dev_block_remove', { room: this.roomCode, x: pos.x, y: pos.y, z: pos.z });
            }
        }
    },

    // Busca el bloque en una posición (usado al recibir una eliminación
    // desde la red, donde solo tenemos las coordenadas, no el mesh)
    removeBlockAt(x, y, z, fromNetwork) {
        const mesh = this.blockMeshes.find(m =>
            Math.abs(m.position.x - x) < 0.1 &&
            Math.abs(m.position.y - y) < 0.1 &&
            Math.abs(m.position.z - z) < 0.1
        );
        if (mesh) this.removeBlock(mesh, fromNetwork);
    },

    clearBlocks() {
        this.blockMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.blockMeshes = [];
        this.blocks = [];
    },

    // Coloca/quita un bloque usando la mirilla central de la pantalla,
    // igual que la mecánica clásica de Minecraft, siempre alineado a una
    // cuadrícula de 1 metro (sin importar el grosor del bloque vecino).
    handleBuildTap() {
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

        const intersects = this.raycaster.intersectObjects(this.blockMeshes);

        if (this.selectedTool === 'erase') {
            if (intersects.length > 0) {
                this.removeBlock(intersects[0].object);
                App.toast('Bloque eliminado');
            }
            return;
        }

        const newConfig = BlockRegistry.getConfig(this.selectedTool);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const normal = hit.face.normal;
            const hitConfig = BlockRegistry.getConfig(hit.object.userData.type);

            // Separación según el eje golpeado, usando el grosor real de
            // cada bloque (piso/techo más delgados, puerta más alta, etc.)
            // para que queden pegados sin huecos ni encimados.
            const axis = Math.abs(normal.x) > 0.5 ? 0 : (Math.abs(normal.y) > 0.5 ? 1 : 2);
            const offset = hitConfig.size[axis] / 2 + newConfig.size[axis] / 2;

            const pos = hit.object.position.clone();
            pos.x += normal.x * offset;
            pos.y += normal.y * offset;
            pos.z += normal.z * offset;

            // La cuadrícula horizontal siempre queda en metros enteros
            pos.x = Math.round(pos.x);
            pos.z = Math.round(pos.z);

            this.placeBlock(pos.x, pos.y, pos.z, this.selectedTool);
        } else if (this.groundMesh) {
            const floorHit = this.raycaster.intersectObject(this.groundMesh);
            if (floorHit.length > 0) {
                const point = floorHit[0].point;
                this.placeBlock(
                    Math.round(point.x),
                    newConfig.size[1] / 2,
                    Math.round(point.z),
                    this.selectedTool
                );
            }
        }
    }
});
