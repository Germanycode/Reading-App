"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Download, Network, Pencil, Plus, Save, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNote, deleteNote, exportNotesMarkdown, extractEntitiesFromNote, listNotes, updateNote } from "@/lib/api";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReaderNotesPanelProps = {
  bookId: string;
  pageNumber: number;
  selectedText: string;
  isExpanded: boolean;
  onClearSelection: () => void;
};

const NOTES_HEIGHT_STORAGE_KEY = "reader-notes-panel-height";
const DEFAULT_NOTES_HEIGHT = 320;
const MIN_NOTES_HEIGHT = 180;

export function ReaderNotesPanel({ bookId, pageNumber, selectedText, isExpanded, onClearSelection }: ReaderNotesPanelProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [panelHeight, setPanelHeight] = useState(DEFAULT_NOTES_HEIGHT);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ pointerY: 0, height: DEFAULT_NOTES_HEIGHT });
  const speech = useSpeechSynthesis();
  const notesQuery = useQuery({
    queryKey: ["notes", bookId],
    queryFn: () => listNotes(bookId)
  });
  const createMutation = useMutation({
    mutationFn: () =>
      createNote({
        book_id: bookId,
        page_number: pageNumber,
        content: content.trim() || selectedText.trim(),
        highlight: selectedText.trim() || null,
        color: "yellow"
      }),
    onSuccess: async () => {
      setContent("");
      onClearSelection();
      await queryClient.invalidateQueries({ queryKey: ["notes", bookId] });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes", bookId] });
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ noteId, content, highlight }: { noteId: string; content: string; highlight: string | null }) =>
      updateNote(noteId, {
        content,
        highlight,
        color: "yellow"
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes", bookId] }),
        queryClient.invalidateQueries({ queryKey: ["knowledge-graph"] })
      ]);
    }
  });
  const extractMutation = useMutation({
    mutationFn: extractEntitiesFromNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["knowledge-graph"] });
    }
  });
  const exportMutation = useMutation({
    mutationFn: () => exportNotesMarkdown(bookId),
    onSuccess: (markdown) => {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reading-notes.md";
      link.click();
      URL.revokeObjectURL(url);
    }
  });
  const pageNotes = useMemo(
    () => (notesQuery.data ?? []).filter((note) => note.page_number === pageNumber),
    [notesQuery.data, pageNumber]
  );
  const canCreate = Boolean(selectedText.trim() || content.trim());

  const getMaxPanelHeight = useCallback(() => {
    if (typeof window === "undefined") {
      return DEFAULT_NOTES_HEIGHT;
    }

    return Math.max(MIN_NOTES_HEIGHT, Math.floor(window.innerHeight * 0.62));
  }, []);

  const clampPanelHeight = useCallback(
    (height: number) => Math.min(getMaxPanelHeight(), Math.max(MIN_NOTES_HEIGHT, Math.round(height))),
    [getMaxPanelHeight]
  );

  useEffect(() => {
    const savedHeight = Number.parseInt(window.localStorage.getItem(NOTES_HEIGHT_STORAGE_KEY) ?? "", 10);
    if (Number.isFinite(savedHeight)) {
      setPanelHeight(clampPanelHeight(savedHeight));
    }
  }, [clampPanelHeight]);

  useEffect(() => {
    function handleResize() {
      setPanelHeight((currentHeight) => clampPanelHeight(currentHeight));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPanelHeight]);

  useEffect(() => {
    window.localStorage.setItem(NOTES_HEIGHT_STORAGE_KEY, String(panelHeight));
  }, [panelHeight]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(event: globalThis.PointerEvent) {
      const nextHeight = resizeStartRef.current.height + resizeStartRef.current.pointerY - event.clientY;
      setPanelHeight(clampPanelHeight(nextHeight));
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
  }, [clampPanelHeight, isResizing]);

  function startResize(event: PointerEvent<HTMLButtonElement>) {
    if (!isExpanded || isMinimized) {
      return;
    }

    resizeStartRef.current = {
      pointerY: event.clientY,
      height: panelHeight
    };
    setIsResizing(true);
  }

  function handleResizeKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setPanelHeight((currentHeight) => clampPanelHeight(currentHeight + 20));
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPanelHeight((currentHeight) => clampPanelHeight(currentHeight - 20));
    }
  }

  const panelStyle = isExpanded
    ? ({
        "--reader-notes-height": `${isMinimized ? 44 : panelHeight}px`
      } as CSSProperties)
    : undefined;
  const maxPanelHeight = getMaxPanelHeight();

  return (
    <aside
      className={cn(
        "rounded-md border border-border bg-muted/40 p-4",
        isExpanded && "relative h-[var(--reader-notes-height)] shrink-0 rounded-none border-x-0 border-b-0 p-3 transition-[height]",
        isExpanded && !isMinimized && "overflow-y-auto",
        isExpanded && isMinimized && "overflow-hidden"
      )}
      style={panelStyle}
    >
      {isExpanded && !isMinimized ? (
        <button
          aria-label="Resize notes panel"
          aria-orientation="horizontal"
          aria-valuemax={maxPanelHeight}
          aria-valuemin={MIN_NOTES_HEIGHT}
          aria-valuenow={panelHeight}
          className={cn(
            "absolute inset-x-0 top-0 z-10 flex h-3 -translate-y-1.5 cursor-row-resize touch-none items-center justify-center outline-none",
            "after:h-1 after:w-16 after:rounded-full after:bg-border after:opacity-70 after:transition hover:after:bg-primary focus-visible:after:bg-primary",
            isResizing && "after:bg-primary after:opacity-100"
          )}
          role="separator"
          title="Drag to resize notes"
          type="button"
          onKeyDown={handleResizeKeyDown}
          onPointerDown={startResize}
        />
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Notes</h2>
          <p className={isExpanded && isMinimized ? "hidden" : "mt-1 text-xs text-muted-foreground"}>Page {pageNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">{pageNotes.length}</span>
          {isExpanded ? (
            <Button
              aria-label={isMinimized ? "Expand notes" : "Minimize notes"}
              className="h-8 w-8 p-0"
              title={isMinimized ? "Expand notes" : "Minimize notes"}
              type="button"
              variant="ghost"
              onClick={() => setIsMinimized((value) => !value)}
            >
              {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      </div>

      {isExpanded && isMinimized ? null : (
        <>

      {selectedText ? (
        <div className="mt-4 rounded-md border border-primary/50 bg-primary/10 p-3">
          <p className="line-clamp-3 text-sm">{selectedText}</p>
        </div>
      ) : null}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a note or select text from the page."
        className="mt-4 min-h-24 w-full resize-y rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary"
      />
      <Button className="mt-3 w-full" onClick={() => createMutation.mutate()} disabled={!canCreate || createMutation.isPending}>
        <Plus className="mr-2 h-4 w-4" />
        {createMutation.isPending ? "Saving..." : "Save Note"}
      </Button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={() => (speech.isSpeaking ? speech.stop() : speech.speak(selectedText || content))}
          disabled={!speech.isSupported || !canCreate}
        >
          {speech.isSpeaking ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
          {speech.isSpeaking ? "Stop" : "Speak"}
        </Button>
        <Button variant="secondary" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {createMutation.isError ? (
        <p className="mt-3 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-200">
          {createMutation.error instanceof Error ? createMutation.error.message : "Unable to save this note."}
        </p>
      ) : null}

      {updateMutation.isError ? (
        <p className="mt-3 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-200">
          {updateMutation.error instanceof Error ? updateMutation.error.message : "Unable to update this note."}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {notesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        ) : notesQuery.isError ? (
          <p className="text-sm text-red-200">Unable to load notes.</p>
        ) : pageNotes.length > 0 ? (
          pageNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isDeleting={deleteMutation.isPending}
              isExtracting={extractMutation.isPending}
              isUpdating={updateMutation.isPending && updateMutation.variables?.noteId === note.id}
              onDelete={() => deleteMutation.mutate(note.id)}
              onExtract={() => extractMutation.mutate(note.id)}
              onUpdate={(content, highlight) => updateMutation.mutateAsync({ noteId: note.id, content, highlight })}
              onSpeak={() => speech.speak([note.highlight, note.content].filter(Boolean).join(". "))}
              canSpeak={speech.isSupported}
            />
          ))
        ) : (
          <p className="rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">No notes on this page yet.</p>
        )}
      </div>
        </>
      )}
    </aside>
  );
}

function NoteCard({
  note,
  isDeleting,
  isExtracting,
  isUpdating,
  onDelete,
  onExtract,
  onUpdate,
  onSpeak,
  canSpeak
}: {
  note: Note;
  isDeleting: boolean;
  isExtracting: boolean;
  isUpdating: boolean;
  onDelete: () => void;
  onExtract: () => void;
  onUpdate: (content: string, highlight: string | null) => Promise<unknown>;
  onSpeak: () => void;
  canSpeak: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(note.content);
  const [draftHighlight, setDraftHighlight] = useState(note.highlight ?? "");
  const canSave = Boolean(draftContent.trim() || draftHighlight.trim());

  function startEditing() {
    setDraftContent(note.content);
    setDraftHighlight(note.highlight ?? "");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftContent(note.content);
    setDraftHighlight(note.highlight ?? "");
    setIsEditing(false);
  }

  async function saveEditing() {
    if (!canSave) {
      return;
    }

    await onUpdate(draftContent.trim(), draftHighlight.trim() || null);
    setIsEditing(false);
  }

  return (
    <article className="rounded-md border border-border bg-background/70 p-3">
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            className="min-h-16 w-full resize-y rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-primary"
            placeholder="Highlight text"
            value={draftHighlight}
            onChange={(event) => setDraftHighlight(event.target.value)}
          />
          <textarea
            className="min-h-24 w-full resize-y rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-primary"
            placeholder="Note"
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
          />
        </div>
      ) : (
        <>
          {note.highlight ? <p className="rounded-sm bg-yellow-300/20 px-2 py-1 text-sm text-yellow-100">{note.highlight}</p> : null}
          <p className="mt-2 whitespace-pre-wrap text-sm">{note.content}</p>
        </>
      )}
      <div className="mt-3 flex gap-2">
        {isEditing ? (
          <>
            <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => void saveEditing()} disabled={!canSave || isUpdating}>
              <Save className="mr-1 h-3.5 w-3.5" />
              {isUpdating ? "Saving" : "Save"}
            </Button>
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={cancelEditing} disabled={isUpdating}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" className="h-8 px-2 text-xs" onClick={onExtract} disabled={isExtracting}>
              <Network className="mr-1 h-3.5 w-3.5" />
              Graph
            </Button>
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={startEditing} aria-label="Edit note">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={onSpeak} disabled={!canSpeak} aria-label="Speak note">
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" className="h-8 px-2 text-xs" onClick={onDelete} disabled={isDeleting} aria-label="Delete note">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
