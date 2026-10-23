import express from 'express';
import mongoose from 'mongoose';
import { config } from '../config/env.js';

const router = express.Router();

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'Signal Bridge API Engine',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    demoMode: config.demoMode,
    version: '1.0.0'
  });
});

export default router;
