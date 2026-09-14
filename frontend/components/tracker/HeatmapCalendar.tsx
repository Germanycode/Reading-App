"use client";

import { useQuery } from "@tanstack/react-query";
import { getReadingActivity } from "@/lib/api";

export function HeatmapCalendar() {
  const activityQuery = useQuery({
    queryKey: ["reading-activity", 98],
    queryFn: () => getReadingActivity(98)
  });
  const activityDays = activityQuery.data;

  return (
    <div className="rounded-md border border-border bg-muted/40 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Reading Activity</h2>
        <span className="text-xs text-muted-foreground">Last 98 days</span>
      </div>
      {activityQuery.isLoading ? (
        <p className="mt-5 rounded-md border border-border bg-background/70 p-4 text-sm text-muted-foreground">Loading activity...</p>
      ) : activityQuery.isError || !activityDays ? (
        <p className="mt-5 rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
          Unable to load reading activity.
        </p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-14 gap-1">
            {activityDays.map((day) => (
              <div
                key={day.date}
                className={`aspect-square rounded-sm ${getIntensityClass(day.minutes_spent, day.pages_read)}`}
                title={`${formatDate(day.date)}: ${day.minutes_spent} min, ${day.pages_read} pages`}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 1, 2, 3].map((level) => (
              <span key={level} className={`h-3 w-3 rounded-sm ${getLegendClass(level)}`} />
            ))}
            <span>More</span>
          </div>
        </>
      )}
    </div>
  );
}

function getIntensityClass(minutesSpent: number, pagesRead: number) {
  const activityScore = minutesSpent + pagesRead * 2;
  if (activityScore >= 60) {
    return "bg-primary";
  }
  if (activityScore >= 25) {
    return "bg-primary/70";
  }
  if (activityScore > 0) {
    return "bg-primary/40";
  }
  return "bg-background";
}

function getLegendClass(level: number) {
  return ["bg-background", "bg-primary/40", "bg-primary/70", "bg-primary"][level] ?? "bg-background";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}
