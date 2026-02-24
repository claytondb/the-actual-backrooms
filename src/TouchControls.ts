/**
 * Touch Controls for mobile devices
 * - Left side: Virtual joystick for movement
 * - Right side: Touch drag for looking around
 */

export interface TouchInput {
  moveX: number;  // -1 to 1
  moveZ: number;  // -1 to 1 (forward/back)
  lookX: number;  // delta
  lookY: number;  // delta
}

export class TouchControls {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Joystick state
  private joystickActive = false;
  private joystickTouchId: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private joystickPos = { x: 0, y: 0 };
  private readonly joystickRadius = 60;
  private readonly joystickMaxDist = 50;
  
  // Look state
  private lookTouchId: number | null = null;
  private lastLookPos = { x: 0, y: 0 };
  
  // Current input state
  public input: TouchInput = {
    moveX: 0,
    moveZ: 0,
    lookX: 0,
    lookY: 0,
  };
  
  private readonly lookSensitivity = 0.003;
  
  constructor() {
    // Create overlay canvas for joystick visual
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'touch-controls';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 50;
    `;
    document.body.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    
    // Event listeners on document for full screen touch
    document.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.onTouchEnd(e));
    document.addEventListener('touchcancel', (e) => this.onTouchEnd(e));
    
    window.addEventListener('resize', () => this.resize());
  }
  
  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  private onTouchStart(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX;
      const y = touch.clientY;
      
      // Left half = joystick
      if (x < window.innerWidth / 2 && this.joystickTouchId === null) {
        e.preventDefault();
        this.joystickTouchId = touch.identifier;
        this.joystickActive = true;
        this.joystickCenter = { x, y };
        this.joystickPos = { x, y };
      }
      // Right half = look
      else if (x >= window.innerWidth / 2 && this.lookTouchId === null) {
        e.preventDefault();
        this.lookTouchId = touch.identifier;
        this.lastLookPos = { x, y };
      }
    }
  }
  
  private onTouchMove(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      
      // Joystick movement
      if (touch.identifier === this.joystickTouchId) {
        e.preventDefault();
        const dx = touch.clientX - this.joystickCenter.x;
        const dy = touch.clientY - this.joystickCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > this.joystickMaxDist) {
          // Clamp to max distance
          this.joystickPos.x = this.joystickCenter.x + (dx / dist) * this.joystickMaxDist;
          this.joystickPos.y = this.joystickCenter.y + (dy / dist) * this.joystickMaxDist;
        } else {
          this.joystickPos.x = touch.clientX;
          this.joystickPos.y = touch.clientY;
        }
        
        // Normalize to -1 to 1
        this.input.moveX = (this.joystickPos.x - this.joystickCenter.x) / this.joystickMaxDist;
        this.input.moveZ = (this.joystickPos.y - this.joystickCenter.y) / this.joystickMaxDist;
      }
      
      // Look movement
      if (touch.identifier === this.lookTouchId) {
        e.preventDefault();
        const dx = touch.clientX - this.lastLookPos.x;
        const dy = touch.clientY - this.lastLookPos.y;
        
        this.input.lookX = dx * this.lookSensitivity;
        this.input.lookY = dy * this.lookSensitivity;
        
        this.lastLookPos = { x: touch.clientX, y: touch.clientY };
      }
    }
  }
  
  private onTouchEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      
      if (touch.identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.joystickActive = false;
        this.input.moveX = 0;
        this.input.moveZ = 0;
      }
      
      if (touch.identifier === this.lookTouchId) {
        this.lookTouchId = null;
        this.input.lookX = 0;
        this.input.lookY = 0;
      }
    }
  }
  
  update(): void {
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw joystick if active
    if (this.joystickActive) {
      // Outer circle
      this.ctx.beginPath();
      this.ctx.arc(this.joystickCenter.x, this.joystickCenter.y, this.joystickRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(196, 184, 150, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Inner circle (thumb position)
      this.ctx.beginPath();
      this.ctx.arc(this.joystickPos.x, this.joystickPos.y, 25, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(196, 184, 150, 0.5)';
      this.ctx.fill();
    }
    
    // Reset look deltas after being read
    this.input.lookX = 0;
    this.input.lookY = 0;
  }
  
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
