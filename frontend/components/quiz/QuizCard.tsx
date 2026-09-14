"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { generateQuiz } from "@/lib/api";

export function QuizCard({ bookId }: { bookId: string }) {
  const queryClient = useQueryClient();
  const quizMutation = useMutation({
    mutationFn: () => generateQuiz({ book_id: bookId, num_questions: 5 }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["due-quiz", bookId] });
    }
  });

  return (
    <article className="rounded-md border border-border bg-muted/40 p-6">
      <h2 className="text-lg font-medium">Multiple Choice</h2>
      <p className="mt-2 text-sm text-muted-foreground">Generate fresh questions from this book and add them to your review queue.</p>
      <Button className="mt-5" variant="secondary" onClick={() => quizMutation.mutate()} disabled={quizMutation.isPending}>
        {quizMutation.isPending ? "Generating..." : "Generate Quiz"}
      </Button>
      {quizMutation.isSuccess ? (
        <p className="mt-4 rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm text-emerald-200">
          Added {quizMutation.data.length} review cards.
        </p>
      ) : null}
      {quizMutation.isError ? (
        <p className="mt-4 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">
          Unable to generate quiz questions. Make sure the backend has a Gemini API key and the book can be parsed.
        </p>
      ) : null}
    </article>
  );
}
