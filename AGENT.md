# AGENT.md - Gemany Reading App
> **REQUIRED: READ THIS FILE BEFORE MAKING ANY CHANGE**
> All coding models/agents MUST read this file in full before making any changes to this codebase.
> This file is the single source of truth for architecture, conventions, and progress.
> All user-facing app text, documentation, prompt outputs, labels, errors, and examples must be written in English.

---

## Project Overview

**Project name**: Gemany Reading App  
**Goal**: A local-first browser app for reading PDF books, with AI features that improve learning  
**Workspace**: `d:\WORKSPACE\Real project\Reading app\`  
**Last updated**: 2026-09-14

---

## Confirmed Technical Decisions

| Decision | Choice | Notes |
|---|---|---|
| AI Provider | **Google Gemini API** | Model names are environment-driven; current working defaults use `gemini-2.5-flash` and `models/gemini-embedding-001` |
| Architecture | **Full-stack (Frontend + Backend)** | Not frontend-only |
| Frontend | **Next.js 14** (App Router) | TypeScript, Tailwind CSS, shadcn/ui |
| Backend | **FastAPI** (Python) | Async, type-safe, automatic OpenAPI docs |
| Main DB | **SQLite** + **SQLAlchemy** ORM | File-based, zero-config, easy backup |
| Vector DB | **ChromaDB** (local) | Stores embeddings for RAG, no cloud required |
| PDF Parsing | **PyMuPDF** (fitz) | Extracts text and metadata from PDFs |
| AI Framework | **LangChain** + `langchain-google-genai` | Chunking, RAG pipeline, prompt templates |
| Knowledge Graph | **React Flow** | Interactive graph with drag and drop |
| Charts | **Recharts** | Heatmap calendar and reading statistics |
| TTS | **Web Speech API** (basic) -> OpenAI TTS (advanced) | Start with the free browser option |

---

## System Architecture

```text
BROWSER (localhost:3000)
|-- Next.js Frontend
|   |-- /library          -> Book list (grid view, categories)
|   |-- /reader/[id]      -> PDF Viewer + AI Panel
|   |-- /tracker          -> Daily tracker, streak, heatmap
|   |-- /graph            -> Knowledge Graph (React Flow)
|   |-- /quiz/[bookId]    -> Quiz and flashcard interface
|   `-- /settings         -> API keys, TTS settings
|
FastAPI Backend (localhost:8000)
|-- /api/books            -> Upload, CRUD, list books
|-- /api/ai/summarize     -> AI summarization (streaming)
|-- /api/ai/quiz          -> Generate quiz questions
|-- /api/ai/entities      -> Extract knowledge graph entities
|-- /api/ai/chat          -> Chat with book (RAG)
|-- /api/notes            -> CRUD notes, highlights
|-- /api/tracker          -> Reading sessions, streak
`-- /api/search           -> Semantic search (ChromaDB)
|
Data Layer
|-- data/db.sqlite        -> SQLite (books, notes, sessions, quiz)
|-- data/chroma/          -> ChromaDB vector store
`-- data/uploads/         -> PDF file storage
```

---

## Folder Structure (Standard - Do Not Change Without Approval)

```text
d:\WORKSPACE\Real project\Reading app\
|-- AGENT.md                          <- This file; read first
|-- .gitignore
|-- README.md                         <- Public project overview and local setup
|-- .env.production.example           <- Placeholder-only production settings
|-- docker-compose.yml                <- Optional; run frontend and backend together
|
|-- frontend/                         <- Next.js app
|   |-- app/
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   |-- page.tsx                  <- Redirect to /library
|   |   |-- providers.tsx
|   |   |-- (dashboard)/
|   |   |   |-- library/
|   |   |   |   `-- page.tsx
|   |   |   |-- reader/
|   |   |   |   `-- [id]/page.tsx
|   |   |   |-- tracker/
|   |   |   |   `-- page.tsx
|   |   |   |-- graph/
|   |   |   |   `-- page.tsx
|   |   |   |-- search/
|   |   |   |   `-- page.tsx
|   |   |   |-- quiz/
|   |   |   |   |-- page.tsx
|   |   |   |   `-- [bookId]/page.tsx
|   |   |   `-- settings/
|   |   |       `-- page.tsx
|   |-- components/
|   |   |-- BackgroundMusicPlayer.tsx
|   |   |-- pdf-viewer/
|   |   |   |-- PDFViewer.tsx
|   |   |   |-- FlipBookPage.tsx
|   |   |   |-- HTMLFlipBookClient.tsx
|   |   |   |-- PageControls.tsx
|   |   |   |-- ReaderNotesPanel.tsx
|   |   |   `-- HighlightLayer.tsx
|   |   |-- ai-panel/
|   |   |   |-- AIPanel.tsx
|   |   |   |-- QuizView.tsx
|   |   |   |-- SummaryView.tsx
|   |   |   `-- ChatView.tsx
|   |   |-- knowledge-graph/
|   |   |   `-- KnowledgeGraph.tsx
|   |   |-- tracker/
|   |   |   |-- StreakCard.tsx
|   |   |   |-- ReadingStats.tsx
|   |   |   `-- HeatmapCalendar.tsx
|   |   |-- quiz/
|   |   |   |-- QuizCard.tsx
|   |   |   `-- FlashcardDeck.tsx
|   |   `-- ui/                       <- shadcn/ui components
|   |-- lib/
|   |   |-- api.ts                    <- API client (fetch wrappers)
|   |   |-- types.ts                  <- Shared TypeScript types
|   |   `-- utils.ts
|   |-- hooks/
|   |   |-- useReadingSession.ts
|   |   |-- useSpeechSynthesis.ts
|   |   `-- useStreak.ts
|   |-- public/
|   |   `-- pdf.worker.min.mjs       <- Static pdf.js worker for react-pdf
|   |-- package.json
|   |-- package-lock.json
|   |-- next.config.mjs
|   |-- postcss.config.mjs
|   |-- scripts/
|   |   `-- next-with-dist.mjs       <- Runs build/start against isolated .next-build output
|   |-- tailwind.config.ts
|   |-- tsconfig.json
|   |-- tsconfig.typecheck.json      <- Plain TypeScript checks without generated Next build folders
|   `-- Dockerfile
|
`-- backend/                          <- FastAPI app
    |-- app/
    |   |-- main.py                   <- FastAPI app entry point
    |   |-- config.py                 <- Settings, env vars
    |   |-- database.py               <- SQLAlchemy setup
    |   |-- time.py                   <- Shared UTC timestamp helper
    |   |-- models/                   <- SQLAlchemy models
    |   |   |-- book.py
    |   |   |-- note.py
    |   |   |-- quiz.py
    |   |   |-- tracker.py
    |   |   `-- graph.py
    |   |-- schemas/                  <- Pydantic schemas
    |   |   |-- ai.py
    |   |   |-- book.py
    |   |   |-- graph.py
    |   |   |-- media.py
    |   |   |-- note.py
    |   |   |-- quiz.py
    |   |   |-- search.py
    |   |   `-- tracker.py
    |   |-- routers/                  <- API route handlers
    |   |   |-- books.py
    |   |   |-- ai.py
    |   |   |-- graph.py
    |   |   |-- media.py
    |   |   |-- notes.py
    |   |   |-- quiz.py
    |   |   |-- tracker.py
    |   |   `-- search.py
    |   `-- services/                 <- Business logic
    |       |-- book_files.py         <- Safe book file resolution and validation
    |       |-- media_files.py        <- Safe music and icon asset resolution
    |       |-- pdf_parser.py         <- PyMuPDF text extraction
    |       |-- rate_limiter.py       <- Lightweight AI endpoint rate limiter
    |       |-- ai_service.py         <- LangChain + Gemini
    |       |-- vector_store.py       <- ChromaDB operations
    |       `-- tts_service.py        <- Text-to-Speech
    |-- data/
    |   |-- uploads/                  <- PDF files (gitignored)
    |   |-- db.sqlite                 <- SQLite DB (gitignored)
    |   `-- chroma/                   <- Vector store (gitignored)
    |-- requirements.txt
    |-- .env.example
    |-- Dockerfile
    |-- .env                          <- API keys (gitignored)
    `-- .venv/                        <- Local virtual environment (gitignored)
```

---

## Database Schema

### SQLite Tables

```sql
-- Uploaded books
books (
  id          TEXT PRIMARY KEY,   -- UUID
  title       TEXT NOT NULL,
  author      TEXT,
  file_path   TEXT NOT NULL,       -- path inside data/uploads/
  file_size   INTEGER,
  page_count  INTEGER,
  category    TEXT,                -- "Tech", "AI", "Finance", etc.
  cover_url   TEXT,
  is_indexed  BOOLEAN DEFAULT 0,   -- whether this book has been embedded into ChromaDB
  created_at  DATETIME,
  updated_at  DATETIME
)

-- Notes and highlights
notes (
  id          TEXT PRIMARY KEY,
  book_id     TEXT REFERENCES books(id),
  page_number INTEGER,
  content     TEXT NOT NULL,       -- note content
  highlight   TEXT,                -- highlighted text
  color       TEXT DEFAULT 'yellow',
  created_at  DATETIME
)

-- Quiz questions
quiz_items (
  id          TEXT PRIMARY KEY,
  book_id     TEXT REFERENCES books(id),
  question    TEXT NOT NULL,
  options     TEXT NOT NULL,       -- JSON array of 4 options
  answer      INTEGER NOT NULL,    -- index of correct option (0-3)
  explanation TEXT,
  difficulty  TEXT,                -- "easy", "medium", "hard"
  next_review DATETIME,            -- spaced repetition
  ease_factor REAL DEFAULT 2.5,    -- SRS ease factor
  created_at  DATETIME
)

-- Reading sessions
reading_sessions (
  id            TEXT PRIMARY KEY,
  book_id       TEXT REFERENCES books(id),
  date          DATE NOT NULL,
  pages_read    INTEGER DEFAULT 0,
  last_page     INTEGER DEFAULT 0, -- resume position
  minutes_spent INTEGER DEFAULT 0,
  quiz_count    INTEGER DEFAULT 0,
  created_at    DATETIME,
  updated_at    DATETIME
)

-- Streak tracking
streaks (
  id              INTEGER PRIMARY KEY,
  current_streak  INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  last_read_date  DATE,
  total_days      INTEGER DEFAULT 0
)

-- Knowledge graph nodes
graph_nodes (
  id        TEXT PRIMARY KEY,
  label     TEXT NOT NULL,         -- concept name
  book_id   TEXT,                  -- source book; nullable for cross-book nodes
  note_id   TEXT,
  x_pos     REAL,
  y_pos     REAL,
  created_at DATETIME
)

-- Knowledge graph edges
graph_edges (
  id          TEXT PRIMARY KEY,
  source_id   TEXT REFERENCES graph_nodes(id),
  target_id   TEXT REFERENCES graph_nodes(id),
  relation    TEXT,                -- "includes", "related to", "leads to"
  created_at  DATETIME
)
```

---

## AI / Gemini API Conventions

### Models To Use
- **Summarization and quiz**: configurable with `GEMINI_SUMMARY_MODEL`; current working default is `gemini-2.5-flash`
- **Chat with book**: configurable with `GEMINI_CHAT_MODEL`; current working default is `gemini-2.5-flash`
- **Entity extraction**: configurable with `GEMINI_QUICK_MODEL`; current working default is `gemini-2.5-flash`
- **Quick tasks (classification, short responses)**: configurable with `GEMINI_QUICK_MODEL`; current working default is `gemini-2.5-flash`
- **Embeddings**: configurable with `GEMINI_EMBEDDING_MODEL`; current working default is `models/gemini-embedding-001`

### Environment Variables (`.env`)

```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_SUMMARY_MODEL=gemini-2.5-flash
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_QUICK_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
CHROMA_PERSIST_DIR=./data/chroma
UPLOAD_DIR=./data/uploads
DATABASE_URL=sqlite:///./data/db.sqlite
CORS_ORIGINS=http://localhost:3000
```

### Prompt Templates (Do Not Change Output Format Without Approval)

All prompt instructions and generated outputs must be in English.

```python
# Summarization prompt - output: structured markdown
SUMMARIZE_PROMPT = """
You are an AI assistant specialized in summarizing educational and technical books.
Summarize the following book excerpt:

{context}

Return the answer in this format:
## Main Ideas
- [bullet points]

## Key Concepts
- [concept name]: [short explanation]

## Action Items
- [practical actions the reader can apply immediately]
"""

# Quiz prompt - output: JSON
QUIZ_PROMPT = """
Create {num_questions} multiple-choice questions from the following content.
Output a JSON array in this exact format:
[{{"question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..."}}]

Content:
{context}
"""

# Entity extraction prompt - output: JSON
ENTITY_PROMPT = """
Extract entities and relationships from the following text.
Output JSON: {{"entities": ["name1","name2"], "relations": [["entity1","relation","entity2"]]}}

Text:
{text}
"""
```

---

## Frontend Conventions

### Design System
- **Font**: Inter (Google Fonts), imported in `layout.tsx`
- **Color Scheme**: Dark mode first, accent color `#6366f1` (indigo-500)
- **Component Library**: shadcn/ui; always prefer it before writing custom components
- **Icons**: Lucide React
- **Language**: all visible UI labels, messages, placeholders, empty states, errors, and help text must be English

### API Client (`frontend/lib/api.ts`)
- Always call the backend through functions in `api.ts`; do not hardcode `fetch` inside components
- Base URL: `http://localhost:8000/api`
- All requests must include error handling
- Streaming responses use `ReadableStream`

### State Management
- **Server state**: React Query (`@tanstack/react-query`)
- **Client state**: Zustand, only when global client state is needed
- Do not use Redux; it is too heavy for this project

---

## Backend Conventions

### FastAPI Standards
- Always use Pydantic schemas for request/response validation
- Always handle errors with `HTTPException`
- Use async functions for all DB queries and AI calls where practical
- API versioning: prefix `/api`; no `/v1` needed at this stage
- All API error messages returned to users must be English

### File Upload
- Max file size: **100MB** per PDF
- Save with UUID filename to avoid conflicts: `{uuid}.pdf`
- Store metadata in SQLite and files in `data/uploads/`

### ChromaDB Collections
- Collection name: `books_{book_id}`; one collection per book
- Chunk size: **500 tokens**, overlap: **50 tokens**
- Metadata per chunk: `{book_id, page_number, chunk_index}`

---

## Security Notes
- Do not commit `.env`; only commit `.env.example`
- Do not commit `data/` (PDF files, SQLite, ChromaDB)
- CORS only allows `localhost:3000`
- File uploads: validate MIME type as `application/pdf`

---

## Progress Tracker

### Repository Preparation
- [x] Add a public README with implemented features and local setup instructions
- [x] Exclude API keys, runtime databases, personal PDFs and third-party music from Git

### Phase 1: Foundation _(Weeks 1-2)_
- [x] Setup Next.js project (frontend/)
- [x] Setup FastAPI project (backend/)
- [x] PDF upload API endpoint
- [x] PDF rendering with react-pdf
- [x] SQLite schema + migrations
- [x] Library view (book grid)
- [x] Reader view (PDF + basic controls)
- [x] Save/restore last reading position

### Phase 2: AI Core _(Weeks 3-4)_
- [x] PyMuPDF text extraction service
- [x] ChromaDB + embedding pipeline
- [x] Summarization API (streaming)
- [x] Quiz generation API (JSON)
- [x] AI Panel UI (collapsible sidebar)
- [x] Chat with book (RAG)

### Phase 3: Gamification _(Week 5)_
- [x] Reading session tracking (start/stop timer)
- [x] Streak calculation logic
- [x] Dashboard: Heatmap calendar
- [x] Reading stats (pages/day, time spent)
- [x] Book progress indicator

### Phase 4: Notes & Knowledge Graph _(Week 6)_
- [x] Highlight text in PDF
- [x] Create note from highlight
- [x] AI entity extraction from notes
- [x] React Flow knowledge graph
- [x] Cross-book node connections

### Phase 5: Audio & Polish _(Weeks 7-8)_
- [x] Web Speech API TTS
- [x] Anki-style flashcard review (SRS)
- [x] Semantic search UI
- [x] Export notes (Markdown)
- [x] Dark mode polish
- [x] Performance optimization

### Phase 6: Library Experience _(Post-Phase 5)_
- [x] Group library books by category
- [x] Add category-specific book icons and visual styles

### Phase 7: Background Music _(Post-Phase 5)_
- [x] Collect background music tracks from `assets/musics`
- [x] Add backend media endpoints for music files and the headphones icon
- [x] Add a global background music player with play, pause, skip, track selection, and volume controls
- [x] Start a random background music track when a reading session begins

### Phase 8: Twilight Background _(Post-Phase 5)_
- [x] Apply the `assets/backgrounds/Dark_purple.md` Twilight Narrative palette to global UI tokens
- [x] Add atmospheric dark purple background layers and glass-style app shell surfaces
- [x] Add selectable PDF page stages for `Dark_purple.md` and `Lumina.md`
- [x] Add selectable PDF page stages for `Golden_Hour.md` and `Emerald Midnight.md`
- [x] Add selectable PDF page appearance filters for original, soft dim, warm paper, and high contrast modes

### Phase 9: Flipbook Page-Turn _(Post-Phase 8)_
- [x] Install react-pageflip dependency
- [x] Create FlipBookPage forwardRef component for flipbook pages
- [x] Integrate HTMLFlipBook into PDFViewer with realistic 3D page flip animation
- [x] Add single-page / two-page spread mode toggle
- [x] Auto-detect small screens and fall back to single-page mode
- [x] Show cover page alone on the right side
- [x] Add expand / reduce (fullscreen) toggle for immersive reading
- [x] Add book spine shadow and flipbook stage themes
- [x] Preserve all existing features (highlights, notes, themes, sessions, zoom, position save)

---

## How to Run (Dev Mode)

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                    # runs on localhost:3000
```

**API Docs**: http://localhost:8000/docs (automatic Swagger UI)  
**Frontend**: http://localhost:3000

---

## Rules for All Coding Agents

1. **Read this file first**; do not skip it.
2. **Update the Progress Tracker** whenever a task is completed by changing `[ ]` to `[x]`.
3. **Update "Last updated"** at the top of this file after each work session.
4. **Do not change the tech stack without approval**. If a change is needed, add it to "Proposed Changes Log" below and ask the user.
5. **Do not hardcode API keys**. Always use environment variables.
6. **Keep the folder structure defined above** unless the user approves a change.
7. **Always write TypeScript** in the frontend; do not use the `any` type.
8. **Always include loading states and error states** in UI components.
9. If you create new files, **update the folder structure** in this file.
10. **Everything visible to app users must be English**, including UI copy, prompts, generated AI section headings, API error messages, seed data examples, and documentation.

---

## Proposed Changes Log

Agents should record proposed architecture changes here before asking the user for approval.

| Date | Agent | Proposed Change | Status |
|---|---|---|---|
| 2026-05-20 | Initial Setup | None | Approved by user |
| 2026-05-21 | Codex | Use currently available Gemini defaults (`gemini-2.5-flash`, `models/gemini-embedding-001`) because the provided key does not support the old `gemini-1.5-pro` / `models/text-embedding-004` names. | Implemented after user asked to proceed |
| 2026-05-21 | Codex | Add separate `GEMINI_CHAT_MODEL` configuration and test Chat with book using `models/gemma-4-31b-it`. | Implemented after user asked to try Gemma 4 |
| 2026-05-21 | Codex | Switch `GEMINI_CHAT_MODEL` back to `gemini-2.5-flash` after testing Gemma 4. | Implemented after user changed preference |

---

*This file was created automatically by Antigravity AI and must be maintained by every coding agent working on this project.*
