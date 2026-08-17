'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedRaceEvent, RaceEventType } from '@/types';
import { Radio, AlertTriangle, Flag, Zap, ArrowUpRight, Wrench, MessageCircle } from 'lucide-react';

interface LiveEventFeedProps {
  events: EnhancedRaceEvent[];
}

const EVENT_CONFIG: Record<RaceEventType, { color: string; bg: string; icon: typeof Radio }> = {
  overtake:      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: ArrowUpRight },
  pit:           { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Wrench },
  safety_car:    { color: '#eab308', bg: 'rgba(234,179,8,0.15)',  icon: AlertTriangle },
  vsc:           { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  icon: AlertTriangle },
  green_flag:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: Flag },
  red_flag:      { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  icon: Flag },
  yellow_flag:   { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  icon: Flag },
  retirement:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: AlertTriangle },
  start:         { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Flag },
  finish:        { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: Flag },
  weather:       { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: Radio },
  fastest_lap:   { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: Zap },
  investigation: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: AlertTriangle },
  team_radio:    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: MessageCircle },
  drs_enabled:   { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  icon: Flag },
  drs_disabled:  { color: '#6b7280', bg: 'rgba(107,114,128,0.08)',icon: Flag },
};

export default function LiveEventFeed({ events }: LiveEventFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);

  // Show most recent events first
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="glass-card overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <Radio size={14} className="text-[#E10600]" />
        <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
          Live Feed
        </span>
        <span className="w-2 h-2 rounded-full bg-[#E10600] live-pulse" />
        {events.length > 0 && (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#E10600]/15 text-[#E10600]">
            {events.length}
          </span>
        )}
      </div>

      {/* Events List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto live-feed-scroll">
        {sortedEvents.length === 0 ? (
          <div className="p-6 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            Events will appear here during the race
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {sortedEvents.slice(0, 50).map((event) => {
              const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.start;
              const EventIcon = config.icon;

              const isHighPriority = ['safety_car', 'red_flag', 'vsc', 'fastest_lap'].includes(event.type);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`border-b ${isHighPriority ? 'event-high-priority' : ''}`}
                  style={{
                    borderColor: 'var(--border)',
                    background: isHighPriority ? config.bg : 'transparent',
                  }}
                >
                  <div className="px-4 py-2.5">
                    <div className="flex items-start gap-2.5">
                      {/* Event icon */}
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: config.bg }}
                      >
                        <EventIcon size={11} style={{ color: config.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Team color accent for driver-specific events */}
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {event.teamColor && event.driverCode && (
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                              style={{ background: event.teamColor }}
                            />
                          )}
                          {event.message}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>
                            Lap {event.lap}
                          </span>
                          <span
                            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: config.bg, color: config.color }}
                          >
                            {event.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
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
