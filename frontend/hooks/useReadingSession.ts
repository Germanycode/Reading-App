"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { startReadingSession, stopReadingSession } from "@/lib/api";
import type { ReadingSession } from "@/lib/types";

type UseReadingSessionResult = {
  isActive: boolean;
  elapsedSeconds: number;
  minutesSpent: number;
  startedPage: number | null;
  lastSavedSession: ReadingSession | null;
  isStarting: boolean;
  isStopping: boolean;
  error: string | null;
  startSession: (currentPage: number) => Promise<void>;
  stopSession: (currentPage: number) => Promise<void>;
};

export function useReadingSession(bookId: string): UseReadingSessionResult {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [startedPage, setStartedPage] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastSavedSession, setLastSavedSession] = useState<ReadingSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startMutation = useMutation({
    mutationFn: (currentPage: number) => startReadingSession(bookId, currentPage)
  });

  const stopMutation = useMutation({
    mutationFn: (payload: { startedPage: number; lastPage: number; elapsedSeconds: number }) =>
      stopReadingSession(bookId, payload.startedPage, payload.lastPage, payload.elapsedSeconds)
  });

  useEffect(() => {
    if (startedAt === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [startedAt]);

  const startSession = useCallback(
    async (currentPage: number) => {
      setError(null);
      const session = await startMutation.mutateAsync(currentPage);
      setLastSavedSession(session);
      setStartedAt(Date.now());
      setStartedPage(currentPage);
      setElapsedSeconds(0);
    },
    [startMutation]
  );

  const stopSession = useCallback(
    async (currentPage: number) => {
      if (startedAt === null || startedPage === null) {
        return;
      }

      setError(null);
      const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const session = await stopMutation.mutateAsync({
        startedPage,
        lastPage: currentPage,
        elapsedSeconds: seconds
      });
      setLastSavedSession(session);
      setStartedAt(null);
      setStartedPage(null);
      setElapsedSeconds(0);
    },
    [startedAt, startedPage, stopMutation]
  );

  useEffect(() => {
    const mutationError = startMutation.error ?? stopMutation.error;
    setError(mutationError instanceof Error ? mutationError.message : null);
  }, [startMutation.error, stopMutation.error]);

  return {
    isActive: startedAt !== null,
    elapsedSeconds,
    minutesSpent: Math.floor(elapsedSeconds / 60),
    startedPage,
    lastSavedSession,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    error,
    startSession,
    stopSession
  };
}
