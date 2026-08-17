'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PostRaceResult, PodiumFinisher } from '@/types';
import {
  Trophy, Zap, ChevronUp, ChevronDown, Flag, Award, Timer,
} from 'lucide-react';

interface PostRaceViewProps {
  raceName: string;
  trackId: string;
  podium: PodiumFinisher[];
  results: PostRaceResult[];
  totalLaps: number;
}

export default function PostRaceView({
  raceName,
  podium,
  results,
  totalLaps,
}: PostRaceViewProps) {
  const stats = useMemo(() => {
    const finished = results.filter(r => r.status === 'finished');
    const dnfs = results.filter(r => r.status === 'dnf').length;
    if (finished.length === 0) {
      return { dnfs, mostGained: null, fastestDriver: null };
    }
    const mostGained = finished.reduce((best, r) => r.positionsGained > best.positionsGained ? r : best, finished[0]);
    const fastestDriver = finished.reduce((best, r) => {
      if (best.fastestLap === '-' || !best.fastestLap) return r;
      if (r.fastestLap === '-' || !r.fastestLap) return best;
      try {
        const bestTime = parseFloat(best.fastestLap.split(':')[0]) * 60 + parseFloat(best.fastestLap.split(':')[1]);
        const currTime = parseFloat(r.fastestLap.split(':')[0]) * 60 + parseFloat(r.fastestLap.split(':')[1]);
        return currTime < bestTime ? r : best;
      } catch (e) {
        return best;
      }
    }, finished[0]);
    return { dnfs, mostGained, fastestDriver };
  }, [results]);

  // Podium display order: P2, P1, P3 (P1 in center, elevated)
  const podiumOrder = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;
  const podiumHeights = ['h-28', 'h-40', 'h-20'];
  const podiumDelays = [0.3, 0.1, 0.5];

  return (
    <div className="space-y-6">
      {/* Race Complete Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 text-center racing-stripe checkered relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flag size={16} className="text-[#E10600]" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#E10600]">
              Race Complete
            </span>
            <Flag size={16} className="text-[#E10600]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-wide" style={{ color: 'var(--text-primary)' }}>
            🏁 {raceName.toUpperCase()}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {totalLaps} Laps Completed
          </p>
        </div>
      </motion.div>

      {/* Podium Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 lg:p-8"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Trophy size={16} className="text-amber-400" />
          <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
            Podium
          </span>
        </div>

        {/* Podium blocks */}
        <div className="flex items-end justify-center gap-4 sm:gap-8 max-w-2xl mx-auto">
          {podiumOrder.map((driver, i) => {
            const isWinner = driver.position === 1;
            return (
              <motion.div
                key={driver.driverId}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: podiumDelays[i], type: 'spring', stiffness: 150, damping: 15 }}
                className="flex-1 max-w-[200px] text-center"
              >
                {/* Driver Info */}
                <div className="mb-3">
                  {/* Trophy/Position */}
                  <div className="flex justify-center mb-2">
                    {isWinner ? (
                      <motion.div
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Trophy size={32} className="text-amber-400 drop-shadow-lg" />
                      </motion.div>
                    ) : (
                      <Award size={24} className={driver.position === 2 ? 'text-gray-300' : 'text-amber-600'} />
                    )}
                  </div>

                  {/* Driver Avatar */}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center font-display font-black text-white text-xl sm:text-2xl mb-2 ${
                      isWinner ? 'podium-winner-glow' : ''
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${driver.teamColor}, ${driver.teamColor}99)`,
                      border: isWinner ? '2px solid rgba(255,215,0,0.5)' : '2px solid var(--border)',
                    }}
                  >
                    {driver.driverCode}
                  </div>

                  <p className={`font-display font-black ${isWinner ? 'text-base sm:text-lg' : 'text-sm'}`} style={{ color: 'var(--text-primary)' }}>
                    {driver.driverName.split(' ').pop()}
                  </p>
                  <p className="text-[10px] font-bold" style={{ color: driver.teamColor }}>
                    {driver.team}
                  </p>
                  <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {driver.totalTime}
                  </p>
                  {driver.hasFastestLap && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                      <Zap size={8} /> Fastest Lap
                    </span>
                  )}
                </div>

                {/* Podium Step */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  transition={{ delay: podiumDelays[i] + 0.3, duration: 0.5 }}
                  className={`rounded-t-xl ${podiumHeights[i]} flex items-center justify-center relative overflow-hidden`}
                  style={{
                    background: `linear-gradient(180deg, ${driver.teamColor}30, ${driver.teamColor}10)`,
                    border: `1px solid ${driver.teamColor}40`,
                    borderBottom: 'none',
                  }}
                >
                  <span
                    className={`font-display font-black ${isWinner ? 'text-4xl' : 'text-2xl'}`}
                    style={{ color: `${driver.teamColor}60` }}
                  >
                    P{driver.position}
                  </span>
                  {isWinner && (
                    <div className="absolute inset-0 podium-confetti pointer-events-none" />
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Race Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: 'Winner', value: podium[0]?.driverCode || '-', icon: Trophy, color: '#FFD700' },
          { label: 'Fastest Lap', value: stats.fastestDriver?.driverCode || '-', icon: Zap, color: '#a855f7' },
          { label: 'Most Gained', value: stats.mostGained ? `${stats.mostGained.driverCode} +${stats.mostGained.positionsGained}` : '-', icon: ChevronUp, color: '#22c55e' },
          { label: 'DNFs', value: String(stats.dnfs), icon: Flag, color: '#ef4444' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <Icon size={16} className="mx-auto mb-1" style={{ color }} />
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-sm font-display font-black mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </motion.div>

      {/* Complete Results Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card overflow-hidden"
      >
        <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <Timer size={14} className="text-[#E10600]" />
          <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
            Race Classification
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">P</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Driver</th>
                <th className="px-3 py-2 text-left font-bold uppercase tracking-wider hidden sm:table-cell">Team</th>
                <th className="px-3 py-2 text-center font-bold uppercase tracking-wider">Laps</th>
                <th className="px-3 py-2 text-center font-bold uppercase tracking-wider">Time/Gap</th>
                <th className="px-3 py-2 text-center font-bold uppercase tracking-wider hidden md:table-cell">Pits</th>
                <th className="px-3 py-2 text-center font-bold uppercase tracking-wider hidden md:table-cell">FL</th>
                <th className="px-3 py-2 text-center font-bold uppercase tracking-wider hidden sm:table-cell">Grid</th>
                <th className="px-3 py-2 text-center font-bold uppercase tracking-wider hidden sm:table-cell">+/-</th>
                <th className="px-3 py-2 text-center font-bold uppercase tracking-wider">PTS</th>
              </tr>
            </thead>
            <tbody>
              {results.sort((a, b) => {
                if (a.status === 'dnf' && b.status !== 'dnf') return 1;
                if (a.status !== 'dnf' && b.status === 'dnf') return -1;
                return a.position - b.position;
              }).map((result, idx) => {
                const isDNF = result.status === 'dnf';
                const isFastestLap = result.fastestLapRank === 1;
                return (
                  <tr
                    key={result.driverId}
                    className={`border-b transition-colors ${isDNF ? 'opacity-40' : 'hover:bg-[var(--surface-hover)]'}`}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-display font-bold" style={{
                        color: idx < 3 && !isDNF ? '#E10600' : 'var(--text-primary)',
                      }}>
                        {isDNF ? 'DNF' : result.position}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-0.5 h-5 rounded-full shrink-0" style={{ background: result.teamColor }} />
                        <div>
                          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{result.driverCode}</p>
                          <p className="text-[9px] hidden lg:block" style={{ color: 'var(--text-muted)' }}>
                            {result.driverName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      {result.team}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {result.lapsCompleted}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold" style={{ color: isDNF ? '#ef4444' : idx === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {result.totalTime}
                    </td>
                    <td className="px-3 py-2.5 text-center hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>
                      {result.pitStops}
                    </td>
                    <td className="px-3 py-2.5 text-center hidden md:table-cell">
                      <span className={isFastestLap ? 'text-purple-400 font-bold' : ''} style={{ color: isFastestLap ? undefined : 'var(--text-muted)' }}>
                        {isFastestLap && <Zap size={8} className="inline mr-0.5" />}
                        {result.fastestLap}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                      P{result.gridPosition}
                    </td>
                    <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                      {result.positionsGained > 0 ? (
                        <span className="text-green-400 font-bold flex items-center justify-center gap-0.5">
                          <ChevronUp size={10} />+{result.positionsGained}
                        </span>
                      ) : result.positionsGained < 0 ? (
                        <span className="text-red-400 font-bold flex items-center justify-center gap-0.5">
                          <ChevronDown size={10} />{result.positionsGained}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-display font-bold" style={{ color: result.points > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {result.points || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
