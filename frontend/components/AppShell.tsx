"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarChart3, BookOpen, BrainCircuit, GitFork, Library, Moon, Search, Settings, Sun } from "lucide-react";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import { useThemeStore } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/library", label: "Library", icon: Library },
  { href: "/search", label: "Search", icon: Search },
  { href: "/tracker", label: "Tracker", icon: BarChart3 },
  { href: "/graph", label: "Graph", icon: GitFork },
  { href: "/quiz", label: "Quiz", icon: BrainCircuit },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const isReaderRoute = pathname.startsWith("/reader/");

  return (
    <div className="twilight-shell min-h-screen">
      <aside className="twilight-glass fixed inset-y-0 left-0 hidden w-64 flex-col border-r p-4 md:flex">
        <Link href="/library" className="flex items-center gap-3 rounded-md px-2 py-3 text-lg font-semibold">
          <BookOpen className="h-6 w-6 text-primary" />
          Gemany Reading App
        </Link>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  isActive && "bg-muted text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-border pt-4">
          <button
            id="theme-toggle-sidebar"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>
      <main
        className={cn(
          "relative z-10 min-h-screen pb-24 md:ml-64",
          isReaderRoute ? "p-0 md:p-0" : "p-5 md:p-8"
        )}
      >
        {children}
      </main>
      <BackgroundMusicPlayer />
      <nav className="twilight-glass-strong fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground",
                isActive && "text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
