"use client";

import { useEffect } from "react";
import type { Note } from "@/lib/types";

type HighlightLayerProps = {
  pageNumber: number;
  notes: Note[];
};

export function HighlightLayer({ pageNumber, notes }: HighlightLayerProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const page = document.querySelector(`[data-page-number="${pageNumber}"]`);
      const textLayer = page?.querySelector(".react-pdf__Page__textContent");
      if (!textLayer) {
        return;
      }

      const spans = Array.from(textLayer.querySelectorAll("span"));
      spans.forEach((span) => {
        span.classList.remove("pdf-highlight");
      });

      const highlights = notes
        .filter((note) => note.page_number === pageNumber && note.highlight)
        .map((note) => normalizeText(note.highlight ?? ""));

      if (!highlights.length) {
        return;
      }

      spans.forEach((span) => {
        const text = normalizeText(span.textContent ?? "");
        if (text && highlights.some((highlight) => highlight.includes(text) || text.includes(highlight))) {
          span.classList.add("pdf-highlight");
        }
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [notes, pageNumber]);

  return null;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
