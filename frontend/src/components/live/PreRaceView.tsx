'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCountdown } from '@/lib/utils';
import {
  PracticeResult,
  QualifyingResult,
} from '@/types';
import {
  Clock, Trophy, Flag, ChevronRight, Zap,
} from 'lucide-react';

interface PreRaceViewProps {
  raceName: string;
  circuitName: string;
  country: string;
  countryFlag: string;
  raceStart: string | Date;
  sessions: Record<string, string>;
  timezone?: string;
  fpResults: { fp1: PracticeResult[]; fp2: PracticeResult[]; fp3: PracticeResult[] };
  qualifyingResults: QualifyingResult[];
}

export default function PreRaceView({
  raceName,
  circuitName,
  country,
  countryFlag,
  raceStart,
  sessions,
  timezone = 'UTC',
  fpResults,
  qualifyingResults,
}: PreRaceViewProps) {
  const targetDate = useMemo(() => new Date(raceStart), [raceStart]);
  const [countdown, setCountdown] = useState(formatCountdown(targetDate));
  const [activeTab, setActiveTab] = useState<'practice' | 'qualifying' | 'grid'>('qualifying');
  const [practiceSession, setPracticeSession] = useState<'fp1' | 'fp2' | 'fp3'>('fp3');
  const [qualifyingPhase, setQualifyingPhase] = useState<'Q1' | 'Q2' | 'Q3'>('Q3');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(formatCountdown(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  // Helper to format session UTC ISO string to User Local & Track Local times
  const formatSessionTime = (isoString: string, trackTimezone: string) => {
    try {
      const date = new Date(isoString);
      
      // Format for user local browser time
      const userFormatter = new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      
      // Format for track local timezone
      const trackFormatter = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: trackTimezone,
        timeZoneName: 'short',
      });

      return {
        userTime: userFormatter.format(date),
        trackTime: trackFormatter.format(date),
      };
    } catch (e) {
      return { userTime: isoString, trackTime: '' };
    }
  };

  const currentPractice = fpResults[practiceSession];

  const filteredQualifying = useMemo(() => {
    if (qualifyingPhase === 'Q1') return qualifyingResults;
    if (qualifyingPhase === 'Q2') return qualifyingResults.filter(r => r.eliminated !== 'Q1');
    return qualifyingResults.filter(r => !r.eliminated);
  }, [qualifyingResults, qualifyingPhase]);

  const fastestSectors = useMemo(() => {
    const results = currentPractice || [];
    let s1 = Infinity, s2 = Infinity, s3 = Infinity;
    results.forEach(r => {
      const v1 = parseFloat(r.sector1); if (!isNaN(v1) && v1 < s1) s1 = v1;
      const v2 = parseFloat(r.sector2); if (!isNaN(v2) && v2 < s2) s2 = v2;
      const v3 = parseFloat(r.sector3); if (!isNaN(v3) && v3 < s3) s3 = v3;
    });
    return { s1, s2, s3 };
  }, [currentPractice]);

  return (
    <div className="space-y-6">
      {/* Race Info Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 racing-stripe"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Race Identity */}
          <div className="flex-1 pl-4">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E10600] mb-1">
              Race Weekend
            </p>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-wide" style={{ color: 'var(--text-primary)' }}>
              {countryFlag} {raceName.toUpperCase()}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {circuitName} — {country}
            </p>
            {/* Session Schedule */}
            <div className="flex flex-wrap gap-2.5 mt-3">
              {Object.entries(sessions).map(([key, time]) => {
                const formatted = formatSessionTime(time, timezone);
                return (
                  <span
                    key={key}
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                    style={{
                      background: key === 'race' ? 'rgba(225, 6, 0, 0.12)' : 'var(--surface)',
                      color: key === 'race' ? '#E10600' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span className="font-black" style={{ color: key === 'race' ? '#E10600' : 'var(--text-primary)' }}>
                      {key}
                    </span>
                    <span className="font-mono text-themed">
                      {formatted.userTime}
                    </span>
                    {formatted.trackTime && (
                      <span className="text-[8px] font-mono text-themed-muted font-normal">
                        ({formatted.trackTime} Track)
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-center mb-2" style={{ color: 'var(--text-muted)' }}>
              <Clock size={10} className="inline mr-1" />
              Race Starts In
            </p>
            <div className="flex gap-2">
              {[
                { label: 'DAYS', value: countdown.days },
                { label: 'HRS', value: countdown.hours },
                { label: 'MIN', value: countdown.minutes },
                { label: 'SEC', value: countdown.seconds },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center font-display font-black text-2xl"
                    style={{
                      background: 'var(--countdown-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-accent)',
                    }}
                  >
                    {String(value).padStart(2, '0')}
                  </div>
                  <span className="text-[8px] font-bold tracking-wider mt-1 block" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2"
      >
        {[
          { id: 'practice' as const, label: 'Free Practice', icon: Flag },
          { id: 'qualifying' as const, label: 'Qualifying', icon: Zap },
          { id: 'grid' as const, label: 'Starting Grid', icon: ChevronRight },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === id
                ? 'bg-[#E10600] text-white shadow-lg shadow-red-500/20'
                : 'glass-card hover:bg-[var(--surface-hover)]'
            }`}
            style={{ color: activeTab === id ? '#fff' : 'var(--text-secondary)' }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card overflow-hidden"
          >
            {/* Session toggle */}
            <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <Flag size={14} className="text-[#E10600]" />
              <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                Free Practice Results
              </span>
              <div className="ml-auto flex gap-1">
                {(['fp1', 'fp2', 'fp3'] as const).map(fp => (
                  <button
                    key={fp}
                    onClick={() => setPracticeSession(fp)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg transition-all ${
                      practiceSession === fp ? 'bg-[#E10600] text-white' : ''
                    }`}
                    style={{ color: practiceSession === fp ? '#fff' : 'var(--text-secondary)' }}
                  >
                    {fp.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-wider">P</th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-wider">Driver</th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-wider hidden sm:table-cell">Team</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider">Best Lap</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider hidden md:table-cell">S1</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider hidden md:table-cell">S2</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider hidden md:table-cell">S3</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider">Gap</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider hidden sm:table-cell">Laps</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentPractice || []).map((result, idx) => (
                    <tr
                      key={result.driverId}
                      className="border-b hover:bg-[var(--surface-hover)] transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                          {result.position}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-0.5 h-5 rounded-full shrink-0" style={{ background: result.teamColor }} />
                          <div>
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{result.driverCode}</p>
                            <p className="text-[9px] hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                              {result.driverName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                        {result.team}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold" style={{ color: idx === 0 ? '#a855f7' : 'var(--text-primary)' }}>
                        {result.bestLapTime}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono hidden md:table-cell" style={{ color: parseFloat(result.sector1) <= fastestSectors.s1 + 0.001 ? '#a855f7' : 'var(--text-secondary)' }}>
                        {result.sector1}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono hidden md:table-cell" style={{ color: parseFloat(result.sector2) <= fastestSectors.s2 + 0.001 ? '#a855f7' : 'var(--text-secondary)' }}>
                        {result.sector2}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono hidden md:table-cell" style={{ color: parseFloat(result.sector3) <= fastestSectors.s3 + 0.001 ? '#a855f7' : 'var(--text-secondary)' }}>
                        {result.sector3}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {result.gap}
                      </td>
                      <td className="px-4 py-2.5 text-center hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                        {result.laps}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'qualifying' && (
          <motion.div
            key="qualifying"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card overflow-hidden"
          >
            {/* Phase toggle */}
            <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <Zap size={14} className="text-[#E10600]" />
              <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                Qualifying Results
              </span>
              <div className="ml-auto flex gap-1">
                {(['Q1', 'Q2', 'Q3'] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => setQualifyingPhase(q)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg transition-all ${
                      qualifyingPhase === q ? 'bg-[#E10600] text-white' : ''
                    }`}
                    style={{ color: qualifyingPhase === q ? '#fff' : 'var(--text-secondary)' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Qualifying Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-wider">P</th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-wider">Driver</th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-wider hidden sm:table-cell">Team</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider">Q1</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider">Q2</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider">Q3</th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-wider">Grid</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQualifying.map((result) => {
                    const isEliminated = result.eliminated !== null;
                    return (
                      <tr
                        key={result.driverId}
                        className="border-b hover:bg-[var(--surface-hover)] transition-colors"
                        style={{
                          borderColor: 'var(--border)',
                          opacity: isEliminated && qualifyingPhase !== 'Q1' && (qualifyingPhase === 'Q3' || result.eliminated === 'Q1') ? 0.4 : 1,
                        }}
                      >
                        <td className="px-4 py-2.5">
                          <span className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                            {result.position}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-0.5 h-5 rounded-full shrink-0" style={{ background: result.teamColor }} />
                            <div>
                              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{result.driverCode}</p>
                              <p className="text-[9px] hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                                {result.driverName}
                              </p>
                            </div>
                            {isEliminated && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
                                OUT {result.eliminated}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                          {result.team}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {result.q1Time}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono" style={{ color: result.q2Time === '-' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                          {result.q2Time}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold" style={{ color: result.q3Time !== '-' && result.position === 1 ? '#a855f7' : result.q3Time === '-' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {result.q3Time}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="font-display font-bold" style={{ color: result.gridPosition <= 3 ? '#E10600' : 'var(--text-primary)' }}>
                            P{result.gridPosition}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'grid' && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <ChevronRight size={14} className="text-[#E10600]" />
              <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                Starting Grid Formation
              </span>
            </div>

            {/* Grid Formation */}
            <div className="max-w-md mx-auto space-y-2">
              {qualifyingResults.sort((a, b) => a.gridPosition - b.gridPosition).map((driver, idx) => (
                <motion.div
                  key={driver.driverId}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-[var(--surface-hover)] ${
                    idx % 2 === 0 ? 'mr-16' : 'ml-16'
                  }`}
                  style={{
                    background: 'var(--surface)',
                    border: idx < 3 ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-display font-black text-white shrink-0"
                    style={{ background: idx < 3 ? '#E10600' : 'var(--surface)' }}
                  >
                    P{driver.gridPosition}
                  </span>
                  <div className="w-0.5 h-5 rounded-full shrink-0" style={{ background: driver.teamColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {driver.driverCode}
                    </p>
                    <p className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {driver.team}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {driver.q3Time !== '-' ? driver.q3Time : driver.q2Time !== '-' ? driver.q2Time : driver.q1Time}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
