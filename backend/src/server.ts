import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import driversRouter from './routes/drivers';
import teamsRouter from './routes/teams';
import standingsRouter from './routes/standings';
import racesRouter from './routes/races';
import liveRouter, { setSimulator } from './routes/live';
import authRouter from './routes/auth';
import { RaceSimulator } from './services/raceSimulator';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// REST API Routes
app.use('/api/drivers', driversRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/races', racesRouter);
app.use('/api/live', liveRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (_req, res) => {
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

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     🏎️  F1 Backend Server Running  🏎️     ║
  ║                                          ║
  ║   REST API: http://localhost:${PORT}/api    ║
  ║   WebSocket: ws://localhost:${PORT}         ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
