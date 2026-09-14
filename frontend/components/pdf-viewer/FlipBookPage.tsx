"use client";

import React from "react";
import { Page } from "react-pdf";
import { HighlightLayer } from "@/components/pdf-viewer/HighlightLayer";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

type FlipBookPageProps = {
  pageNumber: number;
  scale: number;
  notes: Note[];
  pageBackground: string;
  width: number;
  height: number;
  shouldRender: boolean;
};

/**
 * A single page inside the flipbook.
 * Must use forwardRef so react-pageflip can measure and animate it.
 */
export const FlipBookPage = React.forwardRef<HTMLDivElement, FlipBookPageProps>(
  function FlipBookPage(
    { pageNumber, notes, pageBackground, width, height, shouldRender },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn("flip-page", getFlipPageBgClass(pageBackground))}
        style={{ width, height }}
      >
        {shouldRender ? (
          <>
            <Page
              pageNumber={pageNumber}
              width={width}
              className="flip-page-content"
              loading={
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    Loading...
                  </span>
                </div>
              }
              renderAnnotationLayer={false}
              renderTextLayer={true}
            />
            <HighlightLayer pageNumber={pageNumber} notes={notes} />
          </>
        ) : null}
      </div>
    );
  }
);

function getFlipPageBgClass(bg: string): string {
  const map: Record<string, string> = {
    white: "",
    dark: "pdf-page-bg-dark",
    cream: "pdf-page-bg-cream",
    gray: "pdf-page-bg-gray",
    green: "pdf-page-bg-green",
  };
  return map[bg] ?? "";
}
