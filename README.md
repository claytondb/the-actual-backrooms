# The Actual Backrooms

An infinite procedural liminal space exploration game inspired by Kane Pixels' Backrooms series.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-green)

**▶️ [Play Now](https://claytondb.github.io/the-actual-backrooms/)**

## Features

- **Truly Infinite World** - Procedurally generated using chunk-based architecture with deterministic seeding
- **Liminal Aesthetics** - Yellow wallpaper, buzzing fluorescent lights, dirty carpet, office ceiling tiles
- **Multiplayer** - Explore with others in real-time (same world for everyone)
- **Coordinate System** - Minecraft-style X/Y/Z position display
- **No Enemies** - Pure exploration walking simulator

## Controls

### Desktop
- **WASD** - Move
- **Mouse** - Look around
- **Shift** - Run

### Mobile
- **Left Joystick** - Move
- **Right Side** - Touch and drag to look around

## Technical Architecture

### Infinite Generation
The world uses a chunk-based system similar to Minecraft:
- Chunks are generated deterministically from coordinates + world seed
- Same coordinates always produce identical rooms
- Only nearby chunks are loaded (view distance configurable)
- Distant chunks are unloaded to save memory

### Multiplayer Scaling
Designed to support many concurrent players:
- All clients generate the same world locally (no world state sent over network)
- Server only synchronizes player positions
- Spatial partitioning can be added for 1000+ players

## Getting Started

### Client (single player)
```bash
npm install
npm run dev
```

### With Multiplayer Server
```bash
# Terminal 1 - Start server
npm run server:install
npm run server

# Terminal 2 - Start client
npm run dev
```

## Building for Production

```bash
npm run build
```

Output will be in `dist/` folder.

## Lore

Based on the Kane Pixels interpretation of the Backrooms:

> Async Research discovered a method to create infinite spatial anomalies - pocket dimensions that could be used for storage or habitation. The Backrooms are what happens when you "noclip" out of reality into these spaces. An endless maze of yellow rooms, the hum of fluorescent lights, and the unsettling feeling that you're not alone...

*This game focuses on exploration. There are no entities. Just you, the endless rooms, and the buzz of the lights.*

## License

MIT
