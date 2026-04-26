'use client';

import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
  delay?: number;
}

export default function StatsCard({ label, value, icon, accent = '#E10600', delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-5 relative overflow-hidden group cursor-pointer"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${accent}15` }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-[#6B6B8D] uppercase tracking-wider font-semibold">{label}</p>
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
    </motion.div>
  );
}
