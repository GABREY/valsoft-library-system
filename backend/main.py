from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import books, transactions, agent

app = FastAPI(
    title="Valsoft Mini Library API",
    description="Backend architecture featuring LLM tool-calling and semantic vector search.",
    version="1.0.0"
)

# Allow React Frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(books.router)
app.include_router(transactions.router)
app.include_router(agent.router)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Library API is running"}