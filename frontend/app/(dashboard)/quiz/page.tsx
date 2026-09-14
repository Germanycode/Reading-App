"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit } from "lucide-react";
import { listBooks } from "@/lib/api";

export default function QuizIndexPage() {
  const booksQuery = useQuery({
    queryKey: ["books"],
    queryFn: listBooks
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Quiz</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose a book to generate quiz cards or review due flashcards.</p>
      </div>
      {booksQuery.isLoading ? (
        <p className="rounded-md border border-border bg-muted p-6 text-sm text-muted-foreground">Loading books...</p>
      ) : booksQuery.isError ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-200">Unable to load books.</p>
      ) : booksQuery.data && booksQuery.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {booksQuery.data.map((book) => (
            <Link key={book.id} href={`/quiz/${book.id}`} className="rounded-md border border-border bg-muted/50 p-5 transition hover:border-primary/70">
              <BrainCircuit className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-lg font-medium">{book.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{book.author ?? "Unknown author"}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-border bg-muted p-6 text-sm text-muted-foreground">Add a book before starting quiz review.</p>
      )}
    </section>
  );
}
