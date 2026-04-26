import { Router } from 'express';
import { getRaces, getRaceByRound, COUNTRY_FLAGS } from '../services/f1DataService';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const races = await getRaces();
    const enrichedRaces = races.map(race => ({
      ...race,
      flag: COUNTRY_FLAGS[race.country] || '🏁',
      isPast: new Date(race.date) < new Date(),
      isNext: false,
    }));

    // Mark next race
    const now = new Date();
    const futureRaces = enrichedRaces.filter(r => !r.isPast);
    if (futureRaces.length > 0) {
      futureRaces[0].isNext = true;
    }

    res.json({ success: true, data: enrichedRaces });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch races' });
  }
});

router.get('/next', async (_req, res) => {
  try {
    const races = await getRaces();
    const now = new Date();
    const nextRace = races.find(r => new Date(r.date) > now);
    if (!nextRace) {
      return res.json({ success: true, data: null, message: 'Season complete' });
    }
    res.json({
      success: true,
      data: {
        ...nextRace,
        flag: COUNTRY_FLAGS[nextRace.country] || '🏁'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch next race' });
  }
});

router.get('/:round', async (req, res) => {
  try {
    const race = await getRaceByRound(req.params.round);
    if (!race) {
      return res.status(404).json({ success: false, error: 'Race not found' });
    }
    res.json({
      success: true,
      data: {
        ...race,
        flag: COUNTRY_FLAGS[race.country] || '🏁'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch race' });
  }
});

export default router;
