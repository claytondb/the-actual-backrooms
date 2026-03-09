/**
 * Utility functions for The Actual Backrooms
 * Separated for testability
 */

import type { ChunkCoord } from './types';

/**
 * Seeded random number generator (Linear Congruential Generator)
 * Same seed always produces same sequence
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return function() {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Hash chunk coordinates to a unique seed
 * Used for deterministic chunk generation
 */
export function hashCoords(x: number, z: number, seed: number): number {
  let h = seed;
  h = ((h << 5) - h) + x;
  h = ((h << 5) - h) + z;
  return h & 0x7fffffff;
}

/**
 * Convert chunk coordinate to unique string key
 */
export function chunkKey(coord: ChunkCoord): string {
  return `${coord.x},${coord.z}`;
}

/**
 * Convert world position to chunk coordinate
 */
export function worldToChunk(worldX: number, worldZ: number, chunkSize: number): ChunkCoord {
  return {
    x: Math.floor(worldX / chunkSize),
    z: Math.floor(worldZ / chunkSize),
  };
}

/**
 * Get all chunk coordinates within view distance of a center chunk
 */
export function getChunksInRange(centerChunk: ChunkCoord, viewDistance: number): ChunkCoord[] {
  const chunks: ChunkCoord[] = [];
  for (let dx = -viewDistance; dx <= viewDistance; dx++) {
    for (let dz = -viewDistance; dz <= viewDistance; dz++) {
      chunks.push({
        x: centerChunk.x + dx,
        z: centerChunk.z + dz,
      });
    }
  }
  return chunks;
}

/**
 * Calculate distance between two chunk coordinates
 */
export function chunkDistance(a: ChunkCoord, b: ChunkCoord): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Calculate Chebyshev distance (max of absolute differences)
 * Used for view distance calculations
 */
export function chunkChebyshevDistance(a: ChunkCoord, b: ChunkCoord): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.z - b.z));
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Convert player position to display coordinates (rounded integers)
 */
export function positionToCoordinates(x: number, y: number, z: number): { x: number; y: number; z: number } {
  return {
    x: Math.floor(x),
    y: Math.floor(y),
    z: Math.floor(z),
  };
}

/**
 * Calculate wall placement threshold based on depth from origin
 * Deeper areas have more walls (more claustrophobic)
 */
export function calculateWallThreshold(worldX: number, worldZ: number, baseThreshold: number = 0.1): number {
  const depth = Math.sqrt(worldX * worldX + worldZ * worldZ) / 100;
  return baseThreshold - Math.min(depth * 0.02, 0.15);
}
