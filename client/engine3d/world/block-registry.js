// riverojsx-engine - Catálogo de tipos de bloque
// Antes esta misma tabla estaba duplicada de forma idéntica en dos sitios:
// game.js (dentro de createBlock) y developer.js (dentro de getBlockConfig).
// Se unifica aquí como fuente única; ambos módulos ahora la consultan.

const BlockRegistry = {
    configs: {
        wall: { color: 0x8B7355, size: [1, 1, 1], transparent: false },
        floor: { color: 0x5C4033, size: [1, 0.1, 1], transparent: false },
        ceiling: { color: 0x696969, size: [1, 0.1, 1], transparent: false },
        window: { color: 0x87CEEB, size: [1, 1, 0.1], transparent: true, opacity: 0.4 },
        door: { color: 0x4a3728, size: [1, 2, 0.15], transparent: false }
    },

    getConfig(type) {
        return this.configs[type] || this.configs.wall;
    }
};
