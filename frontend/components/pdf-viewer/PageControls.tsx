"use client";

import {
  Book,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Maximize2,
  Minimize2,
  Play,
  Square,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ReaderBackgroundTheme =
  | "dark"
  | "dark-purple"
  | "dark-red"
  | "lumina"
  | "golden-hour"
  | "emerald-midnight";
export type ReaderPageBackground =
  | "white"
  | "dark"
  | "cream"
  | "gray"
  | "green";
export type ReaderViewMode = "single" | "double";

type PageControlsProps = {
  pageNumber: number;
  numPages: number | null;
  scale: number;
  backgroundTheme: ReaderBackgroundTheme;
  pageBackground: ReaderPageBackground;
  viewMode: ReaderViewMode;
  isSmallScreen: boolean;
  isExpanded: boolean;
  isSessionActive: boolean;
  elapsedSeconds: number;
  isSessionPending: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageJump: (pageNumber: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBackgroundThemeChange: (theme: ReaderBackgroundTheme) => void;
  onPageBackgroundChange: (bg: ReaderPageBackground) => void;
  onViewModeChange: (mode: ReaderViewMode) => void;
  onToggleExpand: () => void;
  onStartSession: () => void;
  onStopSession: () => void;
};

export function PageControls({
  pageNumber,
  numPages,
  scale,
  backgroundTheme,
  pageBackground,
  viewMode,
  isSmallScreen,
  isExpanded,
  isSessionActive,
  elapsedSeconds,
  isSessionPending,
  onPreviousPage,
  onNextPage,
  onPageJump,
  onZoomIn,
  onZoomOut,
  onBackgroundThemeChange,
  onPageBackgroundChange,
  onViewModeChange,
  onToggleExpand,
  onStartSession,
  onStopSession,
}: PageControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {/* ── Page navigation ── */}
      <div className="inline-flex items-center rounded-md border border-border bg-background/60">
        <Button
          className="h-8 px-2"
          variant="ghost"
          aria-label="Previous page"
          onClick={onPreviousPage}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <input
          aria-label="Jump to page"
          className="h-8 w-14 border-x border-border bg-transparent px-1 text-center text-xs outline-none focus:bg-background"
          inputMode="numeric"
          min={1}
          max={numPages ?? undefined}
          type="number"
          value={pageNumber}
          onChange={(event) => onPageJump(Number(event.target.value))}
        />
        <span className="min-w-12 px-2 text-xs text-muted-foreground">
          /{numPages ?? "..."}
        </span>
        <Button
          className="h-8 px-2"
          variant="ghost"
          aria-label="Next page"
          onClick={onNextPage}
          disabled={numPages !== null && pageNumber >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Zoom ── */}
      <div className="inline-flex items-center rounded-md border border-border bg-background/60">
        <Button
          className="h-8 px-2"
          variant="ghost"
          aria-label="Zoom out"
          onClick={onZoomOut}
          disabled={scale <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-12 border-x border-border px-2 text-center text-xs text-muted-foreground">
          {Math.round(scale * 100)}%
        </span>
        <Button
          className="h-8 px-2"
          variant="ghost"
          aria-label="Zoom in"
          onClick={onZoomIn}
          disabled={scale >= 2.0}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* ── View mode toggle (single / double page) ── */}
      {!isSmallScreen && (
        <div className="inline-flex items-center rounded-md border border-border bg-background/60">
          <Button
            className="h-8 px-2"
            variant={viewMode === "single" ? "secondary" : "ghost"}
            aria-label="Single page mode"
            title="Single page"
            onClick={() => onViewModeChange("single")}
          >
            <Book className="h-4 w-4" />
          </Button>
          <Button
            className="h-8 px-2"
            variant={viewMode === "double" ? "secondary" : "ghost"}
            aria-label="Two-page spread mode"
            title="Two-page spread"
            onClick={() => onViewModeChange("double")}
          >
            <BookOpen className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Expand / Reduce ── */}
      <Button
        className="h-8 px-2"
        variant="ghost"
        aria-label={isExpanded ? "Exit full view" : "Expand to full view"}
        title={isExpanded ? "Reduce" : "Expand"}
        onClick={onToggleExpand}
      >
        {isExpanded ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>

      {/* ── Background theme ── */}
      <select
        className="h-8 max-w-36 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none transition focus:border-primary"
        value={backgroundTheme}
        onChange={(event) =>
          onBackgroundThemeChange(
            event.target.value as ReaderBackgroundTheme
          )
        }
        aria-label="Choose reader background"
      >
        <option value="dark">Dark</option>
        <option value="dark-purple">Dark Purple</option>
        <option value="dark-red">Dark Red</option>
        <option value="lumina">Lumina</option>
        <option value="golden-hour">Golden Hour</option>
        <option value="emerald-midnight">Emerald</option>
      </select>

      {/* ── Page background filter ── */}
      <select
        className="h-8 max-w-28 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none transition focus:border-primary"
        value={pageBackground}
        onChange={(event) =>
          onPageBackgroundChange(
            event.target.value as ReaderPageBackground
          )
        }
        aria-label="Choose PDF page background color"
      >
        <option value="white">White</option>
        <option value="dark">Dark</option>
        <option value="cream">Cream</option>
        <option value="gray">Gray</option>
        <option value="green">Green</option>
      </select>

      {/* ── Reading session timer ── */}
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-2 py-1">
        <span className="inline-flex min-w-14 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatElapsedTime(elapsedSeconds)}
        </span>
        {isSessionActive ? (
          <Button
            className="h-7 px-2 text-xs"
            variant="secondary"
            onClick={onStopSession}
            disabled={isSessionPending}
            aria-label="Stop reading session"
          >
            <Square className="mr-1 h-3.5 w-3.5" />
            Stop
          </Button>
        ) : (
          <Button
            className="h-7 px-2 text-xs"
            onClick={onStartSession}
            disabled={isSessionPending || numPages === null}
            aria-label="Start reading session"
          >
            <Play className="mr-1 h-3.5 w-3.5" />
            Start
          </Button>
        )}
      </div>
    </div>
  );
}

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
