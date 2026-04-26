'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDrivers } from '@/lib/api';
import DriverCard from '@/components/drivers/DriverCard';
import { Search, Filter } from 'lucide-react';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDrivers().then(d => {
      setDrivers(d || []);
      setFiltered(d || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = drivers;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(d =>
        d.givenName.toLowerCase().includes(s) ||
        d.familyName.toLowerCase().includes(s) ||
        d.code?.toLowerCase().includes(s)
      );
    }
    if (teamFilter !== 'all') {
      result = result.filter(d => d.team?.constructorId === teamFilter);
    }
    setFiltered(result);
  }, [search, teamFilter, drivers]);

  const teams = [...new Set(drivers.map(d => d.team?.constructorId).filter(Boolean))];

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E10600] mb-2">2025 Grid</p>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-white">
            DRIVERS
          </h1>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B8D]" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1E1E2E] border border-white/5 text-white text-sm placeholder-[#6B6B8D] focus:outline-none focus:border-[#E10600]/50 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B8D]" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="pl-10 pr-8 py-3 rounded-xl bg-[#1E1E2E] border border-white/5 text-white text-sm appearance-none focus:outline-none focus:border-[#E10600]/50 cursor-pointer min-w-[180px]"
            >
              <option value="all">All Teams</option>
              {teams.map(t => (
                <option key={t} value={t}>{drivers.find(d => d.team?.constructorId === t)?.team?.name}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card h-64 shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((driver, i) => (
              <DriverCard key={driver.driverId} driver={driver} index={i} />
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-[#6B6B8D] text-lg">No drivers found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
