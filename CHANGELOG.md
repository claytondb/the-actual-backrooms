# Changelog

All notable changes to The Actual Backrooms.

## [0.2.0] - 2026-02-24

### Added
- **Mobile Touch Controls** - Left side virtual joystick for movement, right side for looking
- **Realistic Lighting** - Fluorescent fixture simulation with proper backrooms aesthetic
- **Test Geometry** - Visible geometry to verify rendering works

### Fixed
- Controls inversion corrected (up now looks up)
- Scene brightness drastically improved (was too dark)
- WebGL compatibility check for unsupported devices
- Mobile camera direction and sky background
- TypeScript type-only imports
- Definite assignment errors in TypeScript

### Technical
- GitHub Pages deployment configured
- Build output in `dist/` folder

## [0.1.0] - 2026-02-24

### Added
- **Infinite Procedural World** - Chunk-based generation with deterministic seeding
- **Liminal Aesthetics** - Yellow wallpaper, buzzing fluorescent lights, dirty carpet
- **Multiplayer Support** - Socket.io server for shared exploration
- **Coordinate Display** - Minecraft-style X/Y/Z position HUD
- **First-Person Controls** - WASD + mouse look

### Technical
- Three.js rendering pipeline
- Vite build system
- TypeScript throughout
- Simplex noise for procedural generation
- No enemies - pure exploration walking simulator

---

**Play now:** https://claytondb.github.io/the-actual-backrooms/
