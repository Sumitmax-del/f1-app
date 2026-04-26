import { Router } from 'express';
import { getDriverStandings, getConstructorStandings } from '../services/f1DataService';

const router = Router();

router.get('/drivers', async (_req, res) => {
  try {
    const standings = await getDriverStandings();
    res.json({ success: true, data: standings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch driver standings' });
  }
});

router.get('/constructors', async (_req, res) => {
  try {
    const standings = await getConstructorStandings();
    res.json({ success: true, data: standings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch constructor standings' });
  }
});

export default router;
