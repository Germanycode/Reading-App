"use client";

import { useQuery } from "@tanstack/react-query";
import { getStreak } from "@/lib/api";

export function useStreak() {
  return useQuery({
    queryKey: ["streak"],
    queryFn: getStreak
  });
}
