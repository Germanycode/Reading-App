import { FlashcardDeck } from "@/components/quiz/FlashcardDeck";
import { QuizCard } from "@/components/quiz/QuizCard";

export default async function QuizPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Quiz</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <QuizCard bookId={bookId} />
        <FlashcardDeck bookId={bookId} />
      </div>
    </section>
  );
}

export function generateStaticParams() {
  return [];
}
