#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 * generate-track-paths.mjs
 *
 * Reads JSON telemetry files from ./track_data/ and generates smooth
 * SVG path strings using the Catmull-Rom spline engine, then patches
 * the mainPath and viewBox values in trackPaths.ts.
 *
 * Usage:  node scripts/generate-track-paths.mjs
 * ═══════════════════════════════════════════════════════════════════════
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TRACK_DATA_DIR = join(ROOT, 'track_data');
const TRACK_PATHS_FILE = join(ROOT, 'frontend', 'src', 'data', 'trackPaths.ts');

// ── Inline spline engine (JS port of splineTrackGenerator.ts) ────────────
// We inline the math here so the script runs without ts-node

const ALPHA = 0.5;
const EPSILON = 1e-9;
const SVG_SCALE = 0.08;
const SVG_PADDING = 40;
const STEPS_PER_SEG = 20;
const TRACK_HALF_WIDTH = 7.5; // meters

function v3Len(v) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
function v3Sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }

function chordDist(p0, p1) {
  return Math.pow(v3Len(v3Sub(p1, p0)) + EPSILON, ALPHA);
}

function safe(a, b) { return Math.abs(b - a) < EPSILON ? EPSILON : b - a; }

function catmullPoint(p0, p1, p2, p3, t) {
  const t0 = 0, t1 = t0 + chordDist(p0, p1);
  const t2 = t1 + chordDist(p1, p2), t3 = t2 + chordDist(p2, p3);
  const tt = t1 + t * (t2 - t1);

  function lerp(va, vb, ta, tb) {
    const f = (tt - ta) / safe(ta, tb);
    return { x: va.x + (vb.x - va.x) * f, y: va.y + (vb.y - va.y) * f, z: va.z + (vb.z - va.z) * f };
  }
  function lerpR(va, vb, ta, tb) {
    const f = (tb - tt) / safe(ta, tb);
    return { x: va.x * f + vb.x * (1 - f), y: va.y * f + vb.y * (1 - f), z: va.z * f + vb.z * (1 - f) };
  }

  const A1 = { x: ((t1-tt)/safe(t0,t1))*p0.x + ((tt-t0)/safe(t0,t1))*p1.x,
               y: ((t1-tt)/safe(t0,t1))*p0.y + ((tt-t0)/safe(t0,t1))*p1.y,
               z: ((t1-tt)/safe(t0,t1))*p0.z + ((tt-t0)/safe(t0,t1))*p1.z };
  const A2 = { x: ((t2-tt)/safe(t1,t2))*p1.x + ((tt-t1)/safe(t1,t2))*p2.x,
               y: ((t2-tt)/safe(t1,t2))*p1.y + ((tt-t1)/safe(t1,t2))*p2.y,
               z: ((t2-tt)/safe(t1,t2))*p1.z + ((tt-t1)/safe(t1,t2))*p2.z };
  const A3 = { x: ((t3-tt)/safe(t2,t3))*p2.x + ((tt-t2)/safe(t2,t3))*p3.x,
               y: ((t3-tt)/safe(t2,t3))*p2.y + ((tt-t2)/safe(t2,t3))*p3.y,
               z: ((t3-tt)/safe(t2,t3))*p2.z + ((tt-t2)/safe(t2,t3))*p3.z };
  const B1 = { x: ((t2-tt)/safe(t0,t2))*A1.x + ((tt-t0)/safe(t0,t2))*A2.x,
               y: ((t2-tt)/safe(t0,t2))*A1.y + ((tt-t0)/safe(t0,t2))*A2.y,
               z: ((t2-tt)/safe(t0,t2))*A1.z + ((tt-t0)/safe(t0,t2))*A2.z };
  const B2 = { x: ((t3-tt)/safe(t1,t3))*A2.x + ((tt-t1)/safe(t1,t3))*A3.x,
               y: ((t3-tt)/safe(t1,t3))*A2.y + ((tt-t1)/safe(t1,t3))*A3.y,
               z: ((t3-tt)/safe(t1,t3))*A2.z + ((tt-t1)/safe(t1,t3))*A3.z };
  return {
    x: ((t2-tt)/safe(t1,t2))*B1.x + ((tt-t1)/safe(t1,t2))*B2.x,
    y: ((t2-tt)/safe(t1,t2))*B1.y + ((tt-t1)/safe(t1,t2))*B2.y,
    z: ((t2-tt)/safe(t1,t2))*B1.z + ((tt-t1)/safe(t1,t2))*B2.z,
  };
}

function catmullTangent(p0, p1, p2, p3, t) {
  const h = 0.001, tLo = Math.max(0, t - h), tHi = Math.min(1, t + h);
  const lo = catmullPoint(p0, p1, p2, p3, tLo);
  const hi = catmullPoint(p0, p1, p2, p3, tHi);
  const dt = tHi - tLo;
  return { x: (hi.x - lo.x) / dt, y: (hi.y - lo.y) / dt, z: (hi.z - lo.z) / dt };
}

function catmullD2(p0, p1, p2, p3, t) {
  const h = 0.005, tLo = Math.max(0, t - h), tHi = Math.min(1, t + h);
  const lo = catmullTangent(p0, p1, p2, p3, tLo);
  const hi = catmullTangent(p0, p1, p2, p3, tHi);
  const dt = tHi - tLo;
  return { x: (hi.x - lo.x) / dt, y: (hi.y - lo.y) / dt, z: (hi.z - lo.z) / dt };
}

function sampleSpline(controls) {
  const N = controls.length;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const p0 = controls[(i - 1 + N) % N];
    const p1 = controls[i];
    const p2 = controls[(i + 1) % N];
    const p3 = controls[(i + 2) % N];
    for (let s = 0; s < STEPS_PER_SEG; s++) {
      const t = s / STEPS_PER_SEG;
      const pos = catmullPoint(p0, p1, p2, p3, t);
      const dP = catmullTangent(p0, p1, p2, p3, t);
      const d2P = catmullD2(p0, p1, p2, p3, t);
      const tLen = Math.sqrt(dP.x * dP.x + dP.y * dP.y) + EPSILON;
      const tx = dP.x / tLen, ty = dP.y / tLen;
      const nx = -ty, ny = tx;
      const cross = dP.x * d2P.y - dP.y * d2P.x;
      const speed = Math.sqrt(dP.x*dP.x + dP.y*dP.y + dP.z*dP.z);
      const kappa = Math.abs(cross) / (Math.pow(speed, 3) + EPSILON);
      const R = kappa < EPSILON ? Infinity : 1 / kappa;
      pts.push({ pos, nx, ny, R });
    }
  }
  return pts;
}

function extrudeCenterline(splinePts, halfWidthM) {
  const centerline = [];
  const overlapsClamped = [];
  for (const sp of splinePts) {
    let hw = halfWidthM;
    if (sp.R < halfWidthM) {
      hw = Math.max(sp.R * 0.9, 1); // clamp inner boundary
      overlapsClamped.push(sp.R);
    }
    centerline.push({ x: sp.pos.x * SVG_SCALE, y: sp.pos.y * SVG_SCALE });
  }
  return { centerline, overlapsClamped };
}

function downsample(points, targetCount = 80) {
  if (points.length <= targetCount) return points;
  const step = points.length / targetCount;
  const result = [];
  for (let i = 0; i < targetCount; i++) {
    result.push(points[Math.round(i * step) % points.length]);
  }
  return result;
}

function pointsToSvgPath(pts) {
  if (pts.length < 2) return '';
  const N = pts.length;
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d + ' Z';
}

function computeViewBox(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  const pad = SVG_PADDING;
  return `${Math.floor(minX-pad)} ${Math.floor(minY-pad)} ${Math.ceil(maxX-minX+pad*2)} ${Math.ceil(maxY-minY+pad*2)}`;
}

function processJsonFile(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const rawPts = data.points;
  
  // Downsample to ~80 control points for stable spline
  const downsampled = downsample(rawPts, 80);
  const controls = downsampled.map(([x, y, z]) => ({ x, y, z }));
  
  // Sample spline with periodic boundary conditions
  const splinePts = sampleSpline(controls);
  
  // Extract centerline with anti-overlap protection
  const { centerline, overlapsClamped } = extrudeCenterline(splinePts, TRACK_HALF_WIDTH);
  
  // Generate SVG
  const mainPath = pointsToSvgPath(centerline);
  const viewBox = computeViewBox(centerline);
  
  return {
    trackId: data.trackId,
    mainPath,
    viewBox,
    stats: {
      controlPoints: controls.length,
      splinePoints: splinePts.length,
      overlapsClamped: overlapsClamped.length,
      sourceYear: data.sourceYear,
    }
  };
}

// ── Patch trackPaths.ts ───────────────────────────────────────────────────

function patchTrackPathsFile(results) {
  let src = readFileSync(TRACK_PATHS_FILE, 'utf-8');
  
  let patchCount = 0;
  for (const r of results) {
    const tid = r.trackId;
    
    // Patch mainPath: find the mainPath: `...` string for this trackId
    // Strategy: locate the trackId string, then find the next mainPath: `...`,
    // and replace it with the new spline-generated path.
    
    // We'll use a regex that captures the specific trackId's mainPath block
    // Pattern: trackId: 'TID', (anything), mainPath: `OLD_PATH`
    const escapedPath = r.mainPath.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    
    // Find the constant name by looking for trackId: 'tid' then the mainPath
    // We search block by block between const declarations
    const blockPattern = new RegExp(
      `(trackId:\\s*'${tid}'[^]*?mainPath:\\s*\`)([^]*?)(\`[^]*?(?=const |export const ALL_TRACK_PATHS|$))`,
      's'
    );
    
    if (blockPattern.test(src)) {
      src = src.replace(blockPattern, (match, pre, _oldPath, post) => {
        return `${pre}${r.mainPath}${post}`;
      });
      patchCount++;
      console.log(`  ✓ Patched ${tid} mainPath (${r.stats.overlapsClamped} overlaps clamped)`);
    } else {
      console.log(`  ⚠ Could not find mainPath block for ${tid}`);
    }
    
    // Patch viewBox
    const vbPattern = new RegExp(
      `(trackId:\\s*'${tid}'[^]*?viewBox:\\s*')([^']*)(')`,
      's'
    );
    if (vbPattern.test(src)) {
      src = src.replace(vbPattern, (match, pre, _oldVb, post) => `${pre}${r.viewBox}${post}`);
    }
  }
  
  if (patchCount > 0) {
    writeFileSync(TRACK_PATHS_FILE, src, 'utf-8');
    console.log(`\n✅ trackPaths.ts patched with ${patchCount} spline-generated paths`);
  } else {
    console.log('\n⚠ No patches applied to trackPaths.ts');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60));
  console.log('F1 Track Path Generator — Catmull-Rom Spline Engine');
  console.log('═'.repeat(60));

  if (!existsSync(TRACK_DATA_DIR)) {
    console.error(`\n✗ track_data/ directory not found at: ${TRACK_DATA_DIR}`);
    console.error('  Run track_data_extractor.py first to generate telemetry JSON files.');
    process.exit(1);
  }

  const jsonFiles = readdirSync(TRACK_DATA_DIR).filter(f => f.endsWith('.json'));
  
  if (jsonFiles.length === 0) {
    console.error('\n✗ No JSON files found in track_data/');
    console.error('  Run track_data_extractor.py first.');
    process.exit(1);
  }

  console.log(`\nFound ${jsonFiles.length} telemetry JSON files`);
  console.log();

  const results = [];
  for (const file of jsonFiles) {
    const filePath = join(TRACK_DATA_DIR, file);
    try {
      const result = processJsonFile(filePath);
      results.push(result);
      console.log(`✓ ${result.trackId}: ${result.stats.splinePoints} pts, viewBox=${result.viewBox}`);
      if (result.stats.overlapsClamped > 0) {
        console.log(`  └─ Anti-overlap: ${result.stats.overlapsClamped} hairpin vertices clamped`);
      }
    } catch (err) {
      console.error(`✗ Failed to process ${file}: ${err.message}`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('Patching trackPaths.ts...');
  console.log('─'.repeat(60));
  
  patchTrackPathsFile(results);

  console.log('\n' + '═'.repeat(60));
  console.log(`Complete: ${results.length} tracks processed`);
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
