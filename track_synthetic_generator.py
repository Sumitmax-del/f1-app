#!/usr/bin/env python3
"""
F1 Synthetic Track Coordinate Generator (Fallback)
====================================================
Generates mathematically accurate track coordinate JSON files
from the real-world segment specifications in trackGeometry.ts.

This is the fallback when fastf1 telemetry is unavailable.
Uses heading, arc length, and radius data from the geometry nodes
to construct accurate X,Y,Z centerline coordinate arrays.

Accuracy note: These are engineering-quality approximations based
on the FIA circuit documentation data encoded in trackGeometry.ts.
"""

import json
import math
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'track_data')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Geometry data (from trackGeometry.ts) ────────────────────────────────────
# Format: (name, heading_deg, arc_m, radius_m_or_None, rotation_deg, dz_m)
# rotation_deg: signed, positive=right, negative=left
# heading_deg: absolute heading at segment start, 0=north, clockwise

CIRCUITS = {
    'albert_park': {
        'totalLengthM': 5278,
        'direction': 'clockwise',
        'nodes': [
            # (arc_m, radius_m, rotation_deg, dz_m)
            (690,  None,  0,    0),    # Main straight
            (95,   110,   68,   0),    # T1 Jones
            (60,   90,    -42,  0),    # T2 Brabham
            (160,  None,  0,    0),    # Straight
            (280,  260,   78,   0),    # T3 sweeper
            (180,  140,   38,   0),    # T4-5
            (110,  35,    110,  0.5),  # T6 hairpin
            (220,  None,  0,    -0.3), # Straight
            (120,  80,    -15,  0),    # Chicane
            (250,  320,   55,   0),    # T9
            (190,  280,   -48,  0),    # T10
            (160,  60,    35,   0),    # T11-12
            (200,  150,   -65,  0),    # T13
            (140,  200,   52,   0.2),  # T14
            (400,  None,  0,    0),    # Final straight
        ]
    },
    'bahrain': {
        'totalLengthM': 5412,
        'direction': 'clockwise',
        'nodes': [
            (650,  None, 0,    0),
            (100,  50,   90,   0),
            (60,   45,   -80,  0),
            (55,   40,   90,   0),
            (95,   30,   120,  0),
            (280,  None, 0,    0),
            (200,  80,   -55,  0),
            (400,  None, 0,    0),
            (90,   55,   -70,  0),
            (250,  90,   85,   0),
            (580,  None, 0,    0),
            (100,  80,   -65,  0),
            (180,  70,   50,   0),
            (130,  100,  -50,  0),
            (140,  120,  65,   0),
        ]
    },
    'jeddah': {
        'totalLengthM': 6174,
        'direction': 'anti-clockwise',
        'nodes': [
            (700,  None, 0,    0),
            (80,   200,  55,   0),
            (220,  120,  -65,  1),
            (180,  None, 0,    0),
            (460,  90,   110,  2),
            (280,  None, 0,    -0.5),
            (550,  140,  -80,  3),
            (120,  180,  -50,  -1),
            (350,  None, 0,    -1),
            (680,  100,  95,   3),
            (450,  80,   -75,  -2),
            (380,  110,  55,   -1.5),
            (320,  None, 0,    0),
        ]
    },
    'miami': {
        'totalLengthM': 5412,
        'direction': 'anti-clockwise',
        'nodes': [
            (650,  None, 0,    0),
            (110,  130,  72,   0),
            (100,  120,  -55,  0),
            (90,   90,   68,   0),
            (320,  None, 0,    0),
            (140,  55,   -28,  0),
            (280,  100,  65,   0),
            (380,  None, 0,    0),
            (90,   75,   55,   0),
            (200,  110,  -48,  0),
            (100,  25,   160,  0),
            (250,  None, 0,    0),
            (350,  90,   75,   0),
            (480,  None, 0,    0),
        ]
    },
    'monaco': {
        'totalLengthM': 3337,
        'direction': 'clockwise',
        'nodes': [
            (300,  None, 0,    0),
            (80,   35,   80,   3),
            (370,  None, 0,    30),
            (180,  50,   -75,  -5),
            (70,   45,   60,   -4),
            (50,   10,   180,  -3),
            (65,   60,   50,   -1),
            (280,  None, 0,    -8),
            (100,  30,   -40,  0),
            (90,   55,   58,   0),
            (180,  35,   -55,  0),
            (75,   25,   72,   0),
            (60,   30,   50,   1),
            (170,  None, 0,    -2),
        ]
    },
    'silverstone': {
        'totalLengthM': 5891,
        'direction': 'clockwise',
        'nodes': [
            (770,  None, 0,    0),
            (140,  180,  68,   0),
            (80,   120,  -40,  0),
            (110,  90,   72,   0.5),
            (200,  100,  -65,  0),
            (130,  130,  55,   -1),
            (140,  90,   68,   0),
            (150,  200,  42,   0),
            (160,  440,  32,   0),
            (100,  250,  -35,  0.5),
            (110,  200,  45,   -0.5),
            (80,   280,  -28,  0),
            (770,  None, 0,    0),
            (100,  160,  60,   0),
            (120,  75,   -55,  -0.5),
            (180,  65,   80,   0.5),
            (350,  None, 0,    0),
        ]
    },
    'spa': {
        'totalLengthM': 7004,
        'direction': 'clockwise',
        'nodes': [
            (250,  None, 0,    -3),
            (100,  18,   180,  -5),
            (300,  None, 0,    -40),
            (180,  60,   -42,  41),
            (120,  100,  52,   30),
            (800,  None, 0,    5),
            (200,  55,   68,   -8),
            (100,  30,   120,  -10),
            (350,  None, 0,    -5),
            (350,  120,  82,   -3),
            (200,  50,   -35,  8),
            (320,  90,   65,   10),
            (280,  280,  -35,  -12),
            (200,  35,   55,   -5),
            (280,  None, 0,    -3),
        ]
    },
    'monza': {
        'totalLengthM': 5793,
        'direction': 'clockwise',
        'nodes': [
            (1100, None, 0,    0),
            (210,  35,   50,   0),
            (380,  None, 0,    0),
            (300,  400,  35,   0),
            (180,  30,   -45,  0),
            (180,  100,  60,   0),
            (180,  None, 0,    -0.5),
            (160,  90,   52,   -1),
            (480,  None, 0,    0),
            (260,  50,   -55,  0),
            (620,  None, 0,    0),
            (430,  180,  85,   0.5),
            (280,  None, 0,    1),
        ]
    },
    'suzuka': {
        'totalLengthM': 5807,
        'direction': 'clockwise',
        'nodes': [
            (400,  None, 0,    0),
            (120,  120,  85,   1),
            (100,  95,   -90,  2),
            (580,  85,   105,  5),
            (160,  150,  55,   -2),
            (100,  60,   68,   -3),
            (90,   50,   60,   -1),
            (350,  None, 0,    -2),
            (110,  20,   170,  0),
            (320,  None, 0,    3),
            (400,  100,  100,  4),
            (700,  None, 0,    -3),
            (190,  85,   42,   -5),
            (180,  40,   -70,  -1),
            (140,  180,  -45,  0.5),
        ]
    },
    'baku': {
        'totalLengthM': 6003,
        'direction': 'anti-clockwise',
        'nodes': [
            (2200, None, 0,    0),
            (100,  60,   90,   0),
            (80,   50,   -82,  2),
            (90,   70,   58,   3),
            (250,  None, 0,    4),
            (380,  30,   -110, 6),
            (80,   35,   -90,  2),
            (220,  None, 0,    -3),
            (200,  50,   65,   -4),
            (180,  80,   -50,  -2),
            (120,  120,  55,   0),
            (300,  None, 0,    0),
            (100,  30,   92,   -2),
            (350,  70,   -75,  -4),
            (350,  None, 0,    0),
        ]
    },
    'marina_bay': {
        'totalLengthM': 4940,
        'direction': 'anti-clockwise',
        'nodes': [
            (280,  None, 0,    0),
            (90,   55,   -80,  0),
            (75,   50,   -55,  0),
            (80,   60,   60,   0),
            (530,  None, 0,    0),
            (90,   45,   -90,  0),
            (380,  None, 0,    0),
            (80,   40,   90,   0),
            (320,  55,   -65,  0),
            (280,  70,   55,   0),
            (90,   50,   -75,  0),
            (250,  60,   68,   0),
            (200,  45,   -55,  0),
            (250,  None, 0,    0),
            (350,  65,   80,   0),
            (200,  None, 0,    0),
        ]
    },
    'americas': {
        'totalLengthM': 5513,
        'direction': 'anti-clockwise',
        'nodes': [
            (800,  None, 0,    0),
            (110,  52,   -90,  11),
            (180,  150,  80,   5),
            (320,  100,  -60,  -3),
            (150,  60,   55,   0),
            (200,  None, 0,    -2),
            (180,  75,   -80,  -4),
            (140,  None, 0,    3),
            (200,  120,  65,   5),
            (350,  None, 0,    2),
            (120,  80,   -55,  0),
            (140,  65,   68,   2),
            (300,  None, 0,    -3),
            (200,  90,   -55,  0),
            (450,  None, 0,    -5),
        ]
    },
    'red_bull_ring': {
        'totalLengthM': 4318,
        'direction': 'clockwise',
        'nodes': [
            (750,  None, 0,    0),
            (110,  50,   85,   12),
            (260,  None, 0,    15),
            (90,   75,   55,   8),
            (320,  None, 0,    18),
            (80,   140,  42,   5),
            (100,  230,  -35,  -8),
            (180,  None, 0,    -12),
            (200,  80,   50,   -9),
            (130,  100,  -65,  -6),
            (230,  None, 0,    -3),
            (90,   60,   55,   2),
            (110,  140,  40,   -5),
            (100,  50,   60,   -3),
            (250,  None, 0,    -4),
        ]
    },
    'hungaroring': {
        'totalLengthM': 4381,
        'direction': 'clockwise',
        'nodes': [
            (590,  None, 0,    -5),
            (120,  65,   90,   -3),
            (280,  110,  -100, 4),
            (80,   55,   55,   -2),
            (90,   35,   95,   0),
            (180,  None, 0,    -2),
            (80,   90,   -42,  0),
            (100,  70,   55,   1),
            (80,   65,   -42,  0),
            (200,  None, 0,    -1),
            (180,  80,   55,   2),
            (200,  90,   -48,  3),
            (100,  80,   50,   -1),
            (160,  55,   -55,  -2),
            (250,  None, 0,    5),
        ]
    },
    'zandvoort': {
        'totalLengthM': 4259,
        'direction': 'clockwise',
        'nodes': [
            (550,  None, 0,    0),
            (130,  55,   90,   0),
            (100,  120,  -40,  -1),
            (120,  80,   75,   -2),
            (280,  None, 0,    0.5),
            (200,  100,  45,   1),
            (220,  None, 0,    0),
            (100,  180,  -35,  -1.5),
            (80,   120,  38,   0),
            (280,  None, 0,    0),
            (90,   80,   48,   0),
            (240,  70,   65,   1.5),
            (80,   100,  -40,  0),
            (160,  70,   90,   0),
            (250,  None, 0,    0),
        ]
    },
    'interlagos': {
        'totalLengthM': 4309,
        'direction': 'anti-clockwise',
        'nodes': [
            (250,  None, 0,    0),
            (120,  60,   -90,  5),
            (200,  None, 0,    10),
            (180,  150,  80,   -5),
            (100,  40,   -60,  -3),
            (350,  None, 0,    -2),
            (130,  100,  55,   0),
            (180,  200,  40,   3),
            (250,  None, 0,    5),
            (160,  80,   -45,  -3),
            (200,  None, 0,    -8),
            (120,  55,   60,   -5),
            (140,  70,   -65,  -3),
            (250,  None, 0,    0),
            (400,  80,   55,   -2),
        ]
    },
    'rodriguez': {
        'totalLengthM': 4304,
        'direction': 'clockwise',
        'nodes': [
            (700,  None, 0,    0),
            (120,  90,   55,   0),
            (80,   70,   -48,  0),
            (350,  None, 0,    0),
            (140,  45,   70,   0),
            (250,  None, 0,    0),
            (100,  85,   -55,  0),
            (180,  None, 0,    0),
            (90,   60,   60,   0),
            (90,   65,   -45,  0),
            (380,  None, 0,    0),
            (130,  70,   55,   0),
            (200,  90,   -45,  0),
            (180,  None, 0,    0),
            (300,  65,   -75,  0),
        ]
    },
    'las_vegas': {
        'totalLengthM': 6201,
        'direction': 'anti-clockwise',
        'nodes': [
            (1400, None, 0,    0),
            (110,  55,   -90,  0),
            (380,  None, 0,    0),
            (100,  65,   -75,  0),
            (150,  None, 0,    0),
            (90,   60,   90,   0),
            (900,  None, 0,    0),
            (100,  70,   -90,  0),
            (300,  None, 0,    0),
            (90,   80,   -90,  0),
            (800,  None, 0,    0),
            (100,  65,   -90,  0),
            (300,  None, 0,    0),
            (90,   70,   90,   0),
            (600,  None, 0,    0),
        ]
    },
    'lusail': {
        'totalLengthM': 5419,
        'direction': 'clockwise',
        'nodes': [
            (900,  None, 0,    0),
            (120,  90,   65,   0),
            (200,  200,  40,   0),
            (150,  None, 0,    0),
            (100,  80,   55,   0),
            (80,   60,   -48,  0),
            (300,  None, 0,    0),
            (180,  100,  75,   0),
            (120,  150,  -50,  0),
            (500,  None, 0,    0),
            (130,  70,   55,   0),
            (200,  120,  45,   0),
            (350,  None, 0,    0),
            (120,  80,   60,   0),
            (400,  None, 0,    0),
        ]
    },
    'yas_marina': {
        'totalLengthM': 5281,
        'direction': 'anti-clockwise',
        'nodes': [
            (800,  None, 0,    0),
            (100,  100,  75,   0),
            (80,   80,   -55,  0),
            (250,  None, 0,    0),
            (90,   70,   60,   0),
            (280,  None, 0,    0),
            (100,  18,   180,  0),
            (400,  None, 0,    0),
            (100,  45,   120,  0),
            (650,  None, 0,    0),
            (120,  90,   -65,  0),
            (200,  70,   55,   0),
            (180,  None, 0,    0),
            (90,   60,   60,   0),
            (350,  None, 0,    0),
        ]
    },
    'villeneuve': {
        'totalLengthM': 4361,
        'direction': 'clockwise',
        'nodes': [
            (450,  None, 0,    0),
            (100,  80,   62,   0),
            (80,   70,   -55,  0),
            (150,  35,   65,   0),
            (320,  None, 0,    0),
            (140,  40,   -30,  0),
            (380,  None, 0,    0),
            (130,  200,  48,   0),
            (280,  None, 0,    0),
            (140,  35,   55,   0),
            (90,   20,   168,  0),
            (400,  None, 0,    0),
            (130,  40,   -45,  0),
            (80,   80,   60,   0),
            (200,  None, 0,    0),
        ]
    },
    'imola': {
        'totalLengthM': 4909,
        'direction': 'anti-clockwise',
        'nodes': [
            (430,  None, 0,    0),
            (280,  200,  -40,  0),
            (180,  40,   35,   1),
            (140,  45,   100,  2),
            (350,  None, 0,    3),
            (120,  120,  -58,  -1),
            (220,  60,   85,   -4),
            (160,  50,   -50,  2),
            (150,  80,   55,   -2),
            (130,  90,   52,   -1),
            (350,  None, 0,    0.5),
        ]
    },
    'catalunya': {
        'totalLengthM': 4657,
        'direction': 'clockwise',
        'nodes': [
            (610,  None, 0,    1),
            (100,  120,  78,   0),
            (80,   95,   -55,  -1),
            (380,  150,  92,   -2),
            (70,   70,   -48,  0),
            (140,  45,   60,   0),
            (400,  None, 0,    -1),
            (200,  90,   -55,  0),
            (120,  110,  58,   -1),
            (100,  240,  30,   0),
            (300,  None, 0,    1),
            (130,  55,   -35,  0),
            (280,  80,   70,   0.5),
            (320,  None, 0,    1.5),
        ]
    },
    'madrid': {
        'totalLengthM': 5473,
        'direction': 'clockwise',
        'nodes': [
            (750,  None, 0,    0),
            (120,  80,   75,   0),
            (100,  65,   -58,  0),
            (250,  None, 0,    0),
            (130,  90,   65,   0),
            (200,  None, 0,    0),
            (110,  60,   -70,  0),
            (350,  None, 0,    0),
            (100,  55,   80,   0),
            (180,  None, 0,    0),
            (90,   70,   -55,  0),
            (300,  None, 0,    0),
            (120,  75,   60,   0),
            (200,  None, 0,    0),
            (150,  80,   -65,  0),
        ]
    },
}

# ── Path integration engine ───────────────────────────────────────────────────

def deg2rad(d):
    return d * math.pi / 180.0

def integrate_path(nodes, total_length_m, direction='clockwise'):
    """
    Integrate track heading and arcs to produce X,Y,Z coordinate arrays.
    Uses Euler integration along the centerline.
    """
    sign = 1 if direction == 'clockwise' else -1
    
    # Start heading (pointing North = 0°, increasing clockwise)
    heading_rad = 0.0  # Start pointing up (north)
    
    x, y, z = 0.0, 0.0, 0.0
    points = [(x, y, z)]
    
    for (arc_m, radius_m, rotation_deg, dz_m) in nodes:
        if radius_m is None:
            # Straight segment: walk along current heading
            steps = max(4, int(arc_m / 20))
            dx_step = math.sin(heading_rad) * (arc_m / steps)
            dy_step = math.cos(heading_rad) * (arc_m / steps)
            dz_step = dz_m / steps
            
            for _ in range(steps):
                x += dx_step
                y += dy_step
                z += dz_step
                points.append((x, y, z))
        else:
            # Curved segment: integrate along circular arc
            # rotation_deg = total heading change (signed)
            total_angle_rad = deg2rad(abs(rotation_deg)) * sign * (1 if rotation_deg > 0 else -1)
            steps = max(8, int(abs(rotation_deg) / 5))
            angle_per_step = total_angle_rad / steps
            arc_per_step = arc_m / steps
            dz_per_step = dz_m / steps
            
            for _ in range(steps):
                # Move forward a bit
                dx = math.sin(heading_rad) * arc_per_step
                dy = math.cos(heading_rad) * arc_per_step
                x += dx
                y += dy
                z += dz_per_step
                heading_rad += angle_per_step
                points.append((x, y, z))
    
    # Close the loop by interpolating back to origin
    if len(points) > 0:
        last = points[-1]
        close_steps = 5
        for i in range(1, close_steps + 1):
            t = i / close_steps
            cx = last[0] * (1 - t) + 0 * t
            cy = last[1] * (1 - t) + 0 * t
            cz = last[2] * (1 - t) + 0 * t
            points.append((cx, cy, cz))
    
    return points


def center_points(points):
    """Center around centroid."""
    if not points:
        return []
    cx = sum(p[0] for p in points) / len(points)
    cy = sum(p[1] for p in points) / len(points)
    cz = sum(p[2] for p in points) / len(points)
    return [(p[0]-cx, p[1]-cy, p[2]-cz) for p in points]


def filter_near_duplicates(points, min_dist=0.5):
    """Remove points that are too close together."""
    if not points:
        return []
    clean = [points[0]]
    for p in points[1:]:
        dist = math.sqrt((p[0]-clean[-1][0])**2 + (p[1]-clean[-1][1])**2)
        if dist >= min_dist:
            clean.append(p)
    return clean


def main():
    print("=" * 60)
    print("F1 Synthetic Track Coordinate Generator")
    print("=" * 60)
    
    success = 0
    for track_id, circuit_data in CIRCUITS.items():
        output_path = os.path.join(OUTPUT_DIR, f"{track_id}.json")
        
        # Skip if already generated by fastf1
        if os.path.exists(output_path):
            with open(output_path) as f:
                existing = json.load(f)
            if existing.get('sourceYear'):
                print(f"  ⟲ {track_id}: Already have fastf1 data (year {existing['sourceYear']}), skipping")
                success += 1
                continue
        
        points = integrate_path(
            circuit_data['nodes'],
            circuit_data['totalLengthM'],
            circuit_data['direction'],
        )
        
        points = center_points(points)
        points = filter_near_duplicates(points, min_dist=0.5)
        
        # Round to 2 decimal places
        points_rounded = [[round(p, 2) for p in pt] for pt in points]
        
        output = {
            "trackId": track_id,
            "sourceYear": None,
            "sourceEvent": "Synthetic (trackGeometry.ts nodes)",
            "pointCount": len(points_rounded),
            "points": points_rounded
        }
        
        with open(output_path, 'w') as f:
            json.dump(output, f, separators=(',', ':'))
        
        print(f"  ✓ {track_id}: {len(points_rounded)} synthetic points → {os.path.basename(output_path)}")
        success += 1
    
    print(f"\n✅ Generated {success}/{len(CIRCUITS)} circuit JSON files")
    print(f"   Output directory: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()
