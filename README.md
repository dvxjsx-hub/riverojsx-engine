
Motor de juego 3D web para móvil (vertical) con modo desarrollador, construcción estilo Minecraft, y multijugador online.

## Características

- **Menú principal**: Jugar (Solo/Multiplayer), Novedades, Mapas, Configuración
- **Perfil**: Nombre aleatorio editable, lista de amigos (activo/inactivo)
- **Solo**: Seleccionar mapa (default o creados en modo desarrollador)
- **Multiplayer**: Crear sala (código 4 dígitos, 2-4 jugadores), unirse por código
- **Modo Desarrollador**: Mundo 3D con construcción (pared, piso, techo, ventana, puerta), volar, noclip, guardar mapas
- **Mapas compartidos**: Los mapas guardados aparecen en la sección Mapas para todos
- **Online**: Socket.io para multijugador en tiempo real

## Requisitos

- Node.js 16+
- Termux (Android) o cualquier terminal
- Git
- Cuenta en Render (para deploy)
- Cuenta en GitHub

 ## Mobile First

 # riverojsx-engine

> Mobile Game Engine developed entirely from Android using HTML, CSS and JavaScript.

---

# Overview

**riverojsx-engine** is an independent game engine currently under development.

The long-term vision is to build an online first-person horror game, but before creating the final game, the priority is designing a solid, modular and scalable engine capable of supporting future projects.

This repository represents the foundation of that engine.

The objective is not simply to make a game, but to create a reusable architecture that allows new games, mechanics and multiplayer systems to be developed on top of the same codebase.

---

# Current Development Stage

Current Version:

**Beta 1.0**

Current priority:

✅ Build the engine.

❌ Not the final horror game.

At this stage the project focuses on:

- Menu system
- Online infrastructure
- Multiplayer rooms
- Developer Mode
- Map system
- Modular architecture
- Mobile optimization

The horror gameplay will be developed after the engine reaches a stable version.

---

# Long-Term Vision

The final objective of riverojsx-engine is to become the foundation of a complete multiplayer horror experience.

The future game will include:

- First-person gameplay
- Online multiplayer
- Open environments
- Map creation
- AI enemies
- Survival mechanics
- Persistent player profiles
- Community-created maps

Before reaching that point, every engine system must be completed and documented.

---

# Philosophy

The engine follows several principles.

## Modular

Every system must be independent.

No module should depend unnecessarily on another.

---

## Clean Code

Readable code is more important than clever code.

Small functions.

Clear structure.

Reusable components.

---

## Mobile First

The engine is designed specifically for Android devices.

Portrait orientation.

Fullscreen.

Optimized for touch controls.

---

## Progressive Development

Features are implemented one system at a time.

Architecture comes before content.

The objective is to avoid rewriting large portions of the project in the future.

---

# Current Modules

The engine currently plans the following systems.

- Menu
- Profile
- Friends
- Multiplayer
- Developer Mode
- Maps
- News
- Settings
- Online Networking
- Server
- Asset Management

Each module is developed independently.

---

# Developer Mode

One of the main goals of the engine is providing an integrated world editor.

The editor allows creating maps directly from the mobile device.

Current concept:

- Open world
- Creative mode
- Fly mode
- Block placement
- Collision system
- Save maps
- Continue editing later
- Publish maps for all players

The editor is inspired by the simplicity of Minecraft while remaining optimized for mobile devices.

---

# Multiplayer

The multiplayer architecture is server-based.

Features:

- Room codes
- 2 to 4 players
- Real-time synchronization
- Friend list
- Online status
- Automatic room destruction after match ends

Rooms never remain stored after finishing.

Each session is temporary.

---

# Documentation

The project uses documentation as an essential part of development.

Main documents include:

- README.md
- SPECIFICATION.md
- MENU.md
- MULTIPLAYER.md
- DEVELOPER.md
- MAPS.md
- NETWORK.md
- SERVER.md
- CHANGELOG.md
- ROADMAP.md

Documentation is considered part of the project and must remain synchronized with the code.

---

# Development Workflow

Development follows this workflow:

1. Design the module.
2. Update documentation.
3. Implement the code.
4. Test locally using Acode.
5. Move project to internal storage.
6. Manage version control using Git in Termux.
7. Push to GitHub.
8. Deploy using Render.
9. Build APK after verification.

---

# Technologies

Current stack:

- HTML5
- CSS3
- JavaScript
- LocalStorage
- WebSocket (planned)
- Node.js Server (planned)
- Git
- GitHub
- Render

---

# Future Goals

Future milestones include:

- Complete Developer Mode.
- Stable multiplayer.
- Dynamic map publishing.
- Physics improvements.
- AI system.
- Inventory system.
- Lighting system.
- Sound engine.
- Animation system.
- First-person controller.
- Complete Horror Game.

---

# Project Status

Current state:

🚧 Active Development

The engine is continuously evolving.

Architecture and stability take priority over adding gameplay features.

---

# Author

Created and maintained by:

**riverojsx**

Started in 2026.

This project represents the beginning of a long-term vision to create a complete mobile game engine and eventually build an original online horror game powered entirely by that engine.

The engine is designed exclusively for Android mobile devices.

Portrait orientation only.

Fullscreen experience.

Touch-first interface.

Optimized for smartphones.

Landscape mode is currently not supported.