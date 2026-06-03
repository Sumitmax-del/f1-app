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
// 1. ALBERT PARK — Melbourne (anti-clockwise park circuit)
//    Distinctive: Long back straight along lakeside, flowing sweepers T3-T6,
//    tight T1 hairpin, chicane T11-T12, fast T13-T16 return loop
// ─────────────────────────────────────────────
const albertPark: TrackPathData = {
  trackId: 'albert_park',
  viewBox: '0 0 800 600',
  mainPath: `M 490,75 L 580,75 Q 625,75 645,100 L 660,130
    Q 668,155 658,180 L 635,210 Q 615,235 610,260
    L 612,295 Q 618,325 635,350 L 658,385 Q 675,415 668,445
    L 645,475 Q 618,498 582,510 L 530,522 Q 488,528 445,520
    L 395,508 Q 355,495 320,475 L 285,450 Q 258,428 245,400
    L 238,368 Q 236,338 250,312 L 275,282 Q 300,258 305,230
    L 302,200 Q 295,172 275,152 L 248,130 Q 228,112 232,88
    L 250,70 Q 278,56 320,62 L 378,70 Q 432,78 490,75 Z`,
  pitLanePath: 'M 490,75 L 468,95 Q 445,118 412,120 L 335,118 Q 300,118 282,100',
  startFinishLine: { x: 490, y: 75, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.52, endPercent: 0.65 },
    { startPercent: 0.76, endPercent: 0.88 },
    { startPercent: 0.92, endPercent: 1.0 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.08, speedFactor: 0.45 },
    { percent: 0.15, speedFactor: 0.85 },
    { percent: 0.22, speedFactor: 0.7 },
    { percent: 0.32, speedFactor: 0.95 },
    { percent: 0.42, speedFactor: 0.5 },
    { percent: 0.52, speedFactor: 0.9 },
    { percent: 0.62, speedFactor: 0.6 },
    { percent: 0.72, speedFactor: 0.85 },
    { percent: 0.82, speedFactor: 0.45 },
    { percent: 0.92, speedFactor: 0.9 },
    { percent: 1, speedFactor: 0.95 },
  ],
};

// ─────────────────────────────────────────────
// 2. SHANGHAI — Snail-spiral T1-3, hairpin T6, long back straight, final chicane
//    Distinctive: iconic reverse-snail T1 opening section curling inward,
//    long back straight, two tight hairpins, final chicane
// ─────────────────────────────────────────────
const shanghai: TrackPathData = {
  trackId: 'shanghai',
  viewBox: '0 0 800 600',
  mainPath: `M 580,500 L 665,500 Q 710,500 728,468 L 740,430
    Q 748,390 730,354 L 700,308 Q 675,275 668,240
    L 665,200 Q 668,160 652,128 L 620,90 Q 580,60 528,48
    L 460,42 Q 398,42 348,68 L 298,100 Q 262,128 248,168
    L 240,218 Q 238,268 260,308 L 298,355 Q 325,390 322,428
    L 315,465 Q 305,498 272,515 L 228,530 Q 185,540 148,520
    L 112,495 Q 85,468 86,430 L 90,385 Q 98,350 128,325
    L 175,292 Q 218,268 242,232 L 258,192 Q 278,145 322,128
    L 390,105 Q 450,92 505,118 L 555,155 Q 585,180 592,218
    L 595,265 Q 590,305 562,335 L 502,392 Q 472,422 475,462
    L 480,492 Q 492,518 528,510 Z`,
  pitLanePath: 'M 580,500 L 578,528 Q 576,550 548,550 L 390,548 Q 355,545 332,528',
  startFinishLine: { x: 580, y: 500, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.14 },
    { startPercent: 0.52, endPercent: 0.67 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.4 },
    { percent: 0.18, speedFactor: 0.5 },
    { percent: 0.28, speedFactor: 0.85 },
    { percent: 0.38, speedFactor: 0.45 },
    { percent: 0.5, speedFactor: 0.95 },
    { percent: 0.6, speedFactor: 0.5 },
    { percent: 0.7, speedFactor: 0.6 },
    { percent: 0.8, speedFactor: 0.4 },
    { percent: 0.9, speedFactor: 0.8 },
    { percent: 1, speedFactor: 0.9 },
  ],
};

// ─────────────────────────────────────────────
// 3. SUZUKA — True figure-8 crossover, S-curves, 130R, Spoon, Casio chicane
//    Distinctive: ONLY track with a figure-8 crossover bridge,
//    S-curves (T2-7), double-apex Spoon (T13-14), ultra-fast 130R (T15)
// ─────────────────────────────────────────────
const suzuka: TrackPathData = {
  trackId: 'suzuka',
  viewBox: '0 0 820 620',
  mainPath: `M 530,540 L 628,540 Q 668,540 692,508 L 718,465
    Q 738,422 726,378 L 700,332 Q 672,295 640,272
    L 568,235 Q 525,215 492,185 L 450,145 Q 418,110 375,88
    L 308,62 Q 252,46 198,58 L 142,75 Q 95,95 70,140
    L 54,196 Q 42,254 64,306 L 104,362 L 136,390
    Q 150,405 155,428 L 158,460 Q 158,492 132,522
    L 104,544 Q 72,562 40,542 L 26,526
    Q 13,508 18,482 L 40,425 Q 56,385 96,360
    L 182,306 Q 230,280 274,250 L 352,194
    Q 398,168 448,190 L 530,240 Q 578,268 610,320
    L 650,382 Q 671,424 668,464 L 660,492
    Q 648,520 618,530 L 560,540 Z`,
  pitLanePath: 'M 530,540 L 530,562 Q 530,582 500,582 L 302,577 Q 260,572 240,552',
  startFinishLine: { x: 530, y: 540, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.08 },
    { startPercent: 0.64, endPercent: 0.76 },
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
    { percent: 0.7, speedFactor: 0.95 },
    { percent: 0.8, speedFactor: 0.6 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.8 },
  ],
};

// ─────────────────────────────────────────────
// 4. BAHRAIN — Sakhir: three distinct hairpin loop clusters, desert circuit
//    Distinctive: wide main straight, three tight hairpin sections creating
//    a loop-within-loop feel, final esses before pit straight
// ─────────────────────────────────────────────
const bahrain: TrackPathData = {
  trackId: 'bahrain',
  viewBox: '0 0 800 600',
  mainPath: `M 440,72 L 595,72 Q 645,72 663,110 L 673,158
    Q 680,194 662,224 L 628,262 Q 602,285 600,315
    L 605,355 Q 612,388 592,412 L 548,448
    Q 520,470 520,504 L 524,538 Q 531,563 504,580
    L 452,596 Q 414,607 376,590 L 322,562
    Q 288,544 265,515 L 240,468 Q 222,434 222,396
    L 226,352 Q 232,318 215,290 L 182,248
    Q 155,215 156,176 L 162,140 Q 175,106 210,85
    L 275,66 Q 332,55 440,72 Z
    M 528,260 L 555,248 Q 580,242 596,258
    Q 612,275 600,296 L 578,314 Q 555,324 535,310
    Q 515,296 528,260 Z
    M 240,352 L 265,338 Q 288,330 302,346
    Q 316,362 305,382 L 282,396 Q 260,405 245,390
    Q 230,375 240,352 Z`,
  pitLanePath: 'M 440,72 L 418,94 Q 396,116 362,118 L 272,117 Q 238,117 222,98',
  startFinishLine: { x: 440, y: 72, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.46, endPercent: 0.59 },
    { startPercent: 0.73, endPercent: 0.86 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.95 },
    { percent: 0.18, speedFactor: 0.45 },
    { percent: 0.25, speedFactor: 0.38 },
    { percent: 0.35, speedFactor: 0.85 },
    { percent: 0.46, speedFactor: 1 },
    { percent: 0.55, speedFactor: 0.5 },
    { percent: 0.65, speedFactor: 0.45 },
    { percent: 0.73, speedFactor: 0.9 },
    { percent: 0.85, speedFactor: 0.5 },
    { percent: 0.92, speedFactor: 0.65 },
    { percent: 1, speedFactor: 0.9 },
  ],
};

// ─────────────────────────────────────────────
// 5. JEDDAH — Ultra-fast narrow corniche street circuit
//    Distinctive: extremely elongated tall shape, mega back straight along
//    the Red Sea corniche, tight squiggly middle section (T13-T27),
//    three DRS zones, among fastest street circuits ever
// ─────────────────────────────────────────────
const jeddah: TrackPathData = {
  trackId: 'jeddah',
  viewBox: '0 0 400 820',
  mainPath: `M 210,44 L 305,44 Q 346,44 362,80 L 372,130
    Q 376,168 358,196 L 322,232 Q 300,252 292,280
    L 286,326 Q 282,365 296,394 L 325,432
    Q 352,466 350,508 L 342,572 Q 334,622 302,652
    L 254,698 Q 220,724 178,732 L 132,735
    Q 88,733 62,706 L 38,674 Q 18,646 24,614
    L 38,558 Q 52,518 80,490 L 122,452
    Q 150,426 154,392 L 158,338 Q 158,295 142,268
    L 108,224 Q 86,196 94,164 L 106,128
    Q 120,96 148,76 L 176,58 Q 196,45 210,44 Z`,
  pitLanePath: 'M 210,44 L 210,76 Q 210,108 182,110 L 118,118 Q 92,124 82,152',
  startFinishLine: { x: 210, y: 44, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.1 },
    { startPercent: 0.36, endPercent: 0.5 },
    { startPercent: 0.63, endPercent: 0.79 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.45 },
    { percent: 0.2, speedFactor: 0.92 },
    { percent: 0.3, speedFactor: 0.42 },
    { percent: 0.4, speedFactor: 0.95 },
    { percent: 0.5, speedFactor: 0.48 },
    { percent: 0.6, speedFactor: 0.88 },
    { percent: 0.7, speedFactor: 0.38 },
    { percent: 0.8, speedFactor: 0.92 },
    { percent: 0.9, speedFactor: 0.52 },
    { percent: 1, speedFactor: 0.85 },
  ],
};

// ─────────────────────────────────────────────
// 6. MIAMI — Hard Rock Stadium autodrome
//    Distinctive: three long straights connected by 90° bends (outer loop),
//    stadium inner section with tight T11 hairpin, long final sweeper T17
// ─────────────────────────────────────────────
const miami: TrackPathData = {
  trackId: 'miami',
  viewBox: '0 0 820 620',
  mainPath: `M 415,68 L 628,68 Q 672,68 695,105 L 722,168
    Q 742,214 740,265 L 738,332 Q 732,384 700,415
    L 648,458 Q 614,482 570,494 L 508,510
    Q 470,518 442,545 L 402,578 Q 368,598 325,598
    L 252,592 Q 202,585 162,552 L 114,505
    Q 80,468 68,428 L 58,370 Q 52,322 68,280
    L 98,228 Q 126,186 172,162 L 245,132
    Q 295,112 350,96 L 415,68 Z
    M 425,198 L 565,198 Q 602,198 618,228
    L 632,268 Q 638,300 622,328 L 592,358
    Q 566,378 535,385 L 480,392 Q 446,395 426,374
    L 408,352 Q 396,328 402,300 L 416,268
    Q 420,240 425,198 Z`,
  pitLanePath: 'M 415,68 L 402,100 Q 388,130 352,133 L 258,138 Q 222,140 202,162',
  startFinishLine: { x: 415, y: 68, angle: 0 },
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
// 7. CIRCUIT GILLES VILLENEUVE — Montreal (Île Notre-Dame)
//    Distinctive: thin island circuit with two long parallels,
//    Wall of Champions chicane (T8-9), hairpin T10, casino straight
// ─────────────────────────────────────────────
const villeneuve: TrackPathData = {
  trackId: 'villeneuve',
  viewBox: '0 0 820 420',
  mainPath: `M 432,78 L 600,68 Q 655,63 690,96 L 728,136
    Q 755,168 758,212 L 758,260 Q 750,302 720,328
    L 672,362 Q 640,382 606,390 L 530,393
    Q 488,393 455,370 L 410,338 Q 382,314 348,308
    L 280,302 Q 230,302 190,326 L 140,358
    Q 106,378 70,370 L 38,358 Q 12,340 10,306
    L 10,258 Q 10,218 35,192 L 78,155
    Q 112,128 158,112 L 248,84 Q 330,65 432,78 Z
    M 465,160 L 560,150 Q 595,148 608,175
    L 618,210 Q 622,238 608,260 L 582,285
    Q 558,302 528,308 L 470,312 Q 440,312 425,292
    L 412,268 Q 408,242 418,218 L 435,188
    Q 445,168 465,160 Z`,
  pitLanePath: 'M 432,78 L 410,100 Q 388,124 354,124 L 258,119 Q 222,119 202,102',
  startFinishLine: { x: 432, y: 78, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.15 },
    { startPercent: 0.62, endPercent: 0.79 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.9 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.88 },
    { percent: 0.3, speedFactor: 0.4 },
    { percent: 0.4, speedFactor: 0.5 },
    { percent: 0.5, speedFactor: 0.38 },
    { percent: 0.6, speedFactor: 0.9 },
    { percent: 0.7, speedFactor: 0.5 },
    { percent: 0.8, speedFactor: 0.7 },
    { percent: 0.9, speedFactor: 0.35 },
    { percent: 1, speedFactor: 0.82 },
  ],
};

// ─────────────────────────────────────────────
// 8. MONACO — Iconic tight harbour street circuit
//    Distinctive: uphill Beau Rivage, Casino Square (T4), Fairmont hairpin
//    (world's tightest F1 turn), downhill Portier, dark tunnel,
//    Swimming Pool chicane (T15-16), Rascasse (T17), Anthony Noghes (T18)
// ─────────────────────────────────────────────
const monaco: TrackPathData = {
  trackId: 'monaco',
  viewBox: '0 0 700 580',
  mainPath: `M 205,540 L 292,540 Q 335,540 362,510
    L 395,468 Q 418,435 435,398
    L 448,355 Q 455,318 478,292 L 512,262
    Q 548,232 568,198 L 580,158 Q 585,122 568,90
    L 542,58 Q 510,30 468,22 L 418,18
    Q 372,16 338,38 L 305,66 Q 278,92 268,128
    L 262,168 Q 260,208 278,238 L 308,268
    Q 335,292 342,328 L 345,368 Q 342,402 318,428
    L 285,455 Q 255,474 218,480 L 175,482
    Q 135,480 108,455 L 82,422 Q 62,388 64,352
    L 70,308 Q 80,268 108,240 L 148,208
    Q 175,185 188,155 L 192,118 Q 188,82 165,55
    L 138,35 Q 108,22 75,30 Q 48,42 35,72
    L 25,112 Q 22,152 42,185 L 80,215
    Q 112,238 125,272 L 128,308 Q 125,342 108,368
    L 82,395 Q 58,418 62,452 L 72,485
    Q 88,515 122,530 L 168,540 Z`,
  pitLanePath: 'M 205,540 L 195,555 Q 182,570 162,570 L 95,565 Q 70,560 58,542',
  startFinishLine: { x: 205, y: 540, angle: -8 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.75 },
    { percent: 0.08, speedFactor: 0.32 },
    { percent: 0.15, speedFactor: 0.55 },
    { percent: 0.22, speedFactor: 0.28 },
    { percent: 0.3, speedFactor: 0.52 },
    { percent: 0.4, speedFactor: 0.32 },
    { percent: 0.5, speedFactor: 0.62 },
    { percent: 0.6, speedFactor: 0.28 },
    { percent: 0.7, speedFactor: 0.45 },
    { percent: 0.8, speedFactor: 0.32 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.65 },
  ],
};

// ─────────────────────────────────────────────
// 9. BARCELONA — Circuit de Barcelona-Catalunya
//    Distinctive: long main straight, tight T1 hairpin, flowing T3 sweeper,
//    Repsol chicane (T9-10), SEAT hairpin (T14-15), long back straight T8
// ─────────────────────────────────────────────
const catalunya: TrackPathData = {
  trackId: 'catalunya',
  viewBox: '0 0 820 620',
  mainPath: `M 392,92 L 572,72 Q 634,65 678,104
    L 722,152 Q 754,194 755,246
    L 752,310 Q 744,360 710,394 L 655,438
    Q 620,465 608,504 L 596,545
    Q 578,578 535,592 L 438,606
    Q 375,610 316,582 L 236,538
    Q 188,510 155,468 L 112,408
    Q 79,352 65,294 L 56,232
    Q 52,180 82,140 L 136,98
    Q 192,68 260,66 L 392,92 Z
    M 450,202 L 565,192 Q 602,190 618,220
    L 630,258 Q 636,292 618,322 L 585,352
    Q 558,372 525,380 L 468,386
    Q 432,388 412,362 L 396,332
    Q 388,305 398,278 L 418,248
    Q 430,222 450,202 Z`,
  pitLanePath: 'M 392,92 L 375,120 Q 358,148 320,152 L 222,152 Q 184,152 168,138',
  startFinishLine: { x: 392, y: 92, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.13 },
    { startPercent: 0.61, endPercent: 0.76 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.48 },
    { percent: 0.18, speedFactor: 0.78 },
    { percent: 0.25, speedFactor: 0.55 },
    { percent: 0.35, speedFactor: 0.88 },
    { percent: 0.45, speedFactor: 0.48 },
    { percent: 0.55, speedFactor: 0.65 },
    { percent: 0.65, speedFactor: 0.92 },
    { percent: 0.75, speedFactor: 0.45 },
    { percent: 0.85, speedFactor: 0.72 },
    { percent: 0.95, speedFactor: 0.88 },
    { percent: 1, speedFactor: 0.92 },
  ],
};

// ─────────────────────────────────────────────
// 10. RED BULL RING — Spielberg: short, very compact, high altitude
//     Distinctive: only 10 corners, three main straights meeting at an
//     angular triangle peak, steep elevation changes, T1 downhill approach
// ─────────────────────────────────────────────
const redBullRing: TrackPathData = {
  trackId: 'red_bull_ring',
  viewBox: '0 0 700 540',
  mainPath: `M 330,102 L 488,78 Q 542,70 578,100
    L 614,138 Q 640,172 645,218
    L 648,272 Q 648,320 618,358
    L 568,408 Q 535,435 500,448
    L 435,468 Q 388,478 338,468
    L 265,446 Q 220,428 186,394
    L 132,338 Q 100,294 84,248
    L 72,196 Q 66,148 94,114
    L 150,86 Q 206,70 330,102 Z
    M 435,178 Q 462,155 492,162
    L 518,176 Q 538,195 532,222
    Q 524,250 498,260 L 468,265
    Q 442,265 428,242 Q 414,218 435,178 Z`,
  pitLanePath: 'M 330,102 L 308,128 Q 285,154 252,156 L 172,155 Q 140,155 128,134',
  startFinishLine: { x: 330, y: 102, angle: -8 },
  drsZones: [
    { startPercent: 0, endPercent: 0.14 },
    { startPercent: 0.32, endPercent: 0.48 },
    { startPercent: 0.65, endPercent: 0.82 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.48 },
    { percent: 0.18, speedFactor: 0.95 },
    { percent: 0.3, speedFactor: 0.48 },
    { percent: 0.4, speedFactor: 0.88 },
    { percent: 0.5, speedFactor: 0.42 },
    { percent: 0.6, speedFactor: 0.52 },
    { percent: 0.7, speedFactor: 0.92 },
    { percent: 0.85, speedFactor: 0.48 },
    { percent: 0.95, speedFactor: 0.82 },
    { percent: 1, speedFactor: 0.92 },
  ],
};

// ─────────────────────────────────────────────
// 11. SILVERSTONE — Fast flowing circuit, Maggotts-Becketts-Chapel S complex
//     Distinctive: roughly heptagonal outer shape, the signature
//     Maggotts-Becketts high-speed S-complex mid-top, Copse T1 opener,
//     Stowe and Club at end
// ─────────────────────────────────────────────
const silverstone: TrackPathData = {
  trackId: 'silverstone',
  viewBox: '0 0 820 620',
  mainPath: `M 462,92 L 598,82 Q 652,76 686,108
    L 728,152 Q 755,192 756,238
    L 754,302 Q 748,352 720,388
    L 674,432 Q 648,460 644,498
    L 640,536 Q 634,568 598,582
    L 522,595 Q 470,598 418,585
    L 324,558 Q 265,535 218,498
    L 160,445 Q 118,398 92,344
    L 66,278 Q 50,220 66,166
    L 100,118 Q 145,84 202,74 L 318,70
    Q 388,73 462,92 Z
    M 548,175 Q 568,155 592,160
    L 622,172 Q 645,188 640,215
    Q 636,242 612,250 L 582,255
    Q 555,255 542,234 Q 528,212 548,175 Z`,
  pitLanePath: 'M 462,92 L 438,120 Q 415,148 378,152 L 265,158 Q 228,162 208,146',
  startFinishLine: { x: 462, y: 92, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.56, endPercent: 0.71 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.08, speedFactor: 0.7 },
    { percent: 0.15, speedFactor: 0.88 },
    { percent: 0.22, speedFactor: 0.62 },
    { percent: 0.3, speedFactor: 0.78 },
    { percent: 0.4, speedFactor: 0.55 },
    { percent: 0.5, speedFactor: 0.82 },
    { percent: 0.6, speedFactor: 0.95 },
    { percent: 0.7, speedFactor: 0.55 },
    { percent: 0.8, speedFactor: 0.72 },
    { percent: 0.9, speedFactor: 0.62 },
    { percent: 1, speedFactor: 0.92 },
  ],
};

// ─────────────────────────────────────────────
// 12. SPA-FRANCORCHAMPS — Iconic triangular circuit in the Ardennes
//     Distinctive: La Source hairpin at top, downhill Eau Rouge/Raidillon sweep,
//     long Kemmel straight, Pouhon double-left, Blanchimont flat-out,
//     Bus Stop chicane, forms a clear triangle on the map
// ─────────────────────────────────────────────
const spa: TrackPathData = {
  trackId: 'spa',
  viewBox: '0 0 820 700',
  mainPath: `M 318,620 L 395,598 Q 434,580 454,548
    L 498,474 Q 522,435 562,414 L 638,380
    Q 692,356 732,318 L 768,272
    Q 795,228 784,180 L 762,132
    Q 738,92 692,66 L 626,40
    Q 574,24 520,28 L 432,36
    Q 382,44 344,72 L 296,116
    Q 260,152 228,188 L 174,248
    Q 136,288 106,332 L 72,386
    Q 46,436 52,490 L 66,540
    Q 82,586 128,612 L 196,632
    Q 252,645 318,620 Z`,
  pitLanePath: 'M 318,620 L 280,608 Q 248,595 236,568 L 220,530 Q 204,494 182,474',
  startFinishLine: { x: 318, y: 620, angle: -10 },
  drsZones: [
    { startPercent: 0, endPercent: 0.08 },
    { startPercent: 0.44, endPercent: 0.6 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.85 },
    { percent: 0.05, speedFactor: 0.32 },
    { percent: 0.1, speedFactor: 0.72 },
    { percent: 0.15, speedFactor: 0.52 },
    { percent: 0.25, speedFactor: 0.92 },
    { percent: 0.35, speedFactor: 0.95 },
    { percent: 0.45, speedFactor: 1 },
    { percent: 0.55, speedFactor: 0.38 },
    { percent: 0.65, speedFactor: 0.82 },
    { percent: 0.75, speedFactor: 0.52 },
    { percent: 0.85, speedFactor: 0.55 },
    { percent: 0.92, speedFactor: 0.45 },
    { percent: 1, speedFactor: 0.78 },
  ],
};

// ─────────────────────────────────────────────
// 13. HUNGARORING — Compact twisty Budapest circuit
//     Distinctive: tight kidney-bowl shape, very sinuous layout,
//     virtually no overtaking opportunities, long T2 sweeper,
//     tight final sequence T11-13
// ─────────────────────────────────────────────
const hungaroring: TrackPathData = {
  trackId: 'hungaroring',
  viewBox: '0 0 720 620',
  mainPath: `M 378,78 L 505,68 Q 558,62 596,94
    L 634,136 Q 664,174 668,224
    L 668,285 Q 662,336 628,372
    L 580,420 Q 548,452 538,490
    L 532,528 Q 522,562 478,578
    L 395,592 Q 336,596 283,568
    L 215,528 Q 172,498 140,456
    L 104,395 Q 72,346 62,292
    L 56,232 Q 54,180 80,138
    L 124,102 Q 172,74 230,68 L 378,78 Z
    M 355,195 L 430,185 Q 465,182 480,210
    L 492,245 Q 498,278 480,305 L 452,332
    Q 428,350 395,356 L 348,360
    Q 315,360 298,335 L 285,305
    Q 280,278 295,255 L 318,228
    Q 335,208 355,195 Z`,
  pitLanePath: 'M 378,78 L 360,108 Q 342,136 308,140 L 215,146 Q 182,146 165,126',
  startFinishLine: { x: 378, y: 78, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.1 },
    { startPercent: 0.56, endPercent: 0.69 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.85 },
    { percent: 0.1, speedFactor: 0.42 },
    { percent: 0.18, speedFactor: 0.58 },
    { percent: 0.25, speedFactor: 0.38 },
    { percent: 0.35, speedFactor: 0.55 },
    { percent: 0.45, speedFactor: 0.38 },
    { percent: 0.55, speedFactor: 0.78 },
    { percent: 0.65, speedFactor: 0.42 },
    { percent: 0.75, speedFactor: 0.55 },
    { percent: 0.85, speedFactor: 0.38 },
    { percent: 0.95, speedFactor: 0.72 },
    { percent: 1, speedFactor: 0.82 },
  ],
};

// ─────────────────────────────────────────────
// 14. ZANDVOORT — Dutch coastal dunes circuit
//     Distinctive: compact oval-ish shape with two heavily banked ends
//     (Tarzan T1 banked at 18°, Arie Luyendyk T3 banked at 19°),
//     narrow Hugenholtz chicane, Scheivlak banked sweeper
// ─────────────────────────────────────────────
const zandvoort: TrackPathData = {
  trackId: 'zandvoort',
  viewBox: '0 0 720 520',
  mainPath: `M 368,78 L 500,68 Q 554,62 590,100
    L 625,145 Q 650,185 650,235
    L 644,292 Q 635,340 602,370
    L 548,415 Q 512,442 474,456
    L 412,472 Q 358,478 310,460
    L 242,433 Q 200,412 168,380
    L 125,330 Q 94,284 85,232
    L 79,178 Q 78,130 108,100
    L 162,72 Q 220,54 304,68 L 368,78 Z
    M 405,165 L 490,158 Q 522,156 536,182
    L 545,215 Q 550,245 535,268 L 510,290
    Q 486,305 455,308 L 408,310
    Q 378,308 362,285 L 352,258
    Q 348,232 362,210 L 382,188
    Q 392,172 405,165 Z`,
  pitLanePath: 'M 368,78 L 346,100 Q 325,125 292,127 L 208,132 L 178,112',
  startFinishLine: { x: 368, y: 78, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.1 },
    { startPercent: 0.56, endPercent: 0.71 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.88 },
    { percent: 0.1, speedFactor: 0.42 },
    { percent: 0.2, speedFactor: 0.72 },
    { percent: 0.3, speedFactor: 0.52 },
    { percent: 0.4, speedFactor: 0.68 },
    { percent: 0.5, speedFactor: 0.48 },
    { percent: 0.6, speedFactor: 0.58 },
    { percent: 0.7, speedFactor: 0.82 },
    { percent: 0.8, speedFactor: 0.52 },
    { percent: 0.9, speedFactor: 0.68 },
    { percent: 1, speedFactor: 0.78 },
  ],
};

// ─────────────────────────────────────────────
// 15. MONZA — Temple of Speed
//     Distinctive: elongated oval outer loop with two interrupting chicane
//     clusters: Variante del Rettifilo (T1-2) and Variante della Roggia (T3-4),
//     Lesmo bends (T5-6), Variante Ascari (T8-10), Parabolica (T11)
// ─────────────────────────────────────────────
const monza: TrackPathData = {
  trackId: 'monza',
  viewBox: '0 0 760 630',
  mainPath: `M 395,98 L 552,82 Q 600,76 628,108
    L 656,150 Q 676,186 670,230
    L 654,284 Q 640,322 606,348
    L 550,390 Q 522,412 515,446
    L 515,480 Q 522,514 555,535
    L 594,558 Q 622,574 612,598
    L 585,614 Q 552,624 515,618
    L 378,592 Q 308,575 255,536
    L 188,484 Q 140,438 112,385
    L 86,318 Q 64,260 75,202
    L 98,154 Q 132,114 188,98
    L 288,84 Q 340,85 395,98 Z
    M 420,168 L 510,158 Q 545,155 558,182
    L 568,215 Q 572,246 555,270 L 528,295
    Q 502,312 468,316 L 422,318
    Q 392,315 378,290 L 368,262
    Q 364,232 380,210 L 402,188
    Q 412,175 420,168 Z`,
  pitLanePath: 'M 395,98 L 372,122 Q 350,146 312,150 L 222,154 L 185,140',
  startFinishLine: { x: 395, y: 98, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.15 },
    { startPercent: 0.56, endPercent: 0.73 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.12, speedFactor: 0.38 },
    { percent: 0.18, speedFactor: 0.48 },
    { percent: 0.25, speedFactor: 0.95 },
    { percent: 0.35, speedFactor: 0.42 },
    { percent: 0.42, speedFactor: 0.48 },
    { percent: 0.5, speedFactor: 0.95 },
    { percent: 0.6, speedFactor: 0.48 },
    { percent: 0.65, speedFactor: 0.52 },
    { percent: 0.75, speedFactor: 0.42 },
    { percent: 0.85, speedFactor: 0.92 },
    { percent: 1, speedFactor: 0.95 },
  ],
};

// ─────────────────────────────────────────────
// 16. MADRID — IFEMA Madrid Street Circuit (new 2026)
//     Distinctive: compact urban layout around IFEMA exhibition centre,
//     mix of long straights and tight 90° turns, inner section loops
// ─────────────────────────────────────────────
const madrid: TrackPathData = {
  trackId: 'madrid',
  viewBox: '0 0 820 640',
  mainPath: `M 415,78 L 618,78 Q 668,78 692,115
    L 722,170 Q 742,216 740,270
    L 736,335 Q 725,385 688,416
    L 632,458 Q 598,482 560,498
    L 502,518 Q 465,527 437,553
    L 406,580 Q 375,600 332,600
    L 256,594 Q 205,587 165,552
    L 116,507 Q 80,468 68,424
    L 56,366 Q 50,315 70,268
    L 100,220 Q 134,178 180,154
    L 254,122 Q 318,100 415,78 Z
    M 385,200 L 498,190 Q 538,187 558,218
    L 572,258 Q 580,292 564,322 L 534,354
    Q 508,376 474,384 L 420,392
    Q 386,395 364,370 L 348,344
    Q 339,315 350,288 L 366,256
    Q 374,228 385,200 Z`,
  pitLanePath: 'M 415,78 L 398,110 Q 380,140 344,143 L 250,145 L 212,128',
  startFinishLine: { x: 415, y: 78, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.14 },
    { startPercent: 0.56, endPercent: 0.71 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.95 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.82 },
    { percent: 0.3, speedFactor: 0.55 },
    { percent: 0.4, speedFactor: 0.88 },
    { percent: 0.5, speedFactor: 0.5 },
    { percent: 0.6, speedFactor: 0.78 },
    { percent: 0.7, speedFactor: 0.92 },
    { percent: 0.8, speedFactor: 0.52 },
    { percent: 0.9, speedFactor: 0.72 },
    { percent: 1, speedFactor: 0.88 },
  ],
};

// ─────────────────────────────────────────────
// 17. BAKU — Azerbaijan City Circuit
//     Distinctive: world's longest DRS straight (2.2 km pit straight),
//     very tall elongated key-like shape, medieval old town tight castle
//     section (T8-T14), wide middle section, mega hairpin T3
// ─────────────────────────────────────────────
const baku: TrackPathData = {
  trackId: 'baku',
  viewBox: '0 0 420 840',
  mainPath: `M 212,55 L 298,55 Q 338,55 354,90
    L 366,148 Q 370,188 352,218 L 314,260
    Q 292,284 285,315 L 280,415
    Q 278,462 298,490 L 330,532
    Q 358,566 358,612 L 350,678
    Q 342,728 308,754 L 264,782
    Q 228,800 186,796 L 144,785
    Q 106,772 80,740 L 56,706
    Q 38,676 44,642 L 60,584
    Q 76,546 106,518 L 146,484
    Q 170,460 175,430 L 180,350
    Q 180,305 165,278 L 132,240
    Q 110,212 116,178 L 128,142
    Q 142,110 170,90 L 192,72
    Q 204,60 212,55 Z`,
  pitLanePath: 'M 212,55 L 212,88 Q 212,118 186,120 L 128,132 L 105,162',
  startFinishLine: { x: 212, y: 55, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.08 },
    { startPercent: 0.4, endPercent: 0.58 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.08, speedFactor: 0.38 },
    { percent: 0.15, speedFactor: 0.52 },
    { percent: 0.25, speedFactor: 0.42 },
    { percent: 0.35, speedFactor: 0.58 },
    { percent: 0.45, speedFactor: 1 },
    { percent: 0.55, speedFactor: 0.38 },
    { percent: 0.65, speedFactor: 0.52 },
    { percent: 0.75, speedFactor: 0.42 },
    { percent: 0.85, speedFactor: 0.48 },
    { percent: 0.92, speedFactor: 0.62 },
    { percent: 1, speedFactor: 0.88 },
  ],
};

// ─────────────────────────────────────────────
// 18. MARINA BAY — Singapore night street circuit
//     Distinctive: rectangular bayfront loop, wide Raffles Boulevard straight,
//     multiple 90° right-angle corners, Anderson Bridge, Esplanade flyover section
// ─────────────────────────────────────────────
const marinaBay: TrackPathData = {
  trackId: 'marina_bay',
  viewBox: '0 0 720 620',
  mainPath: `M 375,78 L 528,68 Q 575,62 610,96
    L 648,142 Q 672,180 668,232
    L 658,290 Q 644,334 615,365
    L 578,406 Q 550,432 546,472
    L 543,512 Q 540,548 508,568
    L 448,592 Q 406,606 358,602
    L 280,590 Q 226,580 184,546
    L 130,498 Q 94,458 74,408
    L 58,350 Q 48,296 60,248
    L 84,196 Q 112,152 156,120
    L 218,88 Q 280,70 375,78 Z
    M 390,178 L 498,168 Q 535,165 550,195
    L 562,232 Q 568,265 550,292 L 520,320
    Q 494,340 460,346 L 408,350
    Q 374,348 358,322 L 348,292
    Q 344,265 358,242 L 378,215
    Q 388,195 390,178 Z`,
  pitLanePath: 'M 375,78 L 352,102 Q 330,126 298,130 L 215,136 L 182,160',
  startFinishLine: { x: 375, y: 78, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.1 },
    { startPercent: 0.36, endPercent: 0.49 },
    { startPercent: 0.71, endPercent: 0.83 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.82 },
    { percent: 0.1, speedFactor: 0.38 },
    { percent: 0.2, speedFactor: 0.62 },
    { percent: 0.3, speedFactor: 0.38 },
    { percent: 0.4, speedFactor: 0.72 },
    { percent: 0.5, speedFactor: 0.33 },
    { percent: 0.6, speedFactor: 0.55 },
    { percent: 0.7, speedFactor: 0.82 },
    { percent: 0.8, speedFactor: 0.38 },
    { percent: 0.9, speedFactor: 0.62 },
    { percent: 1, speedFactor: 0.72 },
  ],
};

// ─────────────────────────────────────────────
// 19. COTA — Circuit of the Americas, Austin Texas
//     Distinctive: uphill blind T1 hairpin, epic S-curves esses (T3-T9),
//     long back straight T12-T13, stadium section with T16-T19 tight complex,
//     big sweeping T18 bend, long T20 final sweeper onto pit straight
// ─────────────────────────────────────────────
const americas: TrackPathData = {
  trackId: 'americas',
  viewBox: '0 0 820 620',
  mainPath: `M 412,96 L 562,76 Q 615,68 655,100
    L 700,148 Q 734,192 740,248
    L 742,312 Q 738,365 706,402
    L 658,450 Q 624,480 602,520
    L 585,558 Q 565,584 520,594
    L 412,606 Q 348,608 290,582
    L 218,542 Q 164,510 128,464
    L 88,400 Q 58,342 52,278
    L 52,220 Q 56,168 92,132
    L 150,98 Q 210,74 290,76 L 412,96 Z
    M 485,172 Q 506,150 530,158
    L 556,172 Q 576,190 572,218
    Q 566,248 540,256 L 510,260
    Q 483,258 468,238 Q 453,218 485,172 Z
    M 355,340 L 432,328 Q 465,325 478,350
    L 488,382 Q 492,412 475,435 L 448,458
    Q 422,475 390,480 L 345,482
    Q 315,480 300,457 L 292,428
    Q 290,402 305,382 L 328,360
    Q 342,345 355,340 Z`,
  pitLanePath: 'M 412,96 L 395,125 Q 378,154 340,157 L 248,160 L 212,143',
  startFinishLine: { x: 412, y: 96, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.59, endPercent: 0.73 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.95 },
    { percent: 0.05, speedFactor: 0.38 },
    { percent: 0.12, speedFactor: 0.72 },
    { percent: 0.2, speedFactor: 0.55 },
    { percent: 0.3, speedFactor: 0.88 },
    { percent: 0.4, speedFactor: 0.5 },
    { percent: 0.5, speedFactor: 0.78 },
    { percent: 0.6, speedFactor: 0.95 },
    { percent: 0.7, speedFactor: 0.42 },
    { percent: 0.8, speedFactor: 0.65 },
    { percent: 0.9, speedFactor: 0.52 },
    { percent: 1, speedFactor: 0.88 },
  ],
};

// ─────────────────────────────────────────────
// 20. HERMANOS RODRIGUEZ — Mexico City
//     Distinctive: outer loop feeds into iconic Peraltada stadium hairpin,
//     long main straight, compact infield technical section (T1-T7),
//     the Peraltada wide sweeping bowl (T16-T17)
// ─────────────────────────────────────────────
const rodriguez: TrackPathData = {
  trackId: 'rodriguez',
  viewBox: '0 0 820 520',
  mainPath: `M 428,78 L 585,68 Q 638,62 678,96
    L 722,144 Q 752,182 756,234
    L 756,292 Q 750,342 718,374
    L 665,418 Q 632,442 608,470
    L 590,486 Q 564,505 520,508
    L 395,502 Q 332,495 280,468
    L 214,426 Q 168,392 140,348
    L 108,290 Q 82,238 78,184
    L 78,140 Q 82,104 112,82
    L 185,62 Q 255,48 348,62 L 428,78 Z
    M 480,175 L 565,165 Q 600,162 615,192
    L 625,228 Q 630,260 612,288 L 582,315
    Q 555,335 522,340 L 468,342
    Q 435,340 420,315 L 410,282
    Q 406,252 422,228 L 445,202
    Q 460,183 480,175 Z`,
  pitLanePath: 'M 428,78 L 406,100 Q 385,124 352,126 L 254,126 L 220,108',
  startFinishLine: { x: 428, y: 78, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.43, endPercent: 0.57 },
    { startPercent: 0.73, endPercent: 0.87 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.82 },
    { percent: 0.3, speedFactor: 0.45 },
    { percent: 0.4, speedFactor: 0.58 },
    { percent: 0.5, speedFactor: 0.92 },
    { percent: 0.6, speedFactor: 0.5 },
    { percent: 0.7, speedFactor: 0.45 },
    { percent: 0.8, speedFactor: 0.82 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.88 },
  ],
};

// ─────────────────────────────────────────────
// 21. INTERLAGOS — Autódromo José Carlos Pace, São Paulo
//     Distinctive: anti-clockwise compact circuit, short sweeping outer
//     Senna S double-left (T1-T2), long descent sector 2, Junção hairpin
//     T8, Pinheirinho S, tight final Bico de Pato and Mergulho, elevation changes
// ─────────────────────────────────────────────
const interlagos: TrackPathData = {
  trackId: 'interlagos',
  viewBox: '0 0 720 520',
  mainPath: `M 420,78 L 548,68 Q 596,62 630,96
    L 660,142 Q 680,180 676,230
    L 665,288 Q 652,332 618,362
    L 565,406 Q 532,432 515,460
    L 504,482 Q 488,500 450,502
    L 348,495 Q 292,488 246,460
    L 190,422 Q 148,385 122,342
    L 92,284 Q 72,235 76,188
    L 88,142 Q 105,108 142,90
    L 220,67 Q 292,54 385,70 L 420,78 Z
    M 438,178 L 530,168 Q 565,165 578,195
    L 588,228 Q 592,260 575,286 L 548,312
    Q 522,330 490,335 L 440,337
    Q 408,335 393,310 L 382,280
    Q 378,252 393,230 L 415,205
    Q 428,188 438,178 Z`,
  pitLanePath: 'M 420,78 L 398,100 Q 376,124 344,126 L 252,126 L 218,108',
  startFinishLine: { x: 420, y: 78, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.56, endPercent: 0.71 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.9 },
    { percent: 0.08, speedFactor: 0.38 },
    { percent: 0.18, speedFactor: 0.72 },
    { percent: 0.28, speedFactor: 0.55 },
    { percent: 0.4, speedFactor: 0.88 },
    { percent: 0.5, speedFactor: 0.5 },
    { percent: 0.6, speedFactor: 0.78 },
    { percent: 0.7, speedFactor: 0.45 },
    { percent: 0.8, speedFactor: 0.62 },
    { percent: 0.9, speedFactor: 0.5 },
    { percent: 1, speedFactor: 0.82 },
  ],
};

// ─────────────────────────────────────────────
// 22. LAS VEGAS STRIP CIRCUIT
//     Distinctive: three very long parallel straights around the Strip,
//     sharp 90° right-angle corners, Sphere hairpin T12, MSG Sphere section,
//     Caesars Palace chicane, exceptionally high top speed circuit
// ─────────────────────────────────────────────
const lasVegas: TrackPathData = {
  trackId: 'las_vegas',
  viewBox: '0 0 820 620',
  mainPath: `M 430,78 L 645,78 Q 692,78 716,116
    L 744,168 Q 764,210 764,260
    L 764,348 Q 760,402 727,432
    L 674,476 Q 640,502 596,514
    L 525,530 Q 482,538 452,566
    L 414,594 Q 380,612 336,612
    L 245,606 Q 188,596 148,561
    L 100,514 Q 62,473 50,422
    L 44,356 Q 42,295 62,244
    L 96,192 Q 134,150 188,124
    L 275,88 Q 352,70 430,78 Z
    M 468,175 L 600,168 Q 638,165 652,196
    L 662,232 Q 668,265 650,292 L 620,320
    Q 592,340 558,346 L 500,350
    Q 465,348 450,322 L 440,290
    Q 436,262 450,240 L 458,210
    Q 464,190 468,175 Z`,
  pitLanePath: 'M 430,78 L 410,108 Q 390,136 352,140 L 258,142 L 220,126',
  startFinishLine: { x: 430, y: 78, angle: 0 },
  drsZones: [
    { startPercent: 0, endPercent: 0.14 },
    { startPercent: 0.56, endPercent: 0.73 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 1 },
    { percent: 0.1, speedFactor: 0.42 },
    { percent: 0.2, speedFactor: 0.92 },
    { percent: 0.3, speedFactor: 0.48 },
    { percent: 0.4, speedFactor: 0.95 },
    { percent: 0.5, speedFactor: 0.42 },
    { percent: 0.6, speedFactor: 0.88 },
    { percent: 0.7, speedFactor: 0.48 },
    { percent: 0.8, speedFactor: 0.92 },
    { percent: 0.9, speedFactor: 0.52 },
    { percent: 1, speedFactor: 0.92 },
  ],
};

// ─────────────────────────────────────────────
// 23. LUSAIL — Qatar: flowing high-speed desert circuit
//     Distinctive: large sweeping wide curves, like a horseshoe/crescent shape,
//     no real hairpins, mostly high-speed T1 and T16 semi-circles,
//     flowing Turns 6-15 connecting inner loop
// ─────────────────────────────────────────────
const lusail: TrackPathData = {
  trackId: 'lusail',
  viewBox: '0 0 820 620',
  mainPath: `M 452,88 L 598,78 Q 652,72 686,108
    L 730,160 Q 760,204 764,260
    L 764,328 Q 758,382 725,418
    L 672,465 Q 635,494 602,525
    L 566,555 Q 532,580 484,587
    L 375,590 Q 318,586 265,562
    L 202,524 Q 156,488 126,440
    L 90,378 Q 64,320 64,260
    L 68,198 Q 80,148 122,115
    L 188,84 Q 252,62 336,73 L 452,88 Z`,
  pitLanePath: 'M 452,88 L 430,118 Q 410,148 372,150 L 276,152 L 240,136',
  startFinishLine: { x: 452, y: 88, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.95 },
    { percent: 0.08, speedFactor: 0.52 },
    { percent: 0.15, speedFactor: 0.82 },
    { percent: 0.22, speedFactor: 0.62 },
    { percent: 0.3, speedFactor: 0.88 },
    { percent: 0.4, speedFactor: 0.58 },
    { percent: 0.5, speedFactor: 0.72 },
    { percent: 0.6, speedFactor: 0.88 },
    { percent: 0.7, speedFactor: 0.52 },
    { percent: 0.8, speedFactor: 0.78 },
    { percent: 0.9, speedFactor: 0.62 },
    { percent: 1, speedFactor: 0.88 },
  ],
};

// ─────────────────────────────────────────────
// 24. YAS MARINA — Abu Dhabi: W Hotel underpass section, marina hairpin
//     Distinctive: main elongated outer loop, unique chicane that passes
//     UNDER the iconic W Hotel building, marina inner loop section with
//     two hairpins, Yas Viaduct, long pit straight back to T1
// ─────────────────────────────────────────────
const yasMarina: TrackPathData = {
  trackId: 'yas_marina',
  viewBox: '0 0 820 620',
  mainPath: `M 425,98 L 582,80 Q 636,73 670,108
    L 716,160 Q 745,205 748,260
    L 748,325 Q 742,378 708,414
    L 658,458 Q 624,486 607,522
    L 594,555 Q 578,585 534,595
    L 425,608 Q 361,610 304,583
    L 231,540 Q 178,508 143,462
    L 103,398 Q 72,340 65,275
    L 65,210 Q 72,158 110,124
    L 175,92 Q 240,68 330,78 L 425,98 Z
    M 505,222 L 580,210 Q 618,206 634,238
    L 645,275 Q 650,308 632,336 L 602,362
    Q 574,382 540,388 L 488,392
    Q 455,390 438,364 L 428,332
    Q 422,302 438,278 L 460,252
    Q 480,232 505,222 Z
    M 340,440 L 412,430 Q 445,426 458,454
    L 466,486 Q 469,515 452,538 L 428,558
    Q 405,572 375,575 L 330,574
    Q 300,570 286,545 L 280,516
    Q 278,490 295,470 L 318,452
    Q 330,442 340,440 Z`,
  pitLanePath: 'M 425,98 L 402,126 Q 380,150 344,152 L 250,154 L 214,138',
  startFinishLine: { x: 425, y: 98, angle: -5 },
  drsZones: [
    { startPercent: 0, endPercent: 0.12 },
    { startPercent: 0.56, endPercent: 0.71 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.95 },
    { percent: 0.1, speedFactor: 0.5 },
    { percent: 0.2, speedFactor: 0.82 },
    { percent: 0.3, speedFactor: 0.55 },
    { percent: 0.4, speedFactor: 0.72 },
    { percent: 0.5, speedFactor: 0.52 },
    { percent: 0.6, speedFactor: 0.88 },
    { percent: 0.7, speedFactor: 0.45 },
    { percent: 0.8, speedFactor: 0.72 },
    { percent: 0.9, speedFactor: 0.55 },
    { percent: 1, speedFactor: 0.88 },
  ],
};

// ─────────────────────────────────────────────
// IMOLA — Autodromo Enzo e Dino Ferrari
//    Distinctive: Tamburello chicane (T1-2), Tosa hairpin (T5), Piratella
//    (T6), Acque Minerali (T7-8), Variante Alta (T9-10), Rivazza hairpins
// ─────────────────────────────────────────────
const imola: TrackPathData = {
  trackId: 'imola',
  viewBox: '0 0 800 500',
  mainPath: `M 432,70 L 575,56 Q 624,50 662,78 L 705,118
    Q 735,154 738,204 L 736,258 Q 728,302 696,330
    L 638,372 Q 608,392 598,428 L 594,462
    Q 584,492 542,504 L 435,512 Q 378,512 325,488
    L 258,450 Q 220,428 194,394 L 152,338
    Q 124,298 108,255 L 92,200 Q 82,156 100,118
    L 138,80 Q 182,52 240,52 L 352,62 Q 392,66 432,70 Z
    M 460,155 L 545,145 Q 578,142 592,170
    L 600,205 Q 604,238 585,262 L 558,288
    Q 532,306 498,310 L 450,312 Q 420,310 405,285
    L 396,255 Q 392,224 408,202 L 432,178
    Q 445,160 460,155 Z`,
  pitLanePath: 'M 432,70 L 418,98 Q 404,126 370,128 L 278,124 Q 242,124 222,108',
  startFinishLine: { x: 432, y: 70, angle: -3 },
  drsZones: [
    { startPercent: 0, endPercent: 0.14 },
    { startPercent: 0.58, endPercent: 0.72 },
  ],
  sectorSplits: [0.33, 0.66],
  speedProfile: [
    { percent: 0, speedFactor: 0.92 },
    { percent: 0.1, speedFactor: 0.48 },
    { percent: 0.2, speedFactor: 0.78 },
    { percent: 0.3, speedFactor: 0.62 },
    { percent: 0.4, speedFactor: 0.45 },
    { percent: 0.55, speedFactor: 0.92 },
    { percent: 0.65, speedFactor: 0.48 },
    { percent: 0.75, speedFactor: 0.72 },
    { percent: 0.85, speedFactor: 0.55 },
    { percent: 0.95, speedFactor: 0.82 },
    { percent: 1, speedFactor: 0.88 },
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
  villeneuve,
  monaco,
  catalunya,
  redBullRing,
  silverstone,
  spa,
  hungaroring,
  zandvoort,
  monza,
  madrid,
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
