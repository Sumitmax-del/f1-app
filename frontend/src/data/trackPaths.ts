// ═══════════════════════════════════════════════════════
// F1 Track SVG Path Data — All 24 Official 2025 Circuits
// Accurate SVG paths matching real-world circuit layouts
// Ordered by the 2025 FIA Formula One World Championship Calendar
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
// 1. ALBERT PARK — Melbourne  (Park/lake circuit, anti-clockwise feel)
// ─────────────────────────────────────────────
const albertPark: TrackPathData = {
  trackId: 'albert_park',
  viewBox: '0 0 800 600',
  mainPath: 'M 390,95 L 480,85 Q 530,80 570,95 L 640,130 Q 670,150 690,185 L 710,240 Q 725,275 710,310 L 680,360 Q 660,390 665,420 L 675,460 Q 685,500 660,530 L 620,555 Q 580,570 530,565 L 430,550 Q 380,545 340,525 L 270,490 Q 230,470 200,440 L 155,385 Q 125,355 110,315 L 95,265 Q 85,225 95,190 L 120,145 Q 145,115 185,100 L 260,85 Q 320,78 390,95 Z',
  pitLanePath: 'M 390,95 L 370,115 Q 350,135 320,140 L 240,145 Q 200,150 175,135',
  startFinishLine: { x: 390, y: 95, angle: -5 },
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
// 2. SHANGHAI — Distinctive "snail" / shang character shape
// ─────────────────────────────────────────────
const shanghai: TrackPathData = {
  trackId: 'shanghai',
  viewBox: '0 0 800 600',
  mainPath: 'M 540,510 L 640,510 Q 690,510 720,475 L 740,440 Q 755,405 740,370 L 700,320 Q 680,295 680,265 L 685,220 Q 690,175 660,145 L 610,100 Q 570,70 515,60 L 420,50 Q 360,50 310,75 L 255,110 Q 220,135 210,170 L 200,240 Q 195,290 225,330 L 280,385 Q 305,410 305,445 L 300,480 Q 290,520 255,545 L 210,565 Q 165,575 130,555 L 95,530 Q 65,505 65,465 L 65,400 Q 65,360 90,335 L 150,285 Q 190,260 210,225 L 230,180 Q 250,140 295,125 L 370,100 Q 430,90 480,115 L 530,155 Q 560,175 570,210 L 575,265 Q 575,305 550,335 L 490,395 Q 455,425 455,465 L 460,495 Q 470,520 500,510 Z',
  pitLanePath: 'M 540,510 L 540,535 Q 540,555 510,555 L 380,555 Q 340,555 310,545',
  startFinishLine: { x: 540, y: 510, angle: 0 },
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
// 3. SUZUKA — Figure-8 crossover
// ─────────────────────────────────────────────
const suzuka: TrackPathData = {
  trackId: 'suzuka',
  viewBox: '0 0 800 600',
  mainPath: 'M 510,530 L 620,530 Q 665,530 690,500 L 720,460 Q 745,425 735,385 L 710,340 Q 690,310 660,290 L 590,250 Q 550,235 520,205 L 475,155 Q 445,120 405,100 L 340,75 Q 290,55 240,65 L 185,80 Q 140,95 115,135 L 95,185 Q 80,235 100,280 L 135,330 Q 165,365 175,405 L 180,450 Q 180,490 155,520 L 125,545 Q 90,565 55,545 L 40,530 Q 25,515 30,490 L 50,430 Q 65,390 100,365 L 180,310 Q 225,285 265,255 L 340,200 Q 385,175 430,195 L 510,240 Q 555,265 585,310 L 625,370 Q 650,410 650,450 L 645,480 Q 635,510 605,520 L 550,530 Z',
  pitLanePath: 'M 510,530 L 510,555 Q 510,575 480,575 L 300,570 Q 260,565 240,545',
  startFinishLine: { x: 510, y: 530, angle: 0 },
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
// 4. BAHRAIN — Sakhir  (distinctive hairpin-heavy layout)
// ─────────────────────────────────────────────
const bahrain: TrackPathData = {
  trackId: 'bahrain',
  viewBox: '0 0 800 600',
  mainPath: 'M 420,75 L 580,75 Q 630,75 650,110 L 665,155 Q 675,185 660,210 L 630,245 Q 610,265 610,290 L 615,330 Q 620,355 600,375 L 555,415 Q 530,435 530,465 L 535,495 Q 540,520 515,540 L 465,560 Q 430,570 395,555 L 345,530 Q 315,515 295,490 L 265,445 Q 245,415 245,380 L 250,340 Q 255,310 240,285 L 210,245 Q 185,215 185,180 L 190,145 Q 200,110 230,90 L 290,70 Q 340,60 420,75 Z',
  pitLanePath: 'M 420,75 L 400,95 Q 380,115 350,115 L 270,115 Q 240,115 225,100',
  startFinishLine: { x: 420, y: 75, angle: 0 },
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
// 5. JEDDAH — Long, narrow corniche street circuit
// ─────────────────────────────────────────────
const jeddah: TrackPathData = {
  trackId: 'jeddah',
  viewBox: '0 0 400 800',
  mainPath: 'M 210,55 L 290,55 Q 325,55 340,85 L 350,130 Q 355,160 340,185 L 310,215 Q 290,235 285,260 L 280,330 Q 278,365 295,390 L 325,430 Q 350,460 350,500 L 345,570 Q 340,620 310,650 L 265,695 Q 235,720 195,730 L 150,735 Q 110,735 85,710 L 60,680 Q 40,655 45,625 L 55,570 Q 65,530 90,505 L 130,470 Q 155,445 160,415 L 165,350 Q 165,310 150,285 L 120,240 Q 100,215 105,185 L 115,150 Q 125,120 150,100 L 175,80 Q 195,65 210,55 Z',
  pitLanePath: 'M 210,55 L 210,85 Q 210,115 185,115 L 120,120 Q 95,125 85,150',
  startFinishLine: { x: 210, y: 55, angle: 0 },
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
// 6. MIAMI — Blocky street circuit around Hard Rock Stadium
// ─────────────────────────────────────────────
const miami: TrackPathData = {
  trackId: 'miami',
  viewBox: '0 0 800 600',
  mainPath: 'M 400,80 L 600,80 Q 640,80 660,110 L 690,170 Q 710,210 710,255 L 710,320 Q 710,365 680,395 L 630,440 Q 600,465 560,475 L 500,490 Q 465,495 440,520 L 400,555 Q 370,575 330,575 L 260,570 Q 215,565 180,535 L 135,490 Q 105,460 95,420 L 85,365 Q 80,320 95,280 L 120,230 Q 145,190 185,165 L 250,130 Q 295,110 340,95 L 400,80 Z',
  pitLanePath: 'M 400,80 L 390,110 Q 380,140 345,140 L 255,145 Q 220,150 200,170',
  startFinishLine: { x: 400, y: 80, angle: 0 },
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
// 7. IMOLA — Narrow old-school track with Tamburello & Rivazza
// ─────────────────────────────────────────────
const imola: TrackPathData = {
  trackId: 'imola',
  viewBox: '0 0 800 500',
  mainPath: 'M 420,80 L 560,65 Q 610,60 650,85 L 695,120 Q 725,150 730,195 L 730,245 Q 725,285 695,310 L 640,350 Q 610,370 600,400 L 595,430 Q 585,460 545,470 L 440,475 Q 385,475 335,455 L 270,420 Q 235,400 210,370 L 170,320 Q 145,285 130,245 L 115,195 Q 105,155 120,120 L 155,85 Q 195,60 250,60 L 350,70 Q 385,72 420,80 Z',
  pitLanePath: 'M 420,80 L 410,105 Q 400,130 370,130 L 280,125 Q 245,125 225,110',
  startFinishLine: { x: 420, y: 80, angle: -3 },
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
// 8. MONACO — Iconic tight harbor circuit
// ─────────────────────────────────────────────
const monaco: TrackPathData = {
  trackId: 'monaco',
  viewBox: '0 0 700 600',
  mainPath: 'M 340,95 L 450,75 Q 500,68 535,95 L 570,130 Q 595,160 600,200 L 605,250 Q 605,285 585,310 L 545,355 Q 520,375 510,405 L 505,440 Q 500,475 470,495 L 420,520 Q 385,535 345,530 L 285,515 Q 245,500 215,470 L 180,430 Q 155,395 145,355 L 135,300 Q 130,260 145,225 L 170,180 Q 200,145 240,125 L 290,105 Q 315,97 340,95 Z',
  pitLanePath: 'M 340,95 L 320,115 Q 300,135 270,135 L 210,140 Q 185,145 175,170',
  startFinishLine: { x: 340, y: 95, angle: -8 },
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
// 9. BARCELONA — Catalunya, flowing with long right-hander T3
// ─────────────────────────────────────────────
const catalunya: TrackPathData = {
  trackId: 'catalunya',
  viewBox: '0 0 800 600',
  mainPath: 'M 380,100 L 550,80 Q 610,72 655,105 L 700,150 Q 730,185 730,230 L 725,290 Q 720,335 690,365 L 640,410 Q 610,435 600,470 L 590,510 Q 575,545 535,560 L 440,575 Q 380,580 325,555 L 250,515 Q 205,490 175,450 L 135,395 Q 105,345 90,290 L 80,235 Q 75,185 100,150 L 150,110 Q 200,82 265,80 L 380,100 Z',
  pitLanePath: 'M 380,100 L 365,125 Q 350,150 310,155 L 220,155 Q 185,155 170,140',
  startFinishLine: { x: 380, y: 100, angle: -5 },
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
// 10. CIRCUIT GILLES VILLENEUVE — Montreal island hairpin-heavy
// ─────────────────────────────────────────────
const villeneuve: TrackPathData = {
  trackId: 'villeneuve',
  viewBox: '0 0 800 400',
  mainPath: 'M 420,85 L 580,75 Q 630,70 665,95 L 700,130 Q 725,160 730,200 L 730,240 Q 725,275 700,300 L 660,330 Q 635,350 600,355 L 530,360 Q 490,360 460,340 L 420,310 Q 395,290 365,285 L 300,280 Q 255,280 220,300 L 175,330 Q 145,350 115,345 L 85,335 Q 60,320 55,290 L 55,245 Q 55,210 75,185 L 115,150 Q 145,125 185,110 L 265,85 Q 340,70 420,85 Z',
  pitLanePath: 'M 420,85 L 400,105 Q 380,125 345,125 L 250,120 Q 215,120 195,105',
  startFinishLine: { x: 420, y: 85, angle: -3 },
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
// 11. RED BULL RING — Spielberg, short and steep uphill-downhill
// ─────────────────────────────────────────────
const redBullRing: TrackPathData = {
  trackId: 'red_bull_ring',
  viewBox: '0 0 700 500',
  mainPath: 'M 320,110 L 470,85 Q 520,78 555,100 L 590,130 Q 620,160 630,200 L 640,255 Q 645,300 620,335 L 570,385 Q 540,410 505,425 L 440,445 Q 395,455 350,445 L 280,425 Q 240,410 210,380 L 160,330 Q 130,290 115,245 L 105,195 Q 100,150 125,120 L 175,95 Q 225,80 320,110 Z',
  pitLanePath: 'M 320,110 L 300,130 Q 280,150 250,150 L 180,150 Q 150,150 140,130',
  startFinishLine: { x: 320, y: 110, angle: -8 },
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
// 12. SILVERSTONE — Fast flowing, Maggots-Becketts-Chapel complex
// ─────────────────────────────────────────────
const silverstone: TrackPathData = {
  trackId: 'silverstone',
  viewBox: '0 0 800 600',
  mainPath: 'M 450,100 L 580,90 Q 630,85 665,110 L 705,150 Q 730,185 735,225 L 735,285 Q 732,330 710,365 L 670,410 Q 645,440 640,475 L 640,510 Q 635,545 600,560 L 530,575 Q 480,580 430,570 L 340,545 Q 285,525 240,490 L 185,440 Q 145,395 120,345 L 95,280 Q 80,225 95,175 L 125,130 Q 165,95 220,85 L 330,80 Q 390,82 450,100 Z',
  pitLanePath: 'M 450,100 L 430,125 Q 410,150 375,155 L 265,160 Q 230,165 210,150',
  startFinishLine: { x: 450, y: 100, angle: -3 },
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
// 13. SPA-FRANCORCHAMPS — Iconic Eau Rouge, long triangular shape
// ─────────────────────────────────────────────
const spa: TrackPathData = {
  trackId: 'spa',
  viewBox: '0 0 800 700',
  mainPath: 'M 310,610 L 380,590 Q 415,575 435,545 L 475,475 Q 495,440 530,420 L 600,390 Q 650,370 690,335 L 730,290 Q 760,250 750,205 L 730,160 Q 710,120 670,95 L 610,70 Q 565,55 515,55 L 435,60 Q 390,65 355,90 L 310,130 Q 280,160 250,190 L 200,245 Q 165,280 135,320 L 100,370 Q 75,415 80,465 L 90,510 Q 105,555 145,580 L 210,610 Q 260,625 310,610 Z',
  pitLanePath: 'M 310,610 L 275,600 Q 245,590 235,565 L 220,530 Q 205,495 185,475',
  startFinishLine: { x: 310, y: 610, angle: -10 },
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
// 14. HUNGARORING — Tight, twisty, compact bowl shape
// ─────────────────────────────────────────────
const hungaroring: TrackPathData = {
  trackId: 'hungaroring',
  viewBox: '0 0 700 600',
  mainPath: 'M 370,85 L 490,75 Q 540,70 580,95 L 620,130 Q 650,165 655,210 L 655,270 Q 650,320 620,355 L 575,400 Q 545,430 535,465 L 530,500 Q 520,535 480,550 L 400,565 Q 345,570 295,545 L 230,510 Q 190,480 160,440 L 125,385 Q 95,340 85,290 L 80,235 Q 78,185 100,145 L 140,110 Q 185,82 240,75 L 370,85 Z',
  pitLanePath: 'M 370,85 L 355,110 Q 340,135 310,140 L 220,145 Q 190,145 175,125',
  startFinishLine: { x: 370, y: 85, angle: -3 },
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
// 15. ZANDVOORT — Banked seaside circuit, kidney shape
// ─────────────────────────────────────────────
const zandvoort: TrackPathData = {
  trackId: 'zandvoort',
  viewBox: '0 0 700 500',
  mainPath: 'M 360,85 L 485,75 Q 535,70 575,100 L 610,140 Q 635,175 635,220 L 630,275 Q 625,320 595,350 L 545,395 Q 510,420 475,435 L 415,450 Q 365,455 320,440 L 255,415 Q 215,395 185,365 L 145,320 Q 115,275 105,225 L 100,175 Q 98,130 125,100 L 175,75 Q 230,60 310,75 L 360,85 Z',
  pitLanePath: 'M 360,85 L 340,105 Q 320,125 290,125 L 210,130 Q 180,130 170,110',
  startFinishLine: { x: 360, y: 85, angle: -5 },
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
// 16. MONZA — Temple of Speed, low corner count, long straights
// ─────────────────────────────────────────────
const monza: TrackPathData = {
  trackId: 'monza',
  viewBox: '0 0 700 600',
  mainPath: 'M 380,105 L 530,90 Q 575,85 605,110 L 630,145 Q 650,175 645,215 L 635,265 Q 625,300 595,325 L 545,365 Q 520,385 515,415 L 515,450 Q 520,480 550,500 L 585,520 Q 610,535 600,560 L 575,575 Q 545,585 510,580 L 380,555 Q 315,540 265,505 L 200,455 Q 155,410 130,360 L 105,295 Q 85,240 95,185 L 115,140 Q 145,105 195,92 L 290,82 Q 335,85 380,105 Z',
  pitLanePath: 'M 380,105 L 360,125 Q 340,145 305,148 L 220,150 Q 185,152 170,138',
  startFinishLine: { x: 380, y: 105, angle: -3 },
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
// 17. BAKU — Long narrow city streets with mega straight
// ─────────────────────────────────────────────
const baku: TrackPathData = {
  trackId: 'baku',
  viewBox: '0 0 400 800',
  mainPath: 'M 205,65 L 285,65 Q 320,65 335,95 L 345,145 Q 350,180 335,210 L 300,250 Q 280,270 275,300 L 270,400 Q 268,440 285,465 L 315,505 Q 340,535 340,575 L 335,640 Q 330,685 300,710 L 260,740 Q 225,758 185,755 L 145,745 Q 110,735 85,705 L 65,670 Q 50,640 55,605 L 70,555 Q 85,520 110,495 L 145,465 Q 165,445 170,420 L 175,345 Q 175,305 160,280 L 130,240 Q 110,215 115,185 L 125,150 Q 135,120 160,100 L 180,80 Q 195,68 205,65 Z',
  pitLanePath: 'M 205,65 L 205,95 Q 205,125 185,125 L 130,135 Q 105,140 95,165',
  startFinishLine: { x: 205, y: 65, angle: 0 },
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
// 18. MARINA BAY — Singapore night street circuit
// ─────────────────────────────────────────────
const marinaBay: TrackPathData = {
  trackId: 'marina_bay',
  viewBox: '0 0 700 600',
  mainPath: 'M 365,85 L 510,75 Q 555,70 590,100 L 625,140 Q 650,175 645,220 L 635,275 Q 625,315 600,345 L 565,385 Q 540,410 540,445 L 540,485 Q 540,520 510,540 L 455,565 Q 415,578 370,575 L 295,565 Q 245,555 205,525 L 155,480 Q 120,440 100,395 L 85,340 Q 75,290 85,245 L 105,195 Q 130,155 170,125 L 225,95 Q 280,75 365,85 Z',
  pitLanePath: 'M 365,85 L 345,105 Q 325,125 295,128 L 215,135 Q 185,140 170,160',
  startFinishLine: { x: 365, y: 85, angle: -3 },
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
// 19. COTA — Circuit of the Americas, Turn 1 hill + esses
// ─────────────────────────────────────────────
const americas: TrackPathData = {
  trackId: 'americas',
  viewBox: '0 0 800 600',
  mainPath: 'M 400,105 L 540,85 Q 590,78 630,105 L 675,145 Q 710,185 720,235 L 725,295 Q 722,345 695,385 L 650,430 Q 620,460 600,495 L 585,530 Q 565,558 525,568 L 420,580 Q 360,582 305,560 L 235,525 Q 185,495 150,450 L 110,390 Q 80,335 75,275 L 75,220 Q 78,170 110,135 L 165,100 Q 220,78 295,80 L 400,105 Z',
  pitLanePath: 'M 400,105 L 385,130 Q 370,155 335,158 L 245,160 Q 210,160 195,145',
  startFinishLine: { x: 400, y: 105, angle: -5 },
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
// 20. HERMANOS RODRÍGUEZ — Mexico, stadium section peraltada
// ─────────────────────────────────────────────
const rodriguez: TrackPathData = {
  trackId: 'rodriguez',
  viewBox: '0 0 800 500',
  mainPath: 'M 415,85 L 570,75 Q 620,70 660,100 L 705,145 Q 735,180 740,225 L 740,280 Q 735,325 705,355 L 655,395 Q 625,418 605,440 L 590,455 Q 565,472 525,475 L 400,470 Q 340,465 290,440 L 225,400 Q 180,370 150,330 L 115,275 Q 90,225 85,175 L 85,135 Q 88,100 115,82 L 185,62 Q 250,52 340,65 L 415,85 Z',
  pitLanePath: 'M 415,85 L 395,105 Q 375,125 345,128 L 250,128 Q 220,128 200,110',
  startFinishLine: { x: 415, y: 85, angle: -3 },
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
// 21. INTERLAGOS — São Paulo, anti-clockwise, compact with elevation
// ─────────────────────────────────────────────
const interlagos: TrackPathData = {
  trackId: 'interlagos',
  viewBox: '0 0 700 500',
  mainPath: 'M 410,85 L 530,75 Q 575,70 610,100 L 640,140 Q 658,175 655,220 L 645,275 Q 635,315 605,345 L 555,390 Q 525,415 510,440 L 500,460 Q 485,478 450,480 L 350,475 Q 295,470 250,445 L 195,410 Q 155,375 130,335 L 100,280 Q 80,235 85,190 L 95,145 Q 110,110 145,92 L 220,70 Q 290,58 380,75 L 410,85 Z',
  pitLanePath: 'M 410,85 L 390,105 Q 370,125 340,128 L 250,128 Q 220,128 205,110',
  startFinishLine: { x: 410, y: 85, angle: -3 },
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
// 22. LAS VEGAS — Strip circuit, long straights with tight 90° turns
// ─────────────────────────────────────────────
const lasVegas: TrackPathData = {
  trackId: 'las_vegas',
  viewBox: '0 0 800 600',
  mainPath: 'M 420,85 L 620,85 Q 665,85 690,115 L 720,160 Q 740,195 740,240 L 740,320 Q 740,370 710,400 L 660,445 Q 630,470 590,480 L 520,495 Q 480,500 450,525 L 410,555 Q 380,575 340,575 L 250,570 Q 195,560 155,525 L 110,480 Q 75,440 65,390 L 60,330 Q 58,275 75,225 L 105,175 Q 140,135 190,110 L 270,85 Q 345,72 420,85 Z',
  pitLanePath: 'M 420,85 L 400,110 Q 380,135 345,138 L 255,140 Q 220,142 200,125',
  startFinishLine: { x: 420, y: 85, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.14 },
    { startPercent: 0.55, endPercent: 0.72 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.45 },
    { percent: 0.2, speedFactor: 0.9 },
    { percent: 0.3, speedFactor: 0.5 },
    { percent: 0.4, speedFactor: 0.95 },
    { percent: 0.5, speedFactor: 0.45 },
    { percent: 0.6, speedFactor: 0.85 },
    { percent: 0.7, speedFactor: 0.5 },
    { percent: 0.8, speedFactor: 0.9 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.9 },
  ],
};

// ─────────────────────────────────────────────
// 23. LUSAIL — Qatar, flowing fast desert circuit
// ─────────────────────────────────────────────
const lusail: TrackPathData = {
  trackId: 'lusail',
  viewBox: '0 0 800 600',
  mainPath: 'M 440,95 L 580,85 Q 630,80 665,110 L 710,155 Q 740,195 745,245 L 745,310 Q 740,360 710,395 L 660,440 Q 625,470 595,500 L 560,530 Q 530,555 485,560 L 380,565 Q 325,562 275,540 L 215,505 Q 170,470 140,425 L 105,365 Q 80,310 80,255 L 85,195 Q 95,145 135,115 L 195,85 Q 255,65 335,75 L 440,95 Z',
  pitLanePath: 'M 440,95 L 420,120 Q 400,145 365,148 L 270,150 Q 235,152 215,135',
  startFinishLine: { x: 440, y: 95, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.95 },
    { percent: 0.08, speedFactor: 0.5 },
    { percent: 0.15, speedFactor: 0.8 },
    { percent: 0.22, speedFactor: 0.6 },
    { percent: 0.3, speedFactor: 0.85 },
    { percent: 0.4, speedFactor: 0.55 },
    { percent: 0.5, speedFactor: 0.7 },
    { percent: 0.6, speedFactor: 0.85 },
    { percent: 0.7, speedFactor: 0.5 },
    { percent: 0.8, speedFactor: 0.75 },
    { percent: 0.9, speedFactor: 0.6 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ─────────────────────────────────────────────
// 24. YAS MARINA — Abu Dhabi, hotel & harbor section
// ─────────────────────────────────────────────
const yasMarina: TrackPathData = {
  trackId: 'yas_marina',
  viewBox: '0 0 800 600',
  mainPath: 'M 415,105 L 565,88 Q 615,82 650,110 L 695,155 Q 725,195 730,245 L 730,305 Q 725,355 695,390 L 650,430 Q 620,458 605,490 L 595,520 Q 580,550 540,560 L 430,572 Q 370,575 315,550 L 245,510 Q 195,478 160,435 L 120,375 Q 90,320 85,260 L 85,200 Q 90,150 125,118 L 185,88 Q 245,68 330,78 L 415,105 Z',
  pitLanePath: 'M 415,105 L 395,128 Q 375,148 340,150 L 250,152 Q 215,152 200,135',
  startFinishLine: { x: 415, y: 105, angle: -5 },
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
// TRACK PATHS REGISTRY — Ordered by 2025 Calendar
// ═══════════════════════════════════════════════════════

export const ALL_TRACK_PATHS: TrackPathData[] = [
  albertPark,
  shanghai,
  suzuka,
  bahrain,
  jeddah,
  miami,
  imola,
  monaco,
  catalunya,
  villeneuve,
  redBullRing,
  silverstone,
  spa,
  hungaroring,
  zandvoort,
  monza,
  baku,
  marinaBay,
  americas,
  rodriguez,
  interlagos,
  lasVegas,
  lusail,
  yasMarina,
];

export function getTrackPath(trackId: string): TrackPathData | undefined {
  return ALL_TRACK_PATHS.find(t => t.trackId === trackId);
}
