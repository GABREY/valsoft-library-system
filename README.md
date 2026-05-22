# ValLib — AI-Augmented Library Management System

A full-stack web application that combines a traditional library management system with modern AI capabilities: semantic "vibe" search, automatic keyword and summary generation, and a conversational AI librarian agent powered by Cohere.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [AI Pipeline](#ai-pipeline)
6. [User Roles & Access Control](#user-roles--access-control)
7. [Test Accounts](#test-accounts)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Project Structure](#project-structure)
11. [Environment Variables](#environment-variables)
12. [Running the Project](#running-the-project)

---

## Project Overview

ValLib is a library management system built as a Valsoft assignment. It allows users to browse a book catalog, borrow and return books, and interact with an AI librarian chatbot. Staff (librarians and admins) can manage the inventory — adding, editing, and (for admins only) deleting books. When a book is added, AI automatically generates semantic keywords and a vector embedding in the background, enabling intelligent search.

---

## Tech Stack

### Backend
| Technology | Version | Role |
|---|---|---|
| Python | 3.x | Runtime |
| FastAPI | 0.109.2 | REST API framework |
| Uvicorn | 0.27.1 | ASGI server |
| Pydantic | 2.6.1 | Data validation and schemas |
| Supabase Python SDK | 2.3.4 | Database + auth client |
| Cohere Python SDK | 6.1.0 | LLM + embeddings |
| python-dotenv | 1.0.1 | Environment variable loading |

### Frontend
| Technology | Role |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS v4 | Utility-first styling |
| React Router v6 | Client-side routing |
| Zustand | Global auth state management |
| Lucide React | Icon library |
| Supabase JS SDK | Auth client (frontend) |

### Infrastructure
| Service | Role |
|---|---|
| Supabase | PostgreSQL database + authentication + JWT |
| pgvector | PostgreSQL extension for vector similarity search |
| Cohere API | `command-r7b-12-2024` for chat/agent, `embed-english-v3.0` for embeddings |

---

## Architecture

```
┌─────────────────────────────────────┐
│           React Frontend            │
│  Vite + Tailwind + React Router     │
│  Zustand (auth state)               │
└──────────────┬──────────────────────┘
               │ HTTP (JWT Bearer token)
               ▼
┌─────────────────────────────────────┐
│         FastAPI Backend             │
│  /api/books    — catalog mgmt       │
│  /api/transactions — borrow/return  │
│  /api/agent    — AI chat endpoint   │
└──────┬─────────────┬────────────────┘
       │             │
       ▼             ▼
┌──────────┐   ┌─────────────────────┐
│ Supabase │   │    Cohere API       │
│ Postgres │   │  command-r7b chat   │
│ pgvector │   │  embed-english-v3.0 │
│ Auth/JWT │   └─────────────────────┘
└──────────┘
```

### Request Flow — AI Agent Chat

```
User message
    │
    ▼
POST /api/agent/chat
    │
    ▼
JWT validated → user identified
    │
    ▼
Cohere command-r7b-12-2024 (call 1)
    │
    ├── Model returns text → done
    │
    └── Model calls search_library tool
            │
            ▼
        Cohere embed-english-v3.0
        (embed the search query)
            │
            ▼
        Supabase match_books RPC
        (cosine similarity search, vector(1024))
            │
            ▼
        Results returned to model
            │
            ▼
        Cohere command-r7b-12-2024 (call 2)
            │
            ▼
        Final text response → user
```

### Request Flow — Add Book (Background AI Pipeline)

```
POST /api/books/
    │
    ▼
Book inserted to DB (returns immediately 202)
    │
    ▼
BackgroundTask: process_new_book_metadata()
    ├── generate_keywords()  → Cohere command-r7b (LLM)
    ├── generate_summary()   → Cohere command-r7b (LLM)
    └── generate_embedding(summary) → Cohere embed-english-v3.0
            │
            ▼
        UPDATE books SET keywords=..., embedding=...
```

---

## Features

### Public (no login required)
- **Browse catalog** — view all books with their AI-generated keywords and availability status
- **Title / Author / Keyword search** — exact text-based filtering
- **Vibe Search (AI)** — semantic search using vector embeddings; finds books by concept, mood, or theme rather than exact keywords (e.g. "dystopian future with robots")

### Authenticated Users (all roles)
- **Borrow a book** — check out any available book from the catalog
- **My Books page** — view currently borrowed books
- **Return a book** — return borrowed books
- **AI Librarian chat** — conversational agent that searches the library and recommends books

### Librarian + Admin
- **Add books** — insert a new book; AI pipeline runs automatically in background
- **Edit books** — update title, author, or date; triggers AI re-sync if title/author changed
- **Inventory management page** — full table view with keyword badges and status

### Admin only
- **Delete books** — permanently remove a book from the catalog (librarians cannot delete)

---

## AI Pipeline

### 1. Keyword Generation
- **Model**: `command-r7b-12-2024`
- **Trigger**: book added or title/author edited
- **Output**: 10–15 relevant keywords stored in `books.keywords` (text array)
- **Use**: powers the keyword search mode

### 2. Summary Generation
- **Model**: `command-r7b-12-2024`
- **Trigger**: same as above (runs in same background task)
- **Output**: 3–5 sentence plot summary — used as the text to embed (not stored separately)

### 3. Vector Embedding
- **Model**: `embed-english-v3.0`
- **Input**: the generated summary text
- **Output**: 1024-dimensional float vector stored in `books.embedding`
- **Use**: powers Vibe Search and the agent's `search_library` tool
- **Input type**: `search_document` for indexing, `search_query` for searching

### 4. AI Agent (Librarian Chatbot)
- **Model**: `command-r7b-12-2024`
- **Protocol**: Cohere v2 tool use (OpenAI-compatible message format)
- **Tool**: `search_library(query)` — embeds the query and runs a cosine similarity search against the book catalog
- **Conversation**: full history sent each request; stateless backend
- **Match threshold**: 0.4 cosine similarity minimum
- **Max results**: 3 books per tool call

### 5. Vibe Search
- **Model**: `embed-english-v3.0`
- **Flow**: embed user query → Supabase `match_books` RPC → filter books by returned IDs
- **Match threshold**: 0.4 cosine similarity minimum
- **Max results**: 10 books

---

## User Roles & Access Control

Roles are stored in Supabase `app_metadata.role`. Default role for new signups is `client`.

| Permission | client | librarian | admin |
|---|:---:|:---:|:---:|
| Browse catalog | ✅ | ✅ | ✅ |
| Vibe / keyword / title search | ✅ | ✅ | ✅ |
| Borrow a book (must be logged in) | ✅ | ✅ | ✅ |
| Return a book | ✅ | ✅ | ✅ |
| My Books page | ✅ | ✅ | ✅ |
| AI Librarian chat | ✅ | ✅ | ✅ |
| Add a book | ❌ | ✅ | ✅ |
| Edit a book | ❌ | ✅ | ✅ |
| Access Inventory page | ❌ | ✅ | ✅ |
| **Delete a book** | ❌ | ❌ | ✅ |

### How roles are assigned
Roles are **not** self-assignable. They must be set manually in the Supabase dashboard under **Authentication → Users → Edit user → app_metadata**:
```json
{ "role": "admin" }
```
Any user who signs up without manually assigned metadata defaults to `client`.

### Backend enforcement
- `GET /api/books/` — public
- `POST /api/books/` — requires `admin` or `librarian`
- `PATCH /api/books/{id}` — requires `admin` or `librarian`
- `DELETE /api/books/{id}` — requires `admin` only
- `POST /api/transactions/checkout` — requires any authenticated user
- `POST /api/transactions/return` — requires any authenticated user
- `POST /api/agent/chat` — requires any authenticated user

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | gabrey77@gmail.com | Vallib |
| Librarian | librarian@manos.com | librar |
| Client | vallib@valsoft.com | vallib |
| Client | client1@gmail.com | client |

---

## Database Schema

### Table: `books`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | Book title |
| `author` | `text` | Author name |
| `publication_date` | `date` | Optional publication date |
| `status` | `text` | `"available"` or `"checked_out"` |
| `keywords` | `text[]` | AI-generated keyword array |
| `embedding` | `vector(1024)` | Cohere semantic embedding for search |

### Table: `transactions`
| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `book_id` | `uuid` | Foreign key → books |
| `user_id` | `uuid` | Foreign key → auth.users |
| `status` | `text` | `"active"` or `"returned"` |
| `return_date` | `timestamptz` | Set when book is returned |

### Supabase RPC: `match_books`
PostgreSQL function used for vector similarity search:
```sql
CREATE OR REPLACE FUNCTION match_books(
    query_embedding vector(1024),
    match_threshold float,
    match_count int
)
RETURNS TABLE (id uuid, title text, author text, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT books.id, books.title, books.author,
           1 - (books.embedding <=> query_embedding) AS similarity
    FROM books
    WHERE 1 - (books.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
```

---

## API Reference

### Books — `/api/books`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/books/` | None | List all books |
| `POST` | `/api/books/` | librarian / admin | Add a book (triggers AI pipeline) |
| `GET` | `/api/books/search` | None | Search with `?query=&search_type=vibe\|title\|author\|keyword` |
| `PATCH` | `/api/books/{id}` | librarian / admin | Edit book metadata |
| `DELETE` | `/api/books/{id}` | admin only | Delete a book |

### Transactions — `/api/transactions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/transactions/checkout` | any user | Borrow a book `{ "book_id": "..." }` |
| `POST` | `/api/transactions/return` | any user | Return a book `{ "book_id": "..." }` |

### Agent — `/api/agent`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/agent/chat` | any user | Chat with AI librarian `{ "messages": [...] }` |

---

## Project Structure

```
valsoft-assignment/
│
├── backend/
│   ├── main.py                  # FastAPI app entry point, CORS, router registration
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (not committed)
│   │
│   ├── core/
│   │   ├── config.py            # Loads env vars (SUPABASE_URL, COHERE_API_KEY, etc.)
│   │   └── security.py          # JWT validation, get_current_user, require_role
│   │
│   ├── db/
│   │   └── supabase.py          # Supabase client singleton
│   │
│   ├── models/
│   │   └── schemas.py           # Pydantic models (BookCreate, ChatRequest, etc.)
│   │
│   ├── routers/
│   │   ├── books.py             # Book CRUD + search + background AI pipeline
│   │   ├── transactions.py      # Checkout and return logic
│   │   └── agent.py             # AI librarian chat endpoint + tool definition
│   │
│   └── services/
│       └── llm_service.py       # Cohere wrappers: generate_keywords, generate_summary, generate_embedding
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── .env.local               # Frontend env vars (VITE_SUPABASE_URL, etc.)
    │
    └── src/
        ├── main.jsx             # React entry point (StrictMode)
        ├── App.jsx              # Router, layout, AiAgentChat mounting
        ├── index.css            # Tailwind v4 import
        │
        ├── components/
        │   ├── Navbar.jsx       # Dark navbar, auth form dropdown, role-aware nav links
        │   ├── AiAgentChat.jsx  # Floating AI chat widget (slide-in panel, tool call aware)
        │   ├── BookCover.jsx    # Deterministic gradient book cover (based on title hash)
        │   └── ProtectedRoute.jsx # Role-gated route wrapper
        │
        ├── pages/
        │   ├── Catalog.jsx      # Book grid, search modes, borrow button
        │   ├── Inventory.jsx    # Staff management table, add/edit/delete forms
        │   └── MyBooks.jsx      # Currently borrowed books + return button
        │
        ├── store/
        │   └── authStore.js     # Zustand store: user, session, signIn, signUp, signOut
        │
        └── lib/
            ├── api.js           # fetchAPI helper (attaches JWT Bearer token)
            └── supabase.js      # Supabase JS client (frontend auth)
```

---

## Environment Variables

### Backend — `backend/.env`
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
COHERE_API_KEY=your-cohere-api-key
```
> Use the **service role key** for the backend (bypasses Row Level Security).

### Frontend — `frontend/.env.local`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_BASE_URL=http://localhost:8000/api
```
> Use the **anon public key** for the frontend (safe to expose).

---

## Running the Project

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Supabase project with `pgvector` enabled and the `match_books` function created
- A Cohere API key

### Backend
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Add your .env file (see Environment Variables above)

# Start the server
uvicorn main:app --reload
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Add your .env.local file (see Environment Variables above)

# Start dev server
npm run dev
# App available at http://localhost:5173
```

### Important: After changing embedding model
If you switch embedding models, the vector dimensions change and all existing embeddings become invalid. To reset:
```sql
-- Run in Supabase SQL Editor
ALTER TABLE books ALTER COLUMN embedding TYPE vector(1024);
UPDATE books SET embedding = NULL;
```
Then re-add or re-edit each book to trigger the background pipeline.

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Switched from Gemini to Cohere | Gemini free tier was 20 requests/day for the available models; Cohere trial gives 1000/month with much more manageable rate limits |
| `command-r7b-12-2024` for agent | Smallest Cohere model with tool-use support — fast and appropriate for a library assistant |
| `embed-english-v3.0` for embeddings | High quality 1024-dim embeddings; separate quota from chat model |
| Background tasks for AI pipeline | Adding a book returns immediately (202 Accepted); AI enrichment happens async so the user isn't blocked |
| Stateless agent | Full conversation history sent with each request; no server-side session storage needed |
| Deterministic gradient book covers | No ISBN data available, no external image API needed; title hash maps to consistent color |
| Admin-only delete | Destructive operations restricted to highest privilege level; librarians manage day-to-day without risk of accidental data loss |
