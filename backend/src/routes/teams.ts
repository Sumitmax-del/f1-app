import { Router } from 'express';
import { getTeams, getTeamById } from '../services/f1DataService';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const teams = await getTeams();
    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch teams' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const team = await getTeamById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch team' });
  }
});

export default router;
