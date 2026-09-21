"""
Local vector index and retriever for Formula 1 knowledge base.
Provides fast similarity search over chunked knowledge documents.
"""

import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

from .loader import load_knowledge_documents, DocumentChunk, get_knowledge_dir
from .embeddings import (
    fit_local_vectorizer,
    get_embedding,
    cosine_similarity,
    DEFAULT_EMBEDDING_MODEL
)


class F1RagRetriever:
    """
    Local RAG Retriever managing chunk storage, vector embeddings, and search.
    """
    def __init__(self, knowledge_dir: Optional[Path] = None):
        self.knowledge_dir = knowledge_dir or get_knowledge_dir()
        self.index_file = self.knowledge_dir / "vector_index.json"
        self.chunks: List[DocumentChunk] = []
        self.embeddings: List[List[float]] = []
        self._is_indexed = False
        self.initialize_index()

    def initialize_index(self, force_rebuild: bool = False):
        """Build or load the local vector index from disk."""
        if not force_rebuild and self._try_load_cached_index():
            self._is_indexed = True
            return

        self.rebuild_index()

    def _try_load_cached_index(self) -> bool:
        """Load cached chunks and embeddings from vector_index.json if valid."""
        if not self.index_file.exists():
            return False
        
        try:
            with open(self.index_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            raw_chunks = data.get("chunks", [])
            raw_embeddings = data.get("embeddings", [])
            
            if not raw_chunks or len(raw_chunks) != len(raw_embeddings):
                return False

            self.chunks = [DocumentChunk.from_dict(c) for c in raw_chunks]
            self.embeddings = raw_embeddings
            
            # Also fit the local vectorizer vocabulary on loaded corpus
            corpus = [f"{c.title}\n{c.content}" for c in self.chunks]
            fit_local_vectorizer(corpus)
            return True
        except Exception as e:
            print(f"[RAG Retriever] Warning: Could not load cached index: {e}")
            return False

    def rebuild_index(self):
        """Load raw files, chunk, embed, and save vector_index.json to disk."""
        self.chunks = load_knowledge_documents(self.knowledge_dir)
        if not self.chunks:
            self._is_indexed = False
            return

        corpus = [f"{c.title}\n{c.content}" for c in self.chunks]
        fit_local_vectorizer(corpus)

        self.embeddings = [get_embedding(f"{c.title}\n{c.content}") for c in self.chunks]
        self._is_indexed = True

        # Save to cache file for instant future loading
        try:
            cache_payload = {
                "model": DEFAULT_EMBEDDING_MODEL,
                "chunks": [c.to_dict() for c in self.chunks],
                "embeddings": self.embeddings
            }
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump(cache_payload, f, indent=2)
        except Exception as e:
            print(f"[RAG Retriever] Note: Could not cache vector index to file: {e}")

    def retrieve(self, query: str, top_k: int = 3, min_score: float = 0.05) -> Dict[str, Any]:
        """
        Perform vector cosine similarity search for a query and return formatted context.
        """
        if not self._is_indexed or not self.chunks:
            self.initialize_index()

        if not self.chunks or not self.embeddings:
            return {
                "context": "",
                "sources": [],
                "chunks": []
            }

        query_words = [w.lower() for w in re.sub(r"[^\w\s]", " ", query).split() if len(w) > 2]
        query_vec = get_embedding(query)
        scored_chunks = []
        
        for idx, chunk in enumerate(self.chunks):
            if idx < len(self.embeddings):
                score = cosine_similarity(query_vec, self.embeddings[idx])
                
                # Bonus for exact word appearance in chunk title or content
                chunk_text_lower = f"{chunk.title} {chunk.content}".lower()
                matching_words = [w for w in query_words if w in chunk_text_lower]
                if matching_words:
                    score += 0.05 * len(matching_words)
                
                # Special bonus if keyword appears in title
                if any(w in chunk.title.lower() for w in query_words):
                    score += 0.10

                if score >= min_score:
                    scored_chunks.append((score, chunk))

        # Sort descending by similarity score
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        
        if scored_chunks:
            best_score = scored_chunks[0][0]
            # Keep only chunks that have at least 45% of best score and >= 0.12 min score
            filtered = [item for item in scored_chunks if item[0] >= max(0.12, best_score * 0.45)]
            top_results = filtered[:top_k]
        else:
            top_results = []

        if not top_results:
            # Fallback: if no high vector score, check simple keyword inclusion
            q_lower = query.lower()
            keyword_matches = [
                (0.15, c) for c in self.chunks 
                if any(k in f"{c.title} {c.content}".lower() for k in q_lower.split() if len(k) > 3)
            ]
            top_results = keyword_matches[:top_k]

        formatted_context_blocks = []
        sources = []

        for score, chunk in top_results:
            block = f"--- [Document: {chunk.source_file} | Topic: {chunk.title}] ---\n{chunk.content}"
            formatted_context_blocks.append(block)
            if chunk.source_file not in sources:
                sources.append(chunk.source_file)

        return {
            "context": "\n\n".join(formatted_context_blocks),
            "sources": sources,
            "chunks": [
                {
                    "source_file": chunk.source_file,
                    "title": chunk.title,
                    "content": chunk.content,
                    "score": round(score, 4)
                }
                for score, chunk in top_results
            ]
        }


_global_retriever: Optional[F1RagRetriever] = None


def get_rag_retriever() -> F1RagRetriever:
    """Get or create singleton F1RagRetriever instance."""
    global _global_retriever
    if _global_retriever is None:
        _global_retriever = F1RagRetriever()
    return _global_retriever


def retrieve_knowledge(query: str, top_k: int = 3) -> Dict[str, Any]:
    """Helper function to retrieve relevant knowledge documents for a query."""
    retriever = get_rag_retriever()
    return retriever.retrieve(query, top_k=top_k)


def is_knowledge_query(query: str) -> bool:
    """
    Determine if a user question is asking about stable F1 rules, technical concepts,
    tyre compounds, points system rules, flags, DRS, ERS, or car dynamics.
    
    MUST return False for any live/current statistics, driver points, standings, or race results.
    """
    q = query.lower().strip()
    
    # 1. Immediate negative filter: never route live/driver/season statistics to RAG
    stat_disqualifiers = [
        "current", "currently", "latest", "standing", "standings", "leader", "leading",
        "who won", "winner", "results", "result of", "fastest lap", "pole position",
        "qualifying result", "starting grid", "calendar", "schedule", "next race",
        "points of", "points does", "points has", "position is", "position in",
        "championship position", "where is", "rank of", "how many wins", "career wins"
    ]
    if any(term in q for term in stat_disqualifiers):
        return False

    # Common driver names — if a specific driver is mentioned, do NOT route to RAG
    known_driver_names = [
        "verstappen", "hamilton", "norris", "leclerc", "piastri", "russell",
        "sainz", "alonso", "perez", "bottas", "tsunoda", "gasly", "ocon",
        "albon", "hulkenberg", "magnussen", "stroll", "zhou", "sargeant",
        "colapinto", "bearman", "lawson", "antonelli", "vettel", "ricciardo"
    ]
    if any(re.search(rf"\b{re.escape(d)}\b", q) for d in known_driver_names):
        return False
    
    # 2. Points system explanatory questions (e.g. "what is the f1 points system", "how are points awarded")
    if any(term in q for term in [
        "points system", "point system", "scoring system", "how do points work",
        "how are points awarded", "points distribution", "how does scoring work",
        "points structure", "points allocated"
    ]):
        return True

    # 3. Stable technical & regulatory concepts
    rag_concept_keywords = [
        "drs", "drag reduction",
        "ers", "mgu-k", "mgu-h", "energy recovery", "kinetic", "thermal", "hybrid power unit",
        "tyre compound", "tyres work", "tire compound", "tires work", "pirelli slick",
        "intermediate tyre", "wet tyre", "graining", "blistering", "tyre degradation",
        "parc ferme", "parc fermé",
        "sprint weekend", "sprint format", "sprint shootout", "sprint race format",
        "yellow flag", "blue flag", "red flag", "black flag", "safety car rules", "vsc rules",
        "virtual safety car rules",
        "penalty system", "time penalty rules", "stop-and-go penalty", "drive-through penalty",
        "understeer", "oversteer", "downforce", "slipstream", "dirty air", "ground effect",
        "what is f1", "how does f1 work", "knockout qualifying format", "parc ferme rules"
    ]
    
    for kw in rag_concept_keywords:
        if kw in q:
            return True

    # Exact matches for short abbreviations / questions
    if q in ("what is drs", "what is drs?", "what is ers", "what is ers?", "what is parc ferme", "what is parc ferme?", "what is parc fermé?", "what is a sprint weekend", "what is a sprint weekend?"):
        return True

    return False
