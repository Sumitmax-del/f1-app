"""
Knowledge Base — F1 Document Loader
=====================================
Loads and manages the F1 knowledge base documents from JSON.
Provides document objects for indexing by the vector store.
"""

import os
import json
from dataclasses import dataclass


@dataclass
class Document:
    """A single knowledge base document."""
    id: str
    title: str
    content: str

    @property
    def full_text(self) -> str:
        """Combined title + content for embedding."""
        return f"{self.title}\n{self.content}"


# Path to the knowledge base JSON
DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
)
KB_PATH = os.path.join(DATA_DIR, "f1_knowledge.json")


def load_documents() -> list[Document]:
    """
    Load all documents from the F1 knowledge base JSON file.

    Returns:
        List of Document objects ready for embedding and indexing.
    """
    if not os.path.exists(KB_PATH):
        print(f"[RAG] Warning: Knowledge base not found at {KB_PATH}")
        return []

    try:
        with open(KB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        documents = []
        for doc in data.get("documents", []):
            documents.append(
                Document(
                    id=doc.get("id", ""),
                    title=doc.get("title", ""),
                    content=doc.get("content", ""),
                )
            )

        print(f"[RAG] Loaded {len(documents)} knowledge base documents")
        return documents

    except (json.JSONDecodeError, OSError) as e:
        print(f"[RAG] Error loading knowledge base: {e}")
        return []
