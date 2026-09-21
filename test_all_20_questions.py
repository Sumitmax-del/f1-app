"""
Comprehensive 20+ Question Integration Test Suite for F1 AI Agent
===================================================================
Tests intelligent routing, execution, and return schema across:
1. F1 Data Tool (Fastest Laps, Winners, Standings, Poles, Driver Comparisons, Calendars)
2. Web Search Tool (News, Headlines, Transfers)
3. Hybrid Mode (F1 Data + Web Search for Event Context & Drama)
4. Local RAG Knowledge Base (DRS, ERS, Tyres, Points System, Flags, Terminology)
5. Telemetry Tool (Sector Time Loss, Corner Apex Speed, Throttle/Brake Traces)
"""

import json
from app.agent import ask_agent

TEST_QUESTIONS = [
    # --- Category 1: F1 Data Tool ---
    {
        "id": 1,
        "category": "F1 Data - Fastest Lap",
        "question": "Who had the fastest lap at Mexico 2021?",
        "expected_tools": ["f1_data"],
        "expected_source_contains": "Jolpica F1 API",
    },
    {
        "id": 2,
        "category": "F1 Data - Race Winner",
        "question": "Who won the 2021 Mexican GP?",
        "expected_tools": ["f1_data"],
        "expected_source_contains": "Jolpica F1 API",
    },
    {
        "id": 3,
        "category": "F1 Data - Driver Standings",
        "question": "Who is currently leading the championship?",
        "expected_tools": ["f1_data"],
        "expected_source_contains": "Jolpica F1 API",
    },
    {
        "id": 4,
        "category": "F1 Data - Constructor Standings",
        "question": "Who won the 2021 constructors championship?",
        "expected_tools": ["f1_data"],
        "expected_source_contains": "Jolpica F1 API",
    },
    {
        "id": 5,
        "category": "F1 Data - Pole / Qualifying",
        "question": "Who was on pole at the 2024 Italian GP?",
        "expected_tools": ["f1_data"],
        "expected_source_contains": "Jolpica F1 API",
    },
    {
        "id": 6,
        "category": "F1 Data - Driver Statistics",
        "question": "Give me statistics for Lewis Hamilton in 2021.",
        "expected_tools": ["f1_data"],
        "expected_source_contains": "Jolpica F1 API",
    },
    {
        "id": 7,
        "category": "F1 Data - Driver Comparison",
        "question": "Compare Verstappen and Hamilton in 2021",
        "expected_tools": ["f1_data"],
        "expected_source_contains": "Jolpica F1 API",
    },
    {
        "id": 8,
        "category": "F1 Data - Race Calendar",
        "question": "What was the race calendar for 2021?",
        "expected_tools": ["f1_data"],
        "expected_source_contains": "Jolpica F1 API",
    },

    # --- Category 2: Web Search Tool ---
    {
        "id": 9,
        "category": "Web Search - Latest News",
        "question": "Latest F1 news",
        "expected_tools": ["web_search"],
        "expected_source_contains": None,
    },
    {
        "id": 10,
        "category": "Web Search - Driver/Technical News",
        "question": "Tell me the recent news about Adrian Newey",
        "expected_tools": ["web_search"],
        "expected_source_contains": None,
    },

    # --- Category 3: Hybrid (F1 Data + Web Search) ---
    {
        "id": 11,
        "category": "Hybrid - Event Narrative",
        "question": "What happened at Abu Dhabi 2021?",
        "expected_tools": ["f1_data", "web_search"],
        "expected_source_contains": "Jolpica F1 API",
    },
    {
        "id": 12,
        "category": "Hybrid - Incident Narrative",
        "question": "What happened at the 2021 British GP?",
        "expected_tools": ["f1_data", "web_search"],
        "expected_source_contains": "Jolpica F1 API",
    },

    # --- Category 4: Local RAG Knowledge Base ---
    {
        "id": 13,
        "category": "RAG - DRS Regulations & Mechanics",
        "question": "What is DRS?",
        "expected_tools": ["rag"],
        "expected_source_contains": "knowledge/drs.txt",
    },
    {
        "id": 14,
        "category": "RAG - Points System",
        "question": "How does the points system work?",
        "expected_tools": ["rag"],
        "expected_source_contains": "knowledge/points_system.txt",
    },
    {
        "id": 15,
        "category": "RAG - Tyre Compounds",
        "question": "What are the different tyre compounds?",
        "expected_tools": ["rag"],
        "expected_source_contains": "knowledge/tyres.txt",
    },
    {
        "id": 16,
        "category": "RAG - ERS & Power Unit",
        "question": "Explain ERS and the hybrid system",
        "expected_tools": ["rag"],
        "expected_source_contains": "knowledge/ers.txt",
    },
    {
        "id": 17,
        "category": "RAG - Motorsport Terminology (Apex)",
        "question": "What is an apex in racing?",
        "expected_tools": ["rag"],
        "expected_source_contains": "knowledge/basic_f1.txt",
    },
    {
        "id": 18,
        "category": "RAG - Safety Car & Flags",
        "question": "Explain the safety car and flag rules in F1",
        "expected_tools": ["rag"],
        "expected_source_contains": "knowledge/f1_rules.txt",
    },

    # --- Category 5: Telemetry Analysis Tool ---
    {
        "id": 19,
        "category": "Telemetry - Sector 2 Time Loss",
        "question": "Why did I lose time in Sector 2?",
        "expected_tools": ["telemetry"],
        "expected_source_contains": "Live Telemetry Channel — Sector 2",
    },
    {
        "id": 20,
        "category": "Telemetry - Sector 1 Time Loss",
        "question": "Why did I lose time in Sector 1?",
        "expected_tools": ["telemetry"],
        "expected_source_contains": "Live Telemetry Channel — Sector 1",
    },
    {
        "id": 21,
        "category": "Telemetry - Sector 3 Traction",
        "question": "Where did I lose time in Sector 3?",
        "expected_tools": ["telemetry"],
        "expected_source_contains": "Live Telemetry Channel — Sector 3",
    },
]


def run_all_20_tests():
    print("=" * 75)
    print("      INTEGRATED F1 AI AGENT: 21 TEST QUESTIONS ACROSS ALL TOOLS     ")
    print("=" * 75)

    passed = 0
    total = len(TEST_QUESTIONS)

    for item in TEST_QUESTIONS:
        qid = item["id"]
        cat = item["category"]
        q = item["question"]
        expected_tools = item["expected_tools"]
        expected_src = item["expected_source_contains"]

        print(f"\n[{qid}/{total}] Category: {cat}")
        print(f"      Question       : \"{q}\"")
        
        res = ask_agent(q)
        
        tool_used = res.get("tool_used", [])
        sources = res.get("sources", [])
        confidence = res.get("confidence", "unknown")
        answer_snippet = res.get("answer", "").strip()[:140].replace("\n", " ")

        print(f"      Tool Used      : {tool_used} (Expected: {expected_tools})")
        print(f"      Confidence     : {confidence}")
        print(f"      Sources Count  : {len(sources)}")
        if sources:
            print(f"      Top Source     : {sources[0]}")
        print(f"      Answer Snippet : {answer_snippet}...")

        # Assertions
        assert tool_used == expected_tools, f"Tool mismatch for '{q}': got {tool_used}, expected {expected_tools}"
        assert confidence in ["high", "medium", "low"], f"Invalid confidence: {confidence}"
        if expected_src:
            assert any(expected_src in s for s in sources), f"Expected source containing '{expected_src}' in {sources}"

        print("      STATUS         : [PASS]")
        passed += 1

    print("\n" + "=" * 75)
    print(f"      ALL {passed}/{total} INTEGRATION TESTS PASSED PERFECTLY!       ")
    print("=" * 75)


if __name__ == "__main__":
    run_all_20_tests()
