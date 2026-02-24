/**
 * Chunk - Procedurally generated section of the Backrooms
 * Uses deterministic seeding so same coords always produce same layout
 */

import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import type { ChunkCoord, WorldConfig } from './types';

// Seeded random number generator
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Hash function for chunk coordinates
function hashCoords(x: number, z: number, seed: number): number {
  let h = seed;
  h = ((h << 5) - h) + x;
  h = ((h << 5) - h) + z;
  return h & 0x7fffffff;
}

export class Chunk {
  public readonly coord: ChunkCoord;
  public readonly mesh: THREE.Group;
  private config: WorldConfig;
  
  // Materials (shared across all chunks for performance)
  private static wallMaterial: THREE.MeshStandardMaterial;
  private static floorMaterial: THREE.MeshStandardMaterial;
  private static ceilingMaterial: THREE.MeshStandardMaterial;
  
  constructor(coord: ChunkCoord, config: WorldConfig) {
    this.coord = coord;
    this.config = config;
    this.mesh = new THREE.Group();
    
    // Initialize shared materials
    if (!Chunk.wallMaterial) {
      this.initMaterials();
    }
    
    this.generate();
  }
  
  private initMaterials(): void {
    // Create textures procedurally
    const wallCanvas = this.createWallTexture();
    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 1);
    
    Chunk.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.9,
      metalness: 0.0,
    });
    
    // Floor - dirty carpet
    const floorCanvas = this.createFloorTexture();
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    
    Chunk.floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 1.0,
      metalness: 0.0,
    });
    
    // Ceiling - office tiles
    const ceilingCanvas = this.createCeilingTexture();
    const ceilingTexture = new THREE.CanvasTexture(ceilingCanvas);
    ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(8, 8);
    
    Chunk.ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture,
      roughness: 0.8,
      metalness: 0.0,
      emissive: new THREE.Color(0x2a2a1a),
      emissiveIntensity: 0.1,
    });
  }
  
  private createWallTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Base yellow color
    ctx.fillStyle = '#c4a84b';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add noise/stains
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.15;
      ctx.fillStyle = `rgba(100, 80, 40, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Subtle horizontal lines (wallpaper seams)
    ctx.strokeStyle = 'rgba(80, 60, 30, 0.1)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    
    return canvas;
  }
  
  private createFloorTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Dirty beige carpet
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add carpet texture noise
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const brightness = Math.random() * 30 - 15;
      const r = 139 + brightness;
      const g = 115 + brightness;
      const b = 85 + brightness;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, 2, 2);
    }
    
    // Stains
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 20 + 5;
      ctx.fillStyle = 'rgba(60, 50, 40, 0.2)';
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return canvas;
  }
  
  private createCeilingTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Off-white ceiling tile
    ctx.fillStyle = '#d4d4c4';
    ctx.fillRect(0, 0, 128, 128);
    
    // Tile pattern with dots
    for (let x = 0; x < 128; x += 4) {
      for (let y = 0; y < 128; y += 4) {
        if (Math.random() > 0.7) {
          ctx.fillStyle = 'rgba(180, 180, 170, 0.5)';
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    
    // Grid lines (tile edges)
    ctx.strokeStyle = 'rgba(100, 100, 90, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 124, 124);
    
    return canvas;
  }
  
  private generate(): void {
    const { chunkSize, wallHeight, seed } = this.config;
    const chunkSeed = hashCoords(this.coord.x, this.coord.z, seed);
    const random = seededRandom(chunkSeed);
    const noise2D = createNoise2D(() => random());
    
    const worldX = this.coord.x * chunkSize;
    const worldZ = this.coord.z * chunkSize;
    
    // Position the chunk group
    this.mesh.position.set(worldX, 0, worldZ);
    
    // Generate floor
    const floorGeo = new THREE.PlaneGeometry(chunkSize, chunkSize);
    const floor = new THREE.Mesh(floorGeo, Chunk.floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(chunkSize / 2, 0, chunkSize / 2);
    floor.receiveShadow = true;
    this.mesh.add(floor);
    
    // Generate ceiling
    const ceiling = new THREE.Mesh(floorGeo.clone(), Chunk.ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(chunkSize / 2, wallHeight, chunkSize / 2);
    this.mesh.add(ceiling);
    
    // Generate maze-like walls using noise
    const gridSize = 4; // Wall grid resolution
    const cellSize = chunkSize / gridSize;
    
    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        const cellWorldX = worldX + gx * cellSize;
        const cellWorldZ = worldZ + gz * cellSize;
        
        // Use noise to determine wall placement
        // Multiple octaves for more interesting patterns
        const noiseVal = 
          noise2D(cellWorldX * 0.05, cellWorldZ * 0.05) * 0.5 +
          noise2D(cellWorldX * 0.1, cellWorldZ * 0.1) * 0.3 +
          noise2D(cellWorldX * 0.2, cellWorldZ * 0.2) * 0.2;
        
        // Deeper = more walls (more claustrophobic)
        const depth = Math.sqrt(worldX * worldX + worldZ * worldZ) / 100;
        const wallThreshold = 0.1 - Math.min(depth * 0.02, 0.15);
        
        if (noiseVal > wallThreshold) {
          // Create wall segment
          const wallLength = cellSize * (0.5 + random() * 0.5);
          const wallGeo = new THREE.BoxGeometry(wallLength, wallHeight, 0.2);
          const wall = new THREE.Mesh(wallGeo, Chunk.wallMaterial);
          
          wall.position.set(
            gx * cellSize + cellSize / 2,
            wallHeight / 2,
            gz * cellSize + cellSize / 2
          );
          
          // Random rotation (0, 90 degrees)
          if (random() > 0.5) {
            wall.rotation.y = Math.PI / 2;
          }
          
          wall.castShadow = true;
          wall.receiveShadow = true;
          this.mesh.add(wall);
        }
        
        // Occasional pillar
        if (random() > 0.92) {
          const pillarGeo = new THREE.BoxGeometry(0.4, wallHeight, 0.4);
          const pillar = new THREE.Mesh(pillarGeo, Chunk.wallMaterial);
          pillar.position.set(
            gx * cellSize + random() * cellSize,
            wallHeight / 2,
            gz * cellSize + random() * cellSize
          );
          pillar.castShadow = true;
          this.mesh.add(pillar);
        }
      }
    }
    
    // Add fluorescent lights
    this.addLights(random);
  }
  
  private addLights(random: () => number): void {
    const { chunkSize, wallHeight } = this.config;
    const lightSpacing = 8;
    
    for (let x = lightSpacing / 2; x < chunkSize; x += lightSpacing) {
      for (let z = lightSpacing / 2; z < chunkSize; z += lightSpacing) {
        // Skip some lights randomly (broken/missing)
        if (random() > 0.85) continue;
        
        // Light fixture geometry
        const fixtureGeo = new THREE.BoxGeometry(1.5, 0.1, 0.5);
        const fixtureMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffee,
          emissiveIntensity: random() > 0.9 ? 0.3 : 1.0, // Some dim/flickering
        });
        const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
        fixture.position.set(x, wallHeight - 0.05, z);
        this.mesh.add(fixture);
        
        // Actual light source
        const light = new THREE.PointLight(0xfff8dc, 0.5, 12, 2);
        light.position.set(x, wallHeight - 0.2, z);
        light.castShadow = false; // Too many for shadows
        this.mesh.add(light);
      }
    }
  }
  
  dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        // Don't dispose shared materials
      }
    });
  }
}
