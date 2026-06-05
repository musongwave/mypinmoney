import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ThemeToggle from "@/components/ThemeToggle";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WallDrop — Free HD Wallpapers",
  description: "Thousands of free HD wallpapers for desktop, phone and tablet. Browse and download for free.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <Providers>
          <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
              <a href="/" className="font-bold text-xl text-[#e60023]">WallDrop</a>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
