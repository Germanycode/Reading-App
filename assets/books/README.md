# Assets - PDF Books Folder

This folder stores all PDF documents. The app will automatically scan this folder on startup and import books into the library.

---

## Folder Structure

```text
assets/
`-- books/
    |-- Learning Tech/       <- Programming, DevOps, Cloud, and related topics
    |-- Learning AI/         <- Machine Learning, Deep Learning, LLMs, and related topics
    |-- Communication/       <- Communication, public speaking, and writing
    |-- Financial/           <- Personal finance, investing, and business
    |-- Learn How to Learn/  <- Learning methods, thinking, and memory
    |-- Productivity/        <- Time management, GTD, and habits
    |-- Psychology/          <- Psychology, behavior, and mindset
    |-- Leadership/          <- Leadership, management, and team building
    `-- Other/               <- Books that do not fit the categories above
```

---

## How to Add a New Book

1. **Copy the PDF file** into the correct category folder.
2. **Use a clear filename**: `Book Title - Author Name.pdf`  
   Example: `Deep Learning - Ian Goodfellow.pdf`
3. **Restart the app** or click **Sync Library** in the UI.
4. The app will automatically:
   - Read metadata such as title, author, and page count
   - Extract text and create AI embeddings
   - Add the book to the library with the correct category

---

## Filename Convention

| Recommended | Avoid |
|---|---|
| `Clean Code - Robert Martin.pdf` | `book.pdf` |
| `Atomic Habits - James Clear.pdf` | `download(1).pdf` |
| `AI for Everyone - Andrew Ng.pdf` | `random-good-book.pdf` |

---

## How the App Processes New Books

```text
PDF file is added to assets/books/[Category]/
        |
Backend scans the folder on startup or sync
        |
PyMuPDF extracts text, metadata, and page count
        |
LangChain chunks text at 500 tokens per chunk
        |
Gemini creates embeddings, then stores them in ChromaDB
        |
SQLite stores metadata, then the book appears in Library
```

---

## Categories

| Category | Recommended book types |
|---|---|
| **Learning Tech** | Python, JavaScript, System Design, DevOps, Kubernetes, Cloud |
| **Learning AI** | ML/DL papers, LLMs, Computer Vision, NLP, Data Science |
| **Communication** | Public speaking, Writing, Negotiation, Storytelling |
| **Financial** | Personal finance, Investing, Accounting, Startups |
| **Learn How to Learn** | Memory techniques, Speed reading, Study methods, Feynman technique |
| **Productivity** | GTD, Deep Work, Time management, Habit building |
| **Psychology** | Cognitive biases, Behavioral economics, Mindset |
| **Leadership** | Management, Team dynamics, OKRs, Culture |
| **Other** | Fiction or books that do not fit the groups above |

---

## Notes

- Only **`.pdf`** files are supported for now. `.epub` and `.mobi` are not supported at this stage.
- Large files over 100MB may take longer to process.
- Do not delete `.gitkeep` files; they preserve the folder structure in Git.
- Do not commit copyrighted books in `assets/books/`. This folder is covered by `.gitignore`.
