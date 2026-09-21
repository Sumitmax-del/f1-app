"""
RAG (Retrieval-Augmented Generation) package for Formula 1 AI Agent.
Provides local document loading, embedding generation, and vector retrieval.
"""

from .loader import load_knowledge_documents, DocumentChunk
from .embeddings import get_embedding, get_embeddings, cosine_similarity
from .retriever import get_rag_retriever, retrieve_knowledge, is_knowledge_query

__all__ = [
    "load_knowledge_documents",
    "DocumentChunk",
    "get_embedding",
    "get_embeddings",
    "cosine_similarity",
    "get_rag_retriever",
    "retrieve_knowledge",
    "is_knowledge_query",
]
