"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamBookSummary, streamFullBookSummary } from "@/lib/api";

type SummaryViewProps = {
  bookId: string;
};

export function SummaryView({ bookId }: SummaryViewProps) {
  const [summary, setSummary] = useState("");
  const [pageFrom, setPageFrom] = useState("");
  const [pageTo, setPageTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFullBook, setIsGeneratingFullBook] = useState(false);

  async function handleGenerateSummary() {
    setSummary("");
    setError(null);
    setIsGenerating(true);

    try {
      await streamBookSummary(
        {
          book_id: bookId,
          page_from: parseOptionalPage(pageFrom),
          page_to: parseOptionalPage(pageTo),
          max_context_chars: 24000
        },
        (chunk) => setSummary((currentSummary) => `${currentSummary}${chunk}`)
      );
    } catch (summaryError) {
      setError(summaryError instanceof Error ? summaryError.message : "Unable to generate the summary.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateFullBookSummary() {
    setSummary("");
    setError(null);
    setIsGeneratingFullBook(true);

    try {
      await streamFullBookSummary(
        {
          book_id: bookId,
          pages_per_chunk: 10,
          max_chunk_chars: 45000,
          max_parallel_requests: 5
        },
        (chunk) => setSummary((currentSummary) => `${currentSummary}${chunk}`)
      );
    } catch (summaryError) {
      setError(summaryError instanceof Error ? summaryError.message : "Unable to generate the full-book summary.");
    } finally {
      setIsGeneratingFullBook(false);
    }
  }

  const isBusy = isGenerating || isGeneratingFullBook;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Start page
          <input
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            inputMode="numeric"
            min={1}
            placeholder="1"
            type="number"
            value={pageFrom}
            onChange={(event) => setPageFrom(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          End page
          <input
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            inputMode="numeric"
            min={1}
            placeholder="Auto"
            type="number"
            value={pageTo}
            onChange={(event) => setPageTo(event.target.value)}
          />
        </label>
      </div>

      <Button className="w-full gap-2" disabled={isBusy} variant="secondary" onClick={handleGenerateSummary}>
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isGenerating ? "Generating" : "Generate Summary"}
      </Button>

      <Button className="w-full gap-2" disabled={isBusy} onClick={handleGenerateFullBookSummary}>
        {isGeneratingFullBook ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isGeneratingFullBook ? "Generating Full Book" : "Full Book Study Guide"}
      </Button>

      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      {summary ? (
        <div className="max-h-[42vh] overflow-auto rounded-md border border-border bg-background p-3">
          <MarkdownSummary markdown={summary} />
        </div>
      ) : (
        <div className="rounded-md border border-border bg-background/60 p-3 text-sm text-muted-foreground">
          No summary has been generated for this session.
        </div>
      )}
    </section>
  );
}

function parseOptionalPage(value: string) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}

function MarkdownSummary({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/);

  return (
    <div className="space-y-2 text-sm leading-6 text-foreground">
      {lines.map((line, index) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={`${line}-${index}`} className="pt-2 text-base font-semibold">
              {line.replace(/^##\s+/, "")}
            </h2>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <p key={`${line}-${index}`} className="pl-4 text-muted-foreground before:mr-2 before:content-['•']">
              {line.replace(/^-\s+/, "")}
            </p>
          );
        }

        if (!line.trim()) {
          return <div key={`blank-${index}`} className="h-1" />;
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}
