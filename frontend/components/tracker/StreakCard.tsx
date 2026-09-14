"use client";

import { Flame } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";

export function StreakCard() {
  const streakQuery = useStreak();
  const streak = streakQuery.data;

  return (
    <article className="rounded-md border border-border bg-muted/40 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Current streak</p>
        <Flame className="h-5 w-5 text-primary" />
      </div>
      {streakQuery.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading streak...</p>
      ) : streakQuery.isError || !streak ? (
        <p className="mt-4 text-sm text-red-200">Unable to load your streak.</p>
      ) : (
        <>
          <p className="mt-3 text-5xl font-semibold">{streak.current_streak}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {streak.current_streak === 1 ? "1 active day" : `${streak.current_streak} active days`}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-border bg-background/70 p-3">
              <dt className="text-muted-foreground">Longest</dt>
              <dd className="mt-1 font-medium">{streak.longest_streak} days</dd>
            </div>
            <div className="rounded-md border border-border bg-background/70 p-3">
              <dt className="text-muted-foreground">Total days</dt>
              <dd className="mt-1 font-medium">{streak.total_days}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Last read: {streak.last_read_date ? formatDate(streak.last_read_date) : "No sessions yet"}
          </p>
        </>
      )}
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}
