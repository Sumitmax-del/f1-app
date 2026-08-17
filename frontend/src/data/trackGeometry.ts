// ═══════════════════════════════════════════════════════════════════════════════
// F1 TRACK GEOMETRY ENGINE — All 24 Official 2026 Circuits
// Precise structural blueprints for anti-gravity racing simulation
//
// Data Sources: FIA circuit homologation documents, telemetry analysis,
// elevation survey data, and engineering estimates.
//
// Anti-Gravity Parameters:
//   Track Width:      20 meters (uniform widening)
//   Design Speed:     450 km/h (125 m/s)
//   AG Force Factor:  3.5× (anti-gravity grip multiplier)
//   Max Banking:      60° (structural safety limit)
//   Banking Formula:  θ = min(60, atan(v² / (r × g × 3.5)))  [degrees]
//
// Real-World Structural Corrections:
//   Applied automatically via TrackGeometryProcessor at module load.
//   See trackGeometryProcessor.ts for the correction registry and rules.
// ═══════════════════════════════════════════════════════════════════════════════

import { applyAllTrackCorrections } from './trackGeometryProcessor';

const G = 9.81; // m/s²
const AG_FACTOR = 3.5;
const AG_TRACK_WIDTH = 20; // meters
const MAX_BANK_DEG = 60;

// ─── Segment type codes ──────────────────────────────────────────────────────
export type SegmentType =
  | 'STRAIGHT'
  | 'CONSTANT_RADIUS'
  | 'DECREASING_RADIUS'
  | 'INCREASING_RADIUS'
  | 'CHICANE'
  | 'HAIRPIN'
  | 'COMPLEX';  // multi-apex or esses

// ─── Core interfaces ─────────────────────────────────────────────────────────
export interface TrackNode {
  nodeId: number;
  name: string;
  segmentType: SegmentType;

  // Geometry
  headingDeg: number;      // absolute heading, 0=north, clockwise
  arcLengthM: number;      // length of this segment in meters
  radiusM: number | null;  // null for straights
  rotationDeg: number;     // signed: positive=right, negative=left

  // Displacement (local reference frame)
  deltaX: number;          // meters, positive=right
  deltaY: number;          // meters, positive=forward (track direction)
  deltaZ: number;          // meters, positive=uphill

  // Gradient
  gradientPct: number;     // slope percentage

  // Speed reference (real F1 2024)
  approxSpeedKph: number;  // approximate F1 speed through segment

  // Anti-gravity optimization
  agTrackWidthM: number;   // widened track (always 20)
  agBankingDeg: number;    // calculated banking angle
  agDesignSpeedKph: number; // AG target speed
}

export interface CircuitGeometry {
  circuitId: string;
  circuitName: string;
  totalLengthM: number;
  totalElevationChangeM: number;
  maxGradientPct: number;
  direction: 'clockwise' | 'anti-clockwise';
  nodes: TrackNode[];
}

// ─── Helper: compute banking angle ───────────────────────────────────────────
function calcBanking(radiusM: number, speedKph: number): number {
  const v = speedKph / 3.6;
  const theta = Math.atan((v * v) / (radiusM * G * AG_FACTOR)) * (180 / Math.PI);
  return Math.min(MAX_BANK_DEG, Math.round(theta * 10) / 10);
}

// ─── Helper: AG design speed from radius ─────────────────────────────────────
function agSpeed(radiusM: number): number {
  if (radiusM <= 15)  return 180;
  if (radiusM <= 40)  return 250;
  if (radiusM <= 80)  return 320;
  if (radiusM <= 150) return 380;
  if (radiusM <= 300) return 430;
  if (radiusM <= 500) return 470;
  return 500;
}

// ─── Helper: create node ─────────────────────────────────────────────────────
function N(
  nodeId: number,
  name: string,
  segmentType: SegmentType,
  headingDeg: number,
  arcLengthM: number,
  radiusM: number | null,
  rotationDeg: number,
  deltaX: number,
  deltaY: number,
  deltaZ: number,
  gradientPct: number,
  approxSpeedKph: number,
): TrackNode {
  const aSpeed = radiusM ? agSpeed(radiusM) : 520;
  const aBanking = radiusM ? calcBanking(radiusM, aSpeed) : 0;
  return {
    nodeId, name, segmentType, headingDeg, arcLengthM, radiusM, rotationDeg,
    deltaX, deltaY, deltaZ, gradientPct, approxSpeedKph,
    agTrackWidthM: AG_TRACK_WIDTH,
    agBankingDeg: aBanking,
    agDesignSpeedKph: aSpeed,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCUIT GEOMETRY DATA — All 24 Circuits
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// R1. ALBERT PARK — Melbourne, Australia
// ─────────────────────────────────────────────
const albertPark: CircuitGeometry = {
  circuitId: 'albert_park',
  circuitName: 'Albert Park Circuit',
  totalLengthM: 5278,
  totalElevationChangeM: 2.4,
  maxGradientPct: 1.5,
  direction: 'clockwise',
  nodes: [
    N(1,  'Start/Finish Straight',   'STRAIGHT',          180, 690, null, 0,      0,    690,   0,   0,    310),
    N(2,  'Turn 1 — Jones',          'CONSTANT_RADIUS',   180, 95,  110,  68,     55,   75,    0,   0,    130),
    N(3,  'Turn 2 — Brabham',        'CONSTANT_RADIUS',   248, 60,  90,   -42,    -30,  45,    0,   0,    150),
    N(4,  'Straight T2-T3',          'STRAIGHT',          206, 160, null, 0,      0,    160,   0,   0,    285),
    N(5,  'Turn 3 — Right sweeper',  'CONSTANT_RADIUS',   206, 280, 260,  78,     180,  210,   0,   0,    265),
    N(6,  'Turns 4-5 — Sequence',    'COMPLEX',           284, 180, 140,  38,     100,  140,   0,   0,    220),
    N(7,  'Turn 6 — Clark',          'HAIRPIN',           322, 110, 35,   110,    85,   70,    0.5, 0.5,  80),
    N(8,  'Straight T6-T7',          'STRAIGHT',          72,  220, null, 0,      0,    220,   -0.3,-0.1, 270),
    N(9,  'Turns 7-8',               'CHICANE',           72,  120, 80,   -15,    -10,  120,   0,   0,    200),
    N(10, 'Turn 9 — Fast right',     'CONSTANT_RADIUS',   57,  250, 320,  55,     130,  215,   0,   0,    275),
    N(11, 'Turn 10 — Fast left',     'CONSTANT_RADIUS',   112, 190, 280,  -48,    -100, 165,   0,   0,    260),
    N(12, 'Turns 11-12 — Chicane',   'CHICANE',           64,  160, 60,   35,     70,   140,   0,   0,    130),
    N(13, 'Turn 13 — Ascari left',   'CONSTANT_RADIUS',   99,  200, 150,  -65,    -140, 140,   0,   0,    190),
    N(14, 'Turn 14 — Right',         'CONSTANT_RADIUS',   34,  140, 200,  52,     90,   105,   0.2, 0.2,  240),
    N(15, 'Final straight approach',  'STRAIGHT',          0,   400, null, 0,      0,    400,   0,   0,    300),
  ],
};

// ─────────────────────────────────────────────
// R2. SHANGHAI — Shanghai International Circuit
// ─────────────────────────────────────────────
const shanghaiGeo: CircuitGeometry = {
  circuitId: 'shanghai',
  circuitName: 'Shanghai International Circuit',
  totalLengthM: 5451,
  totalElevationChangeM: 4.2,
  maxGradientPct: 2.0,
  direction: 'clockwise',
  nodes: [
    N(1,  'Main Straight (pit)',      'STRAIGHT',          180, 880,  null, 0,      0,    880,   0,   0,    330),
    N(2,  'Turn 1 — Spiral entry',    'DECREASING_RADIUS', 180, 120, 180,  45,     60,   100,   0,   0,    165),
    N(3,  'Turn 2 — Spiral mid',      'DECREASING_RADIUS', 225, 160, 120,  55,     100,  120,   0,   0,    125),
    N(4,  'Turn 3 — Spiral exit',     'INCREASING_RADIUS', 280, 130, 80,   50,     90,   90,    0.5, 0.4,  105),
    N(5,  'Short straight T3-T4',     'STRAIGHT',          330, 180, null, 0,      0,    180,   0,   0,    260),
    N(6,  'Turn 4',                   'CONSTANT_RADIUS',   330, 80,  60,   -55,    -50,  60,    0,   0,    110),
    N(7,  'Turn 5',                   'CONSTANT_RADIUS',   275, 70,  55,   50,     40,   55,    0,   0,    115),
    N(8,  'Turn 6 — Hairpin',         'HAIRPIN',           325, 100, 25,   160,    70,   70,    0,   0,    65),
    N(9,  'Straight T6-T7',           'STRAIGHT',          125, 240, null, 0,      0,    240,   0,   0,    280),
    N(10, 'Turn 7',                   'CONSTANT_RADIUS',   125, 80,  100,  55,     50,   60,    0,   0,    150),
    N(11, 'Turn 8 — Right',           'CONSTANT_RADIUS',   180, 100, 120,  50,     60,   75,    0,   0,    175),
    N(12, 'Straight T8-T9',           'STRAIGHT',          230, 200, null, 0,      0,    200,   -0.5,-0.3, 260),
    N(13, 'Turns 9-10',               'CHICANE',           230, 120, 65,   -25,    -20,  120,   0,   0,    140),
    N(14, 'Turn 11 — Hairpin',        'HAIRPIN',           205, 90,  30,   135,    60,   65,    0,   0,    70),
    N(15, 'Back Straight',            'STRAIGHT',          340, 1175,null, 0,      0,    1175,  0.3, 0,    340),
    N(16, 'Turn 13 — Fast right',     'CONSTANT_RADIUS',   340, 120, 200,  60,     80,   85,    0,   0,    210),
    N(17, 'Turn 14 — Left',           'CONSTANT_RADIUS',   40,  80,  150,  -45,    -40,  65,    0,   0,    190),
    N(18, 'Turns 15-16 — Final',      'COMPLEX',           355, 160, 100,  55,     90,   125,   -0.3,-0.2, 165),
  ],
};

// ─────────────────────────────────────────────
// R3. SUZUKA — Suzuka International Racing Course (Figure-8)
// ─────────────────────────────────────────────
const suzukaGeo: CircuitGeometry = {
  circuitId: 'suzuka',
  circuitName: 'Suzuka International Racing Course',
  totalLengthM: 5807,
  totalElevationChangeM: 40,
  maxGradientPct: 5.5,
  direction: 'clockwise',
  nodes: [
    N(1,  'Start/Finish Straight',    'STRAIGHT',          0,   400, null, 0,      0,    400,   0,   0,    305),
    N(2,  'Turn 1 — Right',           'CONSTANT_RADIUS',   0,   120, 120,  85,     95,   70,    1,   0.8,  230),
    N(3,  'Turn 2 — Left',            'CONSTANT_RADIUS',   85,  100, 95,   -90,    -80,  55,    2,   2.0,  215),
    N(4,  'Turns 3-6 — S-Curves',     'COMPLEX',           355, 580, 85,   105,    320,  470,   5,   0.9,  225),
    N(5,  'Turn 7 — Dunlop',          'CONSTANT_RADIUS',   100, 160, 150,  55,     90,   125,   -2,  -1.3, 195),
    N(6,  'Degner 1 (Turn 8)',        'CONSTANT_RADIUS',   155, 100, 60,   68,     65,   75,    -3,  -3.0, 165),
    N(7,  'Degner 2 (Turn 9)',        'CONSTANT_RADIUS',   223, 90,  50,   60,     60,   65,    -1,  -1.1, 140),
    N(8,  'Straight under bridge',    'STRAIGHT',          283, 350, null, 0,      0,    350,   -2,  -0.6, 290),
    N(9,  'Turn 10 — Hairpin',        'HAIRPIN',           283, 110, 20,   170,    65,   85,    0,   0,    60),
    N(10, 'Straight T10-Spoon',       'STRAIGHT',          93,  320, null, 0,      0,    320,   3,   0.9,  285),
    N(11, 'Spoon (Turns 13-14)',      'COMPLEX',           93,  400, 100,  100,    280,  285,   4,   1.0,  230),
    N(12, 'Back Straight',            'STRAIGHT',          193, 700, null, 0,      0,    700,   -3,  -0.4, 325),
    N(13, '130R (Turn 15)',           'CONSTANT_RADIUS',   193, 190, 85,   42,     65,   180,   -5,  -2.6, 305),
    N(14, 'Casio Triangle (T16-17)',  'CHICANE',           235, 180, 40,   -70,    -90,  140,   -1,  -0.6, 90),
    N(15, 'Final curve to straight',  'CONSTANT_RADIUS',   165, 140, 180,  -45,    -55,  125,   0.5, 0.4,  250),
  ],
};

// ─────────────────────────────────────────────
// R4. BAHRAIN — Bahrain International Circuit
// ─────────────────────────────────────────────
const bahrainGeo: CircuitGeometry = {
  circuitId: 'bahrain',
  circuitName: 'Bahrain International Circuit',
  totalLengthM: 5412,
  totalElevationChangeM: 0,
  maxGradientPct: 0,
  direction: 'clockwise',
  nodes: [
    N(1,  'Main Straight',            'STRAIGHT',          180, 650,  null, 0,     0,    650,   0,   0,    325),
    N(2,  'Turn 1 — Right',           'CONSTANT_RADIUS',   180, 100,  50,   90,    65,   75,    0,   0,    80),
    N(3,  'Turn 2 — Left',            'CONSTANT_RADIUS',   270, 60,   45,   -80,   -40,  45,    0,   0,    90),
    N(4,  'Turn 3 — Right',           'CONSTANT_RADIUS',   190, 55,   40,   90,    40,   40,    0,   0,    85),
    N(5,  'Turn 4 — Right hairpin',   'HAIRPIN',           280, 95,   30,   120,   65,   70,    0,   0,    70),
    N(6,  'Straight T4-T5',           'STRAIGHT',          40,  280,  null, 0,     0,    280,   0,   0,    295),
    N(7,  'Turn 5-6-7 Complex',       'COMPLEX',           40,  200,  80,   -55,   -85,  180,   0,   0,    145),
    N(8,  'Straight T7-T8',           'STRAIGHT',          345, 400,  null, 0,     0,    400,   0,   0,    310),
    N(9,  'Turn 8 — Left',            'CONSTANT_RADIUS',   345, 90,   55,   -70,   -55,  65,    0,   0,    120),
    N(10, 'Turn 9-10 Complex',        'COMPLEX',           275, 250,  90,   85,    175,  175,   0,   0,    175),
    N(11, 'Straight T10-T11',         'STRAIGHT',          0,   580,  null, 0,     0,    580,   0,   0,    320),
    N(12, 'Turn 11 — Left',           'CONSTANT_RADIUS',   0,   100,  80,   -65,   -60,  75,    0,   0,    140),
    N(13, 'Turn 12-13 Complex',       'COMPLEX',           295, 180,  70,   50,    105,  145,   0,   0,    135),
    N(14, 'Turn 14 — Left',           'CONSTANT_RADIUS',   345, 130,  100,  -50,   -75,  100,   0,   0,    175),
    N(15, 'Turn 15 to Main Str.',     'CONSTANT_RADIUS',   295, 140,  120,  65,    100,  100,   0,   0,    200),
  ],
};

// ─────────────────────────────────────────────
// R5. JEDDAH — Jeddah Corniche Circuit
// ─────────────────────────────────────────────
const jeddahGeo: CircuitGeometry = {
  circuitId: 'jeddah',
  circuitName: 'Jeddah Corniche Circuit',
  totalLengthM: 6174,
  totalElevationChangeM: 12,
  maxGradientPct: 2.5,
  direction: 'anti-clockwise',
  nodes: [
    N(1,  'Main Straight',            'STRAIGHT',          0,   700,  null, 0,     0,    700,   0,   0,    322),
    N(2,  'Turn 1 — Right',           'CONSTANT_RADIUS',   0,   80,   200,  55,    50,   60,    0,   0,    270),
    N(3,  'Turn 2-3 Esses',           'COMPLEX',           55,  220,  120,  -65,   -120, 180,   1,   0.5,  240),
    N(4,  'Straight T3-T4',           'STRAIGHT',          350, 180,  null, 0,     0,    180,   0,   0,    280),
    N(5,  'Turn 4-5-6-7 Swirlies',    'COMPLEX',           350, 460,  90,   110,   280,  360,   2,   0.4,  200),
    N(6,  'Straight T7-T8',           'STRAIGHT',          100, 280,  null, 0,     0,    280,   -0.5,-0.2, 290),
    N(7,  'Turns 8-12 Fast section',  'COMPLEX',           100, 550,  140,  -80,   -380, 400,   3,   0.5,  255),
    N(8,  'Turn 13 — Left',           'CONSTANT_RADIUS',   20,  120,  180,  -50,   -60,  105,   -1,  -0.8, 235),
    N(9,  'Straight T13-T14',         'STRAIGHT',          330, 350,  null, 0,     0,    350,   -1,  -0.3, 310),
    N(10, 'Turns 14-21 Sequence',     'COMPLEX',           330, 680,  100,  95,    420,  530,   3,   0.4,  190),
    N(11, 'Turn 22-24 Complex',       'COMPLEX',           65,  450,  80,   -75,   -250, 370,   -2,  -0.4, 210),
    N(12, 'Turn 25-27 Final sect.',   'COMPLEX',           350, 380,  110,  55,    220,  310,   -1.5,-0.4, 225),
    N(13, 'Run to Main Straight',     'STRAIGHT',          45,  320,  null, 0,     0,    320,   0,   0,    295),
  ],
};

// ─────────────────────────────────────────────
// R6. MIAMI — Miami International Autodrome
// ─────────────────────────────────────────────
const miamiGeo: CircuitGeometry = {
  circuitId: 'miami',
  circuitName: 'Miami International Autodrome',
  totalLengthM: 5412,
  totalElevationChangeM: 0,
  maxGradientPct: 0,
  direction: 'anti-clockwise',
  nodes: [
    N(1,  'Main Straight',           'STRAIGHT',          0,    650, null, 0,     0,    650,   0,   0,    330),
    N(2,  'Turn 1 — Right',          'CONSTANT_RADIUS',   0,    110, 130,  72,    75,   80,    0,   0,    215),
    N(3,  'Turn 2 — Left',           'CONSTANT_RADIUS',   72,   100, 120,  -55,   -55,  80,    0,   0,    225),
    N(4,  'Turn 3 — Right',          'CONSTANT_RADIUS',   17,   90,  90,   68,    60,   65,    0,   0,    200),
    N(5,  'Straight T3-T4',          'STRAIGHT',          85,   320, null, 0,     0,    320,   0,   0,    305),
    N(6,  'Turn 4-5 — Chicane',      'CHICANE',           85,   140, 55,   -28,   -25,  135,   0,   0,    135),
    N(7,  'Turn 6-7 Section',        'COMPLEX',           57,   280, 100,  65,    160,  225,   0,   0,    180),
    N(8,  'Straight T7-T8',          'STRAIGHT',          122,  380, null, 0,     0,    380,   0,   0,    315),
    N(9,  'Turn 8 — Right',          'CONSTANT_RADIUS',   122,  90,  75,   55,    50,   70,    0,   0,    165),
    N(10, 'Turn 9-10 Complex',       'COMPLEX',           177,  200, 110,  -48,   -85,  180,   0,   0,    195),
    N(11, 'Turn 11 — Hairpin',       'HAIRPIN',           129,  100, 25,   160,   65,   75,    0,   0,    65),
    N(12, 'Straight T11-T12',        'STRAIGHT',          289,  250, null, 0,     0,    250,   0,   0,    280),
    N(13, 'Turns 12-16 — Final',     'COMPLEX',           289,  350, 90,   75,    220,  270,   0,   0,    175),
    N(14, 'Straight to pit',         'STRAIGHT',          4,    480, null, 0,     0,    480,   0,   0,    310),
  ],
};

// ─────────────────────────────────────────────
// R7. IMOLA — Autodromo Enzo e Dino Ferrari
// ─────────────────────────────────────────────
const imolaGeo: CircuitGeometry = {
  circuitId: 'imola',
  circuitName: 'Autodromo Enzo e Dino Ferrari',
  totalLengthM: 4909,
  totalElevationChangeM: 30,
  maxGradientPct: 4.0,
  direction: 'anti-clockwise',
  nodes: [
    N(1,  'Start/Finish Straight',   'STRAIGHT',          90,  430,  null, 0,     0,    430,   0,   0,    310),
    N(2,  'Tamburello (T1-2)',       'COMPLEX',           90,  280,  200,  -40,   -120, 250,   0,   0,    265),
    N(3,  'Villeneuve (T3-4)',       'CHICANE',           50,  180,  40,   35,    60,   170,   1,   0.6,  90),
    N(4,  'Tosa (Turn 5)',           'CONSTANT_RADIUS',   85,  140,  45,   100,   100,  95,    2,   1.4,  85),
    N(5,  'Straight to Piratella',   'STRAIGHT',          185, 350,  null, 0,     0,    350,   3,   0.9,  295),
    N(6,  'Piratella (Turn 6)',      'CONSTANT_RADIUS',   185, 120,  120,  -58,   -70,  95,    -1,  -0.8, 195),
    N(7,  'Acque Minerali (T7-8)',   'COMPLEX',           127, 220,  60,   85,    150,  160,   -4,  -1.8, 135),
    N(8,  'Variante Alta (T9-10)',   'CHICANE',           212, 160,  50,   -50,   -70,  140,   2,   1.3,  110),
    N(9,  'Rivazza 1 (Turn 11)',     'CONSTANT_RADIUS',   162, 150,  80,   55,    90,   115,   -2,  -1.3, 160),
    N(10, 'Rivazza 2 (Turn 12)',     'CONSTANT_RADIUS',   217, 130,  90,   52,    75,   100,   -1,  -0.8, 175),
    N(11, 'Run to straight',         'STRAIGHT',          269, 350,  null, 0,     0,    350,   0.5, 0.1,  290),
  ],
};

// ─────────────────────────────────────────────
// R8. MONACO — Circuit de Monaco
// ─────────────────────────────────────────────
const monacoGeo: CircuitGeometry = {
  circuitId: 'monaco',
  circuitName: 'Circuit de Monaco',
  totalLengthM: 3337,
  totalElevationChangeM: 42,
  maxGradientPct: 8.5,
  direction: 'clockwise',
  nodes: [
    N(1,  'Main Straight',            'STRAIGHT',          90,  300,  null, 0,     0,    300,   0,   0,    285),
    N(2,  'Ste Devote (Turn 1)',      'CONSTANT_RADIUS',   90,  80,   35,   80,    55,   55,    3,   3.8,  105),
    N(3,  'Climb to Casino',          'STRAIGHT',          170, 370,  null, 0,     0,    370,   30,  8.1,  265),
    N(4,  'Casino Square (T4-5)',     'COMPLEX',           170, 180,  50,   -75,   -90,  150,   -5,  -2.8, 100),
    N(5,  'Mirabeau (Turn 6)',       'CONSTANT_RADIUS',   95,  70,   45,   60,    45,   50,    -4,  -5.7, 90),
    N(6,  'Fairmont Hairpin (T7)',   'HAIRPIN',           155, 50,   10,   180,   20,   45,    -3,  -6.0, 48),
    N(7,  'Portier (Turn 8)',        'CONSTANT_RADIUS',   335, 65,   60,   50,    40,   50,    -1,  -1.5, 130),
    N(8,  'Tunnel',                  'STRAIGHT',          25,  280,  null, 0,     0,    280,   -8,  -2.9, 265),
    N(9,  'Nouvelle Chicane (T10)',   'CHICANE',           25,  100,  30,   -40,   -35,  90,    0,   0,    80),
    N(10, 'Tabac (Turn 11)',         'CONSTANT_RADIUS',   345, 90,   55,   58,    55,   70,    0,   0,    130),
    N(11, 'Swimming Pool (T12-14)',  'CHICANE',           43,  180,  35,   -55,   -60,  165,   0,   0,    85),
    N(12, 'Rascasse (Turn 15)',      'CONSTANT_RADIUS',   348, 75,   25,   72,    40,   60,    0,   0,    60),
    N(13, 'Anthony Noghes (T16)',    'CONSTANT_RADIUS',   60,  60,   30,   50,    30,   50,    1,   1.7,  70),
    N(14, 'Run to Main Straight',    'STRAIGHT',          110, 170,  null, 0,     0,    170,   -2,  -1.2, 250),
  ],
};

// ─────────────────────────────────────────────
// R9. BARCELONA — Circuit de Barcelona-Catalunya
// ─────────────────────────────────────────────
const catalunyaGeo: CircuitGeometry = {
  circuitId: 'catalunya',
  circuitName: 'Circuit de Barcelona-Catalunya',
  totalLengthM: 4657,
  totalElevationChangeM: 22,
  maxGradientPct: 3.5,
  direction: 'clockwise',
  nodes: [
    N(1,  'Main Straight',            'STRAIGHT',          180, 610,  null, 0,     0,    610,   1,   0.2,  325),
    N(2,  'Turn 1 — Elf',             'CONSTANT_RADIUS',   180, 100,  120,  78,    70,   70,    0,   0,    185),
    N(3,  'Turn 2',                   'CONSTANT_RADIUS',   258, 80,   95,   -55,   -45,  60,    -1,  -1.3, 175),
    N(4,  'Turn 3 — Long right',      'CONSTANT_RADIUS',   203, 380,  150,  92,    280,  260,   -2,  -0.5, 195),
    N(5,  'Turn 4',                   'CONSTANT_RADIUS',   295, 70,   70,   -48,   -35,  55,    0,   0,    155),
    N(6,  'Turn 5 — Chicane',         'CHICANE',           247, 140,  45,   60,    80,   110,   0,   0,    100),
    N(7,  'Straight T5-T7',           'STRAIGHT',          307, 400,  null, 0,     0,    400,   -1,  -0.3, 295),
    N(8,  'Turn 7-8 Complex',         'COMPLEX',           307, 200,  90,   -55,   -110, 165,   0,   0,    165),
    N(9,  'Turn 9 — Right',           'CONSTANT_RADIUS',   252, 120,  110,  58,    75,   90,    -1,  -0.8, 185),
    N(10, 'Turn 10 — Campsa',         'CONSTANT_RADIUS',   310, 100,  240,  30,    35,   95,    0,   0,    260),
    N(11, 'Straight T10-T12',         'STRAIGHT',          340, 300,  null, 0,     0,    300,   1,   0.3,  280),
    N(12, 'Turns 12-13 — Chicane',    'CHICANE',           340, 130,  55,   -35,   -35,  125,   0,   0,    120),
    N(13, 'Turn 14-16 — Final sect.', 'COMPLEX',           305, 280,  80,   70,    175,  215,   0.5, 0.2,  165),
    N(14, 'Run to Main Straight',     'STRAIGHT',          15,  320,  null, 0,     0,    320,   1.5, 0.5,  290),
  ],
};

// ─────────────────────────────────────────────
// R10. MONTREAL — Circuit Gilles Villeneuve
// ─────────────────────────────────────────────
const villeneuveGeo: CircuitGeometry = {
  circuitId: 'villeneuve',
  circuitName: 'Circuit Gilles Villeneuve',
  totalLengthM: 4361,
  totalElevationChangeM: 3,
  maxGradientPct: 0.5,
  direction: 'clockwise',
  nodes: [
    N(1,  'Start/Finish Straight',   'STRAIGHT',          0,   450,  null, 0,     0,    450,   0,   0,    315),
    N(2,  'Turn 1 — Right',          'CONSTANT_RADIUS',   0,   100,  80,   62,    60,   75,    0,   0,    155),
    N(3,  'Turn 2 — Left',           'CONSTANT_RADIUS',   62,  80,   70,   -55,   -45,  60,    0,   0,    145),
    N(4,  'Chicane (T3-4)',          'CHICANE',           7,   150,  35,   65,    80,   125,   0,   0,    85),
    N(5,  'Straight T4-T5',          'STRAIGHT',          72,  320,  null, 0,     0,    320,   0,   0,    290),
    N(6,  'Chicane (T5-6)',          'CHICANE',           72,  140,  40,   -30,   -30,  135,   0,   0,    100),
    N(7,  'Straight T6-T7',          'STRAIGHT',          42,  380,  null, 0,     0,    380,   0,   0,    300),
    N(8,  'Turn 7 — Fast right',     'CONSTANT_RADIUS',   42,  130,  200,  48,    65,   110,   0,   0,    255),
    N(9,  'Straight T7-T8',          'STRAIGHT',          90,  280,  null, 0,     0,    280,   0,   0,    290),
    N(10, 'Chicane (T8-9)',          'CHICANE',           90,  140,  35,   55,    60,   125,   0,   0,    80),
    N(11, 'Turn 10 — Hairpin',       'HAIRPIN',           145, 90,   20,   168,   50,   70,    0,   0,    55),
    N(12, 'Straight T10-T12',        'STRAIGHT',          313, 400,  null, 0,     0,    400,   0,   0,    310),
    N(13, 'Chicane T12-13 (Wall)',    'CHICANE',           313, 130,  40,   -45,   -40,  120,   0,   0,    90),
    N(14, 'Turn 14 — Final',         'CONSTANT_RADIUS',   268, 80,   80,   60,    55,   55,    0,   0,    155),
    N(15, 'Run to Main Straight',    'STRAIGHT',          328, 200,  null, 0,     0,    200,   0,   0,    270),
  ],
};

// ─────────────────────────────────────────────
// R11. RED BULL RING — Spielberg, Austria
// ─────────────────────────────────────────────
const redBullRingGeo: CircuitGeometry = {
  circuitId: 'red_bull_ring',
  circuitName: 'Red Bull Ring',
  totalLengthM: 4318,
  totalElevationChangeM: 63.5,
  maxGradientPct: 12.0,
  direction: 'clockwise',
  nodes: [
    N(1,  'Main Straight',           'STRAIGHT',          10,  750,  null, 0,     0,    750,   0,   0,    315),
    N(2,  'Turn 1 — Right uphill',   'CONSTANT_RADIUS',   10,  110,  50,   85,    80,   70,    12,  10.9, 85),
    N(3,  'Straight T1-T2',          'STRAIGHT',          95,  260,  null, 0,     0,    260,   15,  5.8,  285),
    N(4,  'Turn 2 — Right',          'CONSTANT_RADIUS',   95,  90,   75,   55,    55,   65,    8,   8.9,  120),
    N(5,  'Straight T2-T3',          'STRAIGHT',          150, 320,  null, 0,     0,    320,   18,  5.6,  295),
    N(6,  'Turn 3 — Right crest',    'CONSTANT_RADIUS',   150, 80,   140,  42,    40,   65,    5,   6.3,  245),
    N(7,  'Turn 4 — Right downhill', 'CONSTANT_RADIUS',   192, 100,  230,  -35,   -45,  85,    -8,  -8.0, 260),
    N(8,  'Straight T4-T5',          'STRAIGHT',          157, 180,  null, 0,     0,    180,   -12, -6.7, 280),
    N(9,  'Turns 5-6',               'COMPLEX',           157, 200,  80,   50,    110,  165,   -9,  -4.5, 160),
    N(10, 'Turn 7 — Left',           'CONSTANT_RADIUS',   207, 130,  100,  -65,   -80,  95,    -6,  -4.6, 175),
    N(11, 'Straight T7-T8',          'STRAIGHT',          142, 230,  null, 0,     0,    230,   -3,  -1.3, 270),
    N(12, 'Turn 8 — Right',          'CONSTANT_RADIUS',   142, 90,   60,   55,    50,   70,    2,   2.2,  140),
    N(13, 'Turn 9 — Right',          'CONSTANT_RADIUS',   197, 110,  140,  40,    50,   95,    -5,  -4.5, 230),
    N(14, 'Turn 10 — Right',         'CONSTANT_RADIUS',   237, 100,  50,   60,    60,   75,    -3,  -3.0, 120),
    N(15, 'Run to Main Straight',    'STRAIGHT',          297, 250,  null, 0,     0,    250,   -4,  -1.6, 270),
  ],
};

// ─────────────────────────────────────────────
// R12. SILVERSTONE — Silverstone Circuit
// ─────────────────────────────────────────────
const silverstoneGeo: CircuitGeometry = {
  circuitId: 'silverstone',
  circuitName: 'Silverstone Circuit',
  totalLengthM: 5891,
  totalElevationChangeM: 11,
  maxGradientPct: 2.5,
  direction: 'clockwise',
  nodes: [
    N(1,  'Hamilton Straight',        'STRAIGHT',          200, 770,  null, 0,     0,    770,   0,   0,    325),
    N(2,  'Turn 1 — Abbey',           'CONSTANT_RADIUS',   200, 140,  180,  68,    95,   100,   0,   0,    265),
    N(3,  'Turn 2 — Farm',            'CONSTANT_RADIUS',   268, 80,   120,  -40,   -40,  65,    0,   0,    225),
    N(4,  'Turn 3 — Village',         'CONSTANT_RADIUS',   228, 110,  90,   72,    80,   75,    0.5, 0.5,  210),
    N(5,  'The Loop (T4-5)',          'COMPLEX',           300, 200,  100,  -65,   -120, 155,   0,   0,    195),
    N(6,  'Turn 6 — Brooklands',      'CONSTANT_RADIUS',   235, 130,  130,  55,    80,   100,   -1,  -0.8, 210),
    N(7,  'Luffield (T7)',            'CONSTANT_RADIUS',   290, 140,  90,   68,    95,   100,   0,   0,    175),
    N(8,  'Woodcote (T8)',            'CONSTANT_RADIUS',   358, 150,  200,  42,    55,   140,   0,   0,    265),
    N(9,  'Copse (Turn 9)',           'CONSTANT_RADIUS',   40,  160,  440,  32,    50,   150,   0,   0,    295),
    N(10, 'Maggotts (T10)',           'CONSTANT_RADIUS',   72,  100,  250,  -35,   -40,  90,    0.5, 0.5,  280),
    N(11, 'Becketts (T11)',           'CONSTANT_RADIUS',   37,  110,  200,  45,    55,   95,    -0.5,-0.5, 270),
    N(12, 'Chapel (T12)',             'CONSTANT_RADIUS',   82,  80,   280,  -28,   -25,  75,    0,   0,    285),
    N(13, 'Hangar Straight',          'STRAIGHT',          54,  770,  null, 0,     0,    770,   0,   0,    330),
    N(14, 'Stowe (T13)',              'CONSTANT_RADIUS',   54,  100,  160,  60,    65,   75,    0,   0,    240),
    N(15, 'Turn 14 — Vale',           'CONSTANT_RADIUS',   114, 120,  75,   -55,   -70,  95,    -0.5,-0.4, 160),
    N(16, 'Club (T15-16)',            'COMPLEX',           59,  180,  65,   80,    125,  125,   0.5, 0.3,  145),
    N(17, 'Straight to T1',           'STRAIGHT',          139, 350,  null, 0,     0,    350,   0,   0,    290),
  ],
};

// ─────────────────────────────────────────────
// R13. SPA — Circuit de Spa-Francorchamps
// ─────────────────────────────────────────────
const spaGeo: CircuitGeometry = {
  circuitId: 'spa',
  circuitName: 'Circuit de Spa-Francorchamps',
  totalLengthM: 7004,
  totalElevationChangeM: 102,
  maxGradientPct: 19.0,
  direction: 'clockwise',
  nodes: [
    N(1,  'Start/Finish Straight',    'STRAIGHT',          0,   250,  null, 0,     0,    250,   -3,  -1.2, 310),
    N(2,  'La Source (Turn 1)',       'HAIRPIN',           0,   100,  18,   180,   35,   90,    -5,  -5.0, 60),
    N(3,  'Eau Rouge approach',       'STRAIGHT',          180, 300,  null, 0,     0,    300,   -40, -13.3,310),
    N(4,  'Eau Rouge (Turn 4)',      'COMPLEX',           180, 180,  60,   -42,   -50,  170,   41,  22.8, 305),
    N(5,  'Raidillon',                'CONSTANT_RADIUS',   138, 120,  100,  52,    65,   100,   30,  25.0, 295),
    N(6,  'Kemmel Straight',          'STRAIGHT',          190, 800,  null, 0,     0,    800,   5,   0.6,  335),
    N(7,  'Les Combes (T5-6)',       'CHICANE',           190, 200,  55,   68,    110,  160,   -8,  -4.0, 110),
    N(8,  'Rivage (Turn 9)',         'HAIRPIN',           258, 100,  30,   120,   60,   75,    -10, -10.0,70),
    N(9,  'Straight T9-Pouhon',      'STRAIGHT',          18,  350,  null, 0,     0,    350,   -5,  -1.4, 290),
    N(10, 'Pouhon (T10-11)',         'COMPLEX',           18,  350,  120,  82,    240,  250,   -3,  -0.9, 285),
    N(11, 'Fagnes (T12)',            'CHICANE',           100, 200,  50,   -35,   -50,  190,   8,   4.0,  120),
    N(12, 'Stavelot (T14-15)',       'COMPLEX',           65,  320,  90,   65,    200,  240,   10,  3.1,  190),
    N(13, 'Blanchimont (T16)',       'CONSTANT_RADIUS',   130, 280,  280,  -35,   -65,  270,   -12, -4.3, 310),
    N(14, 'Bus Stop chicane (T17)',  'CHICANE',           95,  200,  35,   55,    80,   180,   -5,  -2.5, 75),
    N(15, 'Run to Start',            'STRAIGHT',          150, 280,  null, 0,     0,    280,   -3,  -1.1, 285),
  ],
};

// ─────────────────────────────────────────────
// R14. HUNGARORING — Budapest
// ─────────────────────────────────────────────
const hungaroringGeo: CircuitGeometry = {
  circuitId: 'hungaroring',
  circuitName: 'Hungaroring',
  totalLengthM: 4381,
  totalElevationChangeM: 36,
  maxGradientPct: 5.0,
  direction: 'clockwise',
  nodes: [
    N(1,  'Main Straight',           'STRAIGHT',          180, 590,  null, 0,     0,    590,   -5,  -0.8, 315),
    N(2,  'Turn 1 — Right',          'CONSTANT_RADIUS',   180, 120,  65,   90,    85,   80,    -3,  -2.5, 130),
    N(3,  'Turn 2 — Long left',      'CONSTANT_RADIUS',   270, 280,  110,  -100,  -200, 195,   4,   1.4,  165),
    N(4,  'Turn 3 — Right',          'CONSTANT_RADIUS',   170, 80,   55,   55,    50,   60,    -2,  -2.5, 125),
    N(5,  'Turn 4 — Hairpin right',  'CONSTANT_RADIUS',   225, 90,   35,   95,    65,   60,    0,   0,    75),
    N(6,  'Straight T4-T5',          'STRAIGHT',          320, 180,  null, 0,     0,    180,   -2,  -1.1, 260),
    N(7,  'Turn 5',                  'CONSTANT_RADIUS',   320, 80,   90,   -42,   -40,  65,    0,   0,    190),
    N(8,  'Turn 6 — Right',          'CONSTANT_RADIUS',   278, 100,  70,   55,    60,   75,    1,   1.0,  155),
    N(9,  'Turn 7 — Left',           'CONSTANT_RADIUS',   333, 80,   65,   -42,   -35,  65,    0,   0,    160),
    N(10, 'Straight T7-T8',          'STRAIGHT',          291, 200,  null, 0,     0,    200,   -1,  -0.5, 260),
    N(11, 'Turn 8-9 Complex',        'COMPLEX',           291, 180,  80,   55,    115,  130,   2,   1.1,  150),
    N(12, 'Turn 10-11 Complex',      'COMPLEX',           346, 200,  90,   -48,   -90,  175,   3,   1.5,  170),
    N(13, 'Turn 12 — Right',         'CONSTANT_RADIUS',   298, 100,  80,   50,    55,   80,    -1,  -1.0, 160),
    N(14, 'Turn 13-14 — Final',      'COMPLEX',           348, 160,  55,   -55,   -70,  140,   -2,  -1.3, 120),
    N(15, 'Run to Main Straight',    'STRAIGHT',          293, 250,  null, 0,     0,    250,   5,   2.0,  275),
  ],
};

// ─────────────────────────────────────────────
// R15. ZANDVOORT — Circuit Zandvoort
// ─────────────────────────────────────────────
const zandvoortGeo: CircuitGeometry = {
  circuitId: 'zandvoort',
  circuitName: 'Circuit Zandvoort',
  totalLengthM: 4259,
  totalElevationChangeM: 9,
  maxGradientPct: 3.0,
  direction: 'clockwise',
  nodes: [
    N(1,  'Main Straight',           'STRAIGHT',          80,  550,  null, 0,     0,    550,   0,   0,    305),
    N(2,  'Turn 1 — Tarzan (banked)','CONSTANT_RADIUS',   80,  130,  55,   90,    90,   90,    0,   0,    130),
    N(3,  'Turn 2 — Gerlachbocht',   'CONSTANT_RADIUS',   170, 100,  120,  -40,   -45,  90,    -1,  -1.0, 210),
    N(4,  'Turn 3 — Hugenholtz (18° bank)', 'CONSTANT_RADIUS', 130, 120, 80, 75, 85, 80, -2, -1.7, 175),
    N(5,  'Straight T3-T5',          'STRAIGHT',          205, 280,  null, 0,     0,    280,   0.5, 0.2,  270),
    N(6,  'Turn 5-6 Complex',        'COMPLEX',           205, 200,  100,  45,    100,  170,   1,   0.5,  195),
    N(7,  'Straight T6-T7',          'STRAIGHT',          250, 220,  null, 0,     0,    220,   0,   0,    265),
    N(8,  'Turn 7 — Scheivlak',      'CONSTANT_RADIUS',   250, 100,  180,  -35,   -40,  90,    -1.5,-1.5, 255),
    N(9,  'Turn 8 — Left',           'CONSTANT_RADIUS',   215, 80,   120,  38,    35,   70,    0,   0,    225),
    N(10, 'Straight T8-T9',          'STRAIGHT',          253, 280,  null, 0,     0,    280,   0,   0,    270),
    N(11, 'Turn 9 — Right',          'CONSTANT_RADIUS',   253, 90,   80,   48,    45,   75,    0,   0,    170),
    N(12, 'Turns 10-12 Complex',     'COMPLEX',           301, 240,  70,   65,    160,  175,   1.5, 0.6,  145),
    N(13, 'Turn 13 — Left',          'CONSTANT_RADIUS',   6,   80,   100,  -40,   -35,  70,    0,   0,    200),
    N(14, 'Turn 14 — Arie Luyendyk (18° banked)', 'CONSTANT_RADIUS', 326, 160, 70, 90, 110, 115, 0, 0, 180),
    N(15, 'Run to Main Straight',    'STRAIGHT',          56,  250,  null, 0,     0,    250,   0,   0,    280),
  ],
};

// ─────────────────────────────────────────────
// R16. MONZA — Autodromo Nazionale di Monza
// ─────────────────────────────────────────────
const monzaGeo: CircuitGeometry = {
  circuitId: 'monza',
  circuitName: 'Autodromo Nazionale di Monza',
  totalLengthM: 5793,
  totalElevationChangeM: 11,
  maxGradientPct: 1.5,
  direction: 'clockwise',
  nodes: [
    N(1,  'Main Straight',            'STRAIGHT',          180, 1100, null, 0,     0,    1100,  0,   0,    360),
    N(2,  'Variante del Rettifilo',   'CHICANE',           180, 210,  35,   50,    70,   195,   0,   0,    80),
    N(3,  'Curva Grande straight',    'STRAIGHT',          230, 380,  null, 0,     0,    380,   0,   0,    330),
    N(4,  'Curva Grande',             'CONSTANT_RADIUS',   230, 300,  400,  35,    80,   290,   0,   0,    310),
    N(5,  'Variante della Roggia',    'CHICANE',           265, 180,  30,   -45,   -55,  170,   0,   0,    75),
    N(6,  'Lesmo 1',                  'CONSTANT_RADIUS',   220, 180,  100,  60,    110,  130,   0,   0,    220),
    N(7,  'Short straight',           'STRAIGHT',          280, 180,  null, 0,     0,    180,   -0.5,-0.3, 270),
    N(8,  'Lesmo 2',                  'CONSTANT_RADIUS',   280, 160,  90,   52,    90,   125,   -1,  -0.6, 210),
    N(9,  'Straight to Ascari',       'STRAIGHT',          332, 480,  null, 0,     0,    480,   0,   0,    330),
    N(10, 'Ascari chicane',           'CHICANE',           332, 260,  50,   -55,   -100, 240,   0,   0,    130),
    N(11, 'Straight to Parabolica',   'STRAIGHT',          277, 620,  null, 0,     0,    620,   0,   0,    340),
    N(12, 'Parabolica (Alboreto)',    'CONSTANT_RADIUS',   277, 430,  180,  85,    320,  290,   0.5, 0.1,  260),
    N(13, 'Run to Main Straight',    'STRAIGHT',          2,   280,  null, 0,     0,    280,   1,   0.4,  330),
  ],
};

// ─────────────────────────────────────────────
// R17. BAKU — Baku City Circuit
// ─────────────────────────────────────────────
const bakuGeo: CircuitGeometry = {
  circuitId: 'baku',
  circuitName: 'Baku City Circuit',
  totalLengthM: 6003,
  totalElevationChangeM: 22,
  maxGradientPct: 6.0,
  direction: 'anti-clockwise',
  nodes: [
    N(1,  'Main Straight',           'STRAIGHT',          180, 2200, null, 0,     0,    2200,  0,   0,    350),
    N(2,  'Turn 1 — Right',          'CONSTANT_RADIUS',   180, 100,  60,   90,    65,   70,    0,   0,    110),
    N(3,  'Turn 2 — Left',           'CONSTANT_RADIUS',   270, 80,   50,   -82,   -55,  55,    2,   2.5,  100),
    N(4,  'Turn 3 — Right',          'CONSTANT_RADIUS',   188, 90,   70,   58,    55,   65,    3,   3.3,  135),
    N(5,  'Straight T3-T4',          'STRAIGHT',          246, 250,  null, 0,     0,    250,   4,   1.6,  280),
    N(6,  'Turns 4-7 Old Town sect.','COMPLEX',           246, 380,  30,   -110,  -140, 350,   6,   1.6,  80),
    N(7,  'Turn 8 — 90° left',      'CONSTANT_RADIUS',   136, 80,   35,   -90,   -55,  55,    2,   2.5,  65),
    N(8,  'Narrow castle section',   'STRAIGHT',          46,  220,  null, 0,     0,    220,   -3,  -1.4, 180),
    N(9,  'Turns 11-12 Complex',     'COMPLEX',           46,  200,  50,   65,    105,  165,   -4,  -2.0, 100),
    N(10, 'Turn 13-14',              'COMPLEX',           111, 180,  80,   -50,   -80,  155,   -2,  -1.1, 160),
    N(11, 'Turn 15 — Right',         'CONSTANT_RADIUS',   61,  120,  120,  55,    70,   95,    0,   0,    190),
    N(12, 'Straight T15-T16',        'STRAIGHT',          116, 300,  null, 0,     0,    300,   0,   0,    290),
    N(13, 'Turn 16 Castle',          'CONSTANT_RADIUS',   116, 100,  30,   92,    55,   80,    -2,  -2.0, 65),
    N(14, 'Turns 17-20',             'COMPLEX',           208, 350,  70,   -75,   -170, 305,   -4,  -1.1, 135),
    N(15, 'Run to Main Straight',    'STRAIGHT',          133, 350,  null, 0,     0,    350,   0,   0,    310),
  ],
};

// ─────────────────────────────────────────────
// R18. SINGAPORE — Marina Bay Street Circuit
// ─────────────────────────────────────────────
const marinaBayGeo: CircuitGeometry = {
  circuitId: 'marina_bay',
  circuitName: 'Marina Bay Street Circuit',
  totalLengthM: 4940,
  totalElevationChangeM: 3,
  maxGradientPct: 1.0,
  direction: 'anti-clockwise',
  nodes: [
    N(1,  'Start/Finish Straight',   'STRAIGHT',          180, 280,  null, 0,     0,    280,   0,   0,    305),
    N(2,  'Turn 1 — Left',           'CONSTANT_RADIUS',   180, 90,   55,   -80,   -55,  65,    0,   0,    115),
    N(3,  'Turn 2 — Left',           'CONSTANT_RADIUS',   100, 75,   50,   -55,   -40,  55,    0,   0,    110),
    N(4,  'Turn 3 — Right',          'CONSTANT_RADIUS',   45,  80,   60,   60,    50,   60,    0,   0,    130),
    N(5,  'Straight T3-T5',          'STRAIGHT',          105, 530,  null, 0,     0,    530,   0,   0,    295),
    N(6,  'Turn 5 — Left 90°',      'CONSTANT_RADIUS',   105, 90,   45,   -90,   -55,  70,    0,   0,    100),
    N(7,  'Straight T5-T7',          'STRAIGHT',          15,  380,  null, 0,     0,    380,   0,   0,    285),
    N(8,  'Turn 7 — Right 90°',     'CONSTANT_RADIUS',   15,  80,   40,   90,    50,   60,    0,   0,    90),
    N(9,  'Turns 8-11 Complex',      'COMPLEX',           105, 320,  55,   -65,   -140, 290,   0,   0,    110),
    N(10, 'Anderson Bridge sect.',   'COMPLEX',           40,  280,  70,   55,    130,  245,   0,   0,    135),
    N(11, 'Turn 14 — Left',          'CONSTANT_RADIUS',   95,  90,   50,   -75,   -55,  60,    0,   0,    105),
    N(12, 'Turns 15-17',             'COMPLEX',           20,  250,  60,   68,    140,  205,   0,   0,    120),
    N(13, 'Turn 18-19 — Esplanade', 'COMPLEX',           88,  200,  45,   -55,   -80,  180,   0,   0,    100),
    N(14, 'Straight T19-T20',        'STRAIGHT',          33,  250,  null, 0,     0,    250,   0,   0,    270),
    N(15, 'Turns 20-23 — Final',     'COMPLEX',           33,  350,  65,   80,    220,  270,   0,   0,    125),
    N(16, 'Run to Start',            'STRAIGHT',          113, 200,  null, 0,     0,    200,   0,   0,    265),
  ],
};

// ─────────────────────────────────────────────
// R19. COTA — Circuit of the Americas
// ─────────────────────────────────────────────
const americasGeo: CircuitGeometry = {
  circuitId: 'americas',
  circuitName: 'Circuit of the Americas',
  totalLengthM: 5513,
  totalElevationChangeM: 41,
  maxGradientPct: 11.0,
  direction: 'anti-clockwise',
  nodes: [
    N(1,  'Main Straight (uphill)',   'STRAIGHT',          340, 350,  null, 0,     0,    350,   30,  8.6,  310),
    N(2,  'Turn 1 — Left hairpin',    'CONSTANT_RADIUS',   340, 100,  45,   -110,  -70,  70,    11,  11.0, 85),
    N(3,  'S-curves (T2-5)',          'COMPLEX',           230, 320,  70,   65,    180,  260,   -5,  -1.6, 195),
    N(4,  'S-curves (T6-10)',         'COMPLEX',           295, 460,  85,   -80,   -260, 375,   -8,  -1.7, 215),
    N(5,  'Back straight',            'STRAIGHT',          215, 920,  null, 0,     0,    920,   -6,  -0.7, 335),
    N(6,  'Turn 11 — Hairpin',       'HAIRPIN',           215, 100,  25,   148,   60,   75,    3,   3.0,  60),
    N(7,  'Straight T11-T12',         'STRAIGHT',          3,   350,  null, 0,     0,    350,   -5,  -1.4, 305),
    N(8,  'Turn 12 — Left',          'CONSTANT_RADIUS',   3,   120,  130,  -55,   -70,  95,    0,   0,    215),
    N(9,  'Turns 13-15 Complex',     'COMPLEX',           308, 280,  90,   55,    160,  225,   2,   0.7,  175),
    N(10, 'Turn 16-18 — Triple apex','COMPLEX',           3,   300,  65,   -70,   -130, 270,   -2,  -0.7, 140),
    N(11, 'Turn 19 — Right',         'CONSTANT_RADIUS',   293, 110,  180,  42,    50,   100,   -1,  -0.9, 250),
    N(12, 'Turn 20 — Left',          'CONSTANT_RADIUS',   335, 100,  100,  -48,   -50,  85,    0,   0,    200),
    N(13, 'Run to Main Straight',    'STRAIGHT',          287, 450,  null, 0,     0,    450,   -8,  -1.8, 300),
  ],
};

// ─────────────────────────────────────────────
// R20. MEXICO CITY — Autódromo Hermanos Rodríguez
// ─────────────────────────────────────────────
const rodriguezGeo: CircuitGeometry = {
  circuitId: 'rodriguez',
  circuitName: 'Autódromo Hermanos Rodríguez',
  totalLengthM: 4304,
  totalElevationChangeM: 5,
  maxGradientPct: 1.0,
  direction: 'clockwise',
  nodes: [
    N(1,  'Main Straight',            'STRAIGHT',          180, 1100, null, 0,     0,    1100,  0,   0,    350),
    N(2,  'Turn 1 — Right',           'CONSTANT_RADIUS',   180, 100,  65,   85,    70,   70,    0,   0,    135),
    N(3,  'Turn 2-3 — Left',          'CONSTANT_RADIUS',   265, 90,   80,   -60,   -55,  65,    0,   0,    155),
    N(4,  'Esses (T4-6)',             'COMPLEX',           205, 350,  100,  60,    200,  280,   0,   0,    190),
    N(5,  'Turn 7-8 Complex',        'COMPLEX',           265, 200,  70,   -55,   -100, 170,   0,   0,    145),
    N(6,  'Straight T8-T9',           'STRAIGHT',          210, 280,  null, 0,     0,    280,   0,   0,    285),
    N(7,  'Turn 9 — Left',            'CONSTANT_RADIUS',   210, 90,   55,   -65,   -50,  65,    0,   0,    115),
    N(8,  'Turn 10-11',               'COMPLEX',           145, 180,  80,   50,    100,  145,   0,   0,    165),
    N(9,  'Turn 12 — Right',          'CONSTANT_RADIUS',   195, 100,  120,  42,    50,   85,    0,   0,    210),
    N(10, 'Peraltada/Stadium (T13-16)','COMPLEX',          237, 380,  50,   100,   250,  285,   0,   0,    110),
    N(11, 'Turn 17 — Exit stadium',   'CONSTANT_RADIUS',   337, 70,   90,   -35,   -30,  60,    0,   0,    195),
    N(12, 'Run to Main Straight',    'STRAIGHT',          302, 260,  null, 0,     0,    260,   0,   0,    285),
  ],
};

// ─────────────────────────────────────────────
// R21. INTERLAGOS — Autódromo José Carlos Pace
// ─────────────────────────────────────────────
const interlagosGeo: CircuitGeometry = {
  circuitId: 'interlagos',
  circuitName: 'Autódromo José Carlos Pace',
  totalLengthM: 4309,
  totalElevationChangeM: 43,
  maxGradientPct: 7.5,
  direction: 'anti-clockwise',
  nodes: [
    N(1,  'Main Straight (uphill)',   'STRAIGHT',          180, 380,  null, 0,     0,    380,   12,  3.2,  320),
    N(2,  'Senna S (T1)',             'CONSTANT_RADIUS',   180, 80,   55,   -75,   -50,  55,    -8,  -10.0,115),
    N(3,  'Senna S (T2)',             'CONSTANT_RADIUS',   105, 70,   50,   65,    45,   50,    -5,  -7.1, 120),
    N(4,  'Curva do Sol (T3)',       'CONSTANT_RADIUS',   170, 350,  200,  -90,   -240, 250,   -10, -2.9, 230),
    N(5,  'Reta Oposta (downhill)',   'STRAIGHT',          80,  350,  null, 0,     0,    350,   -8,  -2.3, 310),
    N(6,  'Descida do Lago (T4)',    'CONSTANT_RADIUS',   80,  120,  70,   65,    80,   85,    -5,  -4.2, 155),
    N(7,  'Ferradura (T6-7)',        'COMPLEX',           145, 280,  60,   -90,   -170, 220,   5,   1.8,  120),
    N(8,  'Laranjinha (T8)',         'CONSTANT_RADIUS',   55,  100,  55,   55,    55,   80,    3,   3.0,  130),
    N(9,  'Pinheirinho (T9)',        'CONSTANT_RADIUS',   110, 80,   70,   -48,   -40,  65,    2,   2.5,  145),
    N(10, 'Cotovelo (T10-11)',       'COMPLEX',           62,  200,  50,   80,    130,  145,   4,   2.0,  110),
    N(11, 'Mergulho (T12-13)',       'COMPLEX',           142, 180,  80,   -55,   -100, 140,   -3,  -1.7, 150),
    N(12, 'Junção (T14)',            'CONSTANT_RADIUS',   87,  130,  60,   68,    85,   95,    -5,  -3.8, 120),
    N(13, 'Subida dos Boxes (uphill)','STRAIGHT',          155, 580,  null, 0,     0,    580,   18,  3.1,  315),
  ],
};

// ─────────────────────────────────────────────
// R22. LAS VEGAS — Las Vegas Strip Circuit
// ─────────────────────────────────────────────
const lasVegasGeo: CircuitGeometry = {
  circuitId: 'las_vegas',
  circuitName: 'Las Vegas Strip Circuit',
  totalLengthM: 6201,
  totalElevationChangeM: 0,
  maxGradientPct: 0,
  direction: 'clockwise',
  nodes: [
    N(1,  'Start/Finish Straight',    'STRAIGHT',          0,   480,  null, 0,     0,    480,   0,   0,    320),
    N(2,  'Turn 1 — Right',           'CONSTANT_RADIUS',   0,   90,   55,   90,    60,   65,    0,   0,    110),
    N(3,  'Straight T1-T3',           'STRAIGHT',          90,  350,  null, 0,     0,    350,   0,   0,    300),
    N(4,  'Turn 3-4 — Chicane',       'CHICANE',           90,  140,  45,   -30,   -30,  135,   0,   0,    100),
    N(5,  'Koval Straight',           'STRAIGHT',          60,  780,  null, 0,     0,    780,   0,   0,    340),
    N(6,  'Turn 5 — Right 90°',      'CONSTANT_RADIUS',   60,  100,  40,   90,    60,   75,    0,   0,    85),
    N(7,  'Straight T5-T6',           'STRAIGHT',          150, 280,  null, 0,     0,    280,   0,   0,    280),
    N(8,  'Turns 6-10 Complex',       'COMPLEX',           150, 500,  70,   -85,   -250, 430,   0,   0,    145),
    N(9,  'Turn 11 — Left',           'CONSTANT_RADIUS',   65,  90,   80,   -55,   -50,  70,    0,   0,    160),
    N(10, 'Straight T11-T12',         'STRAIGHT',          10,  320,  null, 0,     0,    320,   0,   0,    290),
    N(11, 'Turn 12 — Right',          'CONSTANT_RADIUS',   10,  90,   65,   55,    50,   70,    0,   0,    135),
    N(12, 'Turn 13 — Left',           'CONSTANT_RADIUS',   65,  80,   55,   -50,   -40,  65,    0,   0,    120),
    N(13, 'Las Vegas Strip Straight', 'STRAIGHT',          15,  1750, null, 0,     0,    1750,  0,   0,    345),
    N(14, 'Turn 14 — Left 90°',      'CONSTANT_RADIUS',   15,  90,   40,   -90,   -55,  65,    0,   0,    85),
    N(15, 'Straight T14-T15',         'STRAIGHT',          285, 260,  null, 0,     0,    260,   0,   0,    275),
    N(16, 'Turns 15-17 — Final',      'COMPLEX',           285, 180,  55,   50,    105,  140,   0,   0,    115),
    N(17, 'Run to Start Straight',   'STRAIGHT',          335, 320,  null, 0,     0,    320,   0,   0,    285),
  ],
};

// ─────────────────────────────────────────────
// R23. LUSAIL — Lusail International Circuit, Qatar
// ─────────────────────────────────────────────
const lusailGeo: CircuitGeometry = {
  circuitId: 'lusail',
  circuitName: 'Lusail International Circuit',
  totalLengthM: 5419,
  totalElevationChangeM: 1,
  maxGradientPct: 0.5,
  direction: 'anti-clockwise',
  nodes: [
    N(1,  'Main Straight',            'STRAIGHT',          180, 1080, null, 0,     0,    1080,  0,   0,    340),
    N(2,  'Turn 1 — Right',           'CONSTANT_RADIUS',   180, 120,  130,  68,    85,   85,    0,   0,    225),
    N(3,  'Turn 2 — Left',            'CONSTANT_RADIUS',   248, 100,  110,  -55,   -60,  75,    0,   0,    210),
    N(4,  'Turn 3 — Right',           'CONSTANT_RADIUS',   193, 90,   90,   52,    50,   70,    0,   0,    195),
    N(5,  'Turn 4 — Left',            'CONSTANT_RADIUS',   245, 80,   100,  -42,   -38,  68,    0,   0,    205),
    N(6,  'Straight T4-T6',           'STRAIGHT',          203, 280,  null, 0,     0,    280,   0,   0,    295),
    N(7,  'Turn 6 — Right',           'CONSTANT_RADIUS',   203, 110,  120,  55,    70,   85,    0,   0,    220),
    N(8,  'Turn 7-8 Fast esses',     'COMPLEX',           258, 300,  150,  -45,   -130, 275,   0,   0,    260),
    N(9,  'Turn 9 — Right',           'CONSTANT_RADIUS',   213, 90,   100,  48,    50,   70,    0,   0,    205),
    N(10, 'Straight T9-T10',          'STRAIGHT',          261, 250,  null, 0,     0,    250,   0,   0,    285),
    N(11, 'Turn 10 — Right',          'CONSTANT_RADIUS',   261, 100,  80,   55,    60,   75,    0,   0,    180),
    N(12, 'Turn 11-12 Complex',       'COMPLEX',           316, 200,  90,   -50,   -95,  175,   0,   0,    195),
    N(13, 'Turn 13-14 Complex',       'COMPLEX',           266, 250,  110,  55,    150,  195,   0,   0,    210),
    N(14, 'Turn 15 — Left',           'CONSTANT_RADIUS',   321, 100,  120,  -48,   -55,  80,    0,   0,    220),
    N(15, 'Turn 16 — Right',          'CONSTANT_RADIUS',   273, 90,   150,  40,    45,   78,    0,   0,    240),
    N(16, 'Run to Main Straight',    'STRAIGHT',          313, 350,  null, 0,     0,    350,   0,   0,    300),
  ],
};

// ─────────────────────────────────────────────
// R24. YAS MARINA — Yas Marina Circuit, Abu Dhabi
// ─────────────────────────────────────────────
const yasMarinaGeo: CircuitGeometry = {
  circuitId: 'yas_marina',
  circuitName: 'Yas Marina Circuit',
  totalLengthM: 5281,
  totalElevationChangeM: 10.7,
  maxGradientPct: 2.8,
  direction: 'anti-clockwise',
  nodes: [
    N(1,  'Main Straight',            'STRAIGHT',          180, 680,  null, 0,     0,    680,   0,   0,    330),
    N(2,  'Turn 1 — Left braking',   'CONSTANT_RADIUS',   180, 110,  60,   -80,   -65,  80,    0,   0,    120),
    N(3,  'Turn 2 — Right',          'CONSTANT_RADIUS',   100, 80,   50,   65,    45,   60,    0,   0,    110),
    N(4,  'Turn 3 — Left',           'CONSTANT_RADIUS',   165, 90,   100,  -48,   -50,  70,    0,   0,    200),
    N(5,  'Straight T3-T5',          'STRAIGHT',          117, 480,  null, 0,     0,    480,   0,   0,    315),
    N(6,  'Turn 5 — Left',           'CONSTANT_RADIUS',   117, 100,  120,  -52,   -60,  75,    0,   0,    210),
    N(7,  'Hotel section (T6-7)',    'COMPLEX',           65,  200,  30,   110,   100,  170,   -1,  -0.5, 75),
    N(8,  'Straight T7-T8',          'STRAIGHT',          175, 350,  null, 0,     0,    350,   0,   0,    300),
    N(9,  'Turn 8-9',                'CHICANE',           175, 150,  50,   55,    70,   130,   0,   0,    120),
    N(10, 'Long Straight',            'STRAIGHT',          230, 1150, null, 0,     0,    1150,  0,   0,    335),
    N(11, 'Turn 11 — Left hairpin',  'CONSTANT_RADIUS',   230, 100,  25,   -140,  -55,  85,    0,   0,    60),
    N(12, 'Marina section (T12-14)', 'COMPLEX',           90,  320,  50,   80,    200,  240,   -1.5,-0.5, 100),
    N(13, 'Turns 15-16 Complex',     'COMPLEX',           170, 250,  80,   -55,   -120, 220,   1,   0.4,  160),
    N(14, 'Run to Main Straight',    'STRAIGHT',          115, 300,  null, 0,     0,    300,   0.5, 0.2,  290),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// GEOMETRY REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

// Raw geometry arrays — these represent the baseline data before corrections.
const RAW_CIRCUIT_GEOMETRIES: CircuitGeometry[] = [
  albertPark,
  shanghaiGeo,
  suzukaGeo,
  bahrainGeo,
  jeddahGeo,
  miamiGeo,
  imolaGeo,
  monacoGeo,
  catalunyaGeo,
  villeneuveGeo,
  redBullRingGeo,
  silverstoneGeo,
  spaGeo,
  hungaroringGeo,
  zandvoortGeo,
  monzaGeo,
  bakuGeo,
  marinaBayGeo,
  americasGeo,
  rodriguezGeo,
  interlagosGeo,
  lasVegasGeo,
  lusailGeo,
  yasMarinaGeo,
];

/**
 * ALL_CIRCUIT_GEOMETRIES — corrected and validated geometry for all 24 circuits.
 *
 * Real-world structural changes (chicane removals, layout overhauls, gravel trap
 * reinstatements, corner reprofiles, kerb height reductions) are applied
 * automatically by the TrackGeometryProcessor before this array is exported.
 * To update a circuit's corrections, edit TRACK_CORRECTION_REGISTRY in
 * trackGeometryProcessor.ts.
 */
export const ALL_CIRCUIT_GEOMETRIES: CircuitGeometry[] =
  applyAllTrackCorrections(RAW_CIRCUIT_GEOMETRIES);

export function getCircuitGeometry(circuitId: string): CircuitGeometry | undefined {
  return ALL_CIRCUIT_GEOMETRIES.find(c => c.circuitId === circuitId);
}

// ─── Utility: compute total AG optimization stats ────────────────────────────
export function getAGStats(circuitId: string) {
  const geo = getCircuitGeometry(circuitId);
  if (!geo) return null;

  const corners = geo.nodes.filter(n => n.radiusM !== null);
  const avgBanking = corners.reduce((s, n) => s + n.agBankingDeg, 0) / corners.length;
  const maxBanking = Math.max(...corners.map(n => n.agBankingDeg));
  const minRadius = Math.min(...corners.map(n => n.radiusM!));
  const avgDesignSpeed = geo.nodes.reduce((s, n) => s + n.agDesignSpeedKph, 0) / geo.nodes.length;

  return {
    circuitId,
    circuitName: geo.circuitName,
    totalSegments: geo.nodes.length,
    cornerCount: corners.length,
    avgBankingDeg: Math.round(avgBanking * 10) / 10,
    maxBankingDeg: maxBanking,
    tightestRadiusM: minRadius,
    avgAGDesignSpeedKph: Math.round(avgDesignSpeed),
    trackWidthM: AG_TRACK_WIDTH,
    totalElevationM: geo.totalElevationChangeM,
  };
}
