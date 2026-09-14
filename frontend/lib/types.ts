export type Book = {
  id: string;
  title: string;
  author: string | null;
  file_path: string;
  file_size: number | null;
  category: string | null;
  page_count: number | null;
  cover_url: string | null;
  is_indexed: boolean;
  created_at: string;
  updated_at: string;
};

export type BookSyncResult = {
  scanned: number;
  created: number;
  updated: number;
  skipped: number;
  books: Book[];
};

export type BookUpdate = {
  title: string;
};

export type BookIndexResult = {
  book_id: string;
  collection_name: string;
  chunk_count: number;
  page_count: number;
  is_indexed: boolean;
};

export type BookPageText = {
  page_number: number;
  text: string;
  char_count: number;
  word_count: number;
};

export type BookTextExtraction = {
  book_id: string;
  title: string;
  author: string | null;
  page_count: number;
  page_from: number;
  page_to: number;
  total_char_count: number;
  total_word_count: number;
  pages: BookPageText[];
};

export type AudiobookSynthesisRequest = {
  book_id: string;
  page_from: number;
  page_to: number;
  voice_name: string;
  tone: string;
  speaking_style?: string | null;
};

export type AudiobookSynthesisResponse = {
  book_id: string;
  page_from: number;
  page_to: number;
  voice_name: string;
  tone: string;
  filename: string;
  url: string;
};

export type HealthResponse = {
  status: "ok";
  app: string;
};

export type MusicTrack = {
  id: string;
  title: string;
  filename: string;
  url: string;
};

export type ReadingPosition = {
  book_id: string;
  last_page: number;
};

export type ReadingSession = {
  id: string;
  book_id: string;
  date: string;
  pages_read: number;
  last_page: number;
  minutes_spent: number;
  quiz_count: number;
  created_at: string;
  updated_at: string;
};

export type Streak = {
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
  total_days: number;
};

export type ReadingActivityDay = {
  date: string;
  pages_read: number;
  minutes_spent: number;
  session_count: number;
};

export type ReadingStats = {
  total_pages_read: number;
  total_minutes_spent: number;
  total_sessions: number;
  active_days: number;
  average_pages_per_day: number;
  average_minutes_per_day: number;
  best_day: ReadingActivityDay | null;
};

export type BookProgress = {
  book_id: string;
  last_page: number;
  page_count: number | null;
  progress_percent: number;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type QuizItem = QuizQuestion & {
  id: string;
  book_id: string;
  difficulty: string | null;
  next_review: string | null;
  ease_factor: number;
  created_at: string;
};

export type QuizRequest = {
  book_id: string;
  num_questions?: number;
  page_from?: number;
  page_to?: number;
  max_context_chars?: number;
  difficulty?: string;
};

export type SummarizeRequest = {
  book_id: string;
  page_from?: number;
  page_to?: number;
  max_context_chars?: number;
};

export type FullBookSummaryRequest = {
  book_id: string;
  pages_per_chunk?: number;
  max_chunk_chars?: number;
  max_parallel_requests?: number;
};

export type ChatRequest = {
  book_id: string;
  question: string;
  limit?: number;
};

export type ChatSource = {
  page_number: number;
  chunk_index: number;
  score: number | null;
  text: string;
};

export type ChatResponse = {
  answer: string;
  sources: ChatSource[];
};

export type Note = {
  id: string;
  book_id: string;
  page_number: number | null;
  content: string;
  highlight: string | null;
  color: string;
  created_at: string;
};

export type NoteCreate = {
  book_id: string;
  page_number?: number | null;
  content: string;
  highlight?: string | null;
  color?: string;
};

export type NoteUpdate = {
  content: string;
  highlight?: string | null;
  color?: string;
};

export type EntityExtractionResponse = {
  entities: string[];
  relations: [string, string, string][];
  node_count: number;
  edge_count: number;
};

export type GraphNode = {
  id: string;
  label: string;
  book_id: string | null;
  note_id: string | null;
  book_title: string | null;
  page_number: number | null;
  note_content: string | null;
  note_highlight: string | null;
  x_pos: number | null;
  y_pos: number | null;
  created_at: string;
};

export type GraphEdge = {
  id: string;
  source_id: string;
  target_id: string;
  relation: string | null;
  created_at: string;
};

export type KnowledgeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type SearchResultItem = {
  text: string;
  score: number | null;
  book_id: string;
  page_number: number;
  chunk_index: number;
};

export type SearchResponse = {
  book_id: string;
  query: string;
  results: SearchResultItem[];
};
