"""
Vector Store — FAISS + Sentence Transformers
==============================================
Semantic search over the F1 knowledge base using dense embeddings.
Uses all-MiniLM-L6-v2 for fast, lightweight 384-dimensional embeddings
and FAISS for efficient cosine similarity search.
"""

import os
import numpy as np
from typing import Optional

from .knowledge_base import Document, load_documents

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════════

FAISS_INDEX_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "faiss_index",
)

DEFAULT_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")


# ═══════════════════════════════════════════════════════════════════════════════
# Vector Store
# ═══════════════════════════════════════════════════════════════════════════════

class VectorStore:
    """FAISS-backed semantic search over F1 knowledge base documents."""

    def __init__(self):
        self.documents: list[Document] = []
        self.index = None  # FAISS index
        self.embeddings: Optional[np.ndarray] = None
        self._model = None
        self._initialized = False

    def initialize(self, model_name: str = DEFAULT_MODEL) -> None:
        """
        Load documents, compute embeddings, and build FAISS index.
        Caches the index to disk for fast restarts.
        """
        if self._initialized:
            return

        print(f"[RAG] Initializing vector store with model: {model_name}")

        # Load documents
        self.documents = load_documents()
        if not self.documents:
            print("[RAG] No documents to index — vector store will be empty")
            self._initialized = True
            return

        # Try to load cached index
        if self._load_cached_index():
            print(f"[RAG] Loaded cached FAISS index ({len(self.documents)} docs)")
            self._initialized = True
            return

        # Build fresh index
        print(f"[RAG] Building FAISS index for {len(self.documents)} documents...")
        self._load_model(model_name)

        # Encode all documents
        texts = [doc.full_text for doc in self.documents]
        self.embeddings = self._model.encode(
            texts,
            show_progress_bar=True,
            normalize_embeddings=True,
        )

        # Build FAISS index (inner product on normalized vectors = cosine similarity)
        import faiss

        dimension = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(self.embeddings.astype(np.float32))

        # Cache to disk
        self._save_cached_index()

        print(f"[RAG] FAISS index ready — {self.index.ntotal} vectors, {dimension}d")
        self._initialized = True

    def search(self, query: str, top_k: int = 3) -> list[tuple[Document, float]]:
        """
        Search for the most relevant documents given a query string.

        Args:
            query: Natural language query.
            top_k: Number of results to return.

        Returns:
            List of (Document, score) tuples sorted by relevance (descending).
        """
        if not self._initialized or not self.index or self.index.ntotal == 0:
            return []

        if self._model is None:
            self._load_model()

        # Encode query
        query_embedding = self._model.encode(
            [query],
            normalize_embeddings=True,
        ).astype(np.float32)

        # Search
        scores, indices = self.index.search(query_embedding, min(top_k, self.index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and score > 0.0:
                results.append((self.documents[idx], float(score)))

        return results

    def search_formatted(self, query: str, top_k: int = 3) -> str:
        """
        Search and return results as a formatted string for LLM context injection.

        Args:
            query: Natural language query.
            top_k: Number of results to return.

        Returns:
            Formatted context string with relevant knowledge base excerpts.
        """
        results = self.search(query, top_k)

        if not results:
            return ""

        lines = []
        for i, (doc, score) in enumerate(results, 1):
            lines.append(f"[Knowledge Source {i}: {doc.title}] (relevance: {score:.2f})")
            lines.append(doc.content)
            lines.append("")

        return "\n".join(lines)

    # ─── Internal Methods ─────────────────────────────────────────────────────

    def _load_model(self, model_name: str = DEFAULT_MODEL) -> None:
        """Load the sentence-transformers model."""
        if self._model is not None:
            return

        from sentence_transformers import SentenceTransformer

        print(f"[RAG] Loading embedding model: {model_name}")
        self._model = SentenceTransformer(model_name)
        print(f"[RAG] Model loaded — dimension: {self._model.get_sentence_embedding_dimension()}")

    def _save_cached_index(self) -> None:
        """Save FAISS index and metadata to disk."""
        try:
            import faiss

            os.makedirs(FAISS_INDEX_DIR, exist_ok=True)

            # Save FAISS index
            faiss.write_index(
                self.index,
                os.path.join(FAISS_INDEX_DIR, "index.faiss"),
            )

            # Save document count as simple verification
            with open(os.path.join(FAISS_INDEX_DIR, "metadata.txt"), "w") as f:
                f.write(f"{len(self.documents)}\n")

            print(f"[RAG] Cached FAISS index to {FAISS_INDEX_DIR}")
        except Exception as e:
            print(f"[RAG] Warning: Could not cache FAISS index: {e}")

    def _load_cached_index(self) -> bool:
        """Try to load a cached FAISS index from disk. Returns True if successful."""
        index_path = os.path.join(FAISS_INDEX_DIR, "index.faiss")
        meta_path = os.path.join(FAISS_INDEX_DIR, "metadata.txt")

        if not os.path.exists(index_path) or not os.path.exists(meta_path):
            return False

        try:
            import faiss

            # Verify document count matches
            with open(meta_path, "r") as f:
                cached_count = int(f.read().strip())

            if cached_count != len(self.documents):
                print("[RAG] Document count changed — rebuilding index")
                return False

            self.index = faiss.read_index(index_path)
            return True
        except Exception as e:
            print(f"[RAG] Could not load cached index: {e}")
            return False


# ═══════════════════════════════════════════════════════════════════════════════
# Singleton
# ═══════════════════════════════════════════════════════════════════════════════

_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """Get the singleton VectorStore instance."""
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
