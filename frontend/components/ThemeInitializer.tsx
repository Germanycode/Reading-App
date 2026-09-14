"use client";

import { useEffect } from "react";
import { applyAppBackground, type AppBackgroundTheme, useThemeStore } from "@/hooks/useTheme";

/**
 * Hydrates the theme on client mount.
 * Reads localStorage and syncs the html class attribute.
 */
export function ThemeInitializer() {
  const setTheme = useThemeStore((s) => s.setTheme);
  const theme = useThemeStore((s) => s.theme);
  const setAppBackground = useThemeStore((s) => s.setAppBackground);

  useEffect(() => {
    // Re-apply on mount to sync SSR class with client preference
    const stored = localStorage.getItem("app-theme");
    const resolved = stored === "light" ? "light" : "dark";
    if (resolved !== theme) {
      setTheme(resolved);
    } else {
      // Still make sure DOM is in sync
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(resolved);
    }

    const storedBackground = localStorage.getItem("app-background-theme");
    const resolvedBackground = isAppBackgroundTheme(storedBackground) ? storedBackground : "dark-purple";
    applyAppBackground(resolvedBackground);
    setAppBackground(resolvedBackground);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function isAppBackgroundTheme(value: string | null): value is AppBackgroundTheme {
  return (
    value === "dark" ||
    value === "dark-purple" ||
    value === "dark-red" ||
    value === "lumina" ||
    value === "golden-hour" ||
    value === "emerald-midnight"
  );
}
