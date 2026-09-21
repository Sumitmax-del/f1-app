"""
Test suite for F1 Tool-Using AI Agent.
Tests at least 10 different questions across all intents:
- Fastest lap
- Race winners & results
- Driver championship standings
- Qualifying & pole positions
- Constructor standings
- Driver statistics
- Race schedules
- Concept / definition questions (DRS, Tyre compounds, Undercut)
- Non-existent race queries (ensuring no hallucinated stats)
"""

import json
import unittest
from unittest.mock import patch

from app.agent import F1Agent, ask_agent


class TestF1Agent(unittest.TestCase):

    def setUp(self):
        self.agent = F1Agent()

    def test_10_questions(self):
        test_cases = [
            {
                "question": "Who had the fastest lap at the 2021 Mexican GP?",
                "expected_tool": "get_fastest_lap",
                "contains_text": "Bottas",
            },
            {
                "question": "Who won the 2021 Mexican GP?",
                "expected_tool": "get_race_result",
                "contains_text": "Verstappen",
            },
            {
                "question": "Who was leading the 2021 championship?",
                "expected_tool": "get_driver_standings",
                "contains_text": "Verstappen",
            },
            {
                "question": "Who was on pole at the 2024 Italian GP?",
                "expected_tool": "get_qualifying_result",
                "contains_text": "Norris",
            },
            {
                "question": "Explain DRS.",
                "expected_tool": "rag_retrieval",
                "contains_text": None,
            },
            {
                "question": "Who won the 2021 constructor standings?",
                "expected_tool": "get_constructor_standings",
                "contains_text": "Mercedes",
            },
            {
                "question": "Give me statistics for Lewis Hamilton in 2021.",
                "expected_tool": "get_driver_statistics",
                "contains_text": "Hamilton",
            },
            {
                "question": "What was the race calendar for 2021?",
                "expected_tool": "get_race_schedule",
                "contains_text": "22",
            },
            {
                "question": "Explain tyre compounds and degradation in F1.",
                "expected_tool": "rag_retrieval",
                "contains_text": None,
            },
            {
                "question": "Who won the 2021 Abu Dhabi Grand Prix?",
                "expected_tool": "get_race_result",
                "contains_text": "Verstappen",
            },
            {
                "question": "What is an undercut strategy in Formula 1?",
                "expected_tool": None,
                "contains_text": None,
            },
            {
                "question": "Who won the 2021 Atlantis Grand Prix?",
                "expected_tool": "get_race_result",
                "contains_text": "not find race matching",
            },
        ]

        print("\n=======================================================")
        print("          RUNNING 10+ F1 AGENT TEST QUESTIONS          ")
        print("=======================================================\n")

        for idx, tc in enumerate(test_cases, 1):
            q = tc["question"]
            expected_tool = tc["expected_tool"]
            contains_text = tc["contains_text"]

            result = self.agent.process_query(q)

            print(f"[{idx}] Question: {q}")
            print(f"    Tool Used: {result.get('tool_used')}")
            print(f"    Sources:   {result.get('sources')}")
            print(f"    Answer:    {result.get('answer')[:120]}...\n")

            # Verify Tool Selection
            self.assertEqual(
                result.get("tool_used"),
                expected_tool,
                f"Mismatch tool for query: '{q}'. Got {result.get('tool_used')}, expected {expected_tool}",
            )

            # Verify Content
            if contains_text:
                self.assertIn(
                    contains_text.lower(),
                    result.get("answer", "").lower(),
                    f"Expected '{contains_text}' in answer for '{q}'",
                )

    def test_convenience_ask_agent(self):
        """Test top-level ask_agent function."""
        res = ask_agent("Who won the 2021 Mexican GP?")
        self.assertEqual(res["tool_used"], "get_race_result")
        self.assertTrue(len(res["sources"]) > 0)


if __name__ == "__main__":
    unittest.main()
