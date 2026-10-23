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

import bcrypt from 'bcryptjs';
import { User } from './models/User.js';

// Start server
const startServer = async () => {
  await connectDB();

  // In DEMO_MODE, auto-provision baseline demo account if database is fresh
  if (config.demoMode) {
    try {
      const demoUser = await User.findOne({ email: 'demo@signalbridge.org' });
      if (!demoUser) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('demo12345', salt);
        await User.create({
          name: 'Rohan Verma',
          email: 'demo@signalbridge.org',
          password: passwordHash,
          phone: '+919876543210',
          emergencyContactPhone: '+919876543211',
          bloodGroup: 'O+',
          medicalNotes: 'No chronic allergies. Asthmatic (inhaler carried in bag).',
          lastKnownLocation: {
            lat: 12.9716,
            lng: 77.5946,
            accuracy: 12,
            updatedAt: new Date()
          },
          locationSharing: { enabled: true }
        });
        console.log('[Seed] Auto-provisioned baseline demo user (demo@signalbridge.org)');
      }
    } catch (e) {
      console.warn('[Seed Warning] Could not check/provision demo user:', e.message);
    }
  }

  server.listen(config.port, '0.0.0.0', () => {
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
