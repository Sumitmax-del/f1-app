import { Router } from 'express';
import { RaceSimulator } from '../services/raceSimulator';

let simulator: RaceSimulator | null = null;

export function setSimulator(sim: RaceSimulator) {
  simulator = sim;
}

const router = Router();

router.post('/start', (_req, res) => {
  if (!simulator) {
    return res.status(500).json({ success: false, error: 'Simulator not initialized' });
  }
  const state = simulator.startRace();
  res.json({ success: true, data: state });
});

router.post('/stop', (_req, res) => {
  if (!simulator) {
    return res.status(500).json({ success: false, error: 'Simulator not initialized' });
  }
  simulator.stopRace();
  res.json({ success: true, message: 'Race stopped' });
});

router.get('/status', (_req, res) => {
  if (!simulator) {
    return res.status(500).json({ success: false, error: 'Simulator not initialized' });
  }
  res.json({ success: true, data: simulator.getState() });
});

export default router;
