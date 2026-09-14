import type {
  Book,
  BookIndexResult,
  BookProgress,
  BookSyncResult,
  BookUpdate,
  BookTextExtraction,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  EntityExtractionResponse,
  FullBookSummaryRequest,
  GraphNode,
  KnowledgeGraph,
  MusicTrack,
  Note,
  NoteCreate,
  NoteUpdate,
  QuizItem,
  QuizQuestion,
  ReadingActivityDay,
  QuizRequest,
  ReadingPosition,
  ReadingSession,
  ReadingStats,
  SearchResponse,
  Streak,
  AudiobookSynthesisRequest,
  AudiobookSynthesisResponse,
  SummarizeRequest
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const AI_REQUEST_TIMEOUT_MS = 120_000;
const FULL_BOOK_SUMMARY_TIMEOUT_MS = 600_000;
const INDEX_REQUEST_TIMEOUT_MS = 600_000;

async function request<T>(path: string, init?: RequestInit, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...init?.headers
      }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The request timed out. Check the backend connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestStream(path: string, init?: RequestInit): Promise<ReadableStream<Uint8Array>> {
  return requestStreamWithTimeout(path, init, AI_REQUEST_TIMEOUT_MS);
}

async function requestStreamWithTimeout(
  path: string,
  init: RequestInit | undefined,
  timeoutMs: number
): Promise<ReadableStream<Uint8Array>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers
      }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The AI request timed out. Try a smaller page range or check the backend connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("The server did not return a streaming response.");
  }

  return response.body;
}

export function getHealth() {
  return request<HealthResponse>("/health");
}

async function readErrorDetail(response: Response) {
  const body = await response.text();
  if (!body) {
    return "";
  }

  try {
    const payload = JSON.parse(body) as { detail?: unknown };
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      return "The server rejected the request. Check the form values and try again.";
    }
  } catch {
    return body;
  }

  return body;
}

export function getMediaUrl(path: string) {
  return path.startsWith("/api/") ? `${API_ORIGIN}${path}` : `${API_BASE_URL}${path}`;
}

export function listMusicTracks() {
  return request<MusicTrack[]>("/media/music");
}

export function listBooks() {
  return request<Book[]>("/books");
}

export function syncBooks() {
  return request<BookSyncResult>("/books/sync", {
    method: "POST"
  });
}

export function uploadBook(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<Book>("/books/upload", {
    method: "POST",
    body: formData
  });
}

export function updateBook(bookId: string, requestBody: BookUpdate) {
  return request<Book>(`/books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify(requestBody)
  });
}

export async function deleteBook(bookId: string) {
  const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }
}

export function indexBookForSearch(bookId: string) {
  return request<BookIndexResult>(`/books/${bookId}/index`, {
    method: "POST"
  }, INDEX_REQUEST_TIMEOUT_MS);
}

export function getBookFileUrl(bookId: string) {
  return `${API_BASE_URL}/books/${bookId}/file`;
}

export function getBookText(bookId: string, pageFrom?: number, pageTo?: number) {
  const params = new URLSearchParams();
  if (pageFrom) {
    params.set("page_from", String(pageFrom));
  }
  if (pageTo) {
    params.set("page_to", String(pageTo));
  }
  const query = params.toString();
  return request<BookTextExtraction>(`/books/${bookId}/text${query ? `?${query}` : ""}`);
}

export function synthesizeAudiobook(requestBody: AudiobookSynthesisRequest) {
  return request<AudiobookSynthesisResponse>(
    "/audiobooks/synthesize",
    {
      method: "POST",
      body: JSON.stringify(requestBody)
    },
    FULL_BOOK_SUMMARY_TIMEOUT_MS
  );
}

export function getReadingPosition(bookId: string) {
  return request<ReadingPosition>(`/tracker/books/${bookId}/position`);
}

export function getStreak() {
  return request<Streak>("/tracker/streak");
}

export function getReadingActivity(days = 98) {
  return request<ReadingActivityDay[]>(`/tracker/activity?days=${days}`);
}

export function getReadingStats() {
  return request<ReadingStats>("/tracker/stats");
}

export function getBookProgress() {
  return request<BookProgress[]>("/tracker/books/progress");
}

export function updateReadingPosition(bookId: string, lastPage: number) {
  return request<ReadingPosition>(`/tracker/books/${bookId}/position`, {
    method: "PUT",
    body: JSON.stringify({ last_page: lastPage })
  });
}

export function startReadingSession(bookId: string, currentPage: number) {
  return request<ReadingSession>(`/tracker/books/${bookId}/sessions/start`, {
    method: "POST",
    body: JSON.stringify({ current_page: currentPage })
  });
}

export function stopReadingSession(bookId: string, startedPage: number, lastPage: number, elapsedSeconds: number) {
  return request<ReadingSession>(`/tracker/books/${bookId}/sessions/stop`, {
    method: "POST",
    body: JSON.stringify({
      started_page: startedPage,
      last_page: lastPage,
      elapsed_seconds: elapsedSeconds
    })
  });
}

export async function streamBookSummary(requestBody: SummarizeRequest, onChunk: (chunk: string) => void) {
  const stream = await requestStream("/ai/summarize", {
    method: "POST",
    body: JSON.stringify(requestBody)
  });
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    onChunk(decoder.decode(value, { stream: true }));
  }

  const finalChunk = decoder.decode();
  if (finalChunk) {
    onChunk(finalChunk);
  }
}

export async function streamFullBookSummary(requestBody: FullBookSummaryRequest, onChunk: (chunk: string) => void) {
  const stream = await requestStreamWithTimeout(
    "/ai/summarize-full",
    {
      method: "POST",
      body: JSON.stringify(requestBody)
    },
    FULL_BOOK_SUMMARY_TIMEOUT_MS
  );
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    onChunk(decoder.decode(value, { stream: true }));
  }

  const finalChunk = decoder.decode();
  if (finalChunk) {
    onChunk(finalChunk);
  }
}

export function generateQuiz(requestBody: QuizRequest) {
  return request<QuizQuestion[]>("/ai/quiz", {
    method: "POST",
    body: JSON.stringify(requestBody)
  }, AI_REQUEST_TIMEOUT_MS);
}

export function listDueQuizItems(bookId: string) {
  return request<QuizItem[]>(`/quiz/${bookId}/due`);
}

export function reviewQuizItem(quizItemId: string, quality: number) {
  return request<QuizItem>(`/quiz/${quizItemId}/review`, {
    method: "POST",
    body: JSON.stringify({ quality })
  });
}

export function chatWithBook(requestBody: ChatRequest) {
  return request<ChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(requestBody)
  }, AI_REQUEST_TIMEOUT_MS);
}

export function listNotes(bookId?: string) {
  const query = bookId ? `?book_id=${encodeURIComponent(bookId)}` : "";
  return request<Note[]>(`/notes${query}`);
}

export async function exportNotesMarkdown(bookId?: string) {
  const query = bookId ? `?book_id=${encodeURIComponent(bookId)}` : "";
  const response = await fetch(`${API_BASE_URL}/notes/export${query}`);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.text();
}

export function createNote(requestBody: NoteCreate) {
  return request<Note>("/notes", {
    method: "POST",
    body: JSON.stringify(requestBody)
  });
}

export function updateNote(noteId: string, requestBody: NoteUpdate) {
  return request<Note>(`/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(requestBody)
  });
}

export async function deleteNote(noteId: string) {
  const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }
}

export function extractEntitiesFromNote(noteId: string) {
  return request<EntityExtractionResponse>("/ai/entities", {
    method: "POST",
    body: JSON.stringify({ note_id: noteId })
  }, AI_REQUEST_TIMEOUT_MS);
}

export function getKnowledgeGraph() {
  return request<KnowledgeGraph>("/graph");
}

export function updateGraphNodePosition(nodeId: string, xPos: number, yPos: number) {
  return request<GraphNode>(`/graph/nodes/${nodeId}/position`, {
    method: "PUT",
    body: JSON.stringify({ x_pos: xPos, y_pos: yPos })
  });
}

export function semanticSearch(bookId: string, query: string, limit = 8) {
  const params = new URLSearchParams({ book_id: bookId, query, limit: String(limit) });
  return request<SearchResponse>(`/search?${params.toString()}`, undefined, AI_REQUEST_TIMEOUT_MS);
}
