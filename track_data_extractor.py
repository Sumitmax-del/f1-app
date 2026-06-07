#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
F1 2026 Track Telemetry Extractor (using fastf1)
==================================================
Uses fastf1 to extract X,Y,Z coordinates of the fastest lap
for all available F1 circuits. Falls back to 2024/2025 if 2026 data
is not yet available.

Run from the f1env virtual environment:
  f1env\Scripts\python.exe track_data_extractor.py

Output: ./track_data/<circuit_id>.json
Format: {"trackId": "...", "sourceYear": YEAR, "points": [[x, y, z], ...]}
"""

import os
import sys
import json
import math
import warnings
warnings.filterwarnings('ignore')

print(f"Python: {sys.version}")
print(f"Path:   {sys.executable}")
print()

try:
    import fastf1
    print(f"fastf1 version: {fastf1.__version__}")
except ImportError as e:
    print(f"ERROR: Could not import fastf1: {e}")
    print("Make sure you're running inside the f1env virtual environment:")
    print("  f1env\\Scripts\\python.exe track_data_extractor.py")
    sys.exit(1)

import numpy as np

# ── Configuration ─────────────────────────────────────────────────────────────

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'track_data')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Enable fastf1 cache
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.fastf1_cache')
os.makedirs(CACHE_DIR, exist_ok=True)
fastf1.Cache.enable_cache(CACHE_DIR)

# ── 2026 Calendar ─────────────────────────────────────────────────────────────
# Format: (event_name_in_fastf1, our_track_id, fallback_years)
CIRCUITS = [
    ('Australian Grand Prix',      'albert_park',   [2025, 2024, 2023]),
    ('Chinese Grand Prix',         'shanghai',      [2025, 2024, 2024]),
    ('Japanese Grand Prix',        'suzuka',        [2025, 2024, 2023]),
    ('Bahrain Grand Prix',         'bahrain',       [2025, 2024, 2023]),
    ('Saudi Arabian Grand Prix',   'jeddah',        [2025, 2024, 2023]),
    ('Miami Grand Prix',           'miami',         [2025, 2024, 2023]),
    ('Emilia Romagna Grand Prix',  'imola',         [2024, 2022, 2020]),
    ('Monaco Grand Prix',          'monaco',        [2025, 2024, 2023]),
    ('Spanish Grand Prix',         'catalunya',     [2025, 2024, 2023]),
    ('Canadian Grand Prix',        'villeneuve',    [2025, 2024, 2023]),
    ('Austrian Grand Prix',        'red_bull_ring', [2025, 2024, 2023]),
    ('British Grand Prix',         'silverstone',   [2025, 2024, 2023]),
    ('Belgian Grand Prix',         'spa',           [2025, 2024, 2023]),
    ('Hungarian Grand Prix',       'hungaroring',   [2025, 2024, 2023]),
    ('Dutch Grand Prix',           'zandvoort',     [2025, 2024, 2023]),
    ('Italian Grand Prix',         'monza',         [2025, 2024, 2023]),
    ('Azerbaijan Grand Prix',      'baku',          [2025, 2024, 2023]),
    ('Singapore Grand Prix',       'marina_bay',    [2025, 2024, 2023]),
    ('United States Grand Prix',   'americas',      [2025, 2024, 2023]),
    ('Mexico City Grand Prix',     'rodriguez',     [2025, 2024, 2023]),
    ('S\u00e3o Paulo Grand Prix',       'interlagos',    [2025, 2024, 2023]),
    ('Las Vegas Grand Prix',       'las_vegas',     [2025, 2024, 2023]),
    ('Qatar Grand Prix',           'lusail',        [2025, 2024, 2023]),
    ('Abu Dhabi Grand Prix',       'yas_marina',    [2025, 2024, 2023]),
]

# ── Geometry helpers ──────────────────────────────────────────────────────────

def filter_and_clean_points(x_arr, y_arr, z_arr, min_dist_m=0.8):
    """
    1. Drop NaN values
    2. Remove near-duplicate points (< min_dist_m apart)
    3. Center around centroid origin
    Returns list of [x, y, z] in meters.
    """
    pts = np.column_stack([
        np.asarray(x_arr, dtype=float),
        np.asarray(y_arr, dtype=float),
        np.asarray(z_arr, dtype=float),
    ])
    # Drop NaN rows
    mask = ~np.isnan(pts).any(axis=1)
    pts = pts[mask]
    if len(pts) < 10:
        return None

    # Remove near-duplicate points
    clean = [pts[0]]
    for p in pts[1:]:
        dist = math.hypot(float(p[0]) - float(clean[-1][0]),
                          float(p[1]) - float(clean[-1][1]))
        if dist >= min_dist_m:
            clean.append(p)
    clean = np.array(clean)

    # Center around centroid
    cx, cy, cz = clean[:, 0].mean(), clean[:, 1].mean(), clean[:, 2].mean()
    clean[:, 0] -= cx
    clean[:, 1] -= cy
    clean[:, 2] -= cz

    return clean.tolist()


def try_load_session(event_name, year, session_type='Q'):
    """Try to load a fastf1 session; return None on failure."""
    try:
        session = fastf1.get_session(year, event_name, session_type)
        session.load(telemetry=True, laps=True, weather=False, messages=False)
        return session
    except Exception as e:
        print(f"      [{session_type}] {year}: {type(e).__name__}: {e}")
        return None


def get_telemetry(event_name, fallback_years):
    """
    Try to get the fastest lap telemetry. Tries 2026 first, then fallbacks.
    For each year tries Qualifying first, then Race.
    Returns (x, y, z arrays, year_used) or (None, None, None, None).
    """
    all_years = [2026] + list(fallback_years)

    for year in all_years:
        print(f"    Trying {year}...")
        
        # Try Qualifying first (cleaner single lap)
        for stype in ['Q', 'R']:
            session = try_load_session(event_name, year, stype)
            if session is None:
                continue

            try:
                fastest = session.laps.pick_fastest()
                if fastest is None or fastest.empty:
                    print(f"      [{stype}] {year}: No fastest lap found")
                    continue

                tel = fastest.get_telemetry()
                if tel is None or len(tel) < 50:
                    print(f"      [{stype}] {year}: Telemetry too short ({len(tel) if tel is not None else 0} pts)")
                    continue

                # Check required columns
                if 'X' not in tel.columns or 'Y' not in tel.columns:
                    print(f"      [{stype}] {year}: Missing X/Y columns")
                    continue

                x = tel['X'].values
                y = tel['Y'].values
                z = tel['Z'].values if 'Z' in tel.columns else np.zeros(len(x))

                print(f"      [{stype}] {year}: ✓ Got {len(x)} telemetry points")
                return x, y, z, year

            except Exception as e:
                print(f"      [{stype}] {year}: Error extracting telemetry: {type(e).__name__}: {e}")
                continue

    return None, None, None, None

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("F1 Track Telemetry Extractor — fastf1")
    print("=" * 60)

    success_count = 0
    failed = []

    for event_name, track_id, fallback_years in CIRCUITS:
        print(f"\n> {track_id.upper()} ({event_name})")

        # Skip if already extracted
        output_path = os.path.join(OUTPUT_DIR, f"{track_id}.json")
        if os.path.exists(output_path):
            with open(output_path) as f:
                existing = json.load(f)
            if existing.get('sourceYear') is not None:
                print(f"  ⟲ Already extracted ({existing['sourceYear']} data, {existing['pointCount']} pts). Skipping.")
                success_count += 1
                continue

        x_arr, y_arr, z_arr, year_used = get_telemetry(event_name, fallback_years)

        if x_arr is None:
            print(f"  ✗ No telemetry available for {track_id}")
            failed.append(track_id)
            continue

        points = filter_and_clean_points(x_arr, y_arr, z_arr)

        if points is None or len(points) < 20:
            n = len(points) if points else 0
            print(f"  ✗ Insufficient clean points: {n}")
            failed.append(track_id)
            continue

        points_rounded = [[round(float(v), 3) for v in pt] for pt in points]

        output = {
            "trackId": track_id,
            "sourceYear": year_used,
            "sourceEvent": event_name,
            "pointCount": len(points_rounded),
            "points": points_rounded,
        }

        with open(output_path, 'w') as f:
            json.dump(output, f, separators=(',', ':'))

        print(f"  ✓ Saved {len(points_rounded)} pts → track_data/{track_id}.json  (year: {year_used})")
        success_count += 1

    print("\n" + "=" * 60)
    print(f"Done: {success_count}/{len(CIRCUITS)} circuits extracted")
    if failed:
        print(f"Failed: {', '.join(failed)}")
        print("\nNote: Failed circuits will use synthetic coordinates.")
        print("Run: python track_synthetic_generator.py  to fill gaps.")
    print("=" * 60)


if __name__ == '__main__':
    main()
