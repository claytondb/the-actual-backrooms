/**
 * World - Manages infinite procedural chunk loading
 * Chunks are loaded/unloaded based on player position
 */

import * as THREE from 'three';
import { Chunk } from './Chunk';
import { ChunkCoord, WorldConfig, DEFAULT_CONFIG } from './types';

export class World {
  private scene: THREE.Scene;
  private config: WorldConfig;
  private chunks: Map<string, Chunk> = new Map();
  private lastPlayerChunk: ChunkCoord = { x: 0, z: 0 };
  
  constructor(scene: THREE.Scene, config: Partial<WorldConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Add ambient light
    const ambient = new THREE.AmbientLight(0xfff8dc, 0.3);
    this.scene.add(ambient);
    
    // Add slight fog for atmosphere
    this.scene.fog = new THREE.FogExp2(0x1a1810, 0.015);
    this.scene.background = new THREE.Color(0x1a1810);
  }
  
  private chunkKey(coord: ChunkCoord): string {
    return `${coord.x},${coord.z}`;
  }
  
  private worldToChunk(worldPos: THREE.Vector3): ChunkCoord {
    return {
      x: Math.floor(worldPos.x / this.config.chunkSize),
      z: Math.floor(worldPos.z / this.config.chunkSize),
    };
  }
  
  update(playerPosition: THREE.Vector3): void {
    const currentChunk = this.worldToChunk(playerPosition);
    
    // Only update if player moved to new chunk
    if (currentChunk.x === this.lastPlayerChunk.x && 
        currentChunk.z === this.lastPlayerChunk.z) {
      return;
    }
    
    this.lastPlayerChunk = currentChunk;
    
    const { viewDistance } = this.config;
    const neededChunks = new Set<string>();
    
    // Determine which chunks should be loaded
    for (let dx = -viewDistance; dx <= viewDistance; dx++) {
      for (let dz = -viewDistance; dz <= viewDistance; dz++) {
        const coord: ChunkCoord = {
          x: currentChunk.x + dx,
          z: currentChunk.z + dz,
        };
        neededChunks.add(this.chunkKey(coord));
        
        // Load chunk if not already loaded
        if (!this.chunks.has(this.chunkKey(coord))) {
          this.loadChunk(coord);
        }
      }
    }
    
    // Unload chunks that are too far
    for (const [key, chunk] of this.chunks.entries()) {
      if (!neededChunks.has(key)) {
        this.unloadChunk(key, chunk);
      }
    }
  }
  
  private loadChunk(coord: ChunkCoord): void {
    const chunk = new Chunk(coord, this.config);
    this.chunks.set(this.chunkKey(coord), chunk);
    this.scene.add(chunk.mesh);
  }
  
  private unloadChunk(key: string, chunk: Chunk): void {
    this.scene.remove(chunk.mesh);
    chunk.dispose();
    this.chunks.delete(key);
  }
  
  getChunkCount(): number {
    return this.chunks.size;
  }
  
  // Force initial chunk loading
  forceUpdate(playerPosition: THREE.Vector3): void {
    this.lastPlayerChunk = { x: Infinity, z: Infinity }; // Force update
    this.update(playerPosition);
  }
}
