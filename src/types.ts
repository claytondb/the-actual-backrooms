/**
 * Type definitions for The Actual Backrooms
 */

export interface ChunkCoord {
  x: number;
  z: number;
}

export interface PlayerState {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
}

export interface WorldConfig {
  chunkSize: number;      // Size of each chunk in world units
  viewDistance: number;   // How many chunks to render around player
  wallHeight: number;     // Height of walls
  corridorWidth: number;  // Width of corridors
  seed: number;           // World seed for deterministic generation
}

// Default config - can be overridden
export const DEFAULT_CONFIG: WorldConfig = {
  chunkSize: 32,
  viewDistance: 3,
  wallHeight: 3,
  corridorWidth: 3,
  seed: 42,
};
