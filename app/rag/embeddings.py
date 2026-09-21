"""
Embedding generation and vector similarity calculations.
Supports Hugging Face Inference feature extraction with automatic high-speed local vector fallback.
"""

import os
import re
import math
from typing import List, Dict, Any, Optional

DEFAULT_EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")


STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "what", "which", "how", "does", "do",
    "did", "in", "on", "at", "to", "for", "of", "and", "or", "with", "by", "from",
    "tell", "me", "about", "explain", "describe", "can", "you", "please",
    "f1", "formula", "racing", "grand", "prix", "car", "cars"
}


def _tokenize(text: str) -> List[str]:
    """Tokenize and normalize text into words and subwords, filtering stop words."""
    clean = re.sub(r"[^\w\s-]", " ", text.lower())
    words = [w for w in clean.split() if len(w) > 1 and w not in STOP_WORDS]
    
    tokens = list(words)
    for word in words:
        if len(word) >= 3:
            for n in (3, 4):
                if len(word) >= n:
                    for i in range(len(word) - n + 1):
                        tokens.append(f"_sub_{word[i:i+n]}")
    return tokens


class LocalDenseVectorizer:
    """
    Fast, zero-dependency TF-IDF + subword n-gram vectorizer for offline embedding.
    Guarantees deterministic, instant, robust cosine-similarity matching for local RAG.
    """
    def __init__(self):
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_count = 0

    def fit(self, documents: List[str]):
        """Fit vocabulary and compute inverse document frequency (IDF)."""
        self.doc_count = len(documents)
        df: Dict[str, int] = {}
        
        for doc in documents:
            tokens = set(_tokenize(doc))
            for t in tokens:
                df[t] = df.get(t, 0) + 1
        
        # Build vocab sorted by frequency
        sorted_tokens = sorted(df.keys())
        self.vocabulary = {token: idx for idx, token in enumerate(sorted_tokens)}
        
        # Smooth IDF
        self.idf = {
            token: math.log((self.doc_count + 1.0) / (df.get(token, 0) + 1.0)) + 1.0
            for token in self.vocabulary
        }

    def transform(self, text: str) -> List[float]:
        """Convert a string into a normalized dense vector."""
        if not self.vocabulary:
            return [0.0]
        
        tokens = _tokenize(text)
        vec = [0.0] * len(self.vocabulary)
        
        for t in tokens:
            if t in self.vocabulary:
                idx = self.vocabulary[t]
                # Whole words get higher base weight than subword ngrams
                weight = 3.0 if not t.startswith("_sub_") else 0.5
                vec[idx] += weight
        
        # Apply IDF weighting
        for token, idx in self.vocabulary.items():
            if vec[idx] > 0.0:
                vec[idx] = (1.0 + math.log(vec[idx])) * self.idf.get(token, 1.0)
        
        # L2 Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0.0:
            vec = [x / norm for x in vec]
        return vec


# Global local vectorizer instance
_local_vectorizer = LocalDenseVectorizer()
_is_fitted = False


def fit_local_vectorizer(corpus: List[str]):
    """Fit the local vectorizer with all knowledge document chunks."""
    global _local_vectorizer, _is_fitted
    _local_vectorizer.fit(corpus)
    _is_fitted = True


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculate cosine similarity between two numeric vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))


def _try_hf_embedding(text: str, model_name: str = DEFAULT_EMBEDDING_MODEL) -> Optional[List[float]]:
    """Attempt to get dense embeddings via Hugging Face Inference Client."""
    api_key = os.getenv("HF_API_KEY", "").strip()
    if not api_key:
        return None
    
    try:
        from huggingface_hub import InferenceClient
        client = InferenceClient(token=api_key)
        res = client.feature_extraction(text, model=model_name)
        if isinstance(res, list):
            # Flatten if nested
            if len(res) > 0 and isinstance(res[0], list):
                return [float(x) for x in res[0]]
            return [float(x) for x in res]
        elif hasattr(res, "tolist"):
            return res.tolist()
    except Exception:
        pass
    return None


def get_embedding(text: str, model_name: str = DEFAULT_EMBEDDING_MODEL) -> List[float]:
    """
    Generate an embedding vector for a single text string.
    Uses Hugging Face model if configured and reachable; otherwise uses local vectorizer.
    """
    hf_emb = _try_hf_embedding(text, model_name)
    if hf_emb is not None and len(hf_emb) > 0:
        return hf_emb
    
    return _local_vectorizer.transform(text)


def get_embeddings(texts: List[str], model_name: str = DEFAULT_EMBEDDING_MODEL) -> List[List[float]]:
    """Generate embedding vectors for a batch of texts."""
    return [get_embedding(t, model_name) for t in texts]
