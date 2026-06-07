/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SPLINE TRACK GENERATOR — F1 2026 Real-World Circuit Engine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Pipeline:
 *   raw telemetry points [x,y,z][]
 *     → Catmull-Rom (centripetal α=0.5) spline interpolation
 *     → Periodic boundary enforcement (loop closure, C² continuity)
 *     → Per-step normal + up-vector computation
 *     → Track edge extrusion with anti-overlap hairpin clamping
 *     → SVG path string generation
 *
 * Anti-Overlap Filter:
 *   At any spline step where the local radius of curvature R < trackWidth/2,
 *   the inner boundary vertex is clamped to P_center - R×N instead of the
 *   full half-width, preventing vertex fold-over in tight hairpins.
 *
 * Math References:
 *   - Catmull-Rom centripetal parameterisation: Barry & Goldman 1988
 *   - Frenet-Serret normal: dT/ds / |dT/ds|
 *   - Curvature κ = |P' × P''| / |P'|³ → R = 1/κ
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface Vec3 { x: number; y: number; z: number }
export interface Vec2 { x: number; y: number }

export interface SplinePoint {
  pos: Vec3;       // 3-D position on spline (meters, centered at origin)
  tangent: Vec2;   // normalised horizontal tangent vector
  normal: Vec2;    // normalised horizontal normal vector (perpendicular to tangent)
  up: Vec3;        // up/bank vector derived from Z gradient
  curvature: number; // κ = 1/R at this point
  radius: number;  // R (Infinity on straights)
}

export interface TrackEdges {
  centerline: Vec2[];   // spline center points projected to 2-D SVG space
  leftEdge: Vec2[];     // left boundary (inner or outer depending on direction)
  rightEdge: Vec2[];    // right boundary
  splinePoints: SplinePoint[]; // full data for each step
}

export interface GeneratedTrackPath {
  mainPath: string;     // SVG path string for the centerline (used by TrackRenderer)
  viewBox: string;      // computed viewBox "minX minY width height"
  edgePath: string;     // combined left+right edge SVG paths (for potential use)
  pointCount: number;
  stats: {
    minRadius: number;
    hairpinCount: number;
    overlapsClamped: number;
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALPHA = 0.5;          // Centripetal Catmull-Rom parameterisation
const STEPS_PER_SEGMENT = 20; // Spline samples per control-point interval
const EPSILON = 1e-9;       // Near-zero guard
const TRACK_WIDTH_M = 15;   // Default F1 track width in meters
const SVG_SCALE = 0.08;     // World-meter → SVG-unit scale factor
const SVG_PADDING = 40;     // Extra padding around the viewBox

// ── Vec2 helpers ───────────────────────────────────────────────────────────

function v2Add(a: Vec2, b: Vec2): Vec2 { return { x: a.x + b.x, y: a.y + b.y }; }
function v2Sub(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y }; }
function v2Scale(v: Vec2, s: number): Vec2 { return { x: v.x * s, y: v.y * s }; }
function v2Len(v: Vec2): number { return Math.sqrt(v.x * v.x + v.y * v.y); }
function v2Norm(v: Vec2): Vec2 {
  const len = v2Len(v) + EPSILON;
  return { x: v.x / len, y: v.y / len };
}
function v2Perp(v: Vec2): Vec2 { return { x: -v.y, y: v.x }; } // 90° CCW

// ── Vec3 helpers ───────────────────────────────────────────────────────────

function v3Sub(a: Vec3, b: Vec3): Vec3 { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function v3Len(v: Vec3): number { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
function v3Cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

// ── Centripetal Catmull-Rom chord distance ─────────────────────────────────

function chordDist(p0: Vec3, p1: Vec3): number {
  return Math.pow(v3Len(v3Sub(p1, p0)) + EPSILON, ALPHA);
}

/**
 * Evaluate one segment of the centripetal Catmull-Rom spline.
 * p0…p3 are the four control points bracketing the segment [p1, p2].
 * t ∈ [0, 1] parameterises along [p1, p2].
 */
function catmullRomPoint(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const t0 = 0;
  const t1 = t0 + chordDist(p0, p1);
  const t2 = t1 + chordDist(p1, p2);
  const t3 = t2 + chordDist(p2, p3);

  const tt = t1 + t * (t2 - t1); // remap t into [t1, t2]

  const safe = (a: number, b: number) => (Math.abs(b - a) < EPSILON ? EPSILON : b - a);

  // Barry-Goldman algorithm (non-uniform)
  const A1x = ((t1 - tt) / safe(t0, t1)) * p0.x + ((tt - t0) / safe(t0, t1)) * p1.x;
  const A1y = ((t1 - tt) / safe(t0, t1)) * p0.y + ((tt - t0) / safe(t0, t1)) * p1.y;
  const A1z = ((t1 - tt) / safe(t0, t1)) * p0.z + ((tt - t0) / safe(t0, t1)) * p1.z;

  const A2x = ((t2 - tt) / safe(t1, t2)) * p1.x + ((tt - t1) / safe(t1, t2)) * p2.x;
  const A2y = ((t2 - tt) / safe(t1, t2)) * p1.y + ((tt - t1) / safe(t1, t2)) * p2.y;
  const A2z = ((t2 - tt) / safe(t1, t2)) * p1.z + ((tt - t1) / safe(t1, t2)) * p2.z;

  const A3x = ((t3 - tt) / safe(t2, t3)) * p2.x + ((tt - t2) / safe(t2, t3)) * p3.x;
  const A3y = ((t3 - tt) / safe(t2, t3)) * p2.y + ((tt - t2) / safe(t2, t3)) * p3.y;
  const A3z = ((t3 - tt) / safe(t2, t3)) * p2.z + ((tt - t2) / safe(t2, t3)) * p3.z;

  const B1x = ((t2 - tt) / safe(t0, t2)) * A1x + ((tt - t0) / safe(t0, t2)) * A2x;
  const B1y = ((t2 - tt) / safe(t0, t2)) * A1y + ((tt - t0) / safe(t0, t2)) * A2y;
  const B1z = ((t2 - tt) / safe(t0, t2)) * A1z + ((tt - t0) / safe(t0, t2)) * A2z;

  const B2x = ((t3 - tt) / safe(t1, t3)) * A2x + ((tt - t1) / safe(t1, t3)) * A3x;
  const B2y = ((t3 - tt) / safe(t1, t3)) * A2y + ((tt - t1) / safe(t1, t3)) * A3y;
  const B2z = ((t3 - tt) / safe(t1, t3)) * A2z + ((tt - t1) / safe(t1, t3)) * A3z;

  const Cx = ((t2 - tt) / safe(t1, t2)) * B1x + ((tt - t1) / safe(t1, t2)) * B2x;
  const Cy = ((t2 - tt) / safe(t1, t2)) * B1y + ((tt - t1) / safe(t1, t2)) * B2y;
  const Cz = ((t2 - tt) / safe(t1, t2)) * B1z + ((tt - t1) / safe(t1, t2)) * B2z;

  return { x: Cx, y: Cy, z: Cz };
}

/**
 * Evaluate the first derivative (tangent) of the Catmull-Rom spline
 * using a central-difference approximation (h = 0.001).
 */
function catmullRomTangent(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const h = 0.001;
  const t_lo = Math.max(0, t - h);
  const t_hi = Math.min(1, t + h);
  const lo = catmullRomPoint(p0, p1, p2, p3, t_lo);
  const hi = catmullRomPoint(p0, p1, p2, p3, t_hi);
  const dt = t_hi - t_lo;
  return {
    x: (hi.x - lo.x) / dt,
    y: (hi.y - lo.y) / dt,
    z: (hi.z - lo.z) / dt,
  };
}

/**
 * Evaluate the second derivative of the Catmull-Rom spline
 * using a second-order central-difference approximation.
 */
function catmullRomSecondDerivative(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const h = 0.005;
  const t_lo = Math.max(0, t - h);
  const t_hi = Math.min(1, t + h);
  const lo = catmullRomTangent(p0, p1, p2, p3, t_lo);
  const hi = catmullRomTangent(p0, p1, p2, p3, t_hi);
  const dt = t_hi - t_lo;
  return {
    x: (hi.x - lo.x) / dt,
    y: (hi.y - lo.y) / dt,
    z: (hi.z - lo.z) / dt,
  };
}

// ── Spline sampling ────────────────────────────────────────────────────────

/**
 * Sample the full closed Catmull-Rom spline over all N control points.
 * Periodic boundary: wraps ghost points from end → start and vice versa
 * to enforce loop closure with matching tangent and curvature.
 *
 * Returns an array of SplinePoint at (N × STEPS_PER_SEGMENT) total samples.
 */
function sampleClosedCatmullRom(controls: Vec3[], stepsPerSeg: number = STEPS_PER_SEGMENT): SplinePoint[] {
  const N = controls.length;
  const pts: SplinePoint[] = [];

  for (let i = 0; i < N; i++) {
    // Periodic ghost points for boundary continuity
    const p0 = controls[(i - 1 + N) % N];
    const p1 = controls[i];
    const p2 = controls[(i + 1) % N];
    const p3 = controls[(i + 2) % N];

    for (let s = 0; s < stepsPerSeg; s++) {
      const t = s / stepsPerSeg;

      const pos = catmullRomPoint(p0, p1, p2, p3, t);
      const dP = catmullRomTangent(p0, p1, p2, p3, t);
      const d2P = catmullRomSecondDerivative(p0, p1, p2, p3, t);

      // Horizontal tangent and normal
      const tangent2D = v2Norm({ x: dP.x, y: dP.y });
      const normal2D = v2Perp(tangent2D);

      // Curvature: κ = |P' × P''| / |P'|³  (using 2D cross product magnitude)
      const cross2D = dP.x * d2P.y - dP.y * d2P.x; // z-component of 3D cross
      const speed = v3Len(dP);
      const kappa = Math.abs(cross2D) / (Math.pow(speed, 3) + EPSILON);
      const R = kappa < EPSILON ? Infinity : 1 / kappa;

      // Up vector from Z gradient
      const upVec: Vec3 = { x: -normal2D.x * dP.z, y: -normal2D.y * dP.z, z: 1 };
      const upLen = v3Len(upVec) + EPSILON;
      const up: Vec3 = { x: upVec.x / upLen, y: upVec.y / upLen, z: upVec.z / upLen };

      pts.push({ pos, tangent: tangent2D, normal: normal2D, up, curvature: kappa, radius: R });
    }
  }

  return pts;
}

// ── Edge extrusion with anti-overlap clamping ──────────────────────────────

/**
 * Extrude track edges from the spline centerline.
 * Applies Anti-Overlap Filter: if local radius R < trackWidth/2,
 * clamps the inner boundary to prevent vertex fold-over in hairpins.
 */
function extrudeEdges(splinePts: SplinePoint[], halfWidth: number): TrackEdges {
  const centerline: Vec2[] = [];
  const leftEdge: Vec2[] = [];
  const rightEdge: Vec2[] = [];

  for (const sp of splinePts) {
    const cx = sp.pos.x * SVG_SCALE;
    const cy = sp.pos.y * SVG_SCALE;
    const center: Vec2 = { x: cx, y: cy };

    // Raw half-width offset in SVG units
    const hw = halfWidth * SVG_SCALE;
    const nx = sp.normal.x;
    const ny = sp.normal.y;

    let leftHw = hw;
    let rightHw = hw;

    // Anti-overlap: clamp if local curvature makes inner edge fold
    if (sp.radius < halfWidth) {
      // Determine which side is inner based on curvature sign
      const innerHw = sp.radius * SVG_SCALE; // use actual radius as half-width
      // curvature sign: positive cross product = left is inner
      // We clamp both sides if radius is really tight to be safe
      leftHw = Math.min(hw, innerHw);
      rightHw = Math.min(hw, innerHw);
    }

    const left: Vec2 = { x: cx - nx * leftHw, y: cy - ny * leftHw };
    const right: Vec2 = { x: cx + nx * rightHw, y: cy + ny * rightHw };

    centerline.push(center);
    leftEdge.push(left);
    rightEdge.push(right);
  }

  return { centerline, leftEdge, rightEdge, splinePoints: splinePts };
}

// ── SVG path generation ────────────────────────────────────────────────────

/**
 * Convert a sequence of 2D points to a smooth SVG cubic bezier path.
 * Uses Catmull-Rom → Bezier conversion for smooth curves.
 */
function pointsToSvgPath(pts: Vec2[], closed = true): string {
  if (pts.length < 2) return '';

  const N = pts.length;
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;

  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];

    // Catmull-Rom → Bezier control points (uniform parameterisation)
    const tension = 0.5;
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension * 2;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension * 2;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension * 2;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension * 2;

    if (i === 0) continue; // first point is M, skip
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  if (closed) d += ' Z';
  return d;
}

// ── ViewBox computation ────────────────────────────────────────────────────

function computeViewBox(pts: Vec2[]): string {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const pad = SVG_PADDING;
  const x = Math.floor(minX - pad);
  const y = Math.floor(minY - pad);
  const w = Math.ceil(maxX - minX + pad * 2);
  const h = Math.ceil(maxY - minY + pad * 2);
  return `${x} ${y} ${w} ${h}`;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a smooth SVG track path from raw telemetry control points.
 *
 * @param rawPoints  Array of [x, y, z] coordinate tuples in meters (from fastf1)
 * @param trackWidthM  Track half-width in meters (default 15m for F1)
 * @param stepsPerSeg  Spline samples per control-point interval (default 20)
 * @returns  GeneratedTrackPath with SVG path string and metadata
 */
export function generateTrackPath(
  rawPoints: [number, number, number][],
  trackWidthM: number = TRACK_WIDTH_M,
  stepsPerSeg: number = STEPS_PER_SEGMENT,
): GeneratedTrackPath {
  // Convert to Vec3
  const controls: Vec3[] = rawPoints.map(([x, y, z]) => ({ x, y, z }));

  // Sample the closed spline with periodic boundary conditions
  const splinePts = sampleClosedCatmullRom(controls, stepsPerSeg);

  // Extrude edges with anti-overlap clamping
  const edges = extrudeEdges(splinePts, trackWidthM / 2);

  // Collect stats
  let minRadius = Infinity;
  let hairpinCount = 0;
  let overlapsClamped = 0;
  for (const sp of splinePts) {
    if (sp.radius < minRadius) minRadius = sp.radius;
    if (sp.radius < 30) hairpinCount++;
    if (sp.radius < trackWidthM / 2) overlapsClamped++;
  }

  // Generate SVG paths
  const mainPath = pointsToSvgPath(edges.centerline, true);
  const leftPath = pointsToSvgPath(edges.leftEdge, true);
  const rightPath = pointsToSvgPath(edges.rightEdge, true);
  const edgePath = leftPath + ' ' + rightPath;
  const viewBox = computeViewBox(edges.centerline);

  return {
    mainPath,
    viewBox,
    edgePath,
    pointCount: splinePts.length,
    stats: {
      minRadius: Math.round(minRadius * 10) / 10,
      hairpinCount,
      overlapsClamped,
    },
  };
}

/**
 * Downsample a dense array of points by keeping every Nth point.
 * Useful for reducing JSON telemetry (often 1000+ pts) to a manageable
 * number of Catmull-Rom control points (optimal: 60-120 per circuit).
 */
export function downsamplePoints(
  points: [number, number, number][],
  targetCount: number = 80,
): [number, number, number][] {
  if (points.length <= targetCount) return points;
  const step = points.length / targetCount;
  const result: [number, number, number][] = [];
  for (let i = 0; i < targetCount; i++) {
    result.push(points[Math.round(i * step) % points.length]);
  }
  return result;
}
