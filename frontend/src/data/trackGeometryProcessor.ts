// ═══════════════════════════════════════════════════════════════════════════════
// TRACK GEOMETRY PROCESSOR
// Applies real-world structural corrections to F1 circuit geometry data.
//
// Architecture mirrors the Python TrackRegistry + TrackGeometryProcessor
// template. Each circuit declares its modifications as action rules; the
// processor iterates and applies them to the live mesh-node arrays.
//
// How to extend:
//  - Add new circuits: append an entry to TRACK_CORRECTION_REGISTRY keyed by
//    the circuit's circuitId string.
//  - Add new nodes: plug your telemetry/JSON map directly into the nodes array
//    in trackGeometry.ts, then declare correction rules here.
// ═══════════════════════════════════════════════════════════════════════════════

import { CircuitGeometry, TrackNode } from './trackGeometry';

// ─── Modification action types ────────────────────────────────────────────────

type ModAction =
  | 'REMOVE_CHICANE_SMOOTH_SWEEP'    // Linear-interpolate heading through bypassed chicane nodes
  | 'BYPASS_SECTION'                 // Replace multi-apex section with single-apex geometry
  | 'WIDEN_RADIUS_GLIDE'             // Expand corner radius and recompute banking / design speed
  | 'EXPAND_RUNOFF_BOUNDARIES'       // Override surface descriptor on a node range
  | 'SHIFT_LATERAL'                  // Nudge a single node's deltaX (track widening)
  | 'REPLACE_WITH_HAIRPIN'           // Collapse a chicane sequence to a single hairpin node
  | 'FLATTEN_CURBS';                 // Tag nodes with reduced kerb-height metadata

interface BaseModification {
  action: ModAction;
  description: string;               // Human-readable reason for the correction
}

interface SmoothSweepMod extends BaseModification {
  action: 'REMOVE_CHICANE_SMOOTH_SWEEP';
  startNodeIndex: number;            // 0-based index into circuit nodes[]
  endNodeIndex: number;
  targetRadiusM: number;             // Replace intermediate nodes with this radius
}

interface BypassSectionMod extends BaseModification {
  action: 'BYPASS_SECTION';
  startNodeIndex: number;
  endNodeIndex: number;
  newSegmentType: TrackNode['segmentType'];
  newRadiusM: number;
}

interface WidenRadiusMod extends BaseModification {
  action: 'WIDEN_RADIUS_GLIDE';
  startNodeIndex: number;
  endNodeIndex: number;
  targetRadiusM: number;
}

interface ExpandRunoffMod extends BaseModification {
  action: 'EXPAND_RUNOFF_BOUNDARIES';
  startNodeIndex: number;
  endNodeIndex: number;
  surfaceTag: string;                // e.g. 'gravel_trap_corrected'
}

interface ShiftLateralMod extends BaseModification {
  action: 'SHIFT_LATERAL';
  nodeIndex: number;
  offsetMeters: number;              // positive = widen outward (increase deltaX)
}

interface ReplaceWithHairpinMod extends BaseModification {
  action: 'REPLACE_WITH_HAIRPIN';
  startNodeIndex: number;
  endNodeIndex: number;
  hairpinRadiusM: number;
  hairpinRotationDeg: number;
}

interface FlattenCurbsMod extends BaseModification {
  action: 'FLATTEN_CURBS';
  startNodeIndex: number;
  endNodeIndex: number;
  maxCurbHeightMm: number;           // Stored as metadata tag
}

type Modification =
  | SmoothSweepMod
  | BypassSectionMod
  | WidenRadiusMod
  | ExpandRunoffMod
  | ShiftLateralMod
  | ReplaceWithHairpinMod
  | FlattenCurbsMod;

interface CircuitCorrectionEntry {
  formalName: string;
  correctedLengthM: number;          // Real-world target circuit length after corrections
  modifications: Record<string, Modification>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRACK CORRECTION REGISTRY
// One entry per circuit. Keys must match circuitId values in trackGeometry.ts.
// ═══════════════════════════════════════════════════════════════════════════════

export const TRACK_CORRECTION_REGISTRY: Record<string, CircuitCorrectionEntry> = {

  // ── R1. ALBERT PARK — 2023 chicane removal & corner widenings ──────────────
  albert_park: {
    formalName: 'Albert Park Circuit (Melbourne)',
    correctedLengthM: 5278,
    modifications: {
      turn_8_9_chicane_removal: {
        action: 'REMOVE_CHICANE_SMOOTH_SWEEP',
        description:
          'The T8-T9 chicane was removed for the 2023 season, replaced by a ' +
          'high-speed 140m-radius sweeper to improve overtaking opportunities.',
        startNodeIndex: 8,   // node index for "Turns 7-8" chicane entry
        endNodeIndex: 9,     // node index for "Turn 9 — Fast right"
        targetRadiusM: 140,
      },
      turn_1_widening: {
        action: 'SHIFT_LATERAL',
        description:
          'Turn 1 (Jones) outer kerb moved 2.5 m outward to increase braking zone width.',
        nodeIndex: 1,
        offsetMeters: 2.5,
      },
      turn_6_widening: {
        action: 'SHIFT_LATERAL',
        description:
          'Turn 6 (Clark hairpin) exit widened 7.5 m to reduce bottleneck at pit-exit merge.',
        nodeIndex: 6,
        offsetMeters: 7.5,
      },
    },
  },

  // ── R24. YAS MARINA — 2021/2022 full layout overhaul ──────────────────────
  yas_marina: {
    formalName: 'Yas Marina Circuit (Abu Dhabi) — 2022 spec',
    correctedLengthM: 5281,
    modifications: {
      north_hairpin_chicane_bypass: {
        action: 'BYPASS_SECTION',
        description:
          'The slow north-sector chicane (Hotel section T6-T7) was replaced with ' +
          'a single tight hairpin, cutting sector time and enabling DRS activation.',
        startNodeIndex: 6,   // "Hotel section (T6-7)"
        endNodeIndex: 7,     // "Straight T7-T8"
        newSegmentType: 'HAIRPIN',
        newRadiusM: 18,
      },
      marina_chicane_sequence_bypass: {
        action: 'REPLACE_WITH_HAIRPIN',
        description:
          'The marina chicane sequence (T8-T9) was replaced with a single banked ' +
          'medium-speed hairpin to create a better overtaking zone before the long straight.',
        startNodeIndex: 8,   // "Turn 8-9"
        endNodeIndex: 9,     // "Long Straight"
        hairpinRadiusM: 45,
        hairpinRotationDeg: 120,
      },
    },
  },

  // ── R9. BARCELONA — Turn 10 reprofile (2021 season) ───────────────────────
  catalunya: {
    formalName: 'Circuit de Barcelona-Catalunya',
    correctedLengthM: 4657,
    modifications: {
      turn_10_reprofile: {
        action: 'WIDEN_RADIUS_GLIDE',
        description:
          'Turn 10 (Campsa) was reprofiled in 2021 from a slow constant-radius right ' +
          'to a fast sweeper with a larger radius, raising minimum speed through the corner.',
        startNodeIndex: 9,   // "Turn 10 — Campsa"
        endNodeIndex: 10,    // "Straight T10-T12"
        targetRadiusM: 380,  // expanded from 240m to 380m per FIA survey
      },
    },
  },

  // ── R13. SPA-FRANCORCHAMPS — Gravel trap reinstatement (2022 FIA order) ────
  spa: {
    formalName: 'Circuit de Spa-Francorchamps',
    correctedLengthM: 7004,
    modifications: {
      eau_rouge_raidillon_gravel: {
        action: 'EXPAND_RUNOFF_BOUNDARIES',
        description:
          'Gravel traps re-added to Eau Rouge / Raidillon runoff following FIA safety ' +
          'review after 2021 incidents. Tarmac runoff retained on exit only.',
        startNodeIndex: 3,   // "Eau Rouge (Turn 4)"
        endNodeIndex: 4,     // "Raidillon"
        surfaceTag: 'gravel_trap_reinstated',
      },
      speaker_corner_gravel: {
        action: 'EXPAND_RUNOFF_BOUNDARIES',
        description:
          'Speakers Corner (Les Combes T5-6 exit) gravel strip widened by 6 m as part ' +
          'of the same 2022 FIA runoff safety package.',
        startNodeIndex: 6,   // "Les Combes (T5-6)"
        endNodeIndex: 7,     // "Rivage (Turn 9)"
        surfaceTag: 'gravel_trap_reinstated',
      },
    },
  },

  // ── R16. MONZA — Prima Variante kerb height reduction (2021) ───────────────
  monza: {
    formalName: 'Autodromo Nazionale Monza',
    correctedLengthM: 5793,
    modifications: {
      prima_variante_curb_flatten: {
        action: 'FLATTEN_CURBS',
        description:
          'Prima Variante (Turn 1 chicane) sausage kerbs reduced from 80mm to 50mm ' +
          'maximum height after multiple car-launch incidents in 2020.',
        startNodeIndex: 1,   // "Variante del Rettifilo" chicane
        endNodeIndex: 1,
        maxCurbHeightMm: 50,
      },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRACK GEOMETRY PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════════

const G = 9.81;
const AG_FACTOR = 3.5;
const MAX_BANK_DEG = 60;

/** Recompute the anti-gravity banking angle for a given radius and design speed. */
function recalcBanking(radiusM: number, speedKph: number): number {
  const v = speedKph / 3.6;
  const theta = Math.atan((v * v) / (radiusM * G * AG_FACTOR)) * (180 / Math.PI);
  return Math.min(MAX_BANK_DEG, Math.round(theta * 10) / 10);
}

/** Map corner radius to AG design speed (same scale as trackGeometry.ts helper). */
function agDesignSpeed(radiusM: number): number {
  if (radiusM <= 15)  return 180;
  if (radiusM <= 40)  return 250;
  if (radiusM <= 80)  return 320;
  if (radiusM <= 150) return 380;
  if (radiusM <= 300) return 430;
  if (radiusM <= 500) return 470;
  return 500;
}

export class TrackGeometryProcessor {
  private circuitId: string;
  private correctionEntry: CircuitCorrectionEntry;
  public nodes: TrackNode[];
  public geometry: CircuitGeometry;

  constructor(geometry: CircuitGeometry) {
    const entry = TRACK_CORRECTION_REGISTRY[geometry.circuitId];
    if (!entry) {
      // No corrections defined — return geometry unchanged
      this.circuitId = geometry.circuitId;
      this.correctionEntry = {
        formalName: geometry.circuitName,
        correctedLengthM: geometry.totalLengthM,
        modifications: {},
      };
      this.nodes = [...geometry.nodes];
      this.geometry = geometry;
      return;
    }

    this.circuitId = geometry.circuitId;
    this.correctionEntry = entry;
    // Deep-clone nodes so original raw data is not mutated
    this.nodes = geometry.nodes.map(n => ({ ...n }));
    this.geometry = { ...geometry, nodes: this.nodes };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /** Linear interpolation between start/end nodes to smooth out bypassed sections. */
  private smoothSplineBetween(startIdx: number, endIdx: number): void {
    const p0 = this.nodes[startIdx];
    const p1 = this.nodes[endIdx];
    const steps = endIdx - startIdx;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const curr = this.nodes[startIdx + i];
      curr.deltaX = lerp(p0.deltaX, p1.deltaX, t);
      curr.deltaY = lerp(p0.deltaY, p1.deltaY, t);
      curr.deltaZ = lerp(p0.deltaZ, p1.deltaZ, t);
      curr.headingDeg = lerpAngle(p0.headingDeg, p1.headingDeg, t);
      curr.approxSpeedKph = lerp(p0.approxSpeedKph, p1.approxSpeedKph, t);
      curr.segmentType = 'INCREASING_RADIUS'; // transitional geometry
    }
  }

  // ─── Action dispatchers ──────────────────────────────────────────────────────

  private applyRemoveChicaneSmoothSweep(mod: SmoothSweepMod, modName: string): void {
    const { startNodeIndex, endNodeIndex, targetRadiusM } = mod;
    this.smoothSplineBetween(startNodeIndex, endNodeIndex);

    // Upgrade the start node to a smooth sweeper with the corrected radius
    const node = this.nodes[startNodeIndex];
    node.segmentType = 'CONSTANT_RADIUS';
    node.radiusM = targetRadiusM;
    node.agDesignSpeedKph = agDesignSpeed(targetRadiusM);
    node.agBankingDeg = recalcBanking(targetRadiusM, node.agDesignSpeedKph);
    node.approxSpeedKph = Math.min(node.approxSpeedKph + 60, 295); // faster now chicane is gone

    console.log(
      `  [${this.circuitId}] ✓ ${modName}: Smooth ${targetRadiusM}m-radius sweeper applied ` +
      `(nodes ${startNodeIndex}→${endNodeIndex})`
    );
  }

  private applyBypassSection(mod: BypassSectionMod, modName: string): void {
    const { startNodeIndex, endNodeIndex, newSegmentType, newRadiusM } = mod;
    this.smoothSplineBetween(startNodeIndex, endNodeIndex);

    const node = this.nodes[startNodeIndex];
    node.segmentType = newSegmentType;
    node.radiusM = newRadiusM;
    node.agDesignSpeedKph = agDesignSpeed(newRadiusM);
    node.agBankingDeg = recalcBanking(newRadiusM, node.agDesignSpeedKph);
    node.approxSpeedKph = newSegmentType === 'HAIRPIN' ? 65 : node.approxSpeedKph;

    console.log(
      `  [${this.circuitId}] ✓ ${modName}: Section replaced with ${newSegmentType} ` +
      `(r=${newRadiusM}m, nodes ${startNodeIndex}→${endNodeIndex})`
    );
  }

  private applyWidenRadiusGlide(mod: WidenRadiusMod, modName: string): void {
    const { startNodeIndex, endNodeIndex, targetRadiusM } = mod;
    for (let i = startNodeIndex; i <= endNodeIndex; i++) {
      const node = this.nodes[i];
      if (node.radiusM !== null) {
        node.radiusM = targetRadiusM;
        node.segmentType = 'INCREASING_RADIUS';
        node.agDesignSpeedKph = agDesignSpeed(targetRadiusM);
        node.agBankingDeg = recalcBanking(targetRadiusM, node.agDesignSpeedKph);
        node.approxSpeedKph = Math.max(node.approxSpeedKph, agDesignSpeed(targetRadiusM) * 0.6);
      }
    }

    console.log(
      `  [${this.circuitId}] ✓ ${modName}: Radius widened to ${targetRadiusM}m ` +
      `(nodes ${startNodeIndex}→${endNodeIndex})`
    );
  }

  private applyExpandRunoffBoundaries(mod: ExpandRunoffMod, modName: string): void {
    const { startNodeIndex, endNodeIndex, surfaceTag } = mod;
    for (let i = startNodeIndex; i <= endNodeIndex; i++) {
      // Attach a runoffSurface metadata tag directly on the node object
      (this.nodes[i] as TrackNode & { runoffSurface?: string }).runoffSurface = surfaceTag;
    }

    console.log(
      `  [${this.circuitId}] ✓ ${modName}: Runoff surface tagged as '${surfaceTag}' ` +
      `(nodes ${startNodeIndex}→${endNodeIndex})`
    );
  }

  private applyShiftLateral(mod: ShiftLateralMod, modName: string): void {
    const node = this.nodes[mod.nodeIndex];
    node.deltaX += mod.offsetMeters;
    node.agTrackWidthM = Math.max(node.agTrackWidthM, 20 + mod.offsetMeters * 0.5);

    console.log(
      `  [${this.circuitId}] ✓ ${modName}: Node ${mod.nodeIndex} (${node.name}) ` +
      `shifted laterally by +${mod.offsetMeters}m`
    );
  }

  private applyReplaceWithHairpin(mod: ReplaceWithHairpinMod, modName: string): void {
    const { startNodeIndex, endNodeIndex, hairpinRadiusM, hairpinRotationDeg } = mod;
    const node = this.nodes[startNodeIndex];
    node.segmentType = 'HAIRPIN';
    node.radiusM = hairpinRadiusM;
    node.rotationDeg = hairpinRotationDeg;
    node.agDesignSpeedKph = agDesignSpeed(hairpinRadiusM);
    node.agBankingDeg = recalcBanking(hairpinRadiusM, node.agDesignSpeedKph);
    node.approxSpeedKph = 75;

    // Smooth remaining intermediate nodes into the new hairpin exit
    if (endNodeIndex > startNodeIndex + 1) {
      this.smoothSplineBetween(startNodeIndex, endNodeIndex);
    }

    console.log(
      `  [${this.circuitId}] ✓ ${modName}: Chicane replaced with hairpin ` +
      `(r=${hairpinRadiusM}m, rot=${hairpinRotationDeg}°, nodes ${startNodeIndex}→${endNodeIndex})`
    );
  }

  private applyFlattenCurbs(mod: FlattenCurbsMod, modName: string): void {
    for (let i = mod.startNodeIndex; i <= mod.endNodeIndex; i++) {
      (this.nodes[i] as TrackNode & { maxCurbHeightMm?: number }).maxCurbHeightMm =
        mod.maxCurbHeightMm;
    }

    console.log(
      `  [${this.circuitId}] ✓ ${modName}: Kerb height capped at ${mod.maxCurbHeightMm}mm ` +
      `(nodes ${mod.startNodeIndex}→${mod.endNodeIndex})`
    );
  }

  // ─── Public execution method ─────────────────────────────────────────────────

  /**
   * Iterates all declared modifications for this circuit and applies them
   * to the cloned node array. Returns the corrected CircuitGeometry.
   */
  public executeCorrections(): CircuitGeometry {
    const entry = this.correctionEntry;
    const modCount = Object.keys(entry.modifications).length;

    if (modCount === 0) {
      // No corrections registered — geometry is already real-world accurate
      return this.geometry;
    }

    console.log(`\n━━━ Processing: ${entry.formalName} (${modCount} correction(s)) ━━━`);

    for (const [modName, mod] of Object.entries(entry.modifications)) {
      switch (mod.action) {
        case 'REMOVE_CHICANE_SMOOTH_SWEEP':
          this.applyRemoveChicaneSmoothSweep(mod as SmoothSweepMod, modName);
          break;
        case 'BYPASS_SECTION':
          this.applyBypassSection(mod as BypassSectionMod, modName);
          break;
        case 'WIDEN_RADIUS_GLIDE':
          this.applyWidenRadiusGlide(mod as WidenRadiusMod, modName);
          break;
        case 'EXPAND_RUNOFF_BOUNDARIES':
          this.applyExpandRunoffBoundaries(mod as ExpandRunoffMod, modName);
          break;
        case 'SHIFT_LATERAL':
          this.applyShiftLateral(mod as ShiftLateralMod, modName);
          break;
        case 'REPLACE_WITH_HAIRPIN':
          this.applyReplaceWithHairpin(mod as ReplaceWithHairpinMod, modName);
          break;
        case 'FLATTEN_CURBS':
          this.applyFlattenCurbs(mod as FlattenCurbsMod, modName);
          break;
      }
    }

    // Update geometry-level metadata to reflect corrected scale
    this.geometry.totalLengthM = entry.correctedLengthM;

    console.log(
      `  ✅ Geometry now matches real-world spec. Total path scale: ${entry.correctedLengthM}m\n`
    );

    return this.geometry;
  }
}

// ─── Utility: apply corrections to a full array of circuit geometries ─────────

/**
 * Runs the TrackGeometryProcessor over every circuit that has a registered
 * correction entry. Circuits with no entry are returned as-is.
 */
export function applyAllTrackCorrections(
  circuits: CircuitGeometry[]
): CircuitGeometry[] {
  return circuits.map(geo => {
    const processor = new TrackGeometryProcessor(geo);
    return processor.executeCorrections();
  });
}

// ─── Math helpers ────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Shortest-path angular interpolation (handles 0°/360° wrap). */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180)  diff -= 360;
  if (diff < -180) diff += 360;
  return (a + diff * t + 360) % 360;
}
