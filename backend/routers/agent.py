import json
import cohere
from fastapi import APIRouter, Depends
from models.schemas import ChatRequest
from core.security import get_current_user
from core.config import COHERE_API_KEY
from db.supabase import supabase
from services.llm_service import generate_embedding

router = APIRouter(prefix="/api/agent", tags=["AI Agent"])

co = cohere.ClientV2(api_key=COHERE_API_KEY)

SYSTEM_PROMPT = """
You are the intelligent Head Librarian. You help users find books and check them out.
Use the search_library tool when a user asks for a recommendation or a specific book.
Do not invent books. Only recommend books returned by the search tool.
Keep responses friendly, brief, and to the point.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_library",
            "description": "Search the library inventory for books matching a concept, title, genre, or author.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to find relevant books."
                    }
                },
                "required": ["query"]
            }
        }
    }
]

def search_library(query: str) -> list[dict]:
    """Search the library inventory using semantic concepts or titles."""
    embedding = generate_embedding(query, input_type="search_query")
    res = supabase.rpc("match_books", {
        "query_embedding": embedding, "match_threshold": 0.4, "match_count": 3
    }).execute()
    return res.data if res.data else []

@router.post("/chat")
def chat_with_agent(request: ChatRequest, user: dict = Depends(get_current_user)):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in request.messages[:-1]:
        role = "user" if msg.role == "user" else "assistant"
        messages.append({"role": role, "content": msg.content})
    messages.append({"role": "user", "content": request.messages[-1].content})

    response = co.chat(model="command-r7b-12-2024", messages=messages, tools=TOOLS)

    if response.message.tool_calls:
        tool_call = response.message.tool_calls[0]
        args = json.loads(tool_call.function.arguments)
        results = search_library(args.get("query", ""))

        messages.append({
            "role": "assistant",
            "tool_calls": response.message.tool_calls,
            "tool_plan": response.message.tool_plan or ""
        })
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(results)
        })

        response = co.chat(model="command-r7b-12-2024", messages=messages, tools=TOOLS)

    return {"response": response.message.content[0].text}
