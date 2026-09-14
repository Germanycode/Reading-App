"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  GraduationCap,
  Library,
  Loader2,
  LucideIcon,
  MessageSquareText,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  TimerReset,
  Trash2,
  TrendingUp,
  Upload,
  UserRoundCog,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/StatusBanner";
import { deleteBook, getBookProgress, indexBookForSearch, listBooks, syncBooks, updateBook, uploadBook } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: books, error, isLoading, isFetching } = useQuery({
    queryKey: ["books"],
    queryFn: listBooks
  });
  const progressQuery = useQuery({
    queryKey: ["book-progress"],
    queryFn: getBookProgress
  });
  const syncMutation = useMutation({
    mutationFn: syncBooks,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["books"] });
    }
  });
  const uploadMutation = useMutation({
    mutationFn: uploadBook,
    onSuccess: async () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["books"] });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["books"] }),
        queryClient.invalidateQueries({ queryKey: ["book-progress"] })
      ]);
    }
  });
  const indexMutation = useMutation({
    mutationFn: indexBookForSearch,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["books"] });
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ bookId, title }: { bookId: string; title: string }) => updateBook(bookId, { title }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["books"] });
    }
  });

  const isBusy = isFetching || syncMutation.isPending || uploadMutation.isPending;
  const progressByBook = new Map((progressQuery.data ?? []).map((item) => [item.book_id, item]));
  const categoryGroups = useMemo(() => groupBooksByCategory(books ?? []), [books]);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    uploadMutation.mutate(file);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Library</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add PDFs, track reading progress, and build AI study material from your books.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => syncMutation.mutate()} disabled={isBusy}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {syncMutation.isPending ? "Syncing..." : "Sync Library"}
          </Button>
          <Button onClick={handleUploadClick} disabled={isBusy}>
            <Upload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? "Uploading..." : "Upload PDF"}
          </Button>
          <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <StatusBanner />

      {syncMutation.isSuccess ? (
        <p className="rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm text-emerald-200">
          Sync complete: scanned {syncMutation.data.scanned}, added {syncMutation.data.created}, updated {syncMutation.data.updated}, skipped {syncMutation.data.skipped}.
        </p>
      ) : null}

      {syncMutation.isError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
          Sync failed. Check that the backend can access the books folder.
        </p>
      ) : null}

      {uploadMutation.isSuccess ? (
        <p className="rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm text-emerald-200">
          Upload complete: {uploadMutation.data.title} is now in your library.
        </p>
      ) : null}

      {uploadMutation.isError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
          Upload failed. Only PDF files up to 100MB are supported.
        </p>
      ) : null}

      {deleteMutation.isError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
          Unable to delete this book.
        </p>
      ) : null}

      {updateMutation.isSuccess ? (
        <p className="rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm text-emerald-200">
          Book title updated and saved into the PDF metadata.
        </p>
      ) : null}

      {updateMutation.isError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
          {updateMutation.error instanceof Error ? updateMutation.error.message : "Unable to update this book title."}
        </p>
      ) : null}

      {indexMutation.isSuccess ? (
        <p className="rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm text-emerald-200">
          Search index complete: processed {indexMutation.data.chunk_count} text chunks from {indexMutation.data.page_count} pages.
        </p>
      ) : null}

      {indexMutation.isError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
          {indexMutation.error instanceof Error ? indexMutation.error.message : "Unable to index this book for search."}
        </p>
      ) : null}

      {progressQuery.isError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
          Unable to load book progress.
        </p>
      ) : null}

      {isLoading ? (
        <p className="rounded-md border border-border bg-muted p-6 text-sm text-muted-foreground">Loading books...</p>
      ) : error ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-200">Unable to load books.</p>
      ) : books && books.length > 0 ? (
        <div className="space-y-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categoryGroups.map((group) => {
              const style = getCategoryStyle(group.category);
              const Icon = style.icon;

              return (
                <a
                  key={group.category}
                  href={`#category-${slugify(group.category)}`}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm transition hover:border-primary/70",
                    style.badgeClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{group.category}</span>
                  <span className="rounded bg-background/60 px-1.5 py-0.5 text-xs text-muted-foreground">{group.books.length}</span>
                </a>
              );
            })}
          </div>

          {categoryGroups.map((group) => {
            const style = getCategoryStyle(group.category);
            const Icon = style.icon;

            return (
              <section key={group.category} id={`category-${slugify(group.category)}`} className="scroll-mt-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-md border", style.iconClass)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold tracking-normal">{group.category}</h2>
                      <p className="text-sm text-muted-foreground">
                        {group.books.length} {group.books.length === 1 ? "book" : "books"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      progress={progressByBook.get(book.id)}
                      isDeleting={deleteMutation.isPending}
                      isIndexing={indexMutation.isPending && indexMutation.variables === book.id}
                      isUpdating={updateMutation.isPending && updateMutation.variables?.bookId === book.id}
                      onDelete={() => deleteMutation.mutate(book.id)}
                      onIndex={() => indexMutation.mutate(book.id)}
                      onUpdateTitle={(title) => updateMutation.mutate({ bookId: book.id, title })}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-muted/60 p-8">
          <BookOpen className="h-8 w-8 text-primary" />
          <h2 className="mt-4 text-xl font-medium">No books yet</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Place PDFs in `assets/books` or use the upload flow once the backend upload endpoint is connected.
          </p>
          <Button className="mt-5" variant="secondary" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {syncMutation.isPending ? "Syncing..." : "Sync Library"}
          </Button>
        </div>
      )}
    </section>
  );
}

type LibraryBook = {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  page_count: number | null;
  is_indexed: boolean;
};

type CategoryGroup = {
  category: string;
  books: LibraryBook[];
};

type LibraryBookProgress = {
  last_page: number;
  page_count: number | null;
  progress_percent: number;
};

type CategoryStyle = {
  icon: LucideIcon;
  iconClass: string;
  badgeClass: string;
  coverClass: string;
};

const CATEGORY_ORDER = [
  "Learning Tech",
  "Learning AI",
  "Communication",
  "Financial",
  "Learn How to Learn",
  "Productivity",
  "Psychology",
  "Leadership",
  "Uploaded",
  "Other",
  "Uncategorized"
];

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Learning Tech": {
    icon: Code2,
    iconClass: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-100",
    coverClass: "from-sky-500/25 to-cyan-400/10 text-sky-200"
  },
  "Learning AI": {
    icon: BrainCircuit,
    iconClass: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    badgeClass: "border-violet-500/30 bg-violet-500/10 text-violet-100",
    coverClass: "from-violet-500/25 to-fuchsia-400/10 text-violet-200"
  },
  Communication: {
    icon: MessageSquareText,
    iconClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    coverClass: "from-amber-500/25 to-yellow-400/10 text-amber-200"
  },
  Financial: {
    icon: TrendingUp,
    iconClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    coverClass: "from-emerald-500/25 to-teal-400/10 text-emerald-200"
  },
  "Learn How to Learn": {
    icon: GraduationCap,
    iconClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-100",
    coverClass: "from-indigo-500/25 to-blue-400/10 text-indigo-200"
  },
  Productivity: {
    icon: TimerReset,
    iconClass: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-100",
    coverClass: "from-rose-500/25 to-pink-400/10 text-rose-200"
  },
  Psychology: {
    icon: Sparkles,
    iconClass: "border-teal-500/30 bg-teal-500/10 text-teal-300",
    badgeClass: "border-teal-500/30 bg-teal-500/10 text-teal-100",
    coverClass: "from-teal-500/25 to-cyan-400/10 text-teal-200"
  },
  Leadership: {
    icon: UserRoundCog,
    iconClass: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-100",
    coverClass: "from-orange-500/25 to-red-400/10 text-orange-200"
  },
  Uploaded: {
    icon: Upload,
    iconClass: "border-lime-500/30 bg-lime-500/10 text-lime-300",
    badgeClass: "border-lime-500/30 bg-lime-500/10 text-lime-100",
    coverClass: "from-lime-500/25 to-green-400/10 text-lime-200"
  },
  Other: {
    icon: Library,
    iconClass: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    badgeClass: "border-slate-500/30 bg-slate-500/10 text-slate-100",
    coverClass: "from-slate-500/25 to-zinc-400/10 text-slate-200"
  },
  Uncategorized: {
    icon: BookOpen,
    iconClass: "border-primary/30 bg-primary/10 text-primary",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
    coverClass: "from-primary/25 to-primary/5 text-primary"
  }
};

function getBookCategory(book: LibraryBook) {
  return book.category?.trim() || "Uncategorized";
}

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? {
    icon: BriefcaseBusiness,
    iconClass: "border-primary/30 bg-primary/10 text-primary",
    badgeClass: "border-primary/30 bg-primary/10 text-primary",
    coverClass: "from-primary/25 to-primary/5 text-primary"
  };
}

function groupBooksByCategory(books: LibraryBook[]): CategoryGroup[] {
  const groups = new Map<string, LibraryBook[]>();

  for (const book of books) {
    const category = getBookCategory(book);
    groups.set(category, [...(groups.get(category) ?? []), book]);
  }

  return [...groups.entries()]
    .map(([category, groupBooks]) => ({
      category,
      books: groupBooks.sort((firstBook, secondBook) => firstBook.title.localeCompare(secondBook.title))
    }))
    .sort((firstGroup, secondGroup) => {
      const firstIndex = CATEGORY_ORDER.indexOf(firstGroup.category);
      const secondIndex = CATEGORY_ORDER.indexOf(secondGroup.category);

      if (firstIndex !== -1 || secondIndex !== -1) {
        return (firstIndex === -1 ? CATEGORY_ORDER.length : firstIndex) - (secondIndex === -1 ? CATEGORY_ORDER.length : secondIndex);
      }

      return firstGroup.category.localeCompare(secondGroup.category);
    });
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function BookCard({
  book,
  progress,
  isDeleting,
  isIndexing,
  isUpdating,
  onDelete,
  onIndex,
  onUpdateTitle
}: {
  book: LibraryBook;
  progress: LibraryBookProgress | undefined;
  isDeleting: boolean;
  isIndexing: boolean;
  isUpdating: boolean;
  onDelete: () => void;
  onIndex: () => void;
  onUpdateTitle: (title: string) => void;
}) {
  const progressPercent = progress?.progress_percent ?? 0;
  const lastPage = progress?.last_page ?? 0;
  const category = getBookCategory(book);
  const style = getCategoryStyle(category);
  const Icon = style.icon;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(book.title);
  const canSaveTitle = titleDraft.trim().length > 0 && titleDraft.trim() !== book.title;

  function startEditingTitle() {
    setTitleDraft(book.title);
    setIsEditingTitle(true);
  }

  function cancelEditingTitle() {
    setTitleDraft(book.title);
    setIsEditingTitle(false);
  }

  function saveTitle() {
    if (!canSaveTitle) {
      return;
    }
    onUpdateTitle(titleDraft.trim());
    setIsEditingTitle(false);
  }

  return (
    <article className="group rounded-md border border-border bg-muted/60 p-5 transition hover:-translate-y-0.5 hover:border-primary/70 hover:bg-muted/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/reader/${book.id}`} className={cn("flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br ring-1 ring-white/10", style.coverClass)}>
            <Icon className="h-7 w-7" />
          </Link>
          {isEditingTitle ? (
            <input
              className="mt-4 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveTitle();
                }
                if (event.key === "Escape") {
                  cancelEditingTitle();
                }
              }}
              autoFocus
            />
          ) : (
            <Link href={`/reader/${book.id}`} className="block">
              <h3 className="mt-4 line-clamp-2 text-lg font-medium leading-snug">{book.title}</h3>
            </Link>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{book.author ?? "Unknown author"}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {isEditingTitle ? (
            <>
              <Button variant="ghost" className="h-9 px-2" onClick={saveTitle} disabled={!canSaveTitle || isUpdating} aria-label="Save title">
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" className="h-9 px-2" onClick={cancelEditingTitle} disabled={isUpdating} aria-label="Cancel title edit">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" className="h-9 px-2" onClick={startEditingTitle} disabled={isUpdating} aria-label="Edit title">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" className="h-9 px-2" onClick={onDelete} disabled={isDeleting || isUpdating} aria-label="Delete book">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Link href={`/reader/${book.id}`} className="block">
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("inline-flex items-center gap-1 rounded border px-2 py-1 font-medium", style.badgeClass)}>
            <Icon className="h-3.5 w-3.5" />
            {category}
          </span>
          {book.page_count ? <span>{book.page_count} pages</span> : null}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded border px-2 py-1 font-medium",
              book.is_indexed
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-border bg-background/60 text-muted-foreground"
            )}
          >
            {book.is_indexed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
            {book.is_indexed ? "Search ready" : "Not indexed"}
          </span>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-background">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {book.page_count ? `Page ${lastPage} of ${book.page_count}` : lastPage > 0 ? `Last page ${lastPage}` : "Not started"}
          </p>
        </div>
      </Link>
      <Button
        className="mt-4 w-full"
        disabled={isIndexing}
        variant={book.is_indexed ? "secondary" : "primary"}
        onClick={onIndex}
      >
        {isIndexing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
        {isIndexing ? "Indexing for search..." : book.is_indexed ? "Re-index Search" : "Index for Search"}
      </Button>
      {isIndexing ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Extracting text, creating embeddings, and saving the local search index.
        </p>
      ) : null}
    </article>
  );
}
