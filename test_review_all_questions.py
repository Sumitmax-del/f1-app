"""
Review and Validation Suite for all User Requested Questions
============================================================
Tests the 13 required questions:
1. Who had the fastest lap at the 2021 Mexican GP?
2. Who won the 2021 Mexican GP?
3. Who was on pole at the 2021 Mexican GP?
4. Who led the 2021 Drivers' Championship?
5. Who led the 2021 Constructors' Championship?
6. Who is currently leading the championship?
7. What happened at the 2021 Abu Dhabi GP?
8. What is DRS?
9. What is ERS?
10. Explain the F1 points system.
11. Compare Hamilton and Verstappen in 2021.
12. What are the latest F1 news?
13. Who is the best F1 driver?
"""

import json
from app.agent import ask_agent

REVIEW_QUESTIONS = [
    {
        "id": 1,
        "question": "Who had the fastest lap at the 2021 Mexican GP?",
        "expected_tools": ["f1_data"],
        "check": lambda r: "f1_data" in r["tool_used"]
    },
    {
        "id": 2,
        "question": "Who won the 2021 Mexican GP?",
        "expected_tools": ["f1_data"],
        "check": lambda r: "f1_data" in r["tool_used"]
    },
    {
        "id": 3,
        "question": "Who was on pole at the 2021 Mexican GP?",
        "expected_tools": ["f1_data"],
        "check": lambda r: "f1_data" in r["tool_used"]
    },
    {
        "id": 4,
        "question": "Who led the 2021 Drivers' Championship?",
        "expected_tools": ["f1_data"],
        "check": lambda r: "f1_data" in r["tool_used"]
    },
    {
        "id": 5,
        "question": "Who led the 2021 Constructors' Championship?",
        "expected_tools": ["f1_data"],
        "check": lambda r: "f1_data" in r["tool_used"]
    },
    {
        "id": 6,
        "question": "Who is currently leading the championship?",
        "expected_tools": ["f1_data"],
        "check": lambda r: "f1_data" in r["tool_used"]
    },
    {
        "id": 7,
        "question": "What happened at the 2021 Abu Dhabi GP?",
        "expected_tools": ["f1_data", "web_search"],
        "check": lambda r: "f1_data" in r["tool_used"] and "web_search" in r["tool_used"]
    },
    {
        "id": 8,
        "question": "What is DRS?",
        "expected_tools": ["rag"],
        "check": lambda r: "rag" in r["tool_used"] and any("drs.txt" in s for s in r["sources"])
    },
    {
        "id": 9,
        "question": "What is ERS?",
        "expected_tools": ["rag"],
        "check": lambda r: "rag" in r["tool_used"] and any("ers.txt" in s for s in r["sources"])
    },
    {
        "id": 10,
        "question": "Explain the F1 points system.",
        "expected_tools": ["rag"],
        "check": lambda r: "rag" in r["tool_used"] and any("points_system.txt" in s for s in r["sources"])
    },
    {
        "id": 11,
        "question": "Compare Hamilton and Verstappen in 2021.",
        "expected_tools": ["f1_data"],
        "check": lambda r: "f1_data" in r["tool_used"]
    },
    {
        "id": 12,
        "question": "What are the latest F1 news?",
        "expected_tools": ["web_search"],
        "check": lambda r: "web_search" in r["tool_used"]
    },
    {
        "id": 13,
        "question": "Who is the best F1 driver?",
        "expected_tools": ["f1_data"],
        "check": lambda r: "f1_data" in r["tool_used"] and ("subjective" in r["answer"].lower() or "criteria" in r["answer"].lower() or "hamilton" in r["answer"].lower() or "schumacher" in r["answer"].lower())
    },
]


def run_review_tests():
    print("=" * 75)
    print("           F1 AI AGENT COMPLETE SYSTEM REVIEW & TEST RUNNER            ")
    print("=" * 75)

    passed = 0
    total = len(REVIEW_QUESTIONS)

    for item in REVIEW_QUESTIONS:
        qid = item["id"]
        q = item["question"]
        expected_tools = item["expected_tools"]

        print(f"\n[Test {qid}/{total}] Question: \"{q}\"")
        res = ask_agent(q)

        tool_used = res.get("tool_used", [])
        sources = res.get("sources", [])
        confidence = res.get("confidence", "unknown")
        answer_preview = res.get("answer", "").strip().replace("\n", " ")[:140]

        print(f"       Tool Used  : {tool_used} (Expected: {expected_tools})")
        print(f"       Confidence : {confidence}")
        print(f"       Sources    : {sources}")
        print(f"       Answer     : {answer_preview}...")

        assert tool_used == expected_tools, f"Mismatch in tools: got {tool_used}, expected {expected_tools}"
        assert item["check"](res), f"Validation check failed for question '{q}'"
        print("       Status     : [PASS]")
        passed += 1

    print("\n" + "=" * 75)
    print(f"   REVIEW COMPLETE: ALL {passed}/{total} TARGET QUESTIONS PASSED PERFECTLY!   ")
    print("=" * 75)


if __name__ == "__main__":
    run_review_tests()
