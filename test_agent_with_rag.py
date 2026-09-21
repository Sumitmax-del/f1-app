"""
Comprehensive verification of F1 AI Agent with RAG integration.
"""

from app.agent import ask_agent

def test_agent_rag_and_f1_tools():
    print("=" * 60)
    print("TESTING F1 AGENT INTENT ROUTING (RAG vs F1 DATA vs SEARCH)")
    print("=" * 60)

    test_cases = [
        {
            "q": "What is DRS?",
            "expected_tool": "rag_retrieval",
            "expected_source_fragment": "drs.txt"
        },
        {
            "q": "How does the F1 points system work?",
            "expected_tool": "rag_retrieval",
            "expected_source_fragment": "points_system.txt"
        },
        {
            "q": "What are the different tyre compounds?",
            "expected_tool": "rag_retrieval",
            "expected_source_fragment": "tyres.txt"
        },
        {
            "q": "Explain ERS in Formula 1",
            "expected_tool": "rag_retrieval",
            "expected_source_fragment": "ers.txt"
        },
        {
            "q": "Who won the 2021 Mexican GP?",
            "expected_tool": "get_race_result",
            "expected_source_fragment": "Jolpica F1 API"
        },
        {
            "q": "Who had the fastest lap at the 2021 Mexican GP?",
            "expected_tool": "get_fastest_lap",
            "expected_source_fragment": "Jolpica F1 API"
        },
        {
            "q": "Who was leading the 2021 drivers championship?",
            "expected_tool": "get_driver_standings",
            "expected_source_fragment": "Jolpica F1 API"
        },
    ]

    for tc in test_cases:
        q = tc["q"]
        print(f"\n[?] Question: {q}")
        response = ask_agent(q)
        tool_used = response.get("tool_used")
        sources = response.get("sources", [])
        answer_preview = response.get("answer", "")[:180].replace("\n", " ")

        print(f"    Tool Used : {tool_used}")
        print(f"    Sources   : {sources}")
        print(f"    Answer    : {answer_preview}...")

        assert tool_used == tc["expected_tool"], f"Expected tool {tc['expected_tool']}, got {tool_used}"
        assert any(tc["expected_source_fragment"] in s for s in sources), f"Expected {tc['expected_source_fragment']} in sources: {sources}"
        print("    [PASS]")

    print("\n" + "=" * 60)
    print("ALL AGENT + RAG TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_agent_rag_and_f1_tools()
