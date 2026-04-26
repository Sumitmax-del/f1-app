'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';
import { startRace, stopRace } from '@/lib/api';
import { getTireColor } from '@/lib/utils';
import { LivePosition } from '@/types';
import {
  Play, Square, Radio, Gauge, Clock, AlertTriangle,
  ChevronUp, ChevronDown, Minus, Zap
} from 'lucide-react';

export default function LiveRacePage() {
  const { socket, isConnected } = useSocket();
  const [raceState, setRaceState] = useState<any>(null);
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [currentLap, setCurrentLap] = useState(0);
  const [totalLaps, setTotalLaps] = useState(57);
  const [fastestLap, setFastestLap] = useState<any>(null);
  const [status, setStatus] = useState<string>('not_started');
  const [events, setEvents] = useState<any[]>([]);
  const [previousPositions, setPreviousPositions] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!socket) return;

    socket.on('race_state', (state: any) => {
      setRaceState(state);
      if (state.positions) setPositions(state.positions);
      setCurrentLap(state.currentLap || 0);
      setTotalLaps(state.totalLaps || 57);
      setFastestLap(state.fastestLap);
      setStatus(state.status || 'not_started');
    });

    socket.on('race_start', (data: any) => {
      setStatus('racing');
      setPositions(data.positions || []);
      setTotalLaps(data.totalLaps || 57);
      setEvents(prev => [{ type: 'start', message: '🏁 Race Started!', time: Date.now() }, ...prev].slice(0, 30));
    });

    socket.on('lap_update', (data: any) => {
      // Track position changes
      const prevPos: Record<string, number> = {};
      positions.forEach(p => { prevPos[p.driverId] = p.position; });
      setPreviousPositions(prevPos);

      setPositions(data.positions || []);
      setCurrentLap(data.currentLap);
      setTotalLaps(data.totalLaps);
      setFastestLap(data.fastestLap);
      setStatus(data.status);
    });

    socket.on('position_change', (data: any) => {
      setEvents(prev => [{
        type: 'overtake',
        message: `⚔️ ${data.overtaker} overtakes ${data.overtaken} for P${data.position}`,
        time: Date.now()
      }, ...prev].slice(0, 30));
    });

    socket.on('pit_stop', (data: any) => {
      setEvents(prev => [{
        type: 'pit',
        message: `🔧 ${data.driverName} pits — ${data.newTire.toUpperCase()} tires (Stop ${data.pitStops})`,
        time: Date.now()
      }, ...prev].slice(0, 30));
    });

    socket.on('retirement', (data: any) => {
      setEvents(prev => [{
        type: 'retirement',
        message: `❌ ${data.driverName} retires on Lap ${data.lap}`,
        time: Date.now()
      }, ...prev].slice(0, 30));
    });

    socket.on('safety_car', () => {
      setEvents(prev => [{
        type: 'safety_car',
        message: '🟡 SAFETY CAR DEPLOYED',
        time: Date.now()
      }, ...prev].slice(0, 30));
    });

    socket.on('green_flag', () => {
      setEvents(prev => [{
        type: 'green_flag',
        message: '🟢 GREEN FLAG — Racing resumes',
        time: Date.now()
      }, ...prev].slice(0, 30));
    });

    socket.on('race_finish', (data: any) => {
      setStatus('finished');
      setPositions(data.positions);
      setEvents(prev => [{
        type: 'finish',
        message: `🏆 ${data.winner?.driverName} wins the race!`,
        time: Date.now()
      }, ...prev].slice(0, 30));
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
      socket.off('race_finish');
    };
  }, [socket, positions]);

  const handleStart = async () => {
    try {
      await startRace();
    } catch (err) {
      console.error('Failed to start race:', err);
    }
  };

  const handleStop = async () => {
    try {
      await stopRace();
      setStatus('finished');
    } catch (err) {
      console.error('Failed to stop race:', err);
    }
  };

  const getPositionChange = (driverId: string, currentPos: number) => {
    const prev = previousPositions[driverId];
    if (prev === undefined) return 0;
    return prev - currentPos;
  };

  const lapProgress = totalLaps > 0 ? (currentLap / totalLaps) * 100 : 0;

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E10600]">Live Race</p>
            {status === 'racing' && <span className="w-2 h-2 rounded-full bg-[#E10600] live-pulse" />}
            {status === 'safety_car' && <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">⚠ SAFETY CAR</span>}
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-white">
            {status === 'not_started' ? 'RACE SIMULATION' : 'MONACO GRAND PRIX'}
          </h1>
        </motion.div>

        {/* Controls & Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 sm:p-5 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Control buttons */}
            <div className="flex items-center gap-3">
              {status === 'not_started' || status === 'finished' ? (
                <button
                  onClick={handleStart}
                  disabled={!isConnected}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E10600] hover:bg-[#B30500] text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                >
                  <Play size={16} /> Start Race
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6B6B8D]/20 hover:bg-[#6B6B8D]/30 text-white font-bold text-sm transition-all border border-white/10"
                >
                  <Square size={16} /> Stop Race
                </button>
              )}
              {!isConnected && (
                <span className="text-xs text-[#E10600]">Connecting to server...</span>
              )}
            </div>

            {/* Lap info */}
            <div className="flex-1 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-[#6B6B8D]" />
                <span className="text-sm font-display font-bold text-white">
                  LAP {currentLap}/{totalLaps}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex-1 hidden sm:block">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#E10600] to-[#FF4444]"
                    animate={{ width: `${lapProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {fastestLap && (
                <div className="flex items-center gap-2 text-xs">
                  <Zap size={12} className="text-purple-400" />
                  <span className="text-purple-400 font-bold">
                    FL: {fastestLap.time}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leaderboard — 2 columns */}
          <div className="lg:col-span-2">
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                <Gauge size={14} className="text-[#E10600]" />
                <span className="font-display font-bold text-white text-xs tracking-wider uppercase">Live Leaderboard</span>
              </div>

              {/* Column headers */}
              <div className="px-5 py-2 grid grid-cols-12 gap-2 text-[10px] text-[#6B6B8D] uppercase tracking-wider font-bold border-b border-white/5">
                <span className="col-span-1">POS</span>
                <span className="col-span-4">DRIVER</span>
                <span className="col-span-2 text-center hidden sm:block">INTERVAL</span>
                <span className="col-span-2 text-center hidden sm:block">LAST LAP</span>
                <span className="col-span-1 text-center">TIRE</span>
                <span className="col-span-1 text-center hidden sm:block">PIT</span>
                <span className="col-span-1 text-center">DRS</span>
              </div>

              <LayoutGroup>
                <AnimatePresence>
                  {positions.map((pos, i) => {
                    const change = getPositionChange(pos.driverId, pos.position);
                    return (
                      <motion.div
                        key={pos.driverId}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: pos.status === 'retired' ? 0.3 : 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        className="px-5 py-2.5 grid grid-cols-12 gap-2 items-center border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Position */}
                        <div className="col-span-1 flex items-center gap-1">
                          <span className="text-sm font-display font-bold text-white">{pos.position}</span>
                          {change > 0 && <ChevronUp size={10} className="text-green-400" />}
                          {change < 0 && <ChevronDown size={10} className="text-red-400" />}
                        </div>

                        {/* Driver */}
                        <div className="col-span-4 flex items-center gap-2">
                          <div className="w-1 h-6 rounded-full" style={{ background: pos.teamColor }} />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{pos.driverName}</p>
                            <p className="text-[10px] text-[#6B6B8D] truncate">{pos.team}</p>
                          </div>
                        </div>

                        {/* Interval */}
                        <span className="col-span-2 text-center text-xs font-mono text-[#6B6B8D] hidden sm:block">
                          {pos.gap === 'LEADER' ? (
                            <span className="text-white font-bold">LEADER</span>
                          ) : pos.interval}
                        </span>

                        {/* Last lap */}
                        <span className={`col-span-2 text-center text-xs font-mono hidden sm:block ${
                          fastestLap?.driverId === pos.driverId ? 'text-purple-400 font-bold' : 'text-[#6B6B8D]'
                        }`}>
                          {pos.lastLapTime}
                        </span>

                        {/* Tire */}
                        <div className="col-span-1 flex justify-center">
                          <span
                            className="w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center"
                            style={{
                              background: getTireColor(pos.tire) + '25',
                              color: getTireColor(pos.tire),
                              border: `1.5px solid ${getTireColor(pos.tire)}`
                            }}
                          >
                            {pos.tire[0].toUpperCase()}
                          </span>
                        </div>

                        {/* Pit stops */}
                        <span className="col-span-1 text-center text-xs text-[#6B6B8D] hidden sm:block">
                          {pos.pitStops}
                        </span>

                        {/* DRS */}
                        <div className="col-span-1 flex justify-center">
                          {pos.drs && pos.status === 'racing' && (
                            <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                              DRS
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </LayoutGroup>
            </div>
          </div>

          {/* Live Feed */}
          <div className="lg:col-span-1">
            {/* Tire Strategy Summary */}
            <div className="glass-card overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-white/5">
                <span className="font-display font-bold text-white text-xs tracking-wider uppercase">Tire Strategy</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3">
                {['soft', 'medium', 'hard'].map(tire => {
                  const count = positions.filter(p => p.tire === tire && p.status !== 'retired').length;
                  return (
                    <div key={tire} className="text-center">
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-black"
                        style={{
                          background: getTireColor(tire) + '20',
                          color: getTireColor(tire),
                          border: `2px solid ${getTireColor(tire)}`
                        }}
                      >
                        {tire[0].toUpperCase()}
                      </div>
                      <span className="text-xs text-[#6B6B8D]">{count} drivers</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Events Feed */}
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                <Radio size={14} className="text-[#E10600]" />
                <span className="font-display font-bold text-white text-xs tracking-wider uppercase">Race Feed</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {events.length === 0 ? (
                  <div className="p-6 text-center text-[#6B6B8D] text-sm">
                    Start a race to see live events
                  </div>
                ) : (
                  events.map((event, i) => (
                    <motion.div
                      key={event.time + i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="px-4 py-3 border-b border-white/[0.03] text-xs"
                    >
                      <p className="text-white/90">{event.message}</p>
                      <p className="text-[#6B6B8D] text-[10px] mt-0.5">
                        Lap {currentLap}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
