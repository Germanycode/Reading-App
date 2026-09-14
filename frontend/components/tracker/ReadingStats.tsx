"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, Clock, Files } from "lucide-react";
import { getReadingStats } from "@/lib/api";

export function ReadingStats() {
  const statsQuery = useQuery({
    queryKey: ["reading-stats"],
    queryFn: getReadingStats
  });
  const stats = statsQuery.data;

  if (statsQuery.isLoading) {
    return <p className="rounded-md border border-border bg-muted p-6 text-sm text-muted-foreground">Loading reading stats...</p>;
  }

  if (statsQuery.isError || !stats) {
    return (
      <p className="rounded-md border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-200">
        Unable to load reading stats.
      </p>
    );
  }

  const statCards = [
    { label: "Pages read", value: stats.total_pages_read, icon: Files },
    { label: "Minutes", value: stats.total_minutes_spent, icon: Clock },
    { label: "Active days", value: stats.active_days, icon: CalendarDays },
    { label: "Avg pages/day", value: stats.average_pages_per_day, icon: BarChart3 }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((item) => (
        <article key={item.label} className="rounded-md border border-border bg-muted/40 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <item.icon className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-semibold">{item.value}</p>
        </article>
      ))}
      <article className="rounded-md border border-border bg-muted/40 p-5 sm:col-span-2 xl:col-span-4">
        <p className="text-sm text-muted-foreground">Best day</p>
        <p className="mt-2 text-lg font-medium">
          {stats.best_day
            ? `${formatDate(stats.best_day.date)} · ${stats.best_day.minutes_spent} min · ${stats.best_day.pages_read} pages`
            : "No reading sessions yet"}
        </p>
      </article>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}
