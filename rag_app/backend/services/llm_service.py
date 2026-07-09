from openai import OpenAI
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)


def generate_answer(context: str, question: str) -> str:
    """
    Use GPT-4o-mini to answer a question strictly based on the provided context.
    If the answer is not in the context, the model is instructed to say so.
    """
    system_prompt = (
        "You are a helpful study assistant. Answer the user's question using ONLY "
        "the context provided below. If the answer is not present in the context, "
        "say: 'The answer is not available in the uploaded documents.'\n\n"
        f"Context:\n{context}"
    )
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
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
