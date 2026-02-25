/**
 * The Actual Backrooms
 * An infinite procedural liminal space exploration game
 * 
 * Inspired by Kane Pixels' Backrooms series
 */

import * as THREE from 'three';
import { World } from './World';
import { Player } from './Player';
import { Multiplayer } from './Multiplayer';
import { TouchControls } from './TouchControls';

class BackroomsGame {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private world!: World;
  private player!: Player;
  private multiplayer!: Multiplayer;
  private touchControls: TouchControls | null = null;
  
  private clock = new THREE.Clock();
  private isRunning = false;
  
  // HUD elements
  private coordX!: HTMLElement;
  private coordY!: HTMLElement;
  private coordZ!: HTMLElement;
  private playerCount!: HTMLElement;
  
  // Audio
  private audioContext: AudioContext | null = null;
  private buzzGain: GainNode | null = null;
  
  constructor() {
    // Get canvas
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    // Check WebGL support
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      alert('WebGL not supported on this device');
      throw new Error('WebGL not supported');
    }
    
    // Setup renderer with realistic settings
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Create scene with atmospheric background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1810); // Dark murky yellow-brown
    
    // Initialize systems
    this.player = new Player();
    this.world = new World(this.scene, {
      seed: 42, // Same seed for all players = same world
      viewDistance: 3,
    });
    this.multiplayer = new Multiplayer(this.scene);
    
    // Get HUD elements
    this.coordX = document.getElementById('coord-x')!;
    this.coordY = document.getElementById('coord-y')!;
    this.coordZ = document.getElementById('coord-z')!;
    this.playerCount = document.getElementById('player-count')!;
    
    // Setup multiplayer callback
    this.multiplayer.setOnPlayerCountChange((count) => {
      this.playerCount.textContent = count.toString();
    });
    
    // Setup start button
    const startBtn = document.getElementById('start-btn')!;
    const startScreen = document.getElementById('start-screen')!;
    
    startBtn.addEventListener('click', () => {
      startScreen.style.display = 'none';
      this.start();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
  }
  
  private start(): void {
    this.isRunning = true;
    
    // Initialize touch controls for mobile
    this.touchControls = new TouchControls();
    
    // Request pointer lock (desktop only)
    if (!this.touchControls.isTouchDevice()) {
      this.player.requestPointerLock();
    }
    
    // Initialize audio (must be after user interaction)
    this.initAudio();
    
    // Connect to multiplayer server (fails silently if not available)
    this.multiplayer.connect();
    
    // Add realistic lighting
    const ambientLight = new THREE.AmbientLight(0xfff8dc, 0.15);
    this.scene.add(ambientLight);
    
    // Fog for depth
    this.scene.fog = new THREE.Fog(0x1a1810, 5, 40);
    
    // Force initial world generation (procedural chunks)
    this.world.forceUpdate(this.player.position);
    
    // Start game loop
    this.animate();
  }
  
  private initAudio(): void {
    try {
      this.audioContext = new AudioContext();
      
      // Create fluorescent light buzz
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 120; // 60Hz hum doubled
      
      // Add some harmonics
      const oscillator2 = this.audioContext.createOscillator();
      oscillator2.type = 'sine';
      oscillator2.frequency.value = 240;
      
      // Gain control
      this.buzzGain = this.audioContext.createGain();
      this.buzzGain.gain.value = 0.03; // Very quiet
      
      const gain2 = this.audioContext.createGain();
      gain2.gain.value = 0.01;
      
      // Filter to make it more "buzzy"
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      
      oscillator.connect(this.buzzGain);
      oscillator2.connect(gain2);
      this.buzzGain.connect(filter);
      gain2.connect(filter);
      filter.connect(this.audioContext.destination);
      
      oscillator.start();
      oscillator2.start();
    } catch (e) {
      console.log('Audio not available');
    }
  }
  
  private animate(): void {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    
    // Apply touch input
    if (this.touchControls) {
      this.player.applyTouchInput(this.touchControls.input);
      this.touchControls.update();
    }
    
    // Update player
    this.player.update(deltaTime);
    
    // Update world (load/unload chunks)
    this.world.update(this.player.position);
    
    // Send position to multiplayer
    this.multiplayer.sendPosition(
      this.player.position,
      this.player.getRotation()
    );
    
    // Update HUD
    const coords = this.player.getCoordinates();
    this.coordX.textContent = coords.x.toString();
    this.coordY.textContent = coords.y.toString();
    this.coordZ.textContent = coords.z.toString();
    
    // Render
    this.renderer.render(this.scene, this.player.camera);
  }
  
  private onResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BackroomsGame();
});
