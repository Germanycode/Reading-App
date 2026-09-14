"use client";

import { create } from "zustand";

type Theme = "dark" | "light";
export type AppBackgroundTheme = "dark" | "dark-purple" | "dark-red" | "lumina" | "golden-hour" | "emerald-midnight";

const APP_BACKGROUND_THEMES: AppBackgroundTheme[] = ["dark", "dark-purple", "dark-red", "lumina", "golden-hour", "emerald-midnight"];

interface ThemeState {
  theme: Theme;
  appBackground: AppBackgroundTheme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setAppBackground: (theme: AppBackgroundTheme) => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("app-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "dark";
}

function getInitialAppBackground(): AppBackgroundTheme {
  if (typeof window === "undefined") return "dark-purple";
  try {
    const stored = localStorage.getItem("app-background-theme");
    if (APP_BACKGROUND_THEMES.includes(stored as AppBackgroundTheme)) {
      return stored as AppBackgroundTheme;
    }
  } catch {}
  return "dark-purple";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  try {
    localStorage.setItem("app-theme", theme);
  } catch {}
}

export function applyAppBackground(theme: AppBackgroundTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const backgroundTheme of APP_BACKGROUND_THEMES) {
    root.classList.remove(`app-bg-${backgroundTheme}`);
  }
  root.classList.add(`app-bg-${theme}`);
  try {
    localStorage.setItem("app-background-theme", theme);
  } catch {}
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  appBackground: getInitialAppBackground(),
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      return { theme: next };
    }),
  setTheme: (t: Theme) => {
    applyTheme(t);
    set({ theme: t });
  },
  setAppBackground: (theme: AppBackgroundTheme) => {
    applyAppBackground(theme);
    set({ appBackground: theme });
  },
}));
