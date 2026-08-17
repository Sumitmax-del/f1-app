import { Router } from 'express';
import { getRaces, COUNTRY_FLAGS } from '../services/f1DataService';

const router = Router();

const CIRCUIT_TIMEZONES: Record<string, string> = {
  albert_park: 'Australia/Melbourne',
  shanghai: 'Asia/Shanghai',
  suzuka: 'Asia/Tokyo',
  bahrain: 'Asia/Bahrain',
  jeddah: 'Asia/Riyadh',
  miami: 'America/New_York',
  imola: 'Europe/Rome',
  monaco: 'Europe/Monaco',
  catalunya: 'Europe/Madrid',
  spa: 'Europe/Brussels',
  hungaroring: 'Europe/Budapest',
  zandvoort: 'Europe/Amsterdam',
  monza: 'Europe/Rome',
  baku: 'Asia/Baku',
  marina_bay: 'Asia/Singapore',
  americas: 'America/Chicago',
  rodriguez: 'America/Mexico_City',
  interlagos: 'America/Sao_Paulo',
  las_vegas: 'America/Los_Angeles',
  losail: 'Asia/Qatar',
  yas_marina: 'Asia/Dubai',
};

// Unified helper to enrich race schedule dynamically with standard sessions and timezones
function enrichRaceData(race: any, now: Date) {
  const raceStart = new Date(`${race.date}T${race.time || '13:00:00Z'}`);
  // Average race length is 2 hours; we set race end time at 2.5 hours
  const raceEnd = new Date(raceStart.getTime() + 2.5 * 60 * 60 * 1000);
  const isPast = raceEnd < now;

  // Generate standardized ISO UTC session times relative to the main race time
  const getISOStringOffset = (baseDate: Date, hoursOffset: number) => {
    const d = new Date(baseDate.getTime());
    d.setHours(d.getHours() + hoursOffset);
    return d.toISOString();
  };

  const sessions = {
    fp1: getISOStringOffset(raceStart, -48 - 1.5), // Friday morning (11:30 UTC if 13:00 UTC race)
    fp2: getISOStringOffset(raceStart, -48 + 2),   // Friday afternoon (15:00 UTC)
    fp3: getISOStringOffset(raceStart, -24 - 2.5), // Saturday morning (10:30 UTC)
    qualifying: getISOStringOffset(raceStart, -24 + 1), // Saturday afternoon (14:00 UTC)
    race: raceStart.toISOString(),
  };

  return {
    ...race,
    flag: COUNTRY_FLAGS[race.country] || '🏁',
    isPast,
    isNext: false,
    timezone: CIRCUIT_TIMEZONES[race.circuitId] || 'UTC',
    sessions,
  };
}

router.get('/', async (_req, res) => {
  try {
    const races = await getRaces();
    const now = new Date();
    const enrichedRaces = races.map(race => enrichRaceData(race, now));

    // Sort chronologically
    enrichedRaces.sort((a, b) => new Date(a.sessions.race).getTime() - new Date(b.sessions.race).getTime());

    // Resolve active next event (first race where race_end_time > now)
    const nextRace = enrichedRaces.find(r => !r.isPast);
    if (nextRace) {
      nextRace.isNext = true;
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
    const enrichedRaces = races.map(race => enrichRaceData(race, now));
    
    // Sort chronologically
    enrichedRaces.sort((a, b) => new Date(a.sessions.race).getTime() - new Date(b.sessions.race).getTime());

    // Find the next active race
    const nextRace = enrichedRaces.find(r => !r.isPast);
    if (!nextRace) {
      return res.json({ success: true, data: null, message: 'Season complete' });
    }

    res.json({
      success: true,
      data: nextRace
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch next race' });
  }
});

router.get('/:round', async (req, res) => {
  try {
    const races = await getRaces();
    const race = races.find(r => r.round === req.params.round);
    if (!race) {
      return res.status(404).json({ success: false, error: 'Race not found' });
    }
    const enriched = enrichRaceData(race, new Date());
    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch race' });
  }
});

export default router;
