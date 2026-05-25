// ═══════════════════════════════════════════════════════
// F1 Track SVG Path Data — All 22 Official Circuits
// Hand-crafted SVG paths matching real-world layouts
// ═══════════════════════════════════════════════════════

export interface TrackPathData {
  trackId: string;
  viewBox: string;
  mainPath: string;
  pitLanePath: string;
  startFinishLine: { x: number; y: number; angle: number };
  drsZones: Array<{ startPercent: number; endPercent: number }>;
  sectorSplits: [number, number]; // percentages along path (sector 1→2, 2→3)
  speedProfile: Array<{ percent: number; speedFactor: number }>;
}

// ─────────────────────────────────────────────
// 1. BAHRAIN — Sakhir
// ─────────────────────────────────────────────
const bahrain: TrackPathData = {
  trackId: 'bahrain',
  viewBox: '0 0 800 600',
  mainPath: 'M 400,80 L 600,80 Q 660,80 660,140 L 660,200 Q 660,230 640,240 L 580,270 Q 560,280 560,300 L 560,380 Q 560,420 520,440 L 420,480 Q 380,500 340,480 L 280,440 Q 240,420 240,380 L 240,300 Q 240,270 220,250 L 180,220 Q 140,190 140,150 L 140,140 Q 140,80 200,80 Z',
  pitLanePath: 'M 350,80 L 350,100 Q 350,120 370,120 L 550,120 Q 580,120 580,150 L 580,200',
  startFinishLine: { x: 400, y: 80, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.45, endPercent: 0.58 },
    { startPercent: 0.72, endPercent: 0.85 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.95 },
    { percent: 0.18, speedFactor: 0.5 },
    { percent: 0.25, speedFactor: 0.4 },
    { percent: 0.35, speedFactor: 0.85 },
    { percent: 0.45, speedFactor: 1 },
    { percent: 0.55, speedFactor: 0.6 },
    { percent: 0.65, speedFactor: 0.5 },
    { percent: 0.72, speedFactor: 0.9 },
    { percent: 0.85, speedFactor: 0.55 },
    { percent: 0.92, speedFactor: 0.7 },
    { percent: 1, speedFactor: 0.9 },
  ],
};

// ─────────────────────────────────────────────
// 2. JEDDAH — Corniche
// ─────────────────────────────────────────────
const jeddah: TrackPathData = {
  trackId: 'jeddah',
  viewBox: '0 0 400 800',
  mainPath: 'M 200,50 L 300,50 Q 340,50 340,90 L 340,200 Q 340,220 320,230 L 280,250 Q 260,260 260,280 L 260,400 Q 260,430 280,450 L 320,490 Q 350,520 350,560 L 350,650 Q 350,700 300,720 L 200,750 Q 140,750 100,720 L 70,690 Q 50,670 50,640 L 50,500 Q 50,470 70,450 L 120,400 Q 140,380 140,350 L 140,200 Q 140,160 160,140 L 180,120 Q 200,100 200,80 Z',
  pitLanePath: 'M 200,50 L 200,80 Q 200,110 180,110 L 100,110 Q 80,110 80,140 L 80,280',
  startFinishLine: { x: 200, y: 50, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.1 },
    { startPercent: 0.35, endPercent: 0.48 },
    { startPercent: 0.62, endPercent: 0.78 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.9 },
    { percent: 0.3, speedFactor: 0.45 },
    { percent: 0.4, speedFactor: 0.95 },
    { percent: 0.5, speedFactor: 0.5 },
    { percent: 0.6, speedFactor: 0.85 },
    { percent: 0.7, speedFactor: 0.4 },
    { percent: 0.8, speedFactor: 0.9 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ─────────────────────────────────────────────
// 3. ALBERT PARK — Melbourne
// ─────────────────────────────────────────────
const albertPark: TrackPathData = {
  trackId: 'albert_park',
  viewBox: '0 0 800 600',
  mainPath: 'M 350,100 L 550,80 Q 620,75 660,120 L 700,180 Q 720,220 700,260 L 650,340 Q 630,370 640,400 L 660,460 Q 680,510 640,540 L 500,560 Q 450,560 400,540 L 280,480 Q 240,460 200,460 L 150,470 Q 100,480 80,440 L 60,380 Q 40,330 60,280 L 100,200 Q 130,150 180,130 L 280,110 Q 320,105 350,100 Z',
  pitLanePath: 'M 350,100 L 350,130 Q 350,150 330,150 L 220,160 Q 180,170 160,200 L 120,260',
  startFinishLine: { x: 350, y: 100, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.28, endPercent: 0.4 },
    { startPercent: 0.55, endPercent: 0.67 },
    { startPercent: 0.82, endPercent: 0.94 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.95 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.85 },
    { percent: 0.3, speedFactor: 0.6 },
    { percent: 0.4, speedFactor: 0.9 },
    { percent: 0.5, speedFactor: 0.45 },
    { percent: 0.6, speedFactor: 0.85 },
    { percent: 0.7, speedFactor: 0.55 },
    { percent: 0.8, speedFactor: 0.9 },
    { percent: 0.9, speedFactor: 0.5 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ─────────────────────────────────────────────
// 4. SUZUKA — Figure 8
// ─────────────────────────────────────────────
const suzuka: TrackPathData = {
  trackId: 'suzuka',
  viewBox: '0 0 800 600',
  mainPath: 'M 500,520 L 650,520 Q 700,520 720,480 L 740,420 Q 750,380 720,350 L 620,280 Q 580,260 560,220 L 540,160 Q 520,120 480,100 L 400,70 Q 340,55 280,70 L 200,100 Q 160,120 140,160 L 120,220 Q 100,280 140,320 L 220,380 Q 260,410 260,450 L 250,490 Q 240,530 200,540 L 140,550 Q 80,550 60,500 L 50,440 Q 40,400 60,360 L 160,240 Q 200,200 260,200 L 380,210 Q 440,215 480,250 L 560,340 Q 600,380 620,420 L 640,460 Q 650,490 620,510 L 550,520 Z',
  pitLanePath: 'M 500,520 L 500,550 Q 500,570 480,570 L 300,570 Q 260,570 250,540 L 250,500',
  startFinishLine: { x: 500, y: 520, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.08 },
    { startPercent: 0.62, endPercent: 0.74 },
  ],
  sectorSplits: [0.35, 0.7],
  speedProfile: [
    { percent: 0, speedFactor: 0.9 },
    { percent: 0.06, speedFactor: 0.5 },
    { percent: 0.12, speedFactor: 0.85 },
    { percent: 0.2, speedFactor: 0.7 },
    { percent: 0.3, speedFactor: 0.55 },
    { percent: 0.4, speedFactor: 0.75 },
    { percent: 0.5, speedFactor: 0.5 },
    { percent: 0.6, speedFactor: 0.45 },
    { percent: 0.7, speedFactor: 0.9 },
    { percent: 0.8, speedFactor: 0.6 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.8 },
  ],
};

// ─────────────────────────────────────────────
// 5. SHANGHAI
// ─────────────────────────────────────────────
const shanghai: TrackPathData = {
  trackId: 'shanghai',
  viewBox: '0 0 800 600',
  mainPath: 'M 450,100 L 650,100 Q 700,100 720,140 L 740,200 Q 750,240 720,270 L 650,330 Q 620,360 620,400 L 630,460 Q 640,510 600,540 L 480,560 Q 420,560 380,530 L 300,460 Q 260,430 220,430 L 160,440 Q 100,450 80,400 L 60,320 Q 50,270 80,240 L 160,180 Q 200,150 260,140 L 380,120 Q 420,110 450,100 Z',
  pitLanePath: 'M 450,100 L 450,130 Q 450,160 420,160 L 300,170 Q 260,180 230,210',
  startFinishLine: { x: 450, y: 100, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.13 },
    { startPercent: 0.5, endPercent: 0.65 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.12, speedFactor: 0.45 },
    { percent: 0.2, speedFactor: 0.55 },
    { percent: 0.3, speedFactor: 0.85 },
    { percent: 0.4, speedFactor: 0.5 },
    { percent: 0.5, speedFactor: 0.95 },
    { percent: 0.6, speedFactor: 0.55 },
    { percent: 0.7, speedFactor: 0.6 },
    { percent: 0.8, speedFactor: 0.45 },
    { percent: 0.9, speedFactor: 0.8 },
    { percent: 1, speedFactor: 0.9 },
  ],
};

// ─────────────────────────────────────────────
// 6. MIAMI
// ─────────────────────────────────────────────
const miami: TrackPathData = {
  trackId: 'miami',
  viewBox: '0 0 800 600',
  mainPath: 'M 380,80 L 620,80 Q 680,80 700,130 L 720,200 Q 730,240 700,270 L 640,320 Q 610,340 600,370 L 590,420 Q 580,460 540,490 L 440,540 Q 380,560 320,530 L 220,470 Q 180,450 160,410 L 130,340 Q 110,290 130,250 L 180,180 Q 210,140 260,120 L 340,90 Q 360,85 380,80 Z',
  pitLanePath: 'M 380,80 L 380,110 Q 380,140 350,140 L 250,150 Q 220,160 200,190',
  startFinishLine: { x: 380, y: 80, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.14 },
    { startPercent: 0.38, endPercent: 0.52 },
    { startPercent: 0.7, endPercent: 0.84 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.95 },
    { percent: 0.12, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.85 },
    { percent: 0.3, speedFactor: 0.55 },
    { percent: 0.4, speedFactor: 0.95 },
    { percent: 0.5, speedFactor: 0.5 },
    { percent: 0.6, speedFactor: 0.75 },
    { percent: 0.7, speedFactor: 0.9 },
    { percent: 0.8, speedFactor: 0.5 },
    { percent: 0.9, speedFactor: 0.7 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ─────────────────────────────────────────────
// 7. IMOLA
// ─────────────────────────────────────────────
const imola: TrackPathData = {
  trackId: 'imola',
  viewBox: '0 0 800 500',
  mainPath: 'M 400,80 L 600,70 Q 660,65 700,100 L 730,150 Q 750,190 720,220 L 640,280 Q 600,310 590,350 L 580,400 Q 570,440 520,450 L 380,460 Q 320,460 270,430 L 180,370 Q 140,340 120,300 L 90,230 Q 70,180 100,140 L 180,90 Q 230,60 300,70 L 400,80 Z',
  pitLanePath: 'M 400,80 L 400,110 Q 400,140 370,140 L 270,130 Q 230,130 210,110',
  startFinishLine: { x: 400, y: 80, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.14 },
    { startPercent: 0.58, endPercent: 0.72 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.9 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.75 },
    { percent: 0.3, speedFactor: 0.6 },
    { percent: 0.4, speedFactor: 0.45 },
    { percent: 0.55, speedFactor: 0.9 },
    { percent: 0.65, speedFactor: 0.5 },
    { percent: 0.75, speedFactor: 0.7 },
    { percent: 0.85, speedFactor: 0.55 },
    { percent: 0.95, speedFactor: 0.8 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ─────────────────────────────────────────────
// 8. MONACO
// ─────────────────────────────────────────────
const monaco: TrackPathData = {
  trackId: 'monaco',
  viewBox: '0 0 700 600',
  mainPath: 'M 300,80 L 480,60 Q 530,55 560,90 L 590,140 Q 610,180 580,210 L 520,260 Q 490,280 480,310 L 470,360 Q 460,400 420,420 L 350,450 Q 300,460 260,440 L 200,400 Q 160,370 150,330 L 140,260 Q 130,210 160,180 L 220,130 Q 260,100 300,80 Z',
  pitLanePath: 'M 300,80 L 280,100 Q 260,120 240,120 L 180,130 Q 160,140 160,170',
  startFinishLine: { x: 300, y: 80, angle: -10 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.75 },
    { percent: 0.08, speedFactor: 0.35 },
    { percent: 0.15, speedFactor: 0.55 },
    { percent: 0.22, speedFactor: 0.3 },
    { percent: 0.3, speedFactor: 0.5 },
    { percent: 0.4, speedFactor: 0.35 },
    { percent: 0.5, speedFactor: 0.6 },
    { percent: 0.6, speedFactor: 0.3 },
    { percent: 0.7, speedFactor: 0.45 },
    { percent: 0.8, speedFactor: 0.35 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.65 },
  ],
};

// ─────────────────────────────────────────────
// 9. CIRCUIT GILLES VILLENEUVE — Montreal
// ─────────────────────────────────────────────
const villeneuve: TrackPathData = {
  trackId: 'villeneuve',
  viewBox: '0 0 800 400',
  mainPath: 'M 400,80 L 620,80 Q 680,80 710,120 L 730,170 Q 740,200 720,230 L 680,280 Q 660,300 640,300 L 560,300 Q 520,300 500,320 L 480,350 Q 460,370 420,370 L 300,360 Q 240,350 200,320 L 140,270 Q 100,240 80,200 L 60,150 Q 50,110 80,90 L 160,60 Q 200,50 260,60 L 400,80 Z',
  pitLanePath: 'M 400,80 L 380,100 Q 360,120 330,120 L 220,110 Q 180,110 160,90',
  startFinishLine: { x: 400, y: 80, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.15 },
    { startPercent: 0.6, endPercent: 0.78 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.9 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.85 },
    { percent: 0.3, speedFactor: 0.45 },
    { percent: 0.4, speedFactor: 0.55 },
    { percent: 0.5, speedFactor: 0.4 },
    { percent: 0.6, speedFactor: 0.9 },
    { percent: 0.7, speedFactor: 0.5 },
    { percent: 0.8, speedFactor: 0.7 },
    { percent: 0.9, speedFactor: 0.35 },
    { percent: 1, speedFactor: 0.8 },
  ],
};

// ─────────────────────────────────────────────
// 10. BARCELONA — Catalunya
// ─────────────────────────────────────────────
const catalunya: TrackPathData = {
  trackId: 'catalunya',
  viewBox: '0 0 800 600',
  mainPath: 'M 350,100 L 550,80 Q 620,70 670,110 L 720,170 Q 750,210 730,260 L 680,340 Q 650,380 630,420 L 610,470 Q 590,510 540,530 L 400,560 Q 340,570 280,540 L 180,480 Q 140,450 120,400 L 90,320 Q 70,260 100,210 L 160,150 Q 210,110 280,100 L 350,100 Z',
  pitLanePath: 'M 350,100 L 340,130 Q 330,160 290,160 L 210,160 Q 180,160 170,140',
  startFinishLine: { x: 350, y: 100, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.13 },
    { startPercent: 0.6, endPercent: 0.75 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.18, speedFactor: 0.75 },
    { percent: 0.25, speedFactor: 0.55 },
    { percent: 0.35, speedFactor: 0.85 },
    { percent: 0.45, speedFactor: 0.5 },
    { percent: 0.55, speedFactor: 0.65 },
    { percent: 0.65, speedFactor: 0.9 },
    { percent: 0.75, speedFactor: 0.45 },
    { percent: 0.85, speedFactor: 0.7 },
    { percent: 0.95, speedFactor: 0.85 },
    { percent: 1, speedFactor: 0.9 },
  ],
};

// ─────────────────────────────────────────────
// 11. RED BULL RING — Spielberg
// ─────────────────────────────────────────────
const redBullRing: TrackPathData = {
  trackId: 'red_bull_ring',
  viewBox: '0 0 700 500',
  mainPath: 'M 300,100 L 500,80 Q 560,75 600,110 L 630,160 Q 650,200 620,240 L 540,320 Q 500,360 480,400 L 460,430 Q 440,460 400,460 L 280,450 Q 220,440 180,400 L 120,320 Q 90,280 80,230 L 70,170 Q 60,120 100,100 L 200,90 Q 250,85 300,100 Z',
  pitLanePath: 'M 300,100 L 280,120 Q 260,140 230,140 L 150,140 Q 120,140 110,120',
  startFinishLine: { x: 300, y: 100, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.14 },
    { startPercent: 0.32, endPercent: 0.48 },
    { startPercent: 0.65, endPercent: 0.82 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.18, speedFactor: 0.95 },
    { percent: 0.3, speedFactor: 0.5 },
    { percent: 0.4, speedFactor: 0.85 },
    { percent: 0.5, speedFactor: 0.45 },
    { percent: 0.6, speedFactor: 0.5 },
    { percent: 0.7, speedFactor: 0.9 },
    { percent: 0.85, speedFactor: 0.5 },
    { percent: 0.95, speedFactor: 0.8 },
    { percent: 1, speedFactor: 0.9 },
  ],
};

// ─────────────────────────────────────────────
// 12. SILVERSTONE
// ─────────────────────────────────────────────
const silverstone: TrackPathData = {
  trackId: 'silverstone',
  viewBox: '0 0 800 600',
  mainPath: 'M 400,100 L 580,80 Q 640,75 680,110 L 720,160 Q 740,200 720,240 L 680,300 Q 660,330 660,370 L 660,420 Q 660,460 620,490 L 540,530 Q 480,560 420,560 L 300,550 Q 240,540 190,500 L 130,440 Q 90,400 80,350 L 70,280 Q 60,220 100,180 L 180,130 Q 240,100 320,95 L 400,100 Z',
  pitLanePath: 'M 400,100 L 380,130 Q 360,160 320,160 L 200,170 Q 160,180 140,210',
  startFinishLine: { x: 400, y: 100, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.55, endPercent: 0.7 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.08, speedFactor: 0.7 },
    { percent: 0.15, speedFactor: 0.85 },
    { percent: 0.22, speedFactor: 0.6 },
    { percent: 0.3, speedFactor: 0.75 },
    { percent: 0.4, speedFactor: 0.55 },
    { percent: 0.5, speedFactor: 0.8 },
    { percent: 0.6, speedFactor: 0.95 },
    { percent: 0.7, speedFactor: 0.55 },
    { percent: 0.8, speedFactor: 0.7 },
    { percent: 0.9, speedFactor: 0.6 },
    { percent: 1, speedFactor: 0.9 },
  ],
};

// ─────────────────────────────────────────────
// 13. HUNGARORING
// ─────────────────────────────────────────────
const hungaroring: TrackPathData = {
  trackId: 'hungaroring',
  viewBox: '0 0 700 600',
  mainPath: 'M 350,80 L 500,70 Q 560,65 600,100 L 640,160 Q 660,200 640,240 L 580,320 Q 550,360 540,400 L 530,450 Q 510,500 460,510 L 340,520 Q 280,520 230,490 L 160,440 Q 120,400 100,350 L 80,280 Q 60,220 90,170 L 140,120 Q 190,80 260,75 L 350,80 Z',
  pitLanePath: 'M 350,80 L 340,110 Q 330,140 300,140 L 200,140 Q 170,140 160,120',
  startFinishLine: { x: 350, y: 80, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.1 },
    { startPercent: 0.55, endPercent: 0.68 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.85 },
    { percent: 0.1, speedFactor: 0.45 },
    { percent: 0.18, speedFactor: 0.6 },
    { percent: 0.25, speedFactor: 0.4 },
    { percent: 0.35, speedFactor: 0.55 },
    { percent: 0.45, speedFactor: 0.4 },
    { percent: 0.55, speedFactor: 0.75 },
    { percent: 0.65, speedFactor: 0.45 },
    { percent: 0.75, speedFactor: 0.55 },
    { percent: 0.85, speedFactor: 0.4 },
    { percent: 0.95, speedFactor: 0.7 },
    { percent: 1, speedFactor: 0.8 },
  ],
};

// ─────────────────────────────────────────────
// 14. SPA-FRANCORCHAMPS
// ─────────────────────────────────────────────
const spa: TrackPathData = {
  trackId: 'spa',
  viewBox: '0 0 800 700',
  mainPath: 'M 300,600 L 380,580 Q 420,570 440,540 L 480,460 Q 500,420 540,400 L 620,370 Q 680,350 720,300 L 750,240 Q 770,190 740,150 L 680,100 Q 640,70 580,60 L 460,50 Q 400,50 360,80 L 300,140 Q 270,180 240,200 L 160,240 Q 110,270 90,320 L 70,400 Q 50,460 80,510 L 140,560 Q 180,590 240,600 L 300,600 Z',
  pitLanePath: 'M 300,600 L 260,590 Q 230,580 220,560 L 200,520 Q 180,480 160,460',
  startFinishLine: { x: 300, y: 600, angle: -10 },
  drsZones: [
    { startPercent: 0, endPercent: 0.08 },
    { startPercent: 0.42, endPercent: 0.58 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.85 },
    { percent: 0.05, speedFactor: 0.35 },
    { percent: 0.1, speedFactor: 0.7 },
    { percent: 0.15, speedFactor: 0.5 },
    { percent: 0.25, speedFactor: 0.9 },
    { percent: 0.35, speedFactor: 0.95 },
    { percent: 0.45, speedFactor: 1 },
    { percent: 0.55, speedFactor: 0.4 },
    { percent: 0.65, speedFactor: 0.8 },
    { percent: 0.75, speedFactor: 0.5 },
    { percent: 0.85, speedFactor: 0.55 },
    { percent: 0.92, speedFactor: 0.45 },
    { percent: 1, speedFactor: 0.75 },
  ],
};

// ─────────────────────────────────────────────
// 15. ZANDVOORT
// ─────────────────────────────────────────────
const zandvoort: TrackPathData = {
  trackId: 'zandvoort',
  viewBox: '0 0 700 500',
  mainPath: 'M 350,80 L 500,70 Q 560,65 600,100 L 630,150 Q 650,190 630,230 L 580,300 Q 550,340 540,380 L 530,420 Q 510,460 460,460 L 300,450 Q 240,440 200,400 L 140,340 Q 100,290 90,240 L 80,180 Q 70,130 110,100 L 200,70 Q 260,60 350,80 Z',
  pitLanePath: 'M 350,80 L 330,100 Q 310,120 280,120 L 200,120 Q 170,120 160,100',
  startFinishLine: { x: 350, y: 80, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.1 },
    { startPercent: 0.55, endPercent: 0.7 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.85 },
    { percent: 0.1, speedFactor: 0.45 },
    { percent: 0.2, speedFactor: 0.7 },
    { percent: 0.3, speedFactor: 0.5 },
    { percent: 0.4, speedFactor: 0.65 },
    { percent: 0.5, speedFactor: 0.45 },
    { percent: 0.6, speedFactor: 0.55 },
    { percent: 0.7, speedFactor: 0.8 },
    { percent: 0.8, speedFactor: 0.5 },
    { percent: 0.9, speedFactor: 0.65 },
    { percent: 1, speedFactor: 0.75 },
  ],
};

// ─────────────────────────────────────────────
// 16. MONZA — Temple of Speed
// ─────────────────────────────────────────────
const monza: TrackPathData = {
  trackId: 'monza',
  viewBox: '0 0 700 600',
  mainPath: 'M 350,100 L 550,90 Q 600,85 630,110 L 650,150 Q 660,190 630,220 L 560,280 Q 540,300 530,320 L 520,380 Q 510,420 540,450 L 580,480 Q 600,500 580,530 L 520,550 Q 480,560 440,550 L 300,520 Q 240,500 200,460 L 140,390 Q 100,340 90,280 L 80,210 Q 70,150 110,120 L 200,90 Q 260,80 350,100 Z',
  pitLanePath: 'M 350,100 L 330,120 Q 310,140 270,140 L 180,140 Q 150,140 140,120',
  startFinishLine: { x: 350, y: 100, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.15 },
    { startPercent: 0.55, endPercent: 0.72 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.12, speedFactor: 0.4 },
    { percent: 0.18, speedFactor: 0.5 },
    { percent: 0.25, speedFactor: 0.95 },
    { percent: 0.35, speedFactor: 0.45 },
    { percent: 0.42, speedFactor: 0.5 },
    { percent: 0.5, speedFactor: 0.95 },
    { percent: 0.6, speedFactor: 0.5 },
    { percent: 0.65, speedFactor: 0.55 },
    { percent: 0.75, speedFactor: 0.45 },
    { percent: 0.85, speedFactor: 0.9 },
    { percent: 1, speedFactor: 0.95 },
  ],
};

// ─────────────────────────────────────────────
// 17. BAKU — City Circuit
// ─────────────────────────────────────────────
const baku: TrackPathData = {
  trackId: 'baku',
  viewBox: '0 0 400 800',
  mainPath: 'M 200,60 L 300,60 Q 340,60 350,100 L 360,200 Q 365,240 340,260 L 280,300 Q 260,310 260,340 L 260,500 Q 260,540 280,560 L 320,600 Q 350,630 340,670 L 310,720 Q 280,750 240,750 L 160,740 Q 110,730 80,690 L 60,640 Q 40,600 60,560 L 100,500 Q 120,470 120,440 L 120,280 Q 120,240 140,220 L 170,190 Q 190,170 190,140 L 190,100 Q 190,60 200,60 Z',
  pitLanePath: 'M 200,60 L 200,90 Q 200,120 180,120 L 120,130 Q 90,140 80,170',
  startFinishLine: { x: 200, y: 60, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.08 },
    { startPercent: 0.4, endPercent: 0.58 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.08, speedFactor: 0.4 },
    { percent: 0.15, speedFactor: 0.55 },
    { percent: 0.25, speedFactor: 0.45 },
    { percent: 0.35, speedFactor: 0.6 },
    { percent: 0.45, speedFactor: 1 },
    { percent: 0.55, speedFactor: 0.4 },
    { percent: 0.65, speedFactor: 0.55 },
    { percent: 0.75, speedFactor: 0.45 },
    { percent: 0.85, speedFactor: 0.5 },
    { percent: 0.92, speedFactor: 0.65 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ─────────────────────────────────────────────
// 18. MARINA BAY — Singapore
// ─────────────────────────────────────────────
const marinaBay: TrackPathData = {
  trackId: 'marina_bay',
  viewBox: '0 0 700 600',
  mainPath: 'M 350,80 L 520,70 Q 570,65 600,100 L 630,150 Q 650,190 630,220 L 580,280 Q 550,310 550,350 L 550,400 Q 550,440 520,460 L 460,500 Q 420,520 380,520 L 280,510 Q 220,500 180,460 L 130,400 Q 100,360 90,310 L 80,250 Q 70,200 100,160 L 160,110 Q 210,80 280,75 L 350,80 Z',
  pitLanePath: 'M 350,80 L 330,100 Q 310,120 280,120 L 200,130 Q 170,140 160,160',
  startFinishLine: { x: 350, y: 80, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.1 },
    { startPercent: 0.35, endPercent: 0.48 },
    { startPercent: 0.7, endPercent: 0.82 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.8 },
    { percent: 0.1, speedFactor: 0.4 },
    { percent: 0.2, speedFactor: 0.6 },
    { percent: 0.3, speedFactor: 0.4 },
    { percent: 0.4, speedFactor: 0.7 },
    { percent: 0.5, speedFactor: 0.35 },
    { percent: 0.6, speedFactor: 0.55 },
    { percent: 0.7, speedFactor: 0.8 },
    { percent: 0.8, speedFactor: 0.4 },
    { percent: 0.9, speedFactor: 0.6 },
    { percent: 1, speedFactor: 0.7 },
  ],
};

// ─────────────────────────────────────────────
// 19. COTA — Circuit of the Americas
// ─────────────────────────────────────────────
const americas: TrackPathData = {
  trackId: 'americas',
  viewBox: '0 0 800 600',
  mainPath: 'M 380,100 L 560,80 Q 620,70 660,110 L 700,170 Q 730,220 710,270 L 660,340 Q 630,380 610,420 L 590,460 Q 570,500 520,520 L 400,560 Q 340,570 280,540 L 200,490 Q 150,450 120,400 L 80,330 Q 60,270 80,220 L 130,160 Q 170,120 230,100 L 380,100 Z',
  pitLanePath: 'M 380,100 L 370,130 Q 360,160 330,160 L 230,160 Q 200,160 190,140',
  startFinishLine: { x: 380, y: 100, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.58, endPercent: 0.72 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.95 },
    { percent: 0.05, speedFactor: 0.4 },
    { percent: 0.12, speedFactor: 0.7 },
    { percent: 0.2, speedFactor: 0.55 },
    { percent: 0.3, speedFactor: 0.85 },
    { percent: 0.4, speedFactor: 0.5 },
    { percent: 0.5, speedFactor: 0.75 },
    { percent: 0.6, speedFactor: 0.95 },
    { percent: 0.7, speedFactor: 0.45 },
    { percent: 0.8, speedFactor: 0.65 },
    { percent: 0.9, speedFactor: 0.5 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ─────────────────────────────────────────────
// 20. HERMANOS RODRÍGUEZ — Mexico
// ─────────────────────────────────────────────
const rodriguez: TrackPathData = {
  trackId: 'rodriguez',
  viewBox: '0 0 800 500',
  mainPath: 'M 400,80 L 580,70 Q 640,65 680,100 L 720,160 Q 740,200 720,240 L 660,310 Q 630,350 610,390 L 590,420 Q 560,450 510,450 L 350,440 Q 280,430 230,390 L 160,320 Q 120,270 100,220 L 80,160 Q 60,110 100,90 L 220,70 Q 300,65 400,80 Z',
  pitLanePath: 'M 400,80 L 380,100 Q 360,120 330,120 L 220,120 Q 190,120 170,100',
  startFinishLine: { x: 400, y: 80, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.42, endPercent: 0.56 },
    { startPercent: 0.72, endPercent: 0.86 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.8 },
    { percent: 0.3, speedFactor: 0.45 },
    { percent: 0.4, speedFactor: 0.55 },
    { percent: 0.5, speedFactor: 0.9 },
    { percent: 0.6, speedFactor: 0.5 },
    { percent: 0.7, speedFactor: 0.45 },
    { percent: 0.8, speedFactor: 0.8 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ─────────────────────────────────────────────
// 21. INTERLAGOS — São Paulo
// ─────────────────────────────────────────────
const interlagos: TrackPathData = {
  trackId: 'interlagos',
  viewBox: '0 0 700 500',
  mainPath: 'M 400,80 L 540,70 Q 590,65 620,100 L 640,150 Q 650,190 620,220 L 560,280 Q 530,310 520,350 L 510,390 Q 490,430 440,440 L 320,450 Q 260,450 210,420 L 140,370 Q 100,340 80,290 L 60,230 Q 50,180 80,140 L 150,100 Q 200,75 280,70 L 400,80 Z',
  pitLanePath: 'M 400,80 L 380,100 Q 360,120 330,120 L 230,120 Q 200,120 180,100',
  startFinishLine: { x: 400, y: 80, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.55, endPercent: 0.7 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.9 },
    { percent: 0.08, speedFactor: 0.4 },
    { percent: 0.18, speedFactor: 0.7 },
    { percent: 0.28, speedFactor: 0.55 },
    { percent: 0.4, speedFactor: 0.85 },
    { percent: 0.5, speedFactor: 0.5 },
    { percent: 0.6, speedFactor: 0.75 },
    { percent: 0.7, speedFactor: 0.45 },
    { percent: 0.8, speedFactor: 0.6 },
    { percent: 0.9, speedFactor: 0.5 },
    { percent: 1, speedFactor: 0.8 },
  ],
};

// ─────────────────────────────────────────────
// 22. YAS MARINA — Abu Dhabi
// ─────────────────────────────────────────────
const yasMarína: TrackPathData = {
  trackId: 'yas_marina',
  viewBox: '0 0 800 600',
  mainPath: 'M 400,100 L 580,80 Q 640,70 680,110 L 720,170 Q 750,220 730,270 L 680,340 Q 650,380 640,420 L 630,470 Q 610,520 560,540 L 420,560 Q 360,560 300,530 L 220,480 Q 170,440 140,390 L 100,320 Q 70,260 90,200 L 140,140 Q 190,100 260,90 L 400,100 Z',
  pitLanePath: 'M 400,100 L 380,120 Q 360,140 320,140 L 220,140 Q 190,140 170,120',
  startFinishLine: { x: 400, y: 100, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.55, endPercent: 0.7 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.95 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.8 },
    { percent: 0.3, speedFactor: 0.55 },
    { percent: 0.4, speedFactor: 0.7 },
    { percent: 0.5, speedFactor: 0.5 },
    { percent: 0.6, speedFactor: 0.85 },
    { percent: 0.7, speedFactor: 0.45 },
    { percent: 0.8, speedFactor: 0.7 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ═══════════════════════════════════════════════════════
// TRACK PATHS REGISTRY
// ═══════════════════════════════════════════════════════

export const ALL_TRACK_PATHS: TrackPathData[] = [
  bahrain,
  jeddah,
  albertPark,
  suzuka,
  shanghai,
  miami,
  imola,
  monaco,
  villeneuve,
  catalunya,
  redBullRing,
  silverstone,
  hungaroring,
  spa,
  zandvoort,
  monza,
  baku,
  marinaBay,
  americas,
  rodriguez,
  interlagos,
  yasMarína,
];

export function getTrackPath(trackId: string): TrackPathData | undefined {
  return ALL_TRACK_PATHS.find(t => t.trackId === trackId);
}
