/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  seededRandom,
  hashCoords,
  chunkKey,
  worldToChunk,
  getChunksInRange,
  chunkDistance,
  chunkChebyshevDistance,
  clamp,
  lerp,
  positionToCoordinates,
  calculateWallThreshold,
} from './utils';

describe('seededRandom', () => {
  it('should produce deterministic sequences from same seed', () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(42);
    
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('should produce different sequences from different seeds', () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(123);
    
    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];
    
    expect(seq1).not.toEqual(seq2);
  });

  it('should produce values between 0 and 1', () => {
    const rng = seededRandom(999);
    
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('should handle edge case seeds', () => {
    const rng0 = seededRandom(0);
    const rngNeg = seededRandom(-1);
    const rngLarge = seededRandom(2147483647);
    
    // Should not throw and produce valid numbers
    expect(rng0()).toBeGreaterThanOrEqual(0);
    expect(rngNeg()).toBeGreaterThanOrEqual(0);
    expect(rngLarge()).toBeGreaterThanOrEqual(0);
  });
});

describe('hashCoords', () => {
  it('should produce same hash for same inputs', () => {
    const hash1 = hashCoords(5, 10, 42);
    const hash2 = hashCoords(5, 10, 42);
    
    expect(hash1).toBe(hash2);
  });

  it('should produce different hash for different coordinates', () => {
    const hash1 = hashCoords(0, 0, 42);
    const hash2 = hashCoords(1, 0, 42);
    const hash3 = hashCoords(0, 1, 42);
    
    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash2).not.toBe(hash3);
  });

  it('should produce different hash for different seeds', () => {
    const hash1 = hashCoords(5, 5, 1);
    const hash2 = hashCoords(5, 5, 2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should handle negative coordinates', () => {
    const hash1 = hashCoords(-5, -10, 42);
    const hash2 = hashCoords(-5, -10, 42);
    const hash3 = hashCoords(5, 10, 42);
    
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('should always return non-negative values', () => {
    expect(hashCoords(-100, -200, 0)).toBeGreaterThanOrEqual(0);
    expect(hashCoords(0, 0, 0)).toBeGreaterThanOrEqual(0);
    expect(hashCoords(100, 200, 100)).toBeGreaterThanOrEqual(0);
  });
});

describe('chunkKey', () => {
  it('should create consistent string keys', () => {
    expect(chunkKey({ x: 0, z: 0 })).toBe('0,0');
    expect(chunkKey({ x: 5, z: 10 })).toBe('5,10');
    expect(chunkKey({ x: -3, z: 7 })).toBe('-3,7');
  });

  it('should create unique keys for different coordinates', () => {
    const key1 = chunkKey({ x: 1, z: 2 });
    const key2 = chunkKey({ x: 2, z: 1 });
    
    expect(key1).not.toBe(key2);
  });
});

describe('worldToChunk', () => {
  it('should convert positive positions correctly', () => {
    expect(worldToChunk(0, 0, 32)).toEqual({ x: 0, z: 0 });
    expect(worldToChunk(31, 31, 32)).toEqual({ x: 0, z: 0 });
    expect(worldToChunk(32, 32, 32)).toEqual({ x: 1, z: 1 });
    expect(worldToChunk(64, 64, 32)).toEqual({ x: 2, z: 2 });
  });

  it('should convert negative positions correctly', () => {
    expect(worldToChunk(-1, -1, 32)).toEqual({ x: -1, z: -1 });
    expect(worldToChunk(-32, -32, 32)).toEqual({ x: -1, z: -1 });
    expect(worldToChunk(-33, -33, 32)).toEqual({ x: -2, z: -2 });
  });

  it('should handle different chunk sizes', () => {
    expect(worldToChunk(15, 15, 16)).toEqual({ x: 0, z: 0 });
    expect(worldToChunk(16, 16, 16)).toEqual({ x: 1, z: 1 });
    expect(worldToChunk(100, 100, 64)).toEqual({ x: 1, z: 1 });
  });

  it('should handle fractional positions', () => {
    expect(worldToChunk(31.9, 31.9, 32)).toEqual({ x: 0, z: 0 });
    expect(worldToChunk(32.1, 32.1, 32)).toEqual({ x: 1, z: 1 });
  });
});

describe('getChunksInRange', () => {
  it('should return correct number of chunks', () => {
    // viewDistance 0 = just the center chunk
    expect(getChunksInRange({ x: 0, z: 0 }, 0)).toHaveLength(1);
    
    // viewDistance 1 = 3x3 = 9 chunks
    expect(getChunksInRange({ x: 0, z: 0 }, 1)).toHaveLength(9);
    
    // viewDistance 2 = 5x5 = 25 chunks
    expect(getChunksInRange({ x: 0, z: 0 }, 2)).toHaveLength(25);
    
    // viewDistance 3 = 7x7 = 49 chunks
    expect(getChunksInRange({ x: 0, z: 0 }, 3)).toHaveLength(49);
  });

  it('should include the center chunk', () => {
    const center = { x: 5, z: 10 };
    const chunks = getChunksInRange(center, 2);
    
    expect(chunks).toContainEqual(center);
  });

  it('should include corner chunks', () => {
    const chunks = getChunksInRange({ x: 0, z: 0 }, 1);
    
    expect(chunks).toContainEqual({ x: -1, z: -1 });
    expect(chunks).toContainEqual({ x: -1, z: 1 });
    expect(chunks).toContainEqual({ x: 1, z: -1 });
    expect(chunks).toContainEqual({ x: 1, z: 1 });
  });
});

describe('chunkDistance', () => {
  it('should calculate zero distance for same chunk', () => {
    expect(chunkDistance({ x: 5, z: 5 }, { x: 5, z: 5 })).toBe(0);
  });

  it('should calculate correct distances', () => {
    expect(chunkDistance({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
    expect(chunkDistance({ x: 0, z: 0 }, { x: 1, z: 0 })).toBe(1);
    expect(chunkDistance({ x: 0, z: 0 }, { x: 0, z: 1 })).toBe(1);
  });

  it('should handle negative coordinates', () => {
    expect(chunkDistance({ x: -3, z: 0 }, { x: 0, z: 4 })).toBe(5);
  });
});

describe('chunkChebyshevDistance', () => {
  it('should calculate zero for same chunk', () => {
    expect(chunkChebyshevDistance({ x: 3, z: 3 }, { x: 3, z: 3 })).toBe(0);
  });

  it('should return max of absolute differences', () => {
    expect(chunkChebyshevDistance({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(4);
    expect(chunkChebyshevDistance({ x: 0, z: 0 }, { x: 5, z: 2 })).toBe(5);
    expect(chunkChebyshevDistance({ x: 0, z: 0 }, { x: 3, z: 3 })).toBe(3);
  });

  it('should handle negative coordinates', () => {
    expect(chunkChebyshevDistance({ x: -2, z: -2 }, { x: 2, z: 2 })).toBe(4);
  });
});

describe('clamp', () => {
  it('should return value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('should clamp to min when below', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, -50, 50)).toBe(-50);
  });

  it('should clamp to max when above', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(1000, -50, 50)).toBe(50);
  });
});

describe('lerp', () => {
  it('should return start value at t=0', () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(-50, 50, 0)).toBe(-50);
  });

  it('should return end value at t=1', () => {
    expect(lerp(0, 100, 1)).toBe(100);
    expect(lerp(-50, 50, 1)).toBe(50);
  });

  it('should interpolate correctly', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(0, 100, 0.25)).toBe(25);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('should handle negative values', () => {
    expect(lerp(-100, 100, 0.5)).toBe(0);
    expect(lerp(100, -100, 0.5)).toBe(0);
  });

  it('should extrapolate beyond 0-1 range', () => {
    expect(lerp(0, 100, 2)).toBe(200);
    expect(lerp(0, 100, -1)).toBe(-100);
  });
});

describe('positionToCoordinates', () => {
  it('should floor positive values', () => {
    expect(positionToCoordinates(5.7, 3.2, 9.9)).toEqual({ x: 5, y: 3, z: 9 });
  });

  it('should floor negative values', () => {
    expect(positionToCoordinates(-5.3, -3.8, -9.1)).toEqual({ x: -6, y: -4, z: -10 });
  });

  it('should handle zero', () => {
    expect(positionToCoordinates(0, 0, 0)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('should handle integers', () => {
    expect(positionToCoordinates(5, 10, 15)).toEqual({ x: 5, y: 10, z: 15 });
  });
});

describe('calculateWallThreshold', () => {
  it('should return base threshold at origin', () => {
    expect(calculateWallThreshold(0, 0, 0.1)).toBe(0.1);
  });

  it('should decrease threshold further from origin', () => {
    const nearOrigin = calculateWallThreshold(10, 10, 0.1);
    const farFromOrigin = calculateWallThreshold(500, 500, 0.1);
    
    expect(farFromOrigin).toBeLessThan(nearOrigin);
  });

  it('should have a minimum threshold', () => {
    // Very far from origin should still have some threshold
    const veryFar = calculateWallThreshold(10000, 10000, 0.1);
    
    // Should not go below base - 0.15
    expect(veryFar).toBeGreaterThanOrEqual(0.1 - 0.15);
  });

  it('should use default base threshold when not provided', () => {
    expect(calculateWallThreshold(0, 0)).toBe(0.1);
  });
});
