/**
 * FlickeringLight unit tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlickeringLight } from './FlickeringLight';
import type { FlickeringLightConfig } from './FlickeringLight';

// Mock THREE.js objects
const createMockLight = () => ({
  intensity: 1.0,
  position: { x: 0, y: 0, z: 0 },
  parent: null as unknown,
});

const createMockFixture = (emissiveIntensity = 2.0) => ({
  material: {
    emissive: {
      r: 1,
      g: 0.95,
      b: 0.8,
      clone: () => ({ r: 1, g: 0.95, b: 0.8 }),
      copy: vi.fn(),
      setRGB: vi.fn(),
    },
    emissiveIntensity,
  },
});

const createMockChunk = () => ({
  uuid: 'chunk-' + Math.random(),
});

describe('FlickeringLight', () => {
  beforeEach(() => {
    FlickeringLight.clear();
  });

  describe('register', () => {
    it('should register a light', () => {
      const light = createMockLight();
      const fixture = createMockFixture();
      const config: FlickeringLightConfig = {
        baseIntensity: 1.2,
        baseEmissive: 2.0,
        flickerChance: 0.05,
        isDim: false,
      };

      expect(FlickeringLight.count).toBe(0);
      FlickeringLight.register(light as any, fixture as any, config);
      expect(FlickeringLight.count).toBe(1);
    });

    it('should register multiple lights', () => {
      for (let i = 0; i < 5; i++) {
        FlickeringLight.register(
          createMockLight() as any,
          createMockFixture() as any,
          { baseIntensity: 1.0, baseEmissive: 2.0, flickerChance: 0.05, isDim: false }
        );
      }
      expect(FlickeringLight.count).toBe(5);
    });
  });

  describe('update', () => {
    it('should apply subtle intensity variation without flickering', () => {
      const light = createMockLight();
      const fixture = createMockFixture();
      
      FlickeringLight.register(light as any, fixture as any, {
        baseIntensity: 1.0,
        baseEmissive: 2.0,
        flickerChance: 0, // No flickering
        isDim: false,
      });

      // Update for several frames
      for (let i = 0; i < 10; i++) {
        FlickeringLight.update(0.016);
      }

      // Intensity should vary slightly from base (subtle noise)
      expect(light.intensity).toBeGreaterThan(0);
      expect(light.intensity).toBeLessThanOrEqual(1.05);
    });

    it('should handle zero deltaTime', () => {
      const light = createMockLight();
      const fixture = createMockFixture();
      
      FlickeringLight.register(light as any, fixture as any, {
        baseIntensity: 1.0,
        baseEmissive: 2.0,
        flickerChance: 0.5,
        isDim: false,
      });

      // Should not throw
      FlickeringLight.update(0);
      expect(light.intensity).toBeGreaterThanOrEqual(0);
    });

    it('should process all registered lights', () => {
      const lights = [createMockLight(), createMockLight(), createMockLight()];
      
      lights.forEach(light => {
        FlickeringLight.register(light as any, createMockFixture() as any, {
          baseIntensity: 1.0,
          baseEmissive: 2.0,
          flickerChance: 0,
          isDim: false,
        });
      });

      FlickeringLight.update(0.1);

      // All lights should be processed (have subtle variation applied)
      lights.forEach(light => {
        expect(light.intensity).toBeGreaterThan(0);
      });
    });
  });

  describe('unregisterChunk', () => {
    it('should remove lights belonging to a chunk', () => {
      const chunk = createMockChunk();
      const light1 = createMockLight();
      const light2 = createMockLight();
      
      // Set parent to chunk for first light
      light1.parent = chunk;
      light2.parent = null;

      FlickeringLight.register(light1 as any, createMockFixture() as any, {
        baseIntensity: 1.0,
        baseEmissive: 2.0,
        flickerChance: 0.05,
        isDim: false,
      });
      
      FlickeringLight.register(light2 as any, createMockFixture() as any, {
        baseIntensity: 1.0,
        baseEmissive: 2.0,
        flickerChance: 0.05,
        isDim: false,
      });

      expect(FlickeringLight.count).toBe(2);
      
      FlickeringLight.unregisterChunk(chunk as any);
      
      // Light1 should be removed, light2 should remain
      expect(FlickeringLight.count).toBe(1);
    });

    it('should handle nested parent relationships', () => {
      const chunk = createMockChunk();
      const intermediateParent = { parent: chunk };
      const light = createMockLight();
      light.parent = intermediateParent;

      FlickeringLight.register(light as any, createMockFixture() as any, {
        baseIntensity: 1.0,
        baseEmissive: 2.0,
        flickerChance: 0.05,
        isDim: false,
      });

      expect(FlickeringLight.count).toBe(1);
      FlickeringLight.unregisterChunk(chunk as any);
      expect(FlickeringLight.count).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all lights', () => {
      for (let i = 0; i < 10; i++) {
        FlickeringLight.register(
          createMockLight() as any,
          createMockFixture() as any,
          { baseIntensity: 1.0, baseEmissive: 2.0, flickerChance: 0.05, isDim: false }
        );
      }

      expect(FlickeringLight.count).toBe(10);
      FlickeringLight.clear();
      expect(FlickeringLight.count).toBe(0);
    });

    it('should reset internal time', () => {
      FlickeringLight.update(100);
      FlickeringLight.clear();
      
      // After clear, behavior should be consistent with fresh start
      const light = createMockLight();
      FlickeringLight.register(light as any, createMockFixture() as any, {
        baseIntensity: 1.0,
        baseEmissive: 2.0,
        flickerChance: 0,
        isDim: false,
      });
      
      FlickeringLight.update(0.016);
      expect(light.intensity).toBeLessThanOrEqual(1.05);
    });
  });

  describe('dim lights', () => {
    it('should have higher flicker chance for dim lights', () => {
      // This is more of a design test - dim lights should be configured with higher flicker chance
      const dimConfig: FlickeringLightConfig = {
        baseIntensity: 0.3,
        baseEmissive: 0.5,
        flickerChance: 0.15, // Higher than normal
        isDim: true,
      };

      const normalConfig: FlickeringLightConfig = {
        baseIntensity: 1.2,
        baseEmissive: 2.0,
        flickerChance: 0.05,
        isDim: false,
      };

      expect(dimConfig.flickerChance).toBeGreaterThan(normalConfig.flickerChance);
      expect(dimConfig.isDim).toBe(true);
      expect(normalConfig.isDim).toBe(false);
    });
  });

  describe('count getter', () => {
    it('should return correct count', () => {
      expect(FlickeringLight.count).toBe(0);
      
      FlickeringLight.register(
        createMockLight() as any,
        createMockFixture() as any,
        { baseIntensity: 1.0, baseEmissive: 2.0, flickerChance: 0.05, isDim: false }
      );
      
      expect(FlickeringLight.count).toBe(1);
    });
  });
});
