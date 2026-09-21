"""
Test suite for F1 Local RAG System.
"""

from app.rag.retriever import get_rag_retriever, retrieve_knowledge, is_knowledge_query
from app.rag.loader import load_knowledge_documents

def test_rag_system():
    print("\n--- Testing RAG Document Loader ---")
    retriever = get_rag_retriever()
    retriever.rebuild_index()
    print(f"Total Chunks Indexed: {len(retriever.chunks)}")
    assert len(retriever.chunks) > 0, "No chunks indexed"

    test_queries = [
        ("What is DRS?", "drs.txt"),
        ("How does the F1 points system work?", "points_system.txt"),
        ("What are the different tyre compounds?", "tyres.txt"),
        ("What is ERS in Formula 1?", "ers.txt"),
        ("What is the apex of a corner?", "basic_f1.txt"),
        ("Explain the safety car and track flags.", "f1_rules.txt"),
    ]

    print("\n--- Testing Knowledge Retrieval ---")
    for query, expected_source in test_queries:
        res = retrieve_knowledge(query, top_k=2)
        sources = res.get("sources", [])
        chunks = res.get("chunks", [])
        top_src = chunks[0]["source_file"] if chunks else "NONE"
        top_title = chunks[0]["title"] if chunks else "NONE"
        score = chunks[0]["score"] if chunks else 0.0
        
        print(f"\nQuery: {query}")
        print(f"Expected source: {expected_source} | Top source: {top_src} (Score: {score}) | Title: {top_title}")
        print(f"Sources returned: {sources}")
        assert expected_source in sources, f"Expected {expected_source} to be in sources {sources}"
        print("  -> PASS")

    print("\n--- Testing is_knowledge_query intent classifier ---")
    assert is_knowledge_query("What is DRS?") == True
    assert is_knowledge_query("Explain tyre degradation") == True
    assert is_knowledge_query("How many points for 1st place?") == True
    assert is_knowledge_query("Who won the 2021 Mexican GP?") == False
    assert is_knowledge_query("Who had the fastest lap at the 2024 Monaco GP?") == False
    print("  -> ALL INTENT CLASSIFIER CHECKS PASSED")

    print("\nALL RAG SYSTEM TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_rag_system()
