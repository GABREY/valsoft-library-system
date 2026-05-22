import cohere
import json
from core.config import COHERE_API_KEY

co = cohere.ClientV2(api_key=COHERE_API_KEY)

def generate_keywords(title: str, author: str) -> list[str]:
    """Generates 10-15 keywords using an LLM for search indexing."""
    prompt = f"Generate 10 to 15 highly relevant single-word or short-phrase keywords for the book '{title}' by {author}. Return ONLY a valid JSON list of strings."
    response = co.chat(
        model="command-r7b-12-2024",
        messages=[{"role": "user", "content": prompt}]
    )
    text = response.message.content[0].text
    try:
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Failed to parse LLM JSON: {e}")
        return []

def generate_summary(title: str, author: str) -> str:
    """Generates a concise 3-5 sentence summary for the book."""
    prompt = f"Write a 3 to 5 sentence plot summary for the book '{title}' by {author}. Focus on the genre, setting, and main theme."
    response = co.chat(
        model="command-r7b-12-2024",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.message.content[0].text.strip()

def generate_embedding(text: str, input_type: str = "search_document") -> list[float]:
    """Generates a 1024-dimensional vector embedding for semantic search."""
    result = co.embed(
        texts=[text],
        model="embed-english-v3.0",
        input_type=input_type,
        embedding_types=["float"]
    )
    return result.embeddings.float_[0]
