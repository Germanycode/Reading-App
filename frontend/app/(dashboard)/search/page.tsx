"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBooks, semanticSearch } from "@/lib/api";
import type { Book } from "@/lib/types";

const EMPTY_BOOKS: Book[] = [];

export default function SearchPage() {
  const [bookId, setBookId] = useState("");
  const [query, setQuery] = useState("");
  const booksQuery = useQuery({
    queryKey: ["books"],
    queryFn: listBooks
  });
  const searchMutation = useMutation({
    mutationFn: (params: { bookId: string; query: string }) => semanticSearch(params.bookId, params.query, 8)
  });
  const books = booksQuery.data ?? EMPTY_BOOKS;
  const selectedBookId = useMemo(() => bookId || books[0]?.id || "", [bookId, books]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBookId || !query.trim()) {
      return;
    }
    searchMutation.mutate({ bookId: selectedBookId, query: query.trim() });
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Semantic Search</h1>
        <p className="mt-2 text-sm text-muted-foreground">Search indexed book meaning, not just exact words.</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-md border border-border bg-muted/40 p-5">
        <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)_auto]">
          <select
            value={selectedBookId}
            onChange={(event) => setBookId(event.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            disabled={booksQuery.isLoading}
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a concept, question, or phrase"
            className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <Button type="submit" disabled={!selectedBookId || !query.trim() || searchMutation.isPending}>
            <Search className="mr-2 h-4 w-4" />
            {searchMutation.isPending ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>

      {booksQuery.isError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">Unable to load books.</p>
      ) : null}
      {searchMutation.isError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
          Unable to search this book. Index the book first by using chat or the book index endpoint.
        </p>
      ) : null}
      {searchMutation.data ? (
        <div className="space-y-3">
          {searchMutation.data.results.length > 0 ? (
            searchMutation.data.results.map((result) => (
              <Link
                key={`${result.book_id}-${result.page_number}-${result.chunk_index}`}
                href={`/reader/${result.book_id}`}
                className="block rounded-md border border-border bg-muted/40 p-4 transition hover:border-primary/70"
              >
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Page {result.page_number}</span>
                  <span>{result.score === null ? "Score unavailable" : `Score ${result.score.toFixed(3)}`}</span>
                </div>
                <p className="mt-3 line-clamp-4 text-sm">{result.text}</p>
              </Link>
            ))
          ) : (
            <p className="rounded-md border border-border bg-muted/40 p-5 text-sm text-muted-foreground">No matches found.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
