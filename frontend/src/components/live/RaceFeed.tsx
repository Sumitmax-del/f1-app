'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';

interface RaceEvent {
  type: string;
  message: string;
  time: number;
}

interface RaceFeedProps {
  events: RaceEvent[];
  currentLap: number;
}

export default function RaceFeed({ events, currentLap }: RaceFeedProps) {
  return (
    <div className="glass-card overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 flex items-center gap-2 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <Radio size={14} className="text-[#E10600]" />
        <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
          Race Feed
        </span>
        {events.length > 0 && (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#E10600]/15 text-[#E10600]">
            {events.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            Start a race to see live events
          </div>
        ) : (
          <AnimatePresence>
            {events.map((event, i) => {
              const eventColors: Record<string, string> = {
                overtake: '#22c55e',
                pit: '#f59e0b',
                safety_car: '#eab308',
                green_flag: '#22c55e',
                retirement: '#ef4444',
                start: '#3b82f6',
                finish: '#a855f7',
                weather: '#60a5fa',
              };

              return (
                <motion.div
                  key={`${event.time}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-4 py-2.5 border-b text-xs"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                      style={{ background: eventColors[event.type] || '#6b7280' }}
                    />
                    <div className="min-w-0">
                      <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {event.message}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Lap {currentLap}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
