"""
Test suite for Web Search Tool and Multi-Tool Agent Routing.
Tests:
1. Search Tool direct execution (DuckDuckGo provider, structured dictionary schema)
2. Fastest Lap query -> F1 Data Tool
3. Championship Leader query -> F1 Data Tool
4. Latest News query -> Web Search Tool
5. Event Narrative query ("What happened at 2021 Abu Dhabi GP?") -> Hybrid (F1 Data + Web Search)
6. Concept query ("Explain DRS") -> LLM directly
7. Real source URL propagation (no fabricated sources)
"""

import json
import unittest
from app.tools.search_tool import search_web, search_f1_news
from app.agent import F1Agent, ask_agent


class TestSearchAndAgent(unittest.TestCase):

    def setUp(self):
        self.agent = F1Agent()

    def test_1_search_tool_direct(self):
        """Test search_web returns structured results with title, url, snippet."""
        results = search_web("Formula 1 latest news", max_results=3)
        print("\n=== TEST 1: Direct Web Search Output ===")
        print(json.dumps(results[:2], indent=2))

        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0)
        first = results[0]
        self.assertIn("title", first)
        self.assertIn("url", first)
        self.assertIn("snippet", first)
        self.assertTrue(first["url"].startswith("http"))

    def test_2_fastest_lap_routing(self):
        """Test 'Who had the fastest lap at the 2021 Mexican GP?' -> F1 Data Tool."""
        res = self.agent.process_query("Who had the fastest lap at the 2021 Mexican GP?")
        print("\n=== TEST 2: Fastest Lap Query ===")
        print(f"Tool Used: {res['tool_used']}")
        print(f"Sources:   {res['sources']}")
        print(f"Answer:    {res['answer'][:100]}...")

        self.assertEqual(res["tool_used"], "get_fastest_lap")
        self.assertTrue(any("Jolpica" in s for s in res["sources"]))
        self.assertIn("bottas", res["answer"].lower())

    def test_3_current_championship_leader(self):
        """Test 'Who is currently leading the championship?' -> F1 Data Tool."""
        res = self.agent.process_query("Who is currently leading the championship?")
        print("\n=== TEST 3: Championship Leader Query ===")
        print(f"Tool Used: {res['tool_used']}")
        print(f"Sources:   {res['sources']}")
        print(f"Answer:    {res['answer'][:100]}...")

        self.assertEqual(res["tool_used"], "get_driver_standings")
        self.assertTrue(any("Jolpica" in s or "Standings" in s for s in res["sources"]))

    def test_4_latest_news_routing(self):
        """Test 'What are the latest F1 news?' -> Web Search Tool."""
        res = self.agent.process_query("What are the latest F1 news?")
        print("\n=== TEST 4: Latest News Query ===")
        print(f"Tool Used: {res['tool_used']}")
        print(f"Sources:   {res['sources']}")
        print(f"Answer:    {res['answer'][:100]}...")

        self.assertEqual(res["tool_used"], "web_search")
        self.assertGreater(len(res["sources"]), 0)
        # Verify real URLs in sources
        for s in res["sources"]:
            self.assertTrue(s.startswith("http"))

    def test_5_hybrid_event_narrative_routing(self):
        """Test 'What happened at the 2021 Abu Dhabi GP?' -> Hybrid (F1 Data + Web Search)."""
        res = self.agent.process_query("What happened at the 2021 Abu Dhabi GP?")
        print("\n=== TEST 5: Hybrid Event Narrative Query ===")
        print(f"Tool Used: {res['tool_used']}")
        print(f"Sources:   {res['sources']}")
        print(f"Answer:    {res['answer'][:120]}...")

        self.assertEqual(res["tool_used"], "get_race_result+web_search")
        # Must have both official API and web URLs in sources
        self.assertTrue(any("Jolpica" in s for s in res["sources"]))
        self.assertTrue(any(s.startswith("http") for s in res["sources"]))

    def test_6_concept_routing(self):
        """Test 'Explain DRS.' -> RAG retrieval with drs.txt source."""
        res = ask_agent("Explain DRS.")
        print("\n=== TEST 6: Concept Query ===")
        print(f"Tool Used: {res['tool_used']}")
        print(f"Sources:   {res['sources']}")

        self.assertEqual(res["tool_used"], "rag_retrieval")
        self.assertTrue(any("drs.txt" in s for s in res["sources"]))


if __name__ == "__main__":
    unittest.main()
