"""
Document loader and chunker for local Formula 1 knowledge base.
Reads files from knowledge/ directory and breaks them into structured semantic chunks.
"""

import os
from pathlib import Path
from typing import List, Dict, Any


class DocumentChunk:
    def __init__(self, chunk_id: int, source_file: str, title: str, content: str):
        self.chunk_id = chunk_id
        self.source_file = source_file
        self.title = title
        self.content = content.strip()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "source_file": self.source_file,
            "title": self.title,
            "content": self.content
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DocumentChunk":
        return cls(
            chunk_id=data["chunk_id"],
            source_file=data["source_file"],
            title=data.get("title", ""),
            content=data["content"]
        )

    def __repr__(self) -> str:
        return f"<Chunk {self.chunk_id} [{self.source_file}] {self.title[:30]}... ({len(self.content)} chars)>"


def get_knowledge_dir() -> Path:
    """Find knowledge directory from current or parent path."""
    candidates = [
        Path(os.getcwd()) / "knowledge",
        Path(__file__).resolve().parent.parent.parent / "knowledge",
        Path(__file__).resolve().parent.parent / "knowledge",
        Path(os.getcwd()) / "ai-agent" / "knowledge",
    ]
    for c in candidates:
        if c.exists() and c.is_dir():
            return c
    # Fallback to creating knowledge directory at project root
    default_dir = Path(os.getcwd()) / "knowledge"
    default_dir.mkdir(parents=True, exist_ok=True)
    return default_dir


def split_text_into_chunks(text: str, filename: str, start_id: int = 0) -> List[DocumentChunk]:
    """
    Split a document into logical semantic chunks based on headers and paragraphs.
    """
    chunks: List[DocumentChunk] = []
    lines = text.splitlines()
    
    current_title = filename.replace(".txt", "").replace("_", " ").title()
    current_buffer: List[str] = []
    chunk_counter = start_id

    for line in lines:
        stripped = line.strip()
        
        # Check if line is a major markdown header
        if stripped.startswith("# ") or stripped.startswith("## "):
            if current_buffer:
                content = "\n".join(current_buffer).strip()
                if content:
                    chunks.append(DocumentChunk(
                        chunk_id=chunk_counter,
                        source_file=filename,
                        title=current_title,
                        content=content
                    ))
                    chunk_counter += 1
                current_buffer = []
            current_title = stripped.lstrip("#").strip()
            current_buffer.append(stripped)
        elif stripped == "" and len("\n".join(current_buffer)) > 400:
            # Paragraph break for long chunks
            content = "\n".join(current_buffer).strip()
            if content:
                chunks.append(DocumentChunk(
                    chunk_id=chunk_counter,
                    source_file=filename,
                    title=current_title,
                    content=content
                ))
                chunk_counter += 1
            current_buffer = []
        else:
            current_buffer.append(line)

    if current_buffer:
        content = "\n".join(current_buffer).strip()
        if content:
            chunks.append(DocumentChunk(
                chunk_id=chunk_counter,
                source_file=filename,
                title=current_title,
                content=content
            ))

    return chunks


def load_knowledge_documents(knowledge_dir: Path = None) -> List[DocumentChunk]:
    """
    Load all text files from the knowledge directory and return chunked documents.
    """
    if knowledge_dir is None:
        knowledge_dir = get_knowledge_dir()

    chunks: List[DocumentChunk] = []
    if not knowledge_dir.exists():
        return chunks

    txt_files = sorted(list(knowledge_dir.glob("*.txt")) + list(knowledge_dir.glob("*.md")))
    current_id = 0

    for file_path in txt_files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            file_chunks = split_text_into_chunks(content, file_path.name, start_id=current_id)
            chunks.extend(file_chunks)
            current_id += len(file_chunks)
        except Exception as e:
            print(f"[RAG Loader] Warning: could not load {file_path.name}: {e}")

    return chunks
