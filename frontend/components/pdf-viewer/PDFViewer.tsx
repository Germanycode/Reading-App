"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useMutation, useQuery } from "@tanstack/react-query";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { AudiobookPanel } from "@/components/audiobook/AudiobookPanel";
import { HighlightLayer } from "@/components/pdf-viewer/HighlightLayer";
import {
  PageControls,
  type ReaderBackgroundTheme,
  type ReaderPageBackground,
  type ReaderViewMode,
} from "@/components/pdf-viewer/PageControls";
import { ReaderNotesPanel } from "@/components/pdf-viewer/ReaderNotesPanel";
import { useReadingSession } from "@/hooks/useReadingSession";
import {
  getBookFileUrl,
  getReadingPosition,
  listNotes,
  updateReadingPosition,
} from "@/lib/api";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const READER_BACKGROUND_STORAGE_KEY = "reader-background-theme";
const READER_PAGE_BG_STORAGE_KEY = "reader-page-background";
const READER_VIEW_MODE_STORAGE_KEY = "reader-view-mode";
const SMALL_SCREEN_BREAKPOINT = 768;
/* Default page dimensions tuned for reading at 100% zoom. */
const DEFAULT_PAGE_WIDTH = 700;
const DEFAULT_PAGE_HEIGHT = 933;

export function PDFViewer({ bookId, initialPage }: { bookId: string; initialPage?: number }) {
  const fileUrl = getBookFileUrl(bookId);

  /* ─── Core state ─── */
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [hasLoadedSavedPosition, setHasLoadedSavedPosition] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [backgroundTheme, setBackgroundTheme] =
    useState<ReaderBackgroundTheme>("dark-purple");
  const [pageBackground, setPageBackground] =
    useState<ReaderPageBackground>("white");
  const [viewMode, setViewMode] = useState<ReaderViewMode>("double");
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [readerViewportWidth, setReaderViewportWidth] = useState(0);

  /* ─── Refs ─── */
  const restoredPageRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const readerViewportRef = useRef<HTMLDivElement>(null);

  /* ─── Queries ─── */
  const readingSession = useReadingSession(bookId);

  const positionQuery = useQuery({
    queryKey: ["reading-position", bookId],
    queryFn: () => getReadingPosition(bookId),
    retry: 1,
  });

  const positionMutation = useMutation({
    mutationFn: (lastPage: number) => updateReadingPosition(bookId, lastPage),
  });

  const notesQuery = useQuery({
    queryKey: ["notes", bookId],
    queryFn: () => listNotes(bookId),
  });

  /* ─── Responsive: detect small screens ─── */
  useEffect(() => {
    function handleResize() {
      setIsSmallScreen(window.innerWidth < SMALL_SCREEN_BREAKPOINT);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const element = readerViewportRef.current;
    if (!element) return;
    const observedElement = element;

    function updateReaderWidth() {
      setReaderViewportWidth(observedElement.clientWidth);
    }

    updateReaderWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateReaderWidth);
      return () => window.removeEventListener("resize", updateReaderWidth);
    }

    const resizeObserver = new ResizeObserver(updateReaderWidth);
    resizeObserver.observe(observedElement);
    return () => resizeObserver.disconnect();
  }, []);

  /* ─── Restore persisted preferences ─── */
  useEffect(() => {
    const savedTheme = window.localStorage.getItem(
      READER_BACKGROUND_STORAGE_KEY
    );
    if (isReaderBackgroundTheme(savedTheme)) {
      setBackgroundTheme(savedTheme);
    }

    const savedPageBg = window.localStorage.getItem(
      READER_PAGE_BG_STORAGE_KEY
    );
    if (isReaderPageBackground(savedPageBg)) {
      setPageBackground(savedPageBg);
    }

    const savedMode = window.localStorage.getItem(
      READER_VIEW_MODE_STORAGE_KEY
    );
    if (savedMode === "single" || savedMode === "double") {
      setViewMode(savedMode);
    }

    setHasLoadedPreferences(true);
  }, []);

  /* ─── Persist preferences ─── */
  useEffect(() => {
    if (!hasLoadedPreferences) return;
    window.localStorage.setItem(
      READER_BACKGROUND_STORAGE_KEY,
      backgroundTheme
    );
  }, [backgroundTheme, hasLoadedPreferences]);

  useEffect(() => {
    if (!hasLoadedPreferences) return;
    window.localStorage.setItem(READER_PAGE_BG_STORAGE_KEY, pageBackground);
  }, [hasLoadedPreferences, pageBackground]);

  useEffect(() => {
    if (!hasLoadedPreferences) return;
    window.localStorage.setItem(READER_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [hasLoadedPreferences, viewMode]);

  /* ─── Restore reading position ─── */
  useEffect(() => {
    if (positionQuery.data && !hasLoadedSavedPosition) {
      const restoredPage = Math.max(1, initialPage ?? positionQuery.data.last_page);
      restoredPageRef.current = restoredPage;
      setPageNumber(restoredPage);
      setHasLoadedSavedPosition(true);
    }
  }, [hasLoadedSavedPosition, initialPage, positionQuery.data]);

  /* ─── Save reading position ─── */
  useEffect(() => {
    if (!hasLoadedSavedPosition || !numPages) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (restoredPageRef.current === pageNumber) {
        restoredPageRef.current = null;
        return;
      }
      positionMutation.mutate(pageNumber);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [hasLoadedSavedPosition, numPages, pageNumber, positionMutation]);

  /* ─── Compute page dimensions ─── */
  const pageDimensions = useMemo(() => {
    const w = Math.round(DEFAULT_PAGE_WIDTH * scale);
    const h = Math.round(DEFAULT_PAGE_HEIGHT * scale);
    return { width: w, height: h };
  }, [scale]);

  /* ─── Derived ─── */
  const canFitDoublePage =
    readerViewportWidth === 0 ||
    readerViewportWidth >= pageDimensions.width * 2 + 96;
  const effectiveViewMode: ReaderViewMode =
    isSmallScreen || !canFitDoublePage ? "single" : viewMode;
  const renderedPageNumbers = useMemo(() => {
    if (!numPages) return [];
    if (effectiveViewMode === "single" || pageNumber === 1) {
      return [pageNumber];
    }

    const spreadStart = pageNumber % 2 === 0 ? pageNumber : pageNumber - 1;
    return [spreadStart, spreadStart + 1].filter((page) => page <= numPages);
  }, [effectiveViewMode, numPages, pageNumber]);

  /* ─── Handlers ─── */
  function handleLoadSuccess({
    numPages: loadedPages,
  }: {
    numPages: number;
  }) {
    setNumPages(loadedPages);
    setPageNumber((currentPage) =>
      Math.min(Math.max(1, currentPage), loadedPages)
    );
  }

  function goToPreviousPage() {
    setPageNumber((p) => {
      if (effectiveViewMode === "double" && p > 2) {
        return Math.max(1, p - 2);
      }
      return Math.max(1, p - 1);
    });
  }

  function goToNextPage() {
    setPageNumber((p) => {
      const step = effectiveViewMode === "double" && p > 1 ? 2 : 1;
      return numPages ? Math.min(numPages, p + step) : p + step;
    });
  }

  function jumpToPage(targetPage: number) {
    if (!Number.isFinite(targetPage)) return;
    const nextPage = numPages
      ? Math.min(numPages, Math.max(1, targetPage))
      : Math.max(1, targetPage);
    setPageNumber(nextPage);
  }

  function zoomOut() {
    setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(1))));
  }

  function zoomIn() {
    setScale((s) => Math.min(2.0, Number((s + 0.1).toFixed(1))));
  }

  function startSession() {
    window.dispatchEvent(new Event("reading-app:start-background-music"));
    void readingSession.startSession(pageNumber).catch(() => undefined);
  }

  function stopSession() {
    void readingSession.stopSession(pageNumber).catch(() => undefined);
  }

  function captureSelection() {
    const selection = window.getSelection();
    const text = selection?.toString().replace(/\s+/g, " ").trim() ?? "";
    if (text) {
      setSelectedText(text);
    }
  }

  function toggleExpand() {
    setIsExpanded((v) => !v);
  }

  /* ─── Render ─── */
  return (
    <div
      className={cn(
        "grid min-h-screen gap-0",
        isExpanded && "flipbook-expanded"
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          "flex min-h-screen min-w-0 flex-col bg-muted/40",
          isExpanded && "flipbook-expanded-viewer"
        )}
      >
        <div className="border-b border-border px-4 py-3">
          <PageControls
            pageNumber={pageNumber}
            numPages={numPages}
            scale={scale}
            backgroundTheme={backgroundTheme}
            pageBackground={pageBackground}
            viewMode={viewMode}
            isSmallScreen={isSmallScreen}
            isExpanded={isExpanded}
            isSessionActive={readingSession.isActive}
            elapsedSeconds={readingSession.elapsedSeconds}
            isSessionPending={
              readingSession.isStarting || readingSession.isStopping
            }
            onPreviousPage={goToPreviousPage}
            onNextPage={goToNextPage}
            onPageJump={jumpToPage}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onBackgroundThemeChange={setBackgroundTheme}
            onPageBackgroundChange={setPageBackground}
            onViewModeChange={setViewMode}
            onToggleExpand={toggleExpand}
            onStartSession={startSession}
            onStopSession={stopSession}
          />
        </div>
        <AudiobookPanel
          bookId={bookId}
          pageNumber={pageNumber}
          numPages={numPages}
          isExpanded={isExpanded}
        />
        <div
          ref={readerViewportRef}
          className={cn(
            "grid min-h-0 flex-1 place-items-center overflow-auto p-0 transition-colors",
            getReaderBackdropClass(backgroundTheme)
          )}
          onMouseUp={captureSelection}
        >
          {positionQuery.isLoading ? (
            <p className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
              Restoring reading position...
            </p>
          ) : positionQuery.isError ? (
            <p className="rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
              Unable to restore reading position. The book will open at page 1.
            </p>
          ) : null}

          {readingSession.error ? (
            <p className="mb-4 rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
              Unable to save the reading session. {readingSession.error}
            </p>
          ) : null}

          {notesQuery.isError ? (
            <p className="mb-4 rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
              Unable to load saved highlights.
            </p>
          ) : null}

          <Document
            file={fileUrl}
            loading={
              <p className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
                Loading PDF...
              </p>
            }
            error={
              <p className="rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
                Unable to load this PDF.
              </p>
            }
            onLoadSuccess={handleLoadSuccess}
          >
            {numPages && numPages > 0 ? (
              <div
                className={cn(
                  "reader-page-stage",
                  getFlipbookStageClass(backgroundTheme)
                )}
              >
                <button
                  aria-label="Previous page"
                  className="reader-edge-zone reader-edge-zone-left"
                  disabled={pageNumber <= 1}
                  type="button"
                  onClick={goToPreviousPage}
                />
                <div
                  className={cn(
                    "reader-page-spread",
                    renderedPageNumbers.length === 1 &&
                      "reader-page-spread-single"
                  )}
                >
                  {renderedPageNumbers.map((renderedPageNumber) => (
                    <div
                      key={renderedPageNumber}
                      className={cn(
                        "reader-pdf-page",
                        getPageBackgroundClass(pageBackground)
                      )}
                    >
                      <Page
                        pageNumber={renderedPageNumber}
                        width={pageDimensions.width}
                        className="reader-pdf-page-content"
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
                      <HighlightLayer
                        pageNumber={renderedPageNumber}
                        notes={notesQuery.data ?? []}
                      />
                    </div>
                  ))}
                </div>
                <button
                  aria-label="Next page"
                  className="reader-edge-zone reader-edge-zone-right"
                  disabled={numPages !== null && pageNumber >= numPages}
                  type="button"
                  onClick={goToNextPage}
                />
              </div>
            ) : null}
          </Document>
        </div>
      </div>
      <ReaderNotesPanel
        bookId={bookId}
        pageNumber={pageNumber}
        selectedText={selectedText}
        isExpanded={isExpanded}
        onClearSelection={() => setSelectedText("")}
      />
    </div>
  );
}

/* ─── Utilities ─── */

function isReaderBackgroundTheme(
  value: string | null
): value is ReaderBackgroundTheme {
  return (
    value === "dark" ||
    value === "dark-purple" ||
    value === "dark-red" ||
    value === "lumina" ||
    value === "golden-hour" ||
    value === "emerald-midnight"
  );
}

function isReaderPageBackground(
  value: string | null
): value is ReaderPageBackground {
  return (
    value === "white" ||
    value === "dark" ||
    value === "cream" ||
    value === "gray" ||
    value === "green"
  );
}

function getReaderBackdropClass(theme: ReaderBackgroundTheme) {
  const classes: Record<ReaderBackgroundTheme, string> = {
    dark: "pdf-reader-backdrop-dark",
    "dark-purple": "pdf-reader-backdrop-dark-purple",
    "dark-red": "pdf-reader-backdrop-dark-red",
    lumina: "pdf-reader-backdrop-lumina",
    "golden-hour": "pdf-reader-backdrop-golden-hour",
    "emerald-midnight": "pdf-reader-backdrop-emerald-midnight",
  };
  return classes[theme];
}

function getFlipbookStageClass(theme: ReaderBackgroundTheme) {
  const classes: Record<ReaderBackgroundTheme, string> = {
    dark: "flipbook-stage-dark",
    "dark-purple": "flipbook-stage-dark-purple",
    "dark-red": "flipbook-stage-dark-red",
    lumina: "flipbook-stage-lumina",
    "golden-hour": "flipbook-stage-golden-hour",
    "emerald-midnight": "flipbook-stage-emerald-midnight",
  };
  return classes[theme];
}

function getPageBackgroundClass(bg: ReaderPageBackground): string {
  const map: Record<ReaderPageBackground, string> = {
    white: "",
    dark: "pdf-page-bg-dark",
    cream: "pdf-page-bg-cream",
    gray: "pdf-page-bg-gray",
    green: "pdf-page-bg-green",
  };
  return map[bg];
}
