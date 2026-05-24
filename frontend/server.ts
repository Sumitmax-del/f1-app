import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';

import driversRouter from './src/server/routes/drivers';
import teamsRouter from './src/server/routes/teams';
import standingsRouter from './src/server/routes/standings';
import racesRouter from './src/server/routes/races';
import liveRouter, { setSimulator } from './src/server/routes/live';
import authRouter from './src/server/routes/auth';
import { RaceSimulator } from './src/server/services/raceSimulator';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);

  // Socket.io
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Express middleware
  server.use(express.json());

  // Request logging for API routes
  server.use('/api', (req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // REST API Routes
  server.use('/api/drivers', driversRouter);
  server.use('/api/teams', teamsRouter);
  server.use('/api/standings', standingsRouter);
  server.use('/api/races', racesRouter);
  server.use('/api/live', liveRouter);
  server.use('/api/auth', authRouter);

  // Health check
  server.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Initialize Race Simulator
  const simulator = new RaceSimulator(io);
  setSimulator(simulator);

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Send current race state on connect
    socket.emit('race_state', simulator.getState());

    socket.on('start_race', () => {
      console.log(`[SOCKET] Race start requested by ${socket.id}`);
      simulator.startRace();
    });

    socket.on('stop_race', () => {
      console.log(`[SOCKET] Race stop requested by ${socket.id}`);
      simulator.stopRace();
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });

  // All other routes handled by Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`
  ╔══════════════════════════════════════════════╗
  ║     🏎️  F1 App — Unified Server Running  🏎️   ║
  ║                                              ║
  ║   App:       http://localhost:${port}            ║
  ║   API:       http://localhost:${port}/api        ║
  ║   WebSocket: ws://localhost:${port}              ║
  ╚══════════════════════════════════════════════╝
    `);
  });
});
