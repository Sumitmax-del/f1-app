"""
Telemetry Tool — Track Data Access
====================================
Provides access to the project's existing track coordinate data
and circuit information from the track_data/ directory.
"""

import os
import json
from typing import Optional

# Path to the track_data directory (relative to ai-agent/)
TRACK_DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "track_data",
)

# Cache loaded track data
_track_cache: dict[str, dict] = {}


def _load_track(track_id: str) -> Optional[dict]:
    """Load track data from JSON file."""
    if track_id in _track_cache:
        return _track_cache[track_id]

    filepath = os.path.join(TRACK_DATA_DIR, f"{track_id}.json")
    if not os.path.exists(filepath):
        return None

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            _track_cache[track_id] = data
            return data
    except (json.JSONDecodeError, OSError):
        return None


def list_available_tracks() -> str:
    """List all available track data files."""
    if not os.path.exists(TRACK_DATA_DIR):
        return "No track data directory found."

    tracks = []
    for f in sorted(os.listdir(TRACK_DATA_DIR)):
        if f.endswith(".json"):
            track_id = f.replace(".json", "")
            tracks.append(track_id)

    if not tracks:
        return "No track data files found."

    return (
        f"Available track data ({len(tracks)} circuits):\n"
        + "\n".join(f"  • {t}" for t in tracks)
    )


def get_track_info(track_id: str) -> str:
    """
    Get information about a specific circuit from the track data.

    Args:
        track_id: The track identifier (e.g., 'monaco', 'silverstone', 'spa').

    Returns:
        Formatted string with track coordinates info and metadata.
    """
    data = _load_track(track_id)
    if not data:
        # Try fuzzy match
        available = []
        if os.path.exists(TRACK_DATA_DIR):
            available = [
                f.replace(".json", "")
                for f in os.listdir(TRACK_DATA_DIR)
                if f.endswith(".json")
            ]

        # Check if any available track contains the search term
        matches = [t for t in available if track_id.lower() in t.lower()]
        if matches:
            data = _load_track(matches[0])
            if not data:
                return f"Track '{track_id}' not found. Available: {', '.join(available)}"
        else:
            return f"Track '{track_id}' not found. Available: {', '.join(available)}"

    # Extract useful info from the track data
    track_name = data.get("trackId", track_id)
    source_year = data.get("sourceYear", "Unknown")
    points = data.get("points", [])
    num_points = len(points)

    # Calculate approximate track length from coordinates
    info_lines = [
        f"Track: {track_name}",
        f"Data Source Year: {source_year}",
        f"Coordinate Points: {num_points}",
    ]

    if num_points > 0:
        # Get coordinate bounds for approximate dimensions
        xs = [p[0] for p in points if len(p) >= 2]
        ys = [p[1] for p in points if len(p) >= 2]
        if xs and ys:
            info_lines.append(
                f"X range: {min(xs):.1f} to {max(xs):.1f} "
                f"(span: {max(xs) - min(xs):.1f}m)"
            )
            info_lines.append(
                f"Y range: {min(ys):.1f} to {max(ys):.1f} "
                f"(span: {max(ys) - min(ys):.1f}m)"
            )

        # Check for elevation data
        has_z = any(len(p) >= 3 for p in points)
        if has_z:
            zs = [p[2] for p in points if len(p) >= 3]
            info_lines.append(
                f"Elevation range: {min(zs):.1f}m to {max(zs):.1f}m "
                f"(change: {max(zs) - min(zs):.1f}m)"
            )

    return "\n".join(info_lines)


# Tool dispatcher
TOOL_MAP = {
    "list_available_tracks": list_available_tracks,
    "get_track_info": get_track_info,
}
