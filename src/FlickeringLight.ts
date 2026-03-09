/**
 * FlickeringLight - Handles realistic fluorescent light flickering
 * 
 * Simulates the characteristic behavior of old fluorescent lights:
 * - Random subtle intensity variations
 * - Occasional rapid flickers
 * - Rare longer "dying light" sequences
 */

import * as THREE from 'three';

export interface FlickeringLightConfig {
  baseIntensity: number;
  baseEmissive: number;
  flickerChance: number;  // 0-1, chance per frame to start a flicker
  isDim: boolean;         // Dim lights flicker more
}

interface LightState {
  light: THREE.PointLight;
  fixture: THREE.Mesh;
  config: FlickeringLightConfig;
  flickering: boolean;
  flickerTime: number;
  flickerDuration: number;
  baseColor: THREE.Color;
}

export class FlickeringLight {
  private static lights: LightState[] = [];
  private static time = 0;
  
  /**
   * Register a light for flickering
   */
  static register(
    light: THREE.PointLight,
    fixture: THREE.Mesh,
    config: FlickeringLightConfig
  ): void {
    const material = fixture.material as THREE.MeshStandardMaterial;
    this.lights.push({
      light,
      fixture,
      config,
      flickering: false,
      flickerTime: 0,
      flickerDuration: 0,
      baseColor: material.emissive.clone(),
    });
  }
  
  /**
   * Update all registered lights - call once per frame
   */
  static update(deltaTime: number): void {
    this.time += deltaTime;
    
    for (const state of this.lights) {
      this.updateLight(state, deltaTime);
    }
  }
  
  private static updateLight(state: LightState, deltaTime: number): void {
    const { light, fixture, config } = state;
    const material = fixture.material as THREE.MeshStandardMaterial;
    
    // Check if we should start a flicker
    if (!state.flickering) {
      // Dim lights flicker more often
      const flickerChance = config.isDim 
        ? config.flickerChance * 3 
        : config.flickerChance;
      
      if (Math.random() < flickerChance * deltaTime) {
        state.flickering = true;
        state.flickerTime = 0;
        
        // Random flicker duration (0.05 - 0.3 seconds, occasionally longer)
        state.flickerDuration = Math.random() < 0.1
          ? 0.5 + Math.random() * 1.0  // Rare long flicker
          : 0.05 + Math.random() * 0.25;
      }
    }
    
    // Process active flicker
    if (state.flickering) {
      state.flickerTime += deltaTime;
      
      if (state.flickerTime >= state.flickerDuration) {
        // End flicker - restore normal state
        state.flickering = false;
        light.intensity = config.baseIntensity;
        material.emissiveIntensity = config.baseEmissive;
        material.emissive.copy(state.baseColor);
      } else {
        // Active flickering - rapid random intensity changes
        const flickerProgress = state.flickerTime / state.flickerDuration;
        
        // Determine flicker pattern
        if (state.flickerDuration > 0.4) {
          // Long flicker - "dying light" pattern
          // Intensity drops, occasional brief recoveries
          const base = 0.2 + 0.3 * Math.sin(flickerProgress * Math.PI);
          const pulse = Math.random() > 0.7 ? 0.8 : 0;
          light.intensity = config.baseIntensity * (base + pulse);
          material.emissiveIntensity = config.baseEmissive * (base + pulse);
        } else {
          // Short flicker - rapid on/off
          const rapid = Math.sin(this.time * 60) > 0 ? 1 : 0.1;
          const noise = 0.7 + Math.random() * 0.3;
          light.intensity = config.baseIntensity * rapid * noise;
          material.emissiveIntensity = config.baseEmissive * rapid * noise;
        }
        
        // Slight color shift during flicker (more yellow/green)
        const warmShift = 0.1 + Math.random() * 0.1;
        material.emissive.setRGB(
          state.baseColor.r,
          state.baseColor.g + warmShift,
          state.baseColor.b - warmShift * 0.5
        );
      }
    } else {
      // Subtle ambient variation even when not flickering
      const subtleNoise = 0.95 + Math.sin(this.time * 2 + light.position.x) * 0.05;
      light.intensity = config.baseIntensity * subtleNoise;
    }
  }
  
  /**
   * Unregister lights from a chunk being disposed
   */
  static unregisterChunk(chunkMesh: THREE.Group): void {
    this.lights = this.lights.filter(state => {
      // Check if this light belongs to the chunk being disposed
      let parent = state.light.parent;
      while (parent) {
        if (parent === chunkMesh) return false;
        parent = parent.parent;
      }
      return true;
    });
  }
  
  /**
   * Get count of registered lights (for debugging)
   */
  static get count(): number {
    return this.lights.length;
  }
  
  /**
   * Clear all lights (for testing or reset)
   */
  static clear(): void {
    this.lights = [];
    this.time = 0;
  }
}
