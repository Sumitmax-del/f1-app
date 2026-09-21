"""
Test suite for F1 Structured Data Tool.
Verifies all required scenarios against live authoritative F1 data:
1. 2021 Mexican GP winner
2. 2021 Mexican GP fastest lap
3. 2021 driver standings
4. A qualifying result (2021 Mexican GP qualifying / pole position)
5. Constructor standings & Driver statistics
"""

import json
import unittest
from app.tools.f1_data_tool import (
    get_race_result,
    get_race_winner,
    get_fastest_lap,
    get_qualifying_result,
    get_pole_position,
    get_driver_standings,
    get_constructor_standings,
    get_driver_statistics,
    get_constructor_statistics,
    get_race_schedule,
)


class TestF1DataTool(unittest.TestCase):

    def test_1_mexican_gp_2021_winner(self):
        """Test 1: 2021 Mexican GP winner (Max Verstappen)."""
        result = get_race_winner(2021, "mexico")
        print("\n=== TEST 1: 2021 Mexican GP Winner ===")
        print(json.dumps(result, indent=2))

        self.assertNotIn("error", result)
        self.assertEqual(result["year"], 2021)
        self.assertIn("Mexico", result["race"])
        winner = result["winner"]
        self.assertIsNotNone(winner)
        self.assertEqual(winner["position"], 1)
        self.assertIn("Verstappen", winner["driver"])
        self.assertEqual(winner["team"], "Red Bull")

    def test_2_mexican_gp_2021_fastest_lap(self):
        """Test 2: 2021 Mexican GP fastest lap (Valtteri Bottas on Lap 69)."""
        result = get_fastest_lap(2021, "mexican")
        print("\n=== TEST 2: 2021 Mexican GP Fastest Lap ===")
        print(json.dumps(result, indent=2))

        self.assertNotIn("error", result)
        self.assertEqual(result["year"], 2021)
        fl = result["fastest_lap"]
        self.assertIsNotNone(fl)
        self.assertIn("Bottas", fl["driver"])
        self.assertEqual(fl["lap"], 69)
        self.assertEqual(fl["time"], "1:17.774")

    def test_3_driver_standings_2021(self):
        """Test 3: 2021 driver standings (Max Verstappen champion, Hamilton P2)."""
        result = get_driver_standings(2021)
        print("\n=== TEST 3: 2021 Driver Standings ===")
        print(f"Leader: {result.get('leader', {}).get('driver')} ({result.get('leader', {}).get('points')} pts)")
        print(f"Total drivers classified: {len(result.get('standings', []))}")
        print(f"Top 3: {[s['driver'] for s in result.get('standings', [])[:3]]}")

        self.assertNotIn("error", result)
        self.assertEqual(result["year"], "2021")
        standings = result["standings"]
        self.assertGreater(len(standings), 15)
        
        # P1: Max Verstappen
        self.assertEqual(standings[0]["position"], 1)
        self.assertIn("Verstappen", standings[0]["driver"])
        self.assertEqual(standings[0]["points"], 395.5)

        # P2: Lewis Hamilton
        self.assertEqual(standings[1]["position"], 2)
        self.assertIn("Hamilton", standings[1]["driver"])
        self.assertEqual(standings[1]["points"], 387.5)

    def test_4_qualifying_result(self):
        """Test 4: Qualifying result (2021 Mexican GP pole position Valtteri Bottas)."""
        result = get_qualifying_result(2021, "mexico")
        print("\n=== TEST 4: 2021 Mexican GP Qualifying ===")
        print(f"Pole: {result.get('pole_position')}")
        print(f"Top 3 Grid: {[q['driver'] + ' (' + q['q3'] + ')' for q in result.get('qualifying_results', [])[:3]]}")

        self.assertNotIn("error", result)
        self.assertEqual(result["year"], 2021)
        self.assertIn("Mexico", result["race"])
        pole = result["pole_position"]
        self.assertIsNotNone(pole)
        self.assertIn("Bottas", pole["driver"])
        self.assertEqual(pole["team"], "Mercedes")
        self.assertEqual(pole["time"], "1:15.875")

    def test_5_additional_helpers(self):
        """Test constructor standings and driver stats."""
        con_standings = get_constructor_standings(2021)
        self.assertNotIn("error", con_standings)
        self.assertEqual(con_standings["standings"][0]["team"], "Mercedes")

        stats = get_driver_statistics("hamilton", 2021)
        self.assertNotIn("error", stats)
        self.assertEqual(stats["wins"], 8)

        schedule = get_race_schedule(2021)
        self.assertNotIn("error", schedule)
        self.assertEqual(schedule["total_rounds"], 22)


if __name__ == "__main__":
    unittest.main()
