import faiss
import numpy as np

# Initialize FAISS index
index = faiss.IndexFlatL2(384)
chunk_ids_map = []


def add_vectors(vectors: list, chunk_ids: list):
    """Add vectors to FAISS index."""
    global index, chunk_ids_map
    vectors_array = np.array(vectors, dtype=np.float32)
    index.add(vectors_array)
    chunk_ids_map.extend(chunk_ids)


def search_vector(query_vector: list, k: int = 5) -> list:
    """Search for similar vectors in FAISS index."""
    query_array = np.array([query_vector], dtype=np.float32)
    distances, indices = index.search(query_array, k)
    results = [chunk_ids_map[i] for i in indices[0] if i < len(chunk_ids_map)]
    return results
