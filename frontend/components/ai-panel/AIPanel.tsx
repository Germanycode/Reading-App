"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { BookOpenText, ChevronLeft, ChevronRight, MessageSquare, Sparkles, Wand2 } from "lucide-react";
import { ChatView } from "@/components/ai-panel/ChatView";
import { QuizView } from "@/components/ai-panel/QuizView";
import { SummaryView } from "@/components/ai-panel/SummaryView";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PANEL_WIDTH_STORAGE_KEY = "reader-ai-panel-width";
const DEFAULT_PANEL_WIDTH = 320;
const MIN_PANEL_WIDTH = 280;

export function AIPanel({ bookId }: { bookId: string }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "quiz" | "chat">("summary");
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ pointerX: 0, width: DEFAULT_PANEL_WIDTH });

  const getMaxPanelWidth = useCallback(() => {
    if (typeof window === "undefined") {
      return DEFAULT_PANEL_WIDTH;
    }

    return Math.max(MIN_PANEL_WIDTH, Math.floor(window.innerWidth / 2));
  }, []);

  const clampPanelWidth = useCallback(
    (width: number) => Math.min(getMaxPanelWidth(), Math.max(MIN_PANEL_WIDTH, Math.round(width))),
    [getMaxPanelWidth]
  );

  useEffect(() => {
    const savedWidth = Number.parseInt(window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY) ?? "", 10);
    if (Number.isFinite(savedWidth)) {
      setPanelWidth(clampPanelWidth(savedWidth));
    }
  }, [clampPanelWidth]);

  useEffect(() => {
    function handleResize() {
      setPanelWidth((currentWidth) => clampPanelWidth(currentWidth));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPanelWidth]);

  useEffect(() => {
    window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(event: globalThis.PointerEvent) {
      const nextWidth = resizeStartRef.current.width + resizeStartRef.current.pointerX - event.clientX;
      setPanelWidth(clampPanelWidth(nextWidth));
    }

    function stopResize() {
      setIsResizing(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize, { once: true });

    return () => {
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
    };
  }, [clampPanelWidth, isResizing]);

  function startResize(event: PointerEvent<HTMLButtonElement>) {
    if (window.innerWidth < 1024) {
      return;
    }

    resizeStartRef.current = {
      pointerX: event.clientX,
      width: panelWidth
    };
    setIsResizing(true);
  }

  function handleResizeKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPanelWidth((currentWidth) => clampPanelWidth(currentWidth + 20));
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPanelWidth((currentWidth) => clampPanelWidth(currentWidth - 20));
    }
  }

  if (isCollapsed) {
    return (
      <aside className="flex min-h-screen w-full items-start justify-center border-l border-border bg-muted/40 p-1.5 lg:w-12">
        <Button
          aria-label="Expand AI panel"
          className="h-9 w-9 p-0"
          title="Expand AI panel"
          variant="ghost"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </aside>
    );
  }

  const panelStyle = {
    "--ai-panel-width": `${panelWidth}px`
  } as CSSProperties;
  const maxPanelWidth = getMaxPanelWidth();

  return (
    <aside
      className="relative flex min-h-screen w-full flex-col border-l border-border bg-muted/40 lg:w-[var(--ai-panel-width)]"
      style={panelStyle}
    >
      <button
        aria-label="Resize AI panel"
        aria-orientation="vertical"
        aria-valuemax={maxPanelWidth}
        aria-valuemin={MIN_PANEL_WIDTH}
        aria-valuenow={panelWidth}
        className={cn(
          "absolute inset-y-0 left-0 hidden w-2 -translate-x-1 cursor-col-resize touch-none items-center justify-center outline-none lg:flex",
          "after:h-16 after:w-1 after:rounded-full after:bg-border after:opacity-60 after:transition hover:after:bg-primary focus-visible:after:bg-primary",
          isResizing && "after:bg-primary after:opacity-100"
        )}
        role="separator"
        title="Drag to resize AI panel"
        type="button"
        onKeyDown={handleResizeKeyDown}
        onPointerDown={startResize}
      />
      <div className="flex items-center justify-between border-b border-border p-2">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpenText className="h-5 w-5 shrink-0 text-primary" />
          <h2 className="truncate text-base font-medium">AI Panel</h2>
        </div>
        <Button
          aria-label="Collapse AI panel"
          className="h-9 w-9 p-0"
          title="Collapse AI panel"
          variant="ghost"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 border-b border-border p-1.5">
        <PanelTab
          icon={<Sparkles className="h-4 w-4" />}
          isActive={activeTab === "summary"}
          label="Summary"
          onClick={() => setActiveTab("summary")}
        />
        <PanelTab
          icon={<Wand2 className="h-4 w-4" />}
          isActive={activeTab === "quiz"}
          label="Quiz"
          onClick={() => setActiveTab("quiz")}
        />
        <PanelTab
          icon={<MessageSquare className="h-4 w-4" />}
          isActive={activeTab === "chat"}
          label="Chat"
          onClick={() => setActiveTab("chat")}
        />
      </div>

      <div className="flex-1 overflow-hidden p-2">
        {activeTab === "summary" ? <SummaryView bookId={bookId} /> : null}
        {activeTab === "quiz" ? <QuizView bookId={bookId} /> : null}
        {activeTab === "chat" ? <ChatView bookId={bookId} /> : null}
      </div>
    </aside>
  );
}

type PanelTabProps = {
  icon: ReactNode;
  isActive: boolean;
  label: string;
  onClick: () => void;
};

function PanelTab({ icon, isActive, label, onClick }: PanelTabProps) {
  return (
    <button
      className={cn(
        "flex h-9 items-center justify-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition hover:bg-background hover:text-foreground",
        isActive && "bg-background text-foreground"
      )}
      type="button"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
