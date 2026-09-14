"use client";

import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api";

export function StatusBanner() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    retry: 1
  });

  if (isLoading) {
    return <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">Checking backend connection...</p>;
  }

  if (error) {
    return <p className="rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-200">Backend is not reachable yet.</p>;
  }

  return (
    <p className="rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm text-emerald-200">
      Backend status: {data?.status ?? "ok"}
    </p>
  );
}
