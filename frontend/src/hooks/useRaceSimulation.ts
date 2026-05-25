/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { startRace, stopRace } from '@/lib/api';
import { LivePosition, WeatherCondition } from '@/types';

interface RaceEvent {
  type: string;
  message: string;
  time: number;
}

export function useRaceSimulation() {
  const { socket, isConnected } = useSocket();
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [currentLap, setCurrentLap] = useState(0);
  const [totalLaps, setTotalLaps] = useState(57);
  const [fastestLap, setFastestLap] = useState<{ driverId: string; time: string } | null>(null);
  const [status, setStatus] = useState<string>('not_started');
  const [weather, setWeather] = useState<WeatherCondition>('dry');
  const [trackId, setTrackId] = useState<string>('');
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [previousPositions, setPreviousPositions] = useState<Record<string, number>>({});
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const positionsRef = useRef<LivePosition[]>([]);

  // Keep ref in sync
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    if (!socket) return;

    socket.on('race_state', (state: any) => {
      if (state.positions) setPositions(state.positions);
      setCurrentLap(state.currentLap || 0);
      setTotalLaps(state.totalLaps || 57);
      setFastestLap(state.fastestLap);
      setStatus(state.status || 'not_started');
      setWeather(state.weather || 'dry');
      setTrackId(state.trackId || '');
    });

    socket.on('race_start', (data: any) => {
      setStatus('racing');
      setPositions(data.positions || []);
      setTotalLaps(data.totalLaps || 57);
      setTrackId(data.trackId || '');
      setWeather(data.weather || 'dry');
      setEvents(prev => [
        { type: 'start', message: '🏁 Race Started!', time: Date.now() },
        ...prev,
      ].slice(0, 50));
    });

    socket.on('lap_update', (data: any) => {
      // Track position changes
      const prevPos: Record<string, number> = {};
      positionsRef.current.forEach(p => { prevPos[p.driverId] = p.position; });
      setPreviousPositions(prevPos);

      setPositions(data.positions || []);
      setCurrentLap(data.currentLap);
      setTotalLaps(data.totalLaps);
      setFastestLap(data.fastestLap);
      setStatus(data.status);
      setWeather(data.weather || 'dry');
    });

    socket.on('position_change', (data: any) => {
      setEvents(prev => [{
        type: 'overtake',
        message: `⚔️ ${data.overtaker} overtakes ${data.overtaken} for P${data.position}`,
        time: Date.now(),
      }, ...prev].slice(0, 50));
    });

    socket.on('pit_stop', (data: any) => {
      setEvents(prev => [{
        type: 'pit',
        message: `🔧 ${data.driverName} pits — ${data.newTire.toUpperCase()} tires (Stop ${data.pitStops})`,
        time: Date.now(),
      }, ...prev].slice(0, 50));
    });

    socket.on('retirement', (data: any) => {
      setEvents(prev => [{
        type: 'retirement',
        message: `❌ ${data.driverName} retires on Lap ${data.lap}`,
        time: Date.now(),
      }, ...prev].slice(0, 50));
    });

    socket.on('safety_car', () => {
      setEvents(prev => [{
        type: 'safety_car',
        message: '🟡 SAFETY CAR DEPLOYED',
        time: Date.now(),
      }, ...prev].slice(0, 50));
    });

    socket.on('green_flag', () => {
      setEvents(prev => [{
        type: 'green_flag',
        message: '🟢 GREEN FLAG — Racing resumes',
        time: Date.now(),
      }, ...prev].slice(0, 50));
    });

    socket.on('weather_change', (data: any) => {
      const weatherLabels: Record<string, string> = {
        dry: '☀️ Track is dry',
        light_rain: '🌧️ Light rain starting',
        heavy_rain: '⛈️ Heavy rain — conditions worsening',
      };
      setEvents(prev => [{
        type: 'weather',
        message: weatherLabels[data.weather] || `Weather: ${data.weather}`,
        time: Date.now(),
      }, ...prev].slice(0, 50));
    });

    socket.on('race_finish', (data: any) => {
      setStatus('finished');
      setPositions(data.positions);
      setEvents(prev => [{
        type: 'finish',
        message: `🏆 ${data.winner?.driverName} wins the race!`,
        time: Date.now(),
      }, ...prev].slice(0, 50));
    });

    socket.on('race_stopped', () => {
      setStatus('finished');
    });

    return () => {
      socket.off('race_state');
      socket.off('race_start');
      socket.off('lap_update');
      socket.off('position_change');
      socket.off('pit_stop');
      socket.off('retirement');
      socket.off('safety_car');
      socket.off('green_flag');
      socket.off('weather_change');
      socket.off('race_finish');
      socket.off('race_stopped');
    };
  }, [socket]);

  const handleStart = useCallback(async (selectedTrackId: string) => {
    try {
      setTrackId(selectedTrackId);
      setEvents([]);
      setCurrentLap(0);
      setFastestLap(null);
      setPreviousPositions({});
      setSelectedDriver(null);
      await startRace(selectedTrackId);
    } catch (err) {
      console.error('Failed to start race:', err);
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await stopRace();
      setStatus('finished');
    } catch (err) {
      console.error('Failed to stop race:', err);
    }
  }, []);

  const selectedDriverData = selectedDriver
    ? positions.find(p => p.driverId === selectedDriver) || null
    : null;

  return {
    positions,
    currentLap,
    totalLaps,
    fastestLap,
    status,
    weather,
    trackId,
    events,
    previousPositions,
    selectedDriver,
    selectedDriverData,
    isConnected,
    setSelectedDriver,
    handleStart,
    handleStop,
  };
}
