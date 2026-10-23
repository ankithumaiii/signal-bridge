import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket/socketHandler.js';

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach io instance to express app so routes/controllers can access it
app.set('io', io);

// Initialize socket events
initSocket(io);

// Start server
const startServer = async () => {
  await connectDB();

  server.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`🚀 Signal Bridge Server is LIVE`);
    console.log(`📡 Port: ${config.port} (${config.nodeEnv})`);
    console.log(`🚨 Emergency 112 System: Configured`);
    console.log(`📍 Demo Mode: ${config.demoMode ? 'ENABLED (Simulations Marked)' : 'DISABLED'}`);
    console.log(`=========================================`);
  });
};

startServer();

export { app, server, io };
