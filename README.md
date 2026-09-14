# Gemany Reading App

A local-first PDF reading and study application with source-grounded AI assistance.

## Features

- PDF library, reading position, highlights, notes, themes and flipbook views.
- AI summaries, study questions and flashcard review.
- Retrieval-augmented book chat and semantic search with page references.
- Knowledge graphs extracted from notes.
- Reading statistics, streaks and audiobook generation.

## Technology

**Frontend:** Next.js, React, TypeScript, Tailwind CSS, TanStack Query, Zustand,
React PDF, React Flow and Recharts.

**Backend:** Python, FastAPI, SQLAlchemy, SQLite, PyMuPDF, ChromaDB, LangChain,
Google Gemini and optional OpenRouter integration.

## Run locally

Requirements: Python compatible with `backend/requirements.txt`, Node.js and npm.

From the project root, configure the backend:

```powershell
Copy-Item backend/.env.example backend/.env
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Edit `backend/.env` with your own API keys before using AI features. In a second
terminal, start the frontend:

```powershell
cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000>. API documentation is available at
<http://localhost:8000/docs>. Once dependencies are installed, Windows users can
also use `Start Reading App.bat` and `Stop Reading App.bat`.

Upload your own PDF files in the library or follow
[the books folder guide](assets/books/README.md). Personal books, API keys,
databases, generated audio and third-party music are excluded from this repository.
Background music is optional; add your own authorized audio to `assets/musics/`.

## Architecture

```text
frontend/        Next.js user interface
backend/app/     FastAPI routes, data models and AI services
assets/          Local asset directories and documentation
scripts/         Windows startup and shutdown helpers
```

PDF text is split into overlapping chunks, embedded and stored in ChromaDB with
book and page metadata. Book chat retrieves relevant chunks to generate answers
with source-page references. Notes, reading progress and other structured data
are stored in SQLite.

## Privacy and current scope

This project is designed for personal use. Storage is local, while enabled AI
features send selected document text, notes or PDF content to the configured
provider. The default development services run on localhost.

The repository contains implemented application flows; it does not claim a
production deployment or measured learning outcomes. Do not expose the application
to the public internet without reviewing authentication and deployment security.

See [AGENT.md](AGENT.md) for project conventions.
