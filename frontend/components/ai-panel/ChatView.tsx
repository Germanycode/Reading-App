"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatWithBook } from "@/lib/api";
import type { ChatSource } from "@/lib/types";

type ChatViewProps = {
  bookId: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
};

export function ChatView({ bookId }: ChatViewProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: cleanQuestion
    };
    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");
    setError(null);
    setIsSending(true);

    try {
      const response = await chatWithBook({
        book_id: bookId,
        question: cleanQuestion,
        limit: 6
      });
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          sources: response.sources
        }
      ]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Unable to chat with this book.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="flex h-full min-h-[520px] flex-col gap-3">
      <div className="min-h-0 flex-1 space-y-3 overflow-auto rounded-md border border-border bg-background/60 p-3">
        {messages.length === 0 ? (
          <div className="text-sm leading-6 text-muted-foreground">
            Ask a question about this book. The answer will use indexed excerpts and cite source pages.
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-8 rounded-md bg-primary p-3 text-sm leading-6 text-primary-foreground"
                  : "mr-8 rounded-md border border-border bg-muted/40 p-3 text-sm leading-6"
              }
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {message.sources && message.sources.length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Sources</p>
                  {message.sources.slice(0, 3).map((source) => (
                    <details key={`${source.page_number}-${source.chunk_index}`} className="rounded-md bg-background/70 p-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        Page {source.page_number}
                        {source.score === null ? "" : `, score ${source.score.toFixed(2)}`}
                      </summary>
                      <p className="mt-2 line-clamp-5 text-xs leading-5 text-muted-foreground">{source.text}</p>
                    </details>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <textarea
          className="min-h-24 w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          placeholder="Ask a question about this book"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <Button className="w-full gap-2" disabled={isSending || !question.trim()} type="submit" variant="secondary">
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isSending ? "Sending" : "Send"}
        </Button>
      </form>
    </section>
  );
}
