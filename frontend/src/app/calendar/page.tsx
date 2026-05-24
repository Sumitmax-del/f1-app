'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getRaces } from '@/lib/api';
import { NATIONALITY_FLAGS } from '@/types';
import { MapPin, Clock, CheckCircle, Circle, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRaces().then(r => { setRaces(r || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E10600] mb-2">2025 Season</p>
          <h1 className="text-4xl sm:text-5xl font-display font-black" style={{ color: 'var(--text-primary)' }}>RACE CALENDAR</h1>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px" style={{ background: 'var(--border)' }} />

          <div className="space-y-3">
            {races.map((race, index) => {
              const isPast = race.isPast;
              const isNext = race.isNext;
              const flag = race.flag || NATIONALITY_FLAGS[race.country] || '🏁';
              const date = new Date(`${race.date}T${race.time || '13:00:00Z'}`);

              return (
                <motion.div
                  key={race.round}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`relative pl-14 sm:pl-20 ${isPast ? 'opacity-50' : ''}`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 sm:left-6 top-5 z-10">
                    {isNext ? (
                      <div className="w-5 h-5 rounded-full bg-[#E10600] border-2 border-[#FF4444] live-pulse" />
                    ) : isPast ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <Circle size={18} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </div>

                  <div className={`glass-card overflow-hidden ${isNext ? 'glow-red-sm border-[#E10600]/30' : ''}`}>
                    {isNext && <div className="h-0.5 bg-gradient-to-r from-[#E10600] via-[#FF4444] to-transparent" />}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                      {/* Round */}
                      <div className="flex items-center gap-3 sm:w-20">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>R{race.round}</span>
                        {isNext && (
                          <span className="text-[10px] font-bold text-[#E10600] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#E10600]/10">
                            NEXT
                          </span>
                        )}
                      </div>

                      {/* Flag & Name */}
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-2xl">{flag}</span>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>{race.raceName}</h3>
                          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="flex items-center gap-1"><MapPin size={10} /> {race.circuitName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm sm:w-48 sm:justify-end" style={{ color: 'var(--text-secondary)' }}>
                        <Clock size={14} />
                        <span>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        {!isPast && (
                          <ChevronRight size={14} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
