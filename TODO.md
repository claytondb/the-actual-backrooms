# The Actual Backrooms - Task List

Last updated: 2026-03-09

## ✅ Completed

### Core Features
- [x] Infinite procedural world generation (chunk-based)
- [x] First-person WASD + mouse look controls
- [x] Mobile touch controls (joystick + swipe look)
- [x] Coordinate display HUD (Minecraft-style)
- [x] Multiplayer support (Socket.io)
- [x] Deterministic seeding (same world for everyone)
- [x] Liminal aesthetics (yellow wallpaper, fluorescent lights, dirty carpet)
- [x] Ambient audio (fluorescent buzz)
- [x] WebGL compatibility check
- [x] GitHub Pages deployment

### Testing & Documentation
- [x] Unit testing with Vitest (40 tests) - 2026-03-09
- [x] README with controls and features
- [x] CHANGELOG tracking releases

---

## 🔥 Priority Features

### 1. Enhanced World Generation
**Priority:** HIGH

- [ ] More varied room shapes (L-shaped, T-junctions, open areas)
- [ ] Occasional larger rooms/hallways
- [ ] Furniture objects (chairs, desks, filing cabinets)
- [ ] Wall decorations (exit signs, clocks, paintings)
- [ ] Variation in wall/floor textures

### 2. Atmosphere Improvements
**Priority:** MEDIUM

- [ ] Flickering lights effect
- [ ] Light pooling (brighter directly under lights)
- [ ] Dust particles in air
- [ ] Occasional distant sounds (footsteps, door creaking)
- [ ] Dynamic fog density based on depth

### 3. Performance Optimization
**Priority:** MEDIUM

- [ ] Frustum culling for chunks
- [ ] LOD (Level of Detail) for distant geometry
- [ ] Object pooling for frequently created/destroyed meshes
- [ ] Texture atlasing to reduce draw calls

---

## 📋 Phase 2: Gameplay Features

### Exploration Tools
- [ ] Map/radar showing explored areas
- [ ] Waypoint/marker system
- [ ] Screenshot/photo mode
- [ ] Distance traveled counter

### Multiplayer Enhancements
- [ ] Player names displayed
- [ ] Voice chat proximity (optional)
- [ ] "Follow" mode for groups
- [ ] Spawn at friend's location

### Level Variants
- [ ] Different "levels" with unique aesthetics
- [ ] Level 0: Classic yellow rooms (current)
- [ ] Level 1: Warehouse/industrial
- [ ] Level 2: Office spaces
- [ ] Transition zones between levels

---

## 🐛 Known Issues

- None currently tracked

---

## 📊 Stats

- **Version:** 0.2.0
- **Tests:** 40 passing
- **Build:** Clean ✅
- **Platforms:** Web (desktop + mobile)
