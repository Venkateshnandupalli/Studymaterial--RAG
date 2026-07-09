from typing import List


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    """
    Split text into overlapping character-level chunks.

    Args:
        text:       The full document text.
        chunk_size: Max characters per chunk.
        overlap:    Number of characters shared between consecutive chunks.

    Returns:
        List of text chunks.
    """
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap
    return chunks
