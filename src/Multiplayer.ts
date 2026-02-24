/**
 * Multiplayer - Handles player synchronization
 * Uses Socket.io for real-time communication
 * 
 * Architecture notes:
 * - All clients generate the same world (deterministic seeding)
 * - Server only syncs player positions/rotations
 * - Scales well because no world state is sent over the wire
 */

import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import type { PlayerState } from './types';

// Simple player avatar (just a floating figure for now)
function createPlayerAvatar(): THREE.Group {
  const group = new THREE.Group();
  
  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: 0x444444,
    transparent: true,
    opacity: 0.7,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.8;
  group.add(body);
  
  // Head
  const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 1.5;
  group.add(head);
  
  return group;
}

export class Multiplayer {
  private socket: Socket | null = null;
  private scene: THREE.Scene;
  private players: Map<string, THREE.Group> = new Map();
  private localPlayerId: string = '';
  private onPlayerCountChange?: (count: number) => void;
  private connected = false;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  connect(serverUrl?: string): void {
    // Default to localhost for development
    // In production, this would be your deployed server
    const url = serverUrl || 'ws://localhost:3001';
    
    try {
      this.socket = io(url, {
        reconnection: true,
        reconnectionDelay: 1000,
        timeout: 5000,
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to multiplayer server');
        this.connected = true;
        this.localPlayerId = this.socket!.id || '';
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from multiplayer server');
        this.connected = false;
      });
      
      this.socket.on('connect_error', () => {
        // Silent fail - single player mode
        this.connected = false;
      });
      
      // Receive other player updates
      this.socket.on('players', (players: PlayerState[]) => {
        this.updatePlayers(players);
        this.onPlayerCountChange?.(players.length);
      });
      
      // Player joined
      this.socket.on('player_joined', (player: PlayerState) => {
        this.addPlayer(player);
      });
      
      // Player left
      this.socket.on('player_left', (playerId: string) => {
        this.removePlayer(playerId);
      });
      
      // Player moved
      this.socket.on('player_moved', (player: PlayerState) => {
        this.updatePlayerPosition(player);
      });
      
    } catch (e) {
      console.log('Multiplayer not available - single player mode');
    }
  }
  
  setOnPlayerCountChange(callback: (count: number) => void): void {
    this.onPlayerCountChange = callback;
  }
  
  sendPosition(position: THREE.Vector3, rotation: number): void {
    if (!this.socket || !this.connected) return;
    
    this.socket.emit('move', {
      position: { x: position.x, y: position.y, z: position.z },
      rotation,
    });
  }
  
  private updatePlayers(players: PlayerState[]): void {
    // Remove players that left
    const currentIds = new Set(players.map(p => p.id));
    for (const [id, avatar] of this.players.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(avatar);
        this.players.delete(id);
      }
    }
    
    // Add/update players
    for (const player of players) {
      if (player.id === this.localPlayerId) continue;
      this.updatePlayerPosition(player);
    }
  }
  
  private addPlayer(player: PlayerState): void {
    if (player.id === this.localPlayerId) return;
    if (this.players.has(player.id)) return;
    
    const avatar = createPlayerAvatar();
    avatar.position.set(player.position.x, 0, player.position.z);
    avatar.rotation.y = player.rotation;
    
    this.players.set(player.id, avatar);
    this.scene.add(avatar);
  }
  
  private removePlayer(playerId: string): void {
    const avatar = this.players.get(playerId);
    if (avatar) {
      this.scene.remove(avatar);
      this.players.delete(playerId);
    }
  }
  
  private updatePlayerPosition(player: PlayerState): void {
    if (player.id === this.localPlayerId) return;
    
    let avatar = this.players.get(player.id);
    if (!avatar) {
      avatar = createPlayerAvatar();
      this.players.set(player.id, avatar);
      this.scene.add(avatar);
    }
    
    // Smooth interpolation
    avatar.position.lerp(
      new THREE.Vector3(player.position.x, 0, player.position.z),
      0.1
    );
    avatar.rotation.y = player.rotation;
  }
  
  getPlayerCount(): number {
    return this.players.size + 1; // +1 for local player
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
    
    // Clean up avatars
    for (const avatar of this.players.values()) {
      this.scene.remove(avatar);
    }
    this.players.clear();
  }
}
