import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeInitializer } from "@/components/ThemeInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gemany Reading App",
  description: "A local-first PDF reading app with AI learning tools"
};

// Inline script to set theme class before first paint (prevents FOUC)
const themeScript = `(function(){try{var r=document.documentElement;var t=localStorage.getItem('app-theme');var b=localStorage.getItem('app-background-theme')||'dark-purple';var ok={dark:1,'dark-purple':1,'dark-red':1,lumina:1,'golden-hour':1,'emerald-midnight':1};r.classList.remove('dark','light');r.classList.add(t==='light'?'light':'dark');r.classList.add('app-bg-'+(ok[b]?b:'dark-purple'))}catch(e){document.documentElement.classList.add('dark','app-bg-dark-purple')}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeInitializer />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
