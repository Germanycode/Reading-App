"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listDueQuizItems, reviewQuizItem } from "@/lib/api";

export function FlashcardDeck({ bookId }: { bookId: string }) {
  const queryClient = useQueryClient();
  const [showAnswer, setShowAnswer] = useState(false);
  const dueQuery = useQuery({
    queryKey: ["due-quiz", bookId],
    queryFn: () => listDueQuizItems(bookId)
  });
  const reviewMutation = useMutation({
    mutationFn: ({ quizItemId, quality }: { quizItemId: string; quality: number }) => reviewQuizItem(quizItemId, quality),
    onSuccess: async () => {
      setShowAnswer(false);
      await queryClient.invalidateQueries({ queryKey: ["due-quiz", bookId] });
    }
  });
  const currentCard = useMemo(() => dueQuery.data?.[0], [dueQuery.data]);

  return (
    <article className="rounded-md border border-border bg-muted/40 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Flashcards</h2>
        <span className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
          {dueQuery.data?.length ?? 0} due
        </span>
      </div>
      {dueQuery.isLoading ? (
        <p className="mt-5 text-sm text-muted-foreground">Loading review queue...</p>
      ) : dueQuery.isError ? (
        <p className="mt-5 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">Unable to load review cards.</p>
      ) : currentCard ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-md border border-border bg-background/80 p-4">
            <p className="text-sm font-medium">{currentCard.question}</p>
            <div className="mt-4 space-y-2">
              {currentCard.options.map((option, index) => (
                <div
                  key={option}
                  className={`rounded-md border p-2 text-sm ${
                    showAnswer && index === currentCard.answer ? "border-emerald-700 bg-emerald-950/50" : "border-border bg-muted/40"
                  }`}
                >
                  {option}
                </div>
              ))}
            </div>
            {showAnswer ? <p className="mt-4 text-sm text-muted-foreground">{currentCard.explanation}</p> : null}
          </div>
          {showAnswer ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <Button variant="secondary" onClick={() => reviewMutation.mutate({ quizItemId: currentCard.id, quality: 1 })} disabled={reviewMutation.isPending}>
                <X className="mr-2 h-4 w-4" />
                Again
              </Button>
              <Button variant="secondary" onClick={() => reviewMutation.mutate({ quizItemId: currentCard.id, quality: 3 })} disabled={reviewMutation.isPending}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Hard
              </Button>
              <Button onClick={() => reviewMutation.mutate({ quizItemId: currentCard.id, quality: 5 })} disabled={reviewMutation.isPending}>
                <Check className="mr-2 h-4 w-4" />
                Easy
              </Button>
            </div>
          ) : (
            <Button className="w-full" variant="secondary" onClick={() => setShowAnswer(true)}>
              Show Answer
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-5 rounded-md border border-border bg-background/70 p-4 text-sm text-muted-foreground">
          No cards are due. Generate a quiz to create review cards.
        </p>
      )}
    </article>
  );
}
