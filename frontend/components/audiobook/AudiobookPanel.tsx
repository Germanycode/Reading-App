"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMediaUrl, synthesizeAudiobook } from "@/lib/api";

type AudiobookPanelProps = {
  bookId: string;
  pageNumber: number;
  numPages: number | null;
  isExpanded: boolean;
};

const tonePresets = [
  { id: "calm", label: "Calm" },
  { id: "focused", label: "Focused" },
  { id: "warm", label: "Warm" },
  { id: "dramatic", label: "Dramatic" },
  { id: "energetic", label: "Energetic" },
];

const geminiVoices = ["Charon", "Kore", "Puck", "Aoede", "Iapetus", "Sulafat", "Achird", "Gacrux"];

export function AudiobookPanel({ bookId, pageNumber, numPages, isExpanded }: AudiobookPanelProps) {
  const [tone, setTone] = useState("calm");
  const [pageTo, setPageTo] = useState(pageNumber);
  const [geminiVoice, setGeminiVoice] = useState("Charon");
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState("");

  useEffect(() => {
    setPageTo(pageNumber);
    setGeneratedAudioUrl("");
  }, [pageNumber]);

  const selectedTone = useMemo(
    () => tonePresets.find((preset) => preset.id === tone) ?? tonePresets[0],
    [tone]
  );

  const pageRangeEnd = Math.min(numPages ?? pageNumber, Math.max(pageNumber, pageTo));

  const generateAudioMutation = useMutation({
    mutationFn: () =>
      synthesizeAudiobook({
        book_id: bookId,
        page_from: pageNumber,
        page_to: pageRangeEnd,
        voice_name: geminiVoice,
        tone,
      }),
    onSuccess: (result) => {
      setGeneratedAudioUrl(getMediaUrl(result.url));
    },
  });

  return (
    <section
      className={
        isExpanded
          ? "fixed right-4 top-4 z-[70] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-background/95 px-2.5 py-2 shadow-lg backdrop-blur"
          : "border-b border-border bg-background/95 px-3 py-2"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={isExpanded ? "sr-only" : "mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"}>Audiobook</p>
        <div>
          <select
            id="gemini-voice"
            aria-label="Generated voice"
            className="h-8 w-32 rounded-md border border-border bg-background px-2 text-xs"
            value={geminiVoice}
            onChange={(event) => setGeminiVoice(event.target.value)}
          >
            {geminiVoices.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
        </div>
        <select
          id="reader-tone"
          aria-label="Narration tone"
          className="h-8 w-28 rounded-md border border-border bg-background px-2 text-xs"
          value={selectedTone.id}
          onChange={(event) => setTone(event.target.value)}
        >
          {tonePresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          to page
          <input
            className="h-8 w-20 rounded-md border border-border bg-background px-2 text-xs"
            type="number"
            min={pageNumber}
            max={numPages ?? pageNumber}
            value={pageTo}
            onChange={(event) => setPageTo(Number(event.target.value))}
          />
        </label>
        <Button
          className="h-8 gap-1.5 px-2.5 text-xs"
          type="button"
          variant="secondary"
          onClick={() => generateAudioMutation.mutate()}
          disabled={generateAudioMutation.isPending}
        >
          <Wand2 className="h-3.5 w-3.5" />
          {generateAudioMutation.isPending ? "Generating..." : "Generate"}
        </Button>
        {generatedAudioUrl ? (
          <audio className={isExpanded ? "h-8 w-[220px]" : "h-8 min-w-[220px] flex-1"} controls src={generatedAudioUrl} />
        ) : null}
        {generateAudioMutation.isError ? (
          <p className="text-xs text-red-300">
            {generateAudioMutation.error instanceof Error ? generateAudioMutation.error.message : "Unable to generate audio."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
