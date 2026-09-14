import { HeatmapCalendar } from "@/components/tracker/HeatmapCalendar";
import { ReadingStats } from "@/components/tracker/ReadingStats";
import { StreakCard } from "@/components/tracker/StreakCard";

export default function TrackerPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Reading Tracker</h1>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <StreakCard />
        <HeatmapCalendar />
      </div>
      <ReadingStats />
    </section>
  );
}
