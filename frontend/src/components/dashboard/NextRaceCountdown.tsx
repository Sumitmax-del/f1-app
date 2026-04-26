'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatCountdown } from '@/lib/utils';
import { Clock, MapPin } from 'lucide-react';

interface NextRaceCountdownProps {
  race: {
    raceName: string;
    circuitName: string;
    country: string;
    date: string;
    time?: string;
    flag?: string;
    round: string;
  } | null;
}

export default function NextRaceCountdown({ race }: NextRaceCountdownProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!race) return;
    const targetDate = new Date(`${race.date}T${race.time || '13:00:00Z'}`);
    
    const interval = setInterval(() => {
      setCountdown(formatCountdown(targetDate));
    }, 1000);

    setCountdown(formatCountdown(targetDate));
    return () => clearInterval(interval);
  }, [race]);

  if (!race) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-[#6B6B8D] font-semibold">Season Complete</p>
      </div>
    );
  }

  const units = [
    { label: 'DAYS', value: countdown.days },
    { label: 'HRS', value: countdown.hours },
    { label: 'MIN', value: countdown.minutes },
    { label: 'SEC', value: countdown.seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card relative overflow-hidden"
    >
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-[#E10600]" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-[80px] opacity-5 bg-[#FF4444]" />

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E10600]">
            Next Race — Round {race.round}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E10600] live-pulse" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
          {race.flag} {race.raceName}
        </h2>

        <div className="flex items-center gap-4 text-sm text-[#6B6B8D] mb-6">
          <span className="flex items-center gap-1.5">
            <MapPin size={14} />
            {race.circuitName}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {new Date(`${race.date}T${race.time || '13:00:00Z'}`).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Countdown */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {units.map(({ label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="text-center"
            >
              <div className="relative rounded-xl p-3 sm:p-4 border border-white/5"
                style={{ background: 'rgba(30,30,46,0.8)' }}
              >
                <motion.span
                  key={value}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl sm:text-5xl font-display font-bold text-white block"
                >
                  {String(value).padStart(2, '0')}
                </motion.span>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#E10600]/40" />
              </div>
              <span className="text-[10px] sm:text-xs text-[#6B6B8D] font-bold tracking-widest mt-2 block">
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom racing stripe */}
      <div className="h-1 bg-gradient-to-r from-[#E10600] via-[#FF4444] to-transparent" />
    </motion.div>
  );
}
