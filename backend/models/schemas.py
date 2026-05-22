from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class BookBase(BaseModel):
    title: str
    author: str
    publication_date: Optional[date] = None

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: str
    keywords: Optional[List[str]] = []
    status: str

class TransactionCreate(BaseModel):
    book_id: str

class ChatMessage(BaseModel):
    role: str # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]