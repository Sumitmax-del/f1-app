'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_CIRCUIT_GEOMETRIES, getCircuitGeometry, TrackNode, CircuitGeometry, getAGStats } from '@/data/trackGeometry';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Gauge, Activity, Cpu, Layers, Settings, Table, HelpCircle, Compass, Zap } from 'lucide-react';

export default function BlueprintPage() {
  // Page State
  const [selectedId, setSelectedId] = useState('albert_park');
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1); // 1 = 1s per node, 2 = 2s, etc.
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'blueprint-table'>('visualizer');

  // Load geometry
  const geometry = useMemo(() => getCircuitGeometry(selectedId) || ALL_CIRCUIT_GEOMETRIES[0], [selectedId]);
  const agStats = useMemo(() => getAGStats(selectedId), [selectedId]);

  // Compute accumulated coordinates for the SVG visualizer
  const projectedData = useMemo(() => {
    let cx = 0;
    let cy = 0;
    let cz = 0;

    const pathNodes = geometry.nodes.map((node) => {
      // Accumulate relative Cartesian displacements
      cx += node.deltaX;
      cy -= node.deltaY; // Invert Y for SVG coordinates (Y-down)
      cz += node.deltaZ;
      return { x: cx, y: cy, z: cz, node };
    });

    const xCoords = pathNodes.map((p) => p.x);
    const yCoords = pathNodes.map((p) => p.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const size = Math.max(width, height);
    const scale = 360 / size; // Scale to fit comfortably in a 500x500 viewport

    return pathNodes.map((p) => ({
      ...p,
      px: 250 + (p.x - (minX + width / 2)) * scale,
      py: 250 + (p.y - (minY + height / 2)) * scale,
    }));
  }, [geometry]);

  // SVG Path strings
  const svgPathD = useMemo(() => {
    if (projectedData.length === 0) return '';
    const points = projectedData.map((p) => `${p.px},${p.py}`).join(' L ');
    return `M ${projectedData[0].px},${projectedData[0].py} L ${points} Z`;
  }, [projectedData]);

  // Active Node
  const activeNode = useMemo(() => {
    return geometry.nodes[activeNodeIndex] || geometry.nodes[0];
  }, [geometry, activeNodeIndex]);

  // Simulated Telemetry (Fluctuates slightly around node's design specs)
  const [telemetry, setTelemetry] = useState({
    speed: 0,
    gForce: 0,
    banking: 0,
    gradient: 0,
    throttle: 100,
    brake: 0,
  });

  // Telemetry simulation update loop
  useEffect(() => {
    const targetSpeed = activeNode.approxSpeedKph;
    const targetBanking = activeNode.agBankingDeg;
    const targetGradient = activeNode.gradientPct;

    // Radius for G-Force calc
    const radius = activeNode.radiusM;
    const speedMs = (activeNode.agDesignSpeedKph || 300) / 3.6;

    // Lateral G-Force equation: G = v^2 / (r * g)
    // Anti-gravity banking mitigates felt Gs
    let calculatedG = 0;
    if (radius && radius > 0) {
      const rawG = (speedMs * speedMs) / (radius * 9.81);
      const bankingRad = (targetBanking * Math.PI) / 180;
      calculatedG = Math.max(0, rawG * Math.cos(bankingRad) - Math.sin(bankingRad));
      // Max clamping for telemetry realism
      calculatedG = Math.round(Math.min(6.5, calculatedG) * 10) / 10;
    }

    const interval = setInterval(() => {
      // Add slight micro-fluctuations for high-tech telemetry dashboard feeling
      const noiseSpeed = (Math.random() - 0.5) * 4;
      const noiseG = (Math.random() - 0.5) * 0.15;
      const noiseBank = (Math.random() - 0.5) * 0.2;
      const noiseGrad = (Math.random() - 0.5) * 0.1;

      // Throttle/Brake estimation based on segment type
      let thr = 100;
      let brk = 0;
      if (activeNode.segmentType === 'HAIRPIN' || activeNode.segmentType === 'CHICANE') {
        thr = 15 + Math.floor(Math.random() * 20);
        brk = 65 + Math.floor(Math.random() * 25);
      } else if (activeNode.radiusM && activeNode.radiusM < 100) {
        thr = 50 + Math.floor(Math.random() * 25);
        brk = 10 + Math.floor(Math.random() * 20);
      } else {
        thr = 95 + Math.floor(Math.random() * 5);
        brk = 0;
      }

      setTelemetry({
        speed: Math.max(0, Math.round(targetSpeed + noiseSpeed)),
        gForce: Math.max(0, Math.round((calculatedG + noiseG) * 10) / 10),
        banking: Math.round((targetBanking + noiseBank) * 10) / 10,
        gradient: Math.round((targetGradient + noiseGrad) * 10) / 10,
        throttle: thr,
        brake: brk,
      });
    }, 120);

    return () => clearInterval(interval);
  }, [activeNode]);

  // Automated Fly-Through Interval Timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setActiveNodeIndex((prev) => (prev + 1) % geometry.nodes.length);
    }, 1500 / simSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed, geometry]);

  const handleReset = () => {
    setActiveNodeIndex(0);
    setIsPlaying(false);
  };

  const handleNext = () => {
    setActiveNodeIndex((prev) => (prev + 1) % geometry.nodes.length);
  };

  const handlePrev = () => {
    setActiveNodeIndex((prev) => (prev - 1 + geometry.nodes.length) % geometry.nodes.length);
  };

  // Recharts elevation data
  const chartData = useMemo(() => {
    let accumulatedDistance = 0;
    return projectedData.map((p, index) => {
      accumulatedDistance += p.node.arcLengthM;
      return {
        index,
        name: p.node.name,
        distance: Math.round(accumulatedDistance),
        elevation: Math.round(p.z * 10) / 10,
        banking: p.node.agBankingDeg,
        speed: p.node.approxSpeedKph,
        designSpeed: p.node.agDesignSpeedKph,
      };
    });
  }, [projectedData]);

  return (
    <div className="min-h-screen grid-bg py-8">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6">
        
        {/* Futuristic Dashboard Header */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-8 border-b border-[var(--border)] pb-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E10600] bg-[#E10600]/10 px-2.5 py-1 rounded-md border border-[#E10600]/25">
                Telemetry & Geospatial Engine
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88] bg-[#00ff88]/10 px-2.5 py-1 rounded-md border border-[#00ff88]/25 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
                Anti-Gravity Blueprint Active
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-white">
              GEOMETRIC <span className="gradient-text">BLUEPRINTS</span>
            </h1>
            <p className="text-xs sm:text-sm mt-1 max-w-xl text-gray-400">
              Inspect sequenced track centerline datasets. Experience anti-gravity spatial remodeling, elevation crest mapping, and felt lateral G-force mitigation systems.
            </p>
          </motion.div>

          {/* Circuit Switcher Selector */}
          <div className="flex items-center gap-3 shrink-0">
            <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Select Circuit:</label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setActiveNodeIndex(0);
                }}
                className="px-4 py-3 pr-10 rounded-xl border appearance-none font-bold text-sm bg-[var(--surface)] focus:border-[#E10600]/60 outline-none cursor-pointer transition-all duration-200"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                }}
              >
                {ALL_CIRCUIT_GEOMETRIES.map((c) => (
                  <option key={c.circuitId} value={c.circuitId} className="bg-[var(--surface-solid)] text-themed">
                    {c.circuitName}
                  </option>
                ))}
              </select>
              <Compass size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 animate-spin-slow" />
            </div>
          </div>
        </div>

        {/* Global Track Stats Ribbon */}
        {agStats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6"
          >
            {[
              { label: 'Total Centerline Nodes', value: `${agStats.totalSegments} nodes`, sub: 'Sequenced coordinates' },
              { label: 'Elevation Delta (Z)', value: `${agStats.totalElevationM} meters`, sub: 'Crests & compressions' },
              { label: 'Design Core Width', value: `${agStats.trackWidthM} meters`, sub: 'Uniform 20m widening' },
              { label: 'Peak Banking θ', value: `${agStats.maxBankingDeg}° degrees`, sub: 'Calculated safety bank' },
              { label: 'Avg Target Speed', value: `${agStats.avgAGDesignSpeedKph} km/h`, sub: 'Vector velocity' },
              { label: 'Tightest Corner Radius', value: `${agStats.tightestRadiusM} meters`, sub: 'Peak lateral load' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-3 border border-white/5 bg-gradient-to-b from-white/3 to-transparent hover:border-white/10 transition-all">
                <span className="text-[9px] uppercase font-bold tracking-wider block text-gray-500">{stat.label}</span>
                <span className="text-base font-display font-black block mt-1 tracking-tight text-white">{stat.value}</span>
                <span className="text-[9px] text-gray-400">{stat.sub}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'visualizer' ? 'bg-[#E10600] text-white glow-red-sm' : 'hover:bg-[rgba(255,255,255,0.03)] text-gray-400 border border-transparent'
            }`}
          >
            <Activity size={12} /> Live Spatial Dashboard
          </button>
          <button
            onClick={() => setActiveTab('blueprint-table')}
            className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'blueprint-table' ? 'bg-[#E10600] text-white glow-red-sm' : 'hover:bg-[rgba(255,255,255,0.03)] text-gray-400 border border-transparent'
            }`}
          >
            <Table size={12} /> Centerline Dataset Table
          </button>
        </div>

        {/* Main Grid Section */}
        <AnimatePresence mode="wait">
          {activeTab === 'visualizer' ? (
            <motion.div
              key="visualizer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column (5 Cols) — Interactive Node map & Blueprint specs */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* SVG Visualizer Canvas */}
                <div className="glass-card p-6 relative overflow-hidden bg-gradient-to-br from-[#101018] to-[#050508] border border-white/5 min-h-[420px] flex flex-col justify-between">
                  
                  {/* Neon Grid Mesh overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:25px_25px]" />
                  
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#E10600] flex items-center gap-1.5">
                      <Cpu size={12} /> Centerline Projection Vector
                    </span>
                    <span className="text-[9px] font-bold text-gray-500">Center: (0, 0) Scaled</span>
                  </div>

                  {/* SVG Map Container */}
                  <div className="w-full flex-1 flex items-center justify-center p-2">
                    <svg viewBox="0 0 500 500" className="w-full max-h-[340px] aspect-square">
                      {/* Glow filter */}
                      <defs>
                        <filter id="glow-svg" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Track Vector outline (base) */}
                      <path
                        d={svgPathD}
                        fill="none"
                        stroke="#1a1a2e"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Glowing Track centerline */}
                      <path
                        d={svgPathD}
                        fill="none"
                        stroke="#4a4a8a"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-70"
                      />

                      {/* Active Trailing Line */}
                      {projectedData.length > 0 && (
                        <path
                          d={`M ${projectedData[0].px},${projectedData[0].py} L ${projectedData.slice(0, activeNodeIndex + 1).map(p => `${p.px},${p.py}`).join(' L ')}`}
                          fill="none"
                          stroke="#E10600"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#glow-svg)"
                        />
                      )}

                      {/* Clickable Node Markers */}
                      {projectedData.map((pt, i) => {
                        const isActive = i === activeNodeIndex;
                        const isHovered = i === hoveredNodeIndex;

                        return (
                          <g key={pt.node.nodeId} className="cursor-pointer">
                            {/* Hotspot circle */}
                            <circle
                              cx={pt.px}
                              cy={pt.py}
                              r={isActive ? 16 : isHovered ? 12 : 8}
                              fill="transparent"
                              onClick={() => setActiveNodeIndex(i)}
                              onMouseEnter={() => setHoveredNodeIndex(i)}
                              onMouseLeave={() => setHoveredNodeIndex(null)}
                            />

                            {/* Glowing halo */}
                            {(isActive || isHovered) && (
                              <circle
                                cx={pt.px}
                                cy={pt.py}
                                r={isActive ? 10 : 8}
                                fill="none"
                                stroke={isActive ? '#E10600' : '#4a4a8a'}
                                strokeWidth="2"
                                opacity="0.8"
                                className={isActive ? 'animate-pulse' : ''}
                              />
                            )}

                            {/* Core node dot */}
                            <circle
                              cx={pt.px}
                              cy={pt.py}
                              r={isActive ? 4.5 : 3.5}
                              fill={isActive ? '#E10600' : pt.node.radiusM ? '#00ff88' : '#3b82f6'}
                              className="transition-all duration-200"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Visual Legend */}
                  <div className="flex items-center justify-center gap-4 text-[9px] uppercase font-bold text-gray-500 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E10600]" /> Active Position</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Straight Node</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00ff88]" /> Turn Apex Node</span>
                  </div>
                </div>

                {/* Fly-Through Controller Card */}
                <div className="glass-card p-4 border border-white/5 bg-[#101018]/40">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#E10600] flex items-center gap-1.5 mb-3">
                    <Settings size={12} /> Simulation Sequence Controller
                  </span>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrev}
                        className="p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all outline-none cursor-pointer"
                        title="Previous Node"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 outline-none cursor-pointer ${
                          isPlaying ? 'bg-amber-600 text-white' : 'bg-[#E10600] text-white glow-red-sm'
                        }`}
                      >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        <span>{isPlaying ? 'Pause Simulation' : 'Play Walkthrough'}</span>
                      </button>
                      <button
                        onClick={handleNext}
                        className="p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all outline-none cursor-pointer"
                        title="Next Node"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={handleReset}
                        className="p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-gray-400 transition-all outline-none cursor-pointer"
                        title="Reset Sequence"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>

                    {/* Playback speed slider */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Playback Speed:</span>
                      <div className="flex items-center gap-1">
                        {([1, 2, 4] as const).map((speed) => (
                          <button
                            key={speed}
                            onClick={() => setSimSpeed(speed)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                              simSpeed === speed ? 'bg-white/10 text-white font-black' : 'hover:bg-white/5 text-gray-500'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Active Node: <span className="font-bold text-[#E10600]">{activeNodeIndex + 1}</span> of <span className="font-bold">{geometry.nodes.length}</span></span>
                    <span>Tracking Segment: <span className="font-mono text-white font-bold">{activeNode.name}</span></span>
                  </div>
                </div>

              </div>

              {/* Center Column (4 Cols) — Dynamic Telemetry Dashboard (Circular Gauges) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Visual Telemetry Grid */}
                <div className="glass-card p-6 border border-white/5 min-h-[420px] flex flex-col justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#00ff88] flex items-center gap-1.5 mb-4">
                    <Gauge size={12} className="animate-pulse" /> Kinetic Anti-Gravity Telemetry
                  </span>

                  <div className="grid grid-cols-2 gap-4 flex-1">
                    
                    {/* Velocity dial widget */}
                    <div className="p-4 rounded-xl border border-white/5 bg-gradient-to-b from-[#101018]/60 to-transparent flex flex-col justify-between items-center text-center">
                      <span className="text-[9px] uppercase font-bold text-gray-500">Core Velocity</span>
                      <div className="relative my-3 w-28 h-28 flex items-center justify-center">
                        {/* Circular track border */}
                        <svg className="absolute w-full h-full -rotate-90">
                          <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            fill="none"
                            stroke="#00ff88"
                            strokeWidth="6"
                            strokeDasharray="301.6"
                            strokeDashoffset={301.6 - (301.6 * (telemetry.speed / 480))}
                            strokeLinecap="round"
                            className="transition-all duration-300"
                          />
                        </svg>
                        <div className="text-center">
                          <span className="text-xl font-display font-black text-white">{telemetry.speed}</span>
                          <span className="text-[9px] uppercase font-bold block text-gray-500">km/h</span>
                        </div>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider text-[#00ff88] font-bold">
                        Limit: {activeNode.agDesignSpeedKph} km/h
                      </span>
                    </div>

                    {/* Banking meter widget */}
                    <div className="p-4 rounded-xl border border-white/5 bg-gradient-to-b from-[#101018]/60 to-transparent flex flex-col justify-between items-center text-center">
                      <span className="text-[9px] uppercase font-bold text-gray-500">Banking Angle</span>
                      <div className="relative my-3 w-28 h-28 flex items-center justify-center">
                        {/* Visual tilt indicator */}
                        <motion.div
                          animate={{ rotate: telemetry.banking * (activeNode.rotationDeg >= 0 ? 1 : -1) }}
                          transition={{ type: 'spring', damping: 15 }}
                          className="w-16 h-1 bg-gradient-to-r from-[#E10600] to-[#00ff88] rounded-full relative"
                        >
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-white -top-1 left-1/2 -translate-x-1/2 shadow-md shadow-white/80" />
                        </motion.div>
                        <div className="absolute bottom-1 text-center">
                          <span className="text-base font-display font-black text-white">{Math.abs(telemetry.banking)}°</span>
                          <span className="text-[8px] uppercase font-bold block text-gray-500">
                            {activeNode.rotationDeg > 0 ? 'Right Bank' : activeNode.rotationDeg < 0 ? 'Left Bank' : 'Flat'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider text-[#3b82f6] font-bold">
                        Target: {activeNode.agBankingDeg}°
                      </span>
                    </div>

                    {/* Felt Lateral G-Force widget */}
                    <div className="p-4 rounded-xl border border-white/5 bg-gradient-to-b from-[#101018]/60 to-transparent flex flex-col justify-between items-center text-center">
                      <span className="text-[9px] uppercase font-bold text-gray-500">Felt Lateral Load</span>
                      <div className="relative my-3 w-28 h-28 flex items-center justify-center border border-white/5 rounded-full bg-white/2">
                        {/* Crosshair grid */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                          <div className="w-full h-[1px] bg-white" />
                          <div className="h-full w-[1px] bg-white" />
                        </div>
                        {/* Moving G-Force dot vector */}
                        <motion.div
                          animate={{
                            x: (activeNode.radiusM ? (activeNode.rotationDeg >= 0 ? 1 : -1) : 0) * (telemetry.gForce / 6) * 35,
                            y: 0,
                          }}
                          transition={{ type: 'spring', damping: 10 }}
                          className="w-4 h-4 rounded-full bg-[#E10600] border-2 border-white flex items-center justify-center shadow-lg shadow-red-500/50"
                        />
                        <div className="absolute bottom-1 text-[9px] font-bold text-white font-mono bg-black/60 px-1.5 py-0.5 rounded">
                          {telemetry.gForce} G
                        </div>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider text-purple-400 font-bold">
                        {activeNode.radiusM ? '3.5x Mitigated' : 'Linear Vector'}
                      </span>
                    </div>

                    {/* Gradient & Pitch widget */}
                    <div className="p-4 rounded-xl border border-white/5 bg-gradient-to-b from-[#101018]/60 to-transparent flex flex-col justify-between items-center text-center">
                      <span className="text-[9px] uppercase font-bold text-gray-500">Slope Gradient</span>
                      <div className="relative my-3 w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <line x1="20" y1="50" x2="80" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeDasharray="3 3" />
                          {/* Slope trajectory */}
                          <line
                            x1="20"
                            y1={50 + (telemetry.gradient * 2)}
                            x2="80"
                            y2={50 - (telemetry.gradient * 2)}
                            stroke="#ff9f43"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-base font-display font-black text-white">{telemetry.gradient}%</span>
                          <span className="text-[8px] uppercase font-bold block text-gray-500">
                            {telemetry.gradient > 0 ? '🔺 Climb' : telemetry.gradient < 0 ? '🔻 Descent' : 'Flat'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider text-[#ff9f43] font-bold">
                        Max Grade: {geometry.maxGradientPct}%
                      </span>
                    </div>

                  </div>

                  {/* Engine dynamic bars */}
                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-[10px]">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-gray-500">THROTTLE</span>
                        <span className="text-[#00ff88]">{telemetry.throttle}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00ff88]" style={{ width: `${telemetry.throttle}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-gray-500">BRAKE KINETICS</span>
                        <span className="text-[#E10600]">{telemetry.brake}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E10600]" style={{ width: `${telemetry.brake}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vector math specs card */}
                <div className="glass-card p-4 border border-white/5 bg-[#101018]/40">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#E10600] flex items-center gap-1.5 mb-2.5">
                    <Cpu size={12} /> Dynamic Node Blueprint Specs
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Segment Class:</span>
                      <span className="font-bold text-white">{activeNode.segmentType}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Arc Length:</span>
                      <span className="font-mono font-bold text-white">{activeNode.arcLengthM}m</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Displacement ΔX:</span>
                      <span className="font-mono font-bold text-white">{activeNode.deltaX >= 0 ? '+' : ''}{activeNode.deltaX}m</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Displacement ΔY:</span>
                      <span className="font-mono font-bold text-white">{activeNode.deltaY >= 0 ? '+' : ''}{activeNode.deltaY}m</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Vertical ΔZ:</span>
                      <span className="font-mono font-bold text-[#ff9f43]">{activeNode.deltaZ >= 0 ? '+' : ''}{activeNode.deltaZ}m</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Absolute Heading:</span>
                      <span className="font-mono font-bold text-white">{activeNode.headingDeg}°</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Turn Radius:</span>
                      <span className="font-mono font-bold text-[#00ff88]">{activeNode.radiusM ? `${activeNode.radiusM}m` : 'Straight'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-gray-500">Apex Rotation:</span>
                      <span className="font-mono font-bold text-white">{activeNode.rotationDeg > 0 ? '+' : ''}{activeNode.rotationDeg}°</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (3 Cols) — Math blueprints & Physics reference */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Recharts Elevation Profile chart */}
                <div className="glass-card p-4 border border-white/5 bg-[#101018]/60 flex flex-col justify-between h-[230px]">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#ff9f43] flex items-center gap-1.5 mb-2 shrink-0">
                    <Compass size={12} /> Z-Elevation Centerline Profile
                  </span>
                  
                  <div className="flex-1 w-full relative min-h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <defs>
                          <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff9f43" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#ff9f43" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="distance" stroke="rgba(255,255,255,0.2)" fontSize={9} unit="m" tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} unit="m" tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface-solid)',
                            borderColor: 'var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                          }}
                        />
                        <Area type="monotone" dataKey="elevation" stroke="#ff9f43" fill="url(#elevationGrad)" strokeWidth={2} />
                        <ReferenceLine x={chartData[activeNodeIndex]?.distance} stroke="#E10600" strokeWidth={1.5} strokeDasharray="3 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="text-[8px] text-gray-500 uppercase text-center block mt-1">Horizontal: Distance (m) • Vertical: Elevation (m)</span>
                </div>

                {/* Recharts Speed Profile chart */}
                <div className="glass-card p-4 border border-white/5 bg-[#101018]/60 flex flex-col justify-between h-[230px]">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#00ff88] flex items-center gap-1.5 mb-2 shrink-0">
                    <Compass size={12} /> Vector Velocity Profile
                  </span>
                  
                  <div className="flex-1 w-full relative min-h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <defs>
                          <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00ff88" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="distance" stroke="rgba(255,255,255,0.2)" fontSize={9} unit="m" tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} unit="m" tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface-solid)',
                            borderColor: 'var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                          }}
                        />
                        <Area type="monotone" dataKey="designSpeed" name="AG Target Speed" stroke="#00ff88" fill="url(#speedGrad)" strokeWidth={2} />
                        <Area type="monotone" dataKey="speed" name="Real F1 Speed" stroke="#3b82f6" fill="transparent" strokeWidth={1} strokeDasharray="3 3" />
                        <ReferenceLine x={chartData[activeNodeIndex]?.distance} stroke="#E10600" strokeWidth={1.5} strokeDasharray="3 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="text-[8px] text-gray-500 uppercase text-center block mt-1">Horizontal: Distance (m) • Vertical: Velocity (km/h)</span>
                </div>

                {/* Anti-Gravity Physics Guide */}
                <div className="glass-card p-4 border border-white/5 bg-[#101018]/85 text-[11px] space-y-3">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#E10600] flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <HelpCircle size={12} /> Spatial Dynamics Formulas
                  </span>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="font-bold text-white uppercase tracking-wider text-[9px] text-[#00ff88]">1. Anti-Gravity Banking Angle (θ)</p>
                      <p className="mt-0.5 leading-relaxed text-gray-400">
                        Calculates structural bank angle to balance high-speed centripetal forces up to a max threshold:
                      </p>
                      <code className="block mt-1 p-1 bg-black/60 rounded text-[10px] text-center font-mono text-cyan-400">
                        θ = min(60°, atan(v² / (r · g · 3.5)))
                      </code>
                    </div>

                    <div>
                      <p className="font-bold text-white uppercase tracking-wider text-[9px] text-[#ff9f43]">2. Net Lateral G-Force</p>
                      <p className="mt-0.5 leading-relaxed text-gray-400">
                        Centrifugal load countered by structural bank angle vector decomposition:
                      </p>
                      <code className="block mt-1 p-1 bg-black/60 rounded text-[10px] text-center font-mono text-cyan-400">
                        G = (v² / (r · g)) · cos(θ) - sin(θ)
                      </code>
                    </div>

                    <div className="text-[9.5px] text-gray-500 border-t border-white/5 pt-2 leading-relaxed">
                      <span className="font-bold text-[#E10600] uppercase">Grip Multiplier:</span> Design integrates a 3.5× anti-gravity load multiplier factor allowing corner velocities up to 520 km/h with safe lateral margins.
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            // Full Raw Centerline Nodes Data Table
            <motion.div
              key="blueprint-table"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-card overflow-hidden border border-white/5"
            >
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-[#101018] to-transparent">
                <div>
                  <h3 className="text-sm font-display font-black uppercase text-white">Raw Sequenced Centerline Dataset</h3>
                  <p className="text-[10px] text-gray-400">
                    FIA-approximated structural node blueprint for {geometry.circuitName} ({geometry.nodes.length} segments).
                  </p>
                </div>
                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-400/10 px-2 py-1 rounded border border-purple-400/20">
                  EXPORT FORMAT: STRUCTURAL ARRAY
                </span>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[rgba(255,255,255,0.02)] border-b border-[var(--border)] text-[9px] uppercase font-bold tracking-wider text-gray-500">
                      <th className="px-4 py-3 text-center">Node ID</th>
                      <th className="px-4 py-3">Segment Name</th>
                      <th className="px-4 py-3">Segment Type</th>
                      <th className="px-4 py-3 text-right">Displacement ΔX</th>
                      <th className="px-4 py-3 text-right">Displacement ΔY</th>
                      <th className="px-4 py-3 text-right">Elevation ΔZ</th>
                      <th className="px-4 py-3 text-right">Gradient %</th>
                      <th className="px-4 py-3 text-right">Arc Length</th>
                      <th className="px-4 py-3 text-right">Heading</th>
                      <th className="px-4 py-3 text-right">Apex Radius</th>
                      <th className="px-4 py-3 text-right">Banking</th>
                      <th className="px-4 py-3 text-right">AG Speed Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px] text-gray-300">
                    {geometry.nodes.map((node, i) => {
                      const isActive = i === activeNodeIndex;
                      return (
                        <tr
                          key={node.nodeId}
                          onClick={() => {
                            setActiveNodeIndex(i);
                            setActiveTab('visualizer');
                          }}
                          className={`hover:bg-white/2 cursor-pointer transition-colors ${
                            isActive ? 'bg-[#E10600]/10 text-white font-bold' : ''
                          }`}
                        >
                          <td className="px-4 py-2.5 text-center font-bold" style={{ color: isActive ? '#E10600' : 'var(--text-muted)' }}>
                            {node.nodeId}
                          </td>
                          <td className="px-4 py-2.5 text-white font-sans font-semibold">
                            {node.name}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold tracking-wider uppercase ${
                              node.segmentType === 'STRAIGHT' ? 'bg-blue-500/10 text-blue-400' :
                              node.segmentType === 'HAIRPIN' ? 'bg-red-500/10 text-red-400' :
                              node.segmentType === 'CHICANE' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-green-500/10 text-green-400'
                            }`}>
                              {node.segmentType}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">{node.deltaX > 0 ? '+' : ''}{node.deltaX}m</td>
                          <td className="px-4 py-2.5 text-right">{node.deltaY > 0 ? '+' : ''}{node.deltaY}m</td>
                          <td className="px-4 py-2.5 text-right font-bold" style={{ color: node.deltaZ > 0 ? '#ff9f43' : node.deltaZ < 0 ? '#27F4D2' : '' }}>
                            {node.deltaZ > 0 ? '+' : ''}{node.deltaZ}m
                          </td>
                          <td className="px-4 py-2.5 text-right" style={{ color: node.gradientPct > 0 ? '#ff9f43' : node.gradientPct < 0 ? '#27F4D2' : '' }}>
                            {node.gradientPct > 0 ? '+' : ''}{node.gradientPct}%
                          </td>
                          <td className="px-4 py-2.5 text-right">{node.arcLengthM}m</td>
                          <td className="px-4 py-2.5 text-right">{node.headingDeg}°</td>
                          <td className="px-4 py-2.5 text-right font-bold text-white">
                            {node.radiusM ? `${node.radiusM}m` : 'Straight'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-[#00ff88] font-bold">{node.agBankingDeg}°</td>
                          <td className="px-4 py-2.5 text-right text-cyan-400 font-bold">{node.agDesignSpeedKph} km/h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
