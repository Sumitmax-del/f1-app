import { Router } from 'express';
import { getDrivers, getDriverById } from '../services/f1DataService';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const drivers = await getDrivers();
    res.json({ success: true, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch drivers' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const driver = await getDriverById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch driver' });
  }
});

export default router;
