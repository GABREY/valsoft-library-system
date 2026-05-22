from fastapi import APIRouter, Depends, HTTPException
from models.schemas import TransactionCreate
from db.supabase import supabase
from core.security import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("/my-books")
def get_my_books(user: dict = Depends(get_current_user)):
    """Returns the books currently borrowed by the authenticated user."""
    res = supabase.table("transactions")\
        .select("book_id, books(id, title, author, publication_date)")\
        .eq("user_id", user["id"])\
        .eq("status", "active")\
        .execute()
    return [item["books"] for item in res.data if item.get("books")]

@router.post("/checkout")
def checkout_book(transaction: TransactionCreate, user: dict = Depends(get_current_user)):
    # 1. Verify availability
    book_res = supabase.table("books").select("status").eq("id", transaction.book_id).single().execute()
    if not book_res.data or book_res.data["status"] != "available":
        raise HTTPException(status_code=400, detail="Book is currently unavailable.")

    # 2. Update Book Status
    supabase.table("books").update({"status": "checked_out"}).eq("id", transaction.book_id).execute()

    # 3. Log Transaction
    supabase.table("transactions").insert({
        "book_id": transaction.book_id,
        "user_id": user["id"],
        "status": "active"
    }).execute()

    return {"message": "Book successfully checked out"}

@router.post("/return")
def return_book(transaction: TransactionCreate, user: dict = Depends(get_current_user)):
    role = user["role"]

    # Admins manage the catalog — returns are a librarian/client operation
    if role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot return books. Ask a librarian.")

    # Librarians can return any active checkout; clients only their own
    query = supabase.table("transactions").select("id")\
        .eq("book_id", transaction.book_id)\
        .eq("status", "active")

    if role == "client":
        query = query.eq("user_id", user["id"])

    trans_res = query.execute()

    if not trans_res.data:
        detail = "You haven't borrowed this book." if role == "client" else "No active transaction found for this book."
        raise HTTPException(status_code=400, detail=detail)

    # Update book status
    supabase.table("books").update({"status": "available"}).eq("id", transaction.book_id).execute()

    # Close the transaction
    supabase.table("transactions").update({
        "status": "returned",
        "return_date": datetime.utcnow().isoformat()
    }).eq("id", trans_res.data[0]["id"]).execute()

    return {"message": "Book successfully returned"}