from openai import OpenAI
from config import OPENAI_API_KEY

# Determine client and model based on the API key type
is_groq = isinstance(OPENAI_API_KEY, str) and OPENAI_API_KEY.startswith("gsk_")

if is_groq:
    client = OpenAI(
        api_key=OPENAI_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )
    DEFAULT_MODEL = "llama-3.1-8b-instant"
else:
    client = OpenAI(api_key=OPENAI_API_KEY)
    DEFAULT_MODEL = "gpt-4o-mini"


def generate_answer(context: str, question: str) -> str:
    """
    Generate an answer strictly based on the provided context.
    If the answer is not in the context, the model is instructed to say so.
    Uses Groq Llama model if a Groq key is used, otherwise uses OpenAI GPT-4o-mini.
    """
    system_prompt = (
        "You are a helpful study assistant. Answer the user's question using ONLY "
        "the context provided below. If the answer is not present in the context, "
        "say: 'The answer is not available in the uploaded documents.'\n\n"
        "To help the student prepare for exams, structure your answer clearly using the following markdown sections:\n"
        "### 💡 Core Concept\n"
        "Provide a clear 1-2 sentence high-level summary of the concept in plain English.\n\n"
        "### 📌 Key Points & Explanations\n"
        "Provide a detailed bulleted list of the main points. Bold key terms using **bolding**. "
        "For each point, provide a detailed, clear explanation instead of short summaries.\n\n"
        "### 🎓 Exam Relevance & Tips\n"
        "Provide an exam tip, list typical questions about this topic, or highlight important formulas/dates/names to remember.\n\n"
        f"Context:\n{context}"
    )
    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            temperature=0.2,
        )
        content = response.choices[0].message.content
        return content if content else "Unable to generate an answer."
    except Exception as e:
        return f"Error generating answer: {str(e)}"
