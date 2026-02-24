/**
 * Player - First person controller with mouse look and WASD movement
 */

import * as THREE from 'three';

export class Player {
  public readonly camera: THREE.PerspectiveCamera;
  public readonly position: THREE.Vector3;
  
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  
  // Movement state
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private isRunning = false;
  
  // Settings
  private readonly walkSpeed = 4;
  private readonly runSpeed = 8;
  private readonly mouseSensitivity = 0.002;
  private readonly eyeHeight = 1.6;
  private readonly friction = 10;
  
  // Pointer lock state
  private isLocked = false;
  
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    this.position = new THREE.Vector3(0, this.eyeHeight, 0);
    this.camera.position.copy(this.position);
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Keyboard
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    // Mouse movement
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    
    // Pointer lock
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement !== null;
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }
  
  requestPointerLock(): void {
    document.body.requestPointerLock();
  }
  
  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isRunning = true;
        break;
    }
  }
  
  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isRunning = false;
        break;
    }
  }
  
  private onMouseMove(event: MouseEvent): void {
    if (!this.isLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    this.euler.setFromQuaternion(this.camera.quaternion);
    
    this.euler.y -= movementX * this.mouseSensitivity;
    this.euler.x -= movementY * this.mouseSensitivity;
    
    // Clamp vertical look
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
    
    this.camera.quaternion.setFromEuler(this.euler);
  }
  
  update(deltaTime: number): void {
    // Get movement direction
    const direction = new THREE.Vector3();
    const speed = this.isRunning ? this.runSpeed : this.walkSpeed;
    
    if (this.moveForward) direction.z -= 1;
    if (this.moveBackward) direction.z += 1;
    if (this.moveLeft) direction.x -= 1;
    if (this.moveRight) direction.x += 1;
    
    direction.normalize();
    
    // Transform direction by camera rotation (only Y axis)
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
    
    const moveX = direction.x * Math.cos(angle) - direction.z * Math.sin(angle);
    const moveZ = direction.x * Math.sin(angle) + direction.z * Math.cos(angle);
    
    // Apply acceleration
    if (direction.length() > 0) {
      this.velocity.x += moveX * speed * deltaTime * 10;
      this.velocity.z += moveZ * speed * deltaTime * 10;
    }
    
    // Apply friction
    this.velocity.x -= this.velocity.x * this.friction * deltaTime;
    this.velocity.z -= this.velocity.z * this.friction * deltaTime;
    
    // Clamp velocity
    const maxSpeed = speed;
    const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    if (currentSpeed > maxSpeed) {
      this.velocity.x = (this.velocity.x / currentSpeed) * maxSpeed;
      this.velocity.z = (this.velocity.z / currentSpeed) * maxSpeed;
    }
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Update camera position
    this.camera.position.copy(this.position);
  }
  
  getCoordinates(): { x: number; y: number; z: number } {
    return {
      x: Math.floor(this.position.x),
      y: Math.floor(this.position.y),
      z: Math.floor(this.position.z),
    };
  }
  
  getRotation(): number {
    return this.euler.y;
  }
}
