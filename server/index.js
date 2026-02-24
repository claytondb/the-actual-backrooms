/**
 * Backrooms Multiplayer Server
 * Handles player position synchronization
 * 
 * Designed to scale to many concurrent players:
 * - No world state is stored on server (deterministic generation on client)
 * - Only player positions are synchronized
 * - Spatial partitioning could be added for very large player counts
 */

const { Server } = require('socket.io');
const http = require('http');

const PORT = process.env.PORT || 3001;

// Create HTTP server
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Backrooms Multiplayer Server');
});

// Create Socket.io server with CORS
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Player state storage
const players = new Map();

// Broadcast rate limiting
const BROADCAST_INTERVAL = 50; // 20 updates per second
let lastBroadcast = 0;

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Initialize player state
  players.set(socket.id, {
    id: socket.id,
    position: { x: 0, y: 1.6, z: 0 },
    rotation: 0,
  });
  
  // Send current players to new player
  socket.emit('players', Array.from(players.values()));
  
  // Notify others
  socket.broadcast.emit('player_joined', players.get(socket.id));
  
  // Handle movement
  socket.on('move', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      
      // Rate-limited broadcast
      const now = Date.now();
      if (now - lastBroadcast > BROADCAST_INTERVAL) {
        socket.broadcast.emit('player_moved', player);
        lastBroadcast = now;
      }
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    players.delete(socket.id);
    io.emit('player_left', socket.id);
  });
});

// Periodic full state broadcast (for reconnections)
setInterval(() => {
  if (players.size > 0) {
    io.emit('players', Array.from(players.values()));
  }
}, 5000);

httpServer.listen(PORT, () => {
  console.log(`Backrooms server running on port ${PORT}`);
  console.log(`Players online: ${players.size}`);
});

// Log player count periodically
setInterval(() => {
  if (players.size > 0) {
    console.log(`Active players: ${players.size}`);
  }
}, 30000);
