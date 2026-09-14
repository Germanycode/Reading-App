"use client";

import { Moon, Palette, Sun, Volume2 } from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useThemeStore } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const speech = useSpeechSynthesis();
  const { theme, appBackground, setTheme, setAppBackground } = useThemeStore();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Settings</h1>

      {/* Appearance */}
      <div className="rounded-md border border-border bg-muted/40 p-6">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium">Appearance</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose the app mode and background atmosphere.
        </p>
        <div className="mt-4 flex gap-4">
          {/* Dark mode card */}
          <button
            id="theme-select-dark"
            onClick={() => setTheme("dark")}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
              theme === "dark"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-muted-foreground/40"
            )}
          >
            <div className="flex h-16 w-24 items-center justify-center rounded-md border border-border bg-background shadow-inner">
              <Moon className="h-6 w-6 text-primary" />
            </div>
            <span className={cn(
              "text-sm font-medium",
              theme === "dark" ? "text-primary" : "text-muted-foreground"
            )}>
              Dark
            </span>
          </button>

          {/* Light mode card */}
          <button
            id="theme-select-light"
            onClick={() => setTheme("light")}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
              theme === "light"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-muted-foreground/40"
            )}
          >
            <div className="flex h-16 w-24 items-center justify-center rounded-md border border-border bg-muted shadow-inner">
              <Sun className="h-6 w-6 text-primary" />
            </div>
            <span className={cn(
              "text-sm font-medium",
              theme === "light" ? "text-primary" : "text-muted-foreground"
            )}>
              Light
            </span>
          </button>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium" htmlFor="app-background-theme">
            App background
          </label>
          <select
            id="app-background-theme"
            className="mt-2 h-10 w-full max-w-xs rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            value={appBackground}
            onChange={(event) => setAppBackground(event.target.value as typeof appBackground)}
          >
            <option value="dark">Dark</option>
            <option value="dark-purple">Dark Purple</option>
            <option value="dark-red">Dark Red</option>
            <option value="lumina">Lumina</option>
            <option value="golden-hour">Golden Hour</option>
            <option value="emerald-midnight">Emerald Midnight</option>
          </select>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="rounded-md border border-border bg-muted/40 p-6">
        <h2 className="text-lg font-medium">AI Configuration</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Store API keys in backend environment variables. Do not enter secrets into frontend code.
        </p>
      </div>

      {/* Text to Speech */}
      <div className="rounded-md border border-border bg-muted/40 p-6">
        <div className="flex items-center gap-3">
          <Volume2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium">Text to Speech</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Browser speech synthesis is {speech.isSupported ? "available" : "not available"} in this browser.
        </p>
      </div>
    </section>
  );
}
