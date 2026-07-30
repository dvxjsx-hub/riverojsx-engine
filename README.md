# riverojsx-engine

> **Motor de juego experimental desarrollado por riverojsx.**
> **100% desde celular para celular, modo 100% horizontal**

## 📖 Descripción

**riverojsx-engine** es un motor de juego en desarrollo creado desde cero utilizando **HTML, CSS, JavaScript, Node.js y Socket.IO**. Su propósito no es ser un juego terminado, sino convertirse en la herramienta con la que se construirá el mundo completo de **Riveros Horror Game**.

La filosofía del proyecto consiste en desarrollar primero un motor funcional que permita crear, editar y probar escenarios en tiempo real antes de comenzar el desarrollo completo del juego de terror.

Todo el proyecto está pensado para funcionar tanto en navegador como en dispositivos móviles, con una interfaz sencilla y optimizada para pantallas táctiles.

---

# 🚀 Estado actual

Versión actual: **BETA 1.0**

Actualmente el proyecto incluye:

- Sistema de menús.
- Perfil de jugador.
- Configuración.
- Noticias (News).
- Sistema de amigos.
- Conexión mediante Socket.IO.
- Partidas en solitario.
- Creación y unión a salas multijugador.
- Lobby multijugador.
- Modo desarrollador.
- Mundo de pruebas.
- Cámara en primera persona.
- Pantalla inmersiva.
- Sistema básico de texturas.
- Motor preparado para expansión.

---

# 🛠 Developer Mode

El **Developer Mode** es actualmente la característica principal del proyecto.

Su objetivo es permitir construir el mapa principal del juego directamente desde el propio motor sin necesidad de programas externos.

Actualmente permite experimentar con la creación del mundo y servirá como base del escenario definitivo.

## Objetivo

Construir completamente el mapa del futuro **Riveros Horror Game** desde este editor.

Una vez terminado y optimizado, este mismo sistema evolucionará para convertirse en un editor disponible para la comunidad.

---

# 🌍 Visión del proyecto

La meta NO es únicamente desarrollar un juego.

La visión consiste en construir un motor que permita:

- Crear mundos abiertos.
- Editar escenarios en tiempo real.
- Construir estructuras.
- Crear mapas.
- Compartir mapas.
- Jugar esos mapas en modo individual o multijugador.

El objetivo final es que el mapa oficial del juego sea construido utilizando este mismo motor.

---

# 🌐 Funciones planeadas

Entre las funciones que aún se encuentran en desarrollo están:

- Guardado permanente de mapas en servidor.
- Sincronización automática de mapas para todos los jugadores.
- Descarga automática del mapa más reciente al entrar al juego.
- Lista de jugadores registrados.
- Estado En línea / Desconectado en tiempo real.
- Sistema de construcción avanzado.
- Objetos interactivos.
- IA.
- Sistema de iluminación.
- Optimización del motor.
- Sistema de físicas.
- Animaciones.
- Inventario.
- Guardado en la nube.

---

# ⚠ Estado de desarrollo

Actualmente existen funciones implementadas parcialmente.

## Mapas

El modo desarrollador ya puede crear mapas.

Sin embargo, todavía **los mapas no se sincronizan automáticamente entre todos los jugadores**.

Actualmente el objetivo es desarrollar el sistema para que:

- un creador guarde un mapa;
- el servidor lo almacene;
- cualquier jugador pueda verlo al entrar al juego sin necesidad de descargar una actualización.

---

## Amigos

Sistema de amigos con sincronización en tiempo real mediante Socket.IO:

- cada jugador tiene un ID único de 8 dígitos (Perfil) para ser agregado;
- solicitudes de amistad con aceptar/rechazar;
- estado En línea / Desconectado en tiempo real;
- desde dentro del mundo (Solo, Multijugador o Modo Desarrollador) se puede invitar
  a un amigo en línea a unirse a la partida; si acepta, se une sin importar si
  la sesión era Solo o Modo Desarrollador.

---

# 🎮 Objetivo principal

Antes de comenzar el desarrollo completo de Riveros Horror Game se pretende terminar un motor capaz de construir el escenario completo del juego.

Este enfoque permitirá:

- desarrollar el mapa mientras se prueba el motor;
- detectar errores antes de crear el juego completo;
- reutilizar el motor en futuras versiones.

---

# 🔮 Visión a largo plazo

Cuando el motor sea estable se convertirá en la herramienta principal de desarrollo del universo de **Riveros Horror Game**.

Posteriormente se añadirá un editor mucho más completo para que cualquier jugador pueda construir sus propios mapas y compartirlos con la comunidad.

El objetivo final es disponer de un motor ligero, fácil de ampliar y completamente desarrollado desde cero.

---

# 👨‍💻 Desarrollador

**riverojsx**

Proyecto desarrollado como parte del aprendizaje de programación, motores de juego, arquitectura de software y desarrollo multijugador en tiempo real.

---

*"Primero construir el motor. Después construir el mundo."*