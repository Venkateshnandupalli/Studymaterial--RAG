def load_docx_text(file_path: str) -> str:
    """Extract all paragraph text from a DOCX file."""
    try:
        from docx import Document  # type: ignore
        doc = Document(file_path)
        return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except ImportError:
        print("[WARNING] python-docx not installed. Run: pip install python-docx")
        return ""
    except Exception as e:
        print(f"[ERROR] Error reading DOCX {file_path}: {e}")
        return ""


def load_txt_text(file_path: str) -> str:
    """Read a plain-text file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
    except Exception as e:
        print(f"[ERROR] Error reading TXT {file_path}: {e}")
        return ""
