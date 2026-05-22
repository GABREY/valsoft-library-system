from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Query
from typing import Optional
from models.schemas import BookCreate
from db.supabase import supabase
from core.security import require_role
from services.llm_service import generate_keywords, generate_embedding, generate_summary

router = APIRouter(prefix="/api/books", tags=["Books"])

def process_new_book_metadata(book_id: str, title: str, author: str):
    """Background task to fetch keywords and generate vector embeddings."""
    keywords = generate_keywords(title, author)
    summary = generate_summary(title, author)
    #embed_string = f"Title: {title}, Author: {author}, Keywords: {', '.join(keywords)}"
    embedding = generate_embedding(summary)
    
    supabase.table("books").update({
        "keywords": keywords,
        "embedding": embedding
    }).eq("id", book_id).execute()

@router.post("/", status_code=202)
def add_book(
    book: BookCreate, 
    background_tasks: BackgroundTasks, 
    user: dict = Depends(require_role(["admin", "librarian"]))
):
    new_book_data = {
        "title": book.title,
        "author": book.author,
        "publication_date": book.publication_date.isoformat() if book.publication_date else None,
        "status": "available"
    }
    
    res = supabase.table("books").insert(new_book_data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to insert book")
        
    created_book = res.data[0]
    background_tasks.add_task(process_new_book_metadata, created_book["id"], book.title, book.author)
    
    return {"message": "Book added. Generating AI metadata in background.", "book": created_book}

@router.get("/")
def list_books():
    """Returns all books."""
    res = supabase.table("books").select("id, title, author, publication_date, keywords, status").execute()
    return res.data

@router.get("/search")
def search_books(
    query: Optional[str] = None,
    search_type: str = "vibe", # New param: 'vibe', 'title', 'author', or 'keyword'
    author: Optional[str] = None,
    pub_year: Optional[int] = None
):
    db_query = supabase.table("books").select("*")

    # 1. Metadata-specific search
    if search_type == "title" and query:
        db_query = db_query.ilike("title", f"%{query}%")
    elif search_type == "author" and query:
        db_query = db_query.ilike("author", f"%{query}%")
    elif search_type == "keyword" and query:
        db_query = db_query.contains("keywords", [query])
    
    # 2. "Vibe Search" (Semantic/Vector)
    elif search_type == "vibe" and query:
        query_embedding = generate_embedding(query, input_type="search_query")
        print(f"[VIBE] query='{query}', embedding dim={len(query_embedding)}, sample={query_embedding[:3]}")
        rpc_res = supabase.rpc("match_books", {
            "query_embedding": query_embedding,
            "match_threshold": 0.25,
            "match_count": 10
        }).execute()
        print(f"[VIBE] match_books returned {len(rpc_res.data)} results: {rpc_res.data}")
        vector_ids = [item["id"] for item in rpc_res.data]
        print(f"[VIBE] filtering by IDs: {vector_ids}")
        db_query = db_query.in_("id", vector_ids)

    return db_query.execute().data

# --- NEW DELETE ROUTE ---
@router.delete("/{book_id}")
def delete_book(
    book_id: str, 
    user: dict = Depends(require_role(["admin"]))
):
    """Deletes a book from the catalog. Restricted to admins only."""
    res = supabase.table("books").delete().eq("id", book_id).execute()
    
    # Supabase returns the deleted rows in res.data. If empty, the book wasn't found.
    if not res.data:
        raise HTTPException(status_code=404, detail="Book not found")
        
    return {"message": "Book deleted successfully", "deleted_book": res.data[0]}

@router.patch("/{book_id}")
def edit_book(
    book_id: str, 
    book_data: dict, 
    background_tasks: BackgroundTasks, # Add this
    user: dict = Depends(require_role(["admin", "librarian"]))
):
    """Updates book info and re-syncs AI metadata."""
    
    # 1. Update the database record
    res = supabase.table("books").update(book_data).eq("id", book_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Book not found")
        
    updated_book = res.data[0]
    
    # 2. If the user edited the title or author, re-trigger the AI pipeline
    if "title" in book_data or "author" in book_data:
        background_tasks.add_task(
            process_new_book_metadata, 
            updated_book["id"], 
            updated_book["title"], 
            updated_book["author"]
        )
        
    return {"message": "Book updated. AI metadata re-syncing...", "book": updated_book}