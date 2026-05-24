'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDrivers } from '@/lib/api';
import { NATIONALITY_FLAGS } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import { GitCompare, ChevronDown } from 'lucide-react';

export default function ComparePage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driver1Id, setDriver1Id] = useState('');
  const [driver2Id, setDriver2Id] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDrivers().then(d => {
      setDrivers(d || []);
      if (d.length >= 2) {
        setDriver1Id(d[0].driverId);
        setDriver2Id(d[1].driverId);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const driver1 = drivers.find(d => d.driverId === driver1Id);
  const driver2 = drivers.find(d => d.driverId === driver2Id);

  const comparisonData = driver1 && driver2 ? [
    { metric: 'Points', driver1: driver1.points || 0, driver2: driver2.points || 0 },
    { metric: 'Wins', driver1: driver1.wins || 0, driver2: driver2.wins || 0 },
    { metric: 'Position', driver1: 21 - (driver1.position || 20), driver2: 21 - (driver2.position || 20) },
  ] : [];

  const radarData = driver1 && driver2 ? [
    { subject: 'Points', A: (driver1.points || 0), B: (driver2.points || 0), fullMark: 200 },
    { subject: 'Wins', A: (driver1.wins || 0) * 30, B: (driver2.wins || 0) * 30, fullMark: 200 },
    { subject: 'Grid Pos', A: (21 - (driver1.position || 20)) * 10, B: (21 - (driver2.position || 20)) * 10, fullMark: 200 },
    { subject: 'Consistency', A: 50 + Math.random() * 100, B: 50 + Math.random() * 100, fullMark: 200 },
    { subject: 'Speed', A: 80 + Math.random() * 80, B: 80 + Math.random() * 80, fullMark: 200 },
  ] : [];

  const DriverSelector = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <div className="relative">
      <label className="text-[10px] uppercase tracking-widest font-bold mb-1 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border appearance-none focus:outline-none focus:border-[#E10600]/50 cursor-pointer"
        style={{
          background: 'var(--countdown-bg)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)'
        }}
      >
        {drivers.map(d => (
          <option key={d.driverId} value={d.driverId} style={{ background: 'var(--background)', color: 'var(--text-primary)' }}>
            {d.givenName} {d.familyName} — {d.team?.name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 bottom-3.5 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
    </div>
  );

  const DriverProfile = ({ driver }: { driver: any }) => {
    if (!driver) return null;
    const teamColor = driver.team?.color || '#666';
    const flag = NATIONALITY_FLAGS[driver.nationality] || '🏁';
    return (
      <div className="glass-card p-6 text-center">
        <div className="w-20 h-20 rounded-xl mx-auto mb-4 flex items-center justify-center text-3xl font-display font-bold border-2"
          style={{ background: `${teamColor}20`, borderColor: `${teamColor}40`, color: 'var(--text-primary)' }}
        >
          {driver.code}
        </div>
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{driver.givenName} <span className="uppercase">{driver.familyName}</span></h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ background: teamColor }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{driver.team?.name}</span>
          <span className="text-lg ml-1">{flag}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{driver.points || 0}</p>
            <p className="text-[10px] uppercase" style={{ color: 'var(--text-secondary)' }}>Points</p>
          </div>
          <div>
            <p className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{driver.wins || 0}</p>
            <p className="text-[10px] uppercase" style={{ color: 'var(--text-secondary)' }}>Wins</p>
          </div>
          <div>
            <p className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>P{driver.position || '-'}</p>
            <p className="text-[10px] uppercase" style={{ color: 'var(--text-secondary)' }}>Rank</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E10600] mb-2">Head to Head</p>
          <h1 className="text-4xl sm:text-5xl font-display font-black" style={{ color: 'var(--text-primary)' }}>
            DRIVER <span className="gradient-text">COMPARISON</span>
          </h1>
        </motion.div>

        {/* Selectors */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <DriverSelector value={driver1Id} onChange={setDriver1Id} label="Driver 1" />
          <DriverSelector value={driver2Id} onChange={setDriver2Id} label="Driver 2" />
        </div>

        {driver1 && driver2 && (
          <>
            {/* Profile cards with VS */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <DriverProfile driver={driver1} />
              </motion.div>
              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-16 h-16 rounded-full bg-[#E10600]/10 border border-[#E10600]/30 flex items-center justify-center"
                >
                  <GitCompare size={24} className="text-[#E10600]" />
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <DriverProfile driver={driver2} />
              </motion.div>
            </div>

            {/* Stat bars */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 mb-6"
            >
              <h3 className="font-display font-bold text-sm tracking-wider uppercase mb-6" style={{ color: 'var(--text-primary)' }}>Stats Comparison</h3>
              <div className="space-y-6">
                {[
                  { label: 'Points', v1: driver1.points || 0, v2: driver2.points || 0 },
                  { label: 'Wins', v1: driver1.wins || 0, v2: driver2.wins || 0 },
                  { label: 'Championship Position', v1: driver1.position || 20, v2: driver2.position || 20, invert: true },
                ].map(({ label, v1, v2, invert }) => {
                  const max = Math.max(v1, v2, 1);
                  const w1 = invert ? ((21 - v1) / 20) * 100 : (v1 / max) * 100;
                  const w2 = invert ? ((21 - v2) / 20) * 100 : (v2 / max) * 100;
                  const c1 = driver1.team?.color || '#666';
                  const c2 = driver2.team?.color || '#666';

                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold" style={{ color: c1 }}>{invert ? `P${v1}` : v1}</span>
                        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span className="text-sm font-bold" style={{ color: c2 }}>{invert ? `P${v2}` : v2}</span>
                      </div>
                      <div className="flex gap-1 h-3">
                        <div className="flex-1 flex justify-end">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${w1}%` }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="h-full rounded-l-full"
                            style={{ background: c1 }}
                          />
                        </div>
                        <div className="flex-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${w2}%` }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="h-full rounded-r-full"
                            style={{ background: c2 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="font-display font-bold text-sm tracking-wider uppercase mb-6" style={{ color: 'var(--text-primary)' }}>Performance Radar</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <Radar
                      name={`${driver1.givenName} ${driver1.familyName}`}
                      dataKey="A"
                      stroke={driver1.team?.color || '#E10600'}
                      fill={driver1.team?.color || '#E10600'}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Radar
                      name={`${driver2.givenName} ${driver2.familyName}`}
                      dataKey="B"
                      stroke={driver2.team?.color || '#3671C6'}
                      fill={driver2.team?.color || '#3671C6'}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Legend
                      wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '12px' }}
                    />
                    <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
