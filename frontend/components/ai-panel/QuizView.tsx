"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Wand2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQuiz } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/types";

type QuizViewProps = {
  bookId: string;
};

export function QuizView({ bookId }: QuizViewProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [questionCount, setQuestionCount] = useState(5);
  const [pageFrom, setPageFrom] = useState("");
  const [pageTo, setPageTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerateQuiz() {
    setError(null);
    setIsGenerating(true);
    setSelectedAnswers({});

    try {
      const generatedQuestions = await generateQuiz({
        book_id: bookId,
        num_questions: questionCount,
        page_from: parseOptionalPage(pageFrom),
        page_to: parseOptionalPage(pageTo),
        max_context_chars: 24000,
        difficulty: "medium"
      });
      setQuestions(generatedQuestions);
    } catch (quizError) {
      setError(quizError instanceof Error ? quizError.message : "Unable to generate quiz questions.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Questions
          <input
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            max={20}
            min={1}
            type="number"
            value={questionCount}
            onChange={(event) => setQuestionCount(clampQuestionCount(event.target.value))}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Start
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
          End
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

      <Button className="w-full gap-2" disabled={isGenerating} variant="secondary" onClick={handleGenerateQuiz}>
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        {isGenerating ? "Generating" : "Generate Quiz"}
      </Button>

      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="max-h-[44vh] space-y-3 overflow-auto pr-1">
        {questions.length === 0 ? (
          <div className="rounded-md border border-border bg-background/60 p-3 text-sm text-muted-foreground">
            No quiz questions have been generated for this session.
          </div>
        ) : (
          questions.map((question, questionIndex) => {
            const selectedAnswer = selectedAnswers[questionIndex];
            return (
              <article key={`${question.question}-${questionIndex}`} className="rounded-md border border-border bg-background p-3">
                <h3 className="text-sm font-medium leading-6">{question.question}</h3>
                <div className="mt-3 space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = selectedAnswer === optionIndex;
                    const isCorrect = selectedAnswer !== undefined && question.answer === optionIndex;
                    const isWrongSelection = isSelected && question.answer !== optionIndex;

                    return (
                      <button
                        key={`${option}-${optionIndex}`}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-md border border-border bg-muted/30 p-2 text-left text-sm transition hover:border-primary",
                          isCorrect && "border-emerald-700 bg-emerald-950/40 text-emerald-100",
                          isWrongSelection && "border-red-800 bg-red-950/40 text-red-100"
                        )}
                        type="button"
                        onClick={() => setSelectedAnswers((answers) => ({ ...answers, [questionIndex]: optionIndex }))}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : isWrongSelection ? (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px]">
                            {optionIndex + 1}
                          </span>
                        )}
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedAnswer !== undefined ? (
                  <p className="mt-3 rounded-md bg-muted/50 p-2 text-xs leading-5 text-muted-foreground">{question.explanation}</p>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function parseOptionalPage(value: string) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}

function clampQuestionCount(value: string) {
  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedValue)) {
    return 1;
  }
  return Math.min(20, Math.max(1, parsedValue));
}
