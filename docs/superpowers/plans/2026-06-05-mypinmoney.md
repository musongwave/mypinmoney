# MYPINMONEY Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a wallpaper gallery website that auto-syncs from Pinterest via gallery-dl, serves SEO-optimized pages, and earns revenue through Google AdSense.

**Architecture:** `sync.py` runs daily via launchd — calls `gallery-dl` for new pins, uploads each to Cloudinary, prepends entries to `web/public/pins.json`, git-pushes to trigger a Vercel ISR rebuild of the Next.js gallery site.

**Tech Stack:** Next.js 14 (App Router, TypeScript, Tailwind CSS), next-themes, Jest + @testing-library/react, Python 3 + gallery-dl + cloudinary SDK + pytest, Vercel, Cloudinary (free tier), Google AdSense.

---

## File Map

```
MYPINMONEY/
├── .gitignore
├── sync/
│   ├── sync.py              # Pinterest → Cloudinary → pins.json → git push
│   ├── mypinmoney.plist     # launchd daily trigger
│   ├── requirements.txt
│   └── tests/
│       └── test_sync.py
└── web/
    ├── jest.config.ts
    ├── jest.setup.ts
    ├── next.config.ts
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── .env.local              # CLOUDINARY_URL, NEXT_PUBLIC_ADSENSE_ID
    ├── app/
    │   ├── layout.tsx          # ThemeProvider + AdSense script tag
    │   ├── globals.css         # Tailwind base + CSS variables for theme
    │   ├── page.tsx            # Home: AdBanner + Gallery
    │   ├── sitemap.ts          # generated from pins.json
    │   └── pin/
    │       └── [id]/
    │           └── page.tsx    # individual pin page
    ├── components/
    │   ├── AdBanner.tsx        # client-only AdSense wrapper
    │   ├── Gallery.tsx         # 4-column grid + client-side pagination
    │   ├── PinCard.tsx         # single pin card with hover overlay
    │   └── ThemeToggle.tsx     # dark/light manual override button
    └── public/
        ├── pins.json           # auto-updated by sync.py
        └── robots.txt
```

---

## Task 1: Scaffold Next.js app + .gitignore

**Files:**
- Create: `web/` (via create-next-app)
- Create: `.gitignore`

- [ ] **Step 1: Scaffold web app**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
npx create-next-app@latest web \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-eslint
```

Expected: `web/` created with `app/`, `public/`, `package.json`, `tailwind.config.ts`, `tsconfig.json`, `next.config.ts`.

- [ ] **Step 2: Install additional dependencies**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npm install next-themes
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest ts-jest
```

- [ ] **Step 3: Create root .gitignore**

Create `/Users/muradhajyev/Claude Works/MYPINMONEY/.gitignore`:

```
# Next.js
web/.next/
web/node_modules/
web/.env.local

# Python
sync/__pycache__/
sync/.pytest_cache/
sync/.venv/
*.pyc

# macOS
.DS_Store

# Brainstorm artifacts
.superpowers/
```

- [ ] **Step 4: Remove boilerplate from create-next-app**

Replace `web/app/page.tsx` with a minimal placeholder:

```tsx
export default function Home() {
  return <main className="min-h-screen p-8">Loading...</main>;
}
```

Replace `web/app/globals.css` with just the Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/ .gitignore
git commit -m "feat: scaffold Next.js app with Tailwind and test deps"
```

---

## Task 2: Jest test infrastructure

**Files:**
- Create: `web/jest.config.ts`
- Create: `web/jest.setup.ts`
- Modify: `web/package.json` (add test script)

- [ ] **Step 1: Create jest.config.ts**

```typescript
// web/jest.config.ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default createJestConfig(config);
```

- [ ] **Step 2: Create jest.setup.ts**

```typescript
// web/jest.setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 3: Add test script to package.json**

In `web/package.json`, add to `"scripts"`:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Verify jest works**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest --version
```

Expected: prints Jest version (e.g. `29.x.x`), no errors.

- [ ] **Step 5: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/jest.config.ts web/jest.setup.ts web/package.json
git commit -m "chore: configure Jest with jsdom and React Testing Library"
```

---

## Task 3: Mock pins.json + Cloudinary loader

**Files:**
- Create: `web/public/pins.json`
- Modify: `web/next.config.ts`

- [ ] **Step 1: Create mock pins.json**

```json
[
  {
    "id": "a1b2c3d4e5f6",
    "source_url": "https://i.pinimg.com/originals/01/23/45/mock1.jpg",
    "cloudinary_url": "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_auto/mypinmoney/mock1.jpg",
    "created_at": "2026-06-05T03:00:00Z"
  },
  {
    "id": "b2c3d4e5f6a1",
    "source_url": "https://i.pinimg.com/originals/01/23/45/mock2.jpg",
    "cloudinary_url": "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_auto/mypinmoney/mock2.jpg",
    "created_at": "2026-06-04T03:00:00Z"
  },
  {
    "id": "c3d4e5f6a1b2",
    "source_url": "https://i.pinimg.com/originals/01/23/45/mock3.jpg",
    "cloudinary_url": "https://res.cloudinary.com/demo/image/upload/w_800,q_auto,f_auto/mypinmoney/mock3.jpg",
    "created_at": "2026-06-03T03:00:00Z"
  }
]
```

Save to `web/public/pins.json`.

- [ ] **Step 2: Define Pin type**

Create `web/types.ts`:

```typescript
export interface Pin {
  id: string;
  source_url: string;
  cloudinary_url: string;
  created_at: string;
}
```

- [ ] **Step 3: Configure Cloudinary image loader in next.config.ts**

Replace the contents of `web/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./cloudinary-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create Cloudinary loader**

Create `web/cloudinary-loader.ts`:

```typescript
interface LoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderProps): string {
  // src is already a full Cloudinary URL — rewrite the transformation segment
  const q = quality ?? 75;
  return src.replace(
    /\/upload\//,
    `/upload/w_${width},q_${q},f_auto/`
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/public/pins.json web/types.ts web/next.config.ts web/cloudinary-loader.ts
git commit -m "feat: add mock pins.json and Cloudinary image loader"
```

---

## Task 4: PinCard component (TDD)

**Files:**
- Create: `web/components/__tests__/PinCard.test.tsx`
- Create: `web/components/PinCard.tsx`

- [ ] **Step 1: Write failing test**

Create `web/components/__tests__/PinCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import PinCard from "../PinCard";
import type { Pin } from "@/types";

const mockPin: Pin = {
  id: "abc123",
  source_url: "https://i.pinimg.com/originals/mock.jpg",
  cloudinary_url: "https://res.cloudinary.com/demo/image/upload/mypinmoney/mock.jpg",
  created_at: "2026-06-05T03:00:00Z",
};

describe("PinCard", () => {
  it("renders a link to the pin detail page", () => {
    render(<PinCard pin={mockPin} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pin/abc123");
  });

  it("renders an image with alt text", () => {
    render(<PinCard pin={mockPin} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Wallpaper abc123");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest components/__tests__/PinCard.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../PinCard'`

- [ ] **Step 3: Implement PinCard.tsx**

Create `web/components/PinCard.tsx`:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Pin } from "@/types";

interface Props {
  pin: Pin;
}

export default function PinCard({ pin }: Props) {
  return (
    <Link
      href={`/pin/${pin.id}`}
      className="group relative block overflow-hidden rounded-lg bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-white aspect-square"
    >
      <Image
        src={pin.cloudinary_url}
        alt={`Wallpaper ${pin.id}`}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest components/__tests__/PinCard.test.tsx --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/components/
git commit -m "feat: add PinCard component with tests"
```

---

## Task 5: Gallery component (TDD)

**Files:**
- Create: `web/components/__tests__/Gallery.test.tsx`
- Create: `web/components/Gallery.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/components/__tests__/Gallery.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Gallery from "../Gallery";
import type { Pin } from "@/types";

function makePins(count: number): Pin[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `pin${i}`,
    source_url: `https://i.pinimg.com/mock${i}.jpg`,
    cloudinary_url: `https://res.cloudinary.com/demo/image/upload/mypinmoney/mock${i}.jpg`,
    created_at: new Date(2026, 5, i + 1).toISOString(),
  }));
}

describe("Gallery", () => {
  it("renders 24 cards on first page when given 30 pins", () => {
    render(<Gallery pins={makePins(30)} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(24);
  });

  it("shows Next button when there are more than 24 pins", () => {
    render(<Gallery pins={makePins(30)} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("does not show Next button when all pins fit on one page", () => {
    render(<Gallery pins={makePins(10)} />);
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("navigates to page 2 and shows remaining pins", () => {
    render(<Gallery pins={makePins(30)} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6); // 30 - 24
  });

  it("shows Prev button on page 2", () => {
    render(<Gallery pins={makePins(30)} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("button", { name: /prev/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest components/__tests__/Gallery.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../Gallery'`

- [ ] **Step 3: Implement Gallery.tsx**

Create `web/components/Gallery.tsx`:

```tsx
"use client";

import { useState } from "react";
import PinCard from "./PinCard";
import type { Pin } from "@/types";

const PAGE_SIZE = 24;

interface Props {
  pins: Pin[];
}

export default function Gallery({ pins }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(pins.length / PAGE_SIZE);
  const pagePins = pins.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pagePins.map((pin) => (
          <PinCard key={pin.id} pin={pin} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="px-4 py-2 rounded bg-[#e60023] text-white disabled:opacity-30 hover:bg-[#c0001e] transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            className="px-4 py-2 rounded bg-[#e60023] text-white disabled:opacity-30 hover:bg-[#c0001e] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest components/__tests__/Gallery.test.tsx --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/components/
git commit -m "feat: add Gallery component with pagination tests"
```

---

## Task 6: ThemeToggle component + next-themes setup (TDD)

**Files:**
- Create: `web/components/__tests__/ThemeToggle.test.tsx`
- Create: `web/components/ThemeToggle.tsx`
- Create: `web/components/Providers.tsx`

- [ ] **Step 1: Write failing test**

Create `web/components/__tests__/ThemeToggle.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "../ThemeToggle";

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));

describe("ThemeToggle", () => {
  it("renders a button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls setTheme with 'dark' when current theme is light", () => {
    const setTheme = jest.fn();
    jest.spyOn(require("next-themes"), "useTheme").mockReturnValue({
      theme: "light",
      setTheme,
    });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest components/__tests__/ThemeToggle.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../ThemeToggle'`

- [ ] **Step 3: Implement ThemeToggle.tsx**

Create `web/components/ThemeToggle.tsx`:

```tsx
"use client";

import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
```

- [ ] **Step 4: Create Providers.tsx (ThemeProvider wrapper)**

Create `web/components/Providers.tsx`:

```tsx
"use client";

import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest components/__tests__/ThemeToggle.test.tsx --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/components/
git commit -m "feat: add ThemeToggle and Providers with next-themes"
```

---

## Task 7: AdBanner component (TDD)

**Files:**
- Create: `web/components/__tests__/AdBanner.test.tsx`
- Create: `web/components/AdBanner.tsx`

- [ ] **Step 1: Write failing test**

Create `web/components/__tests__/AdBanner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import AdBanner from "../AdBanner";

describe("AdBanner", () => {
  it("renders a leaderboard container with correct dimensions", () => {
    render(<AdBanner size="leaderboard" adSlot="1234567890" />);
    const container = screen.getByTestId("ad-leaderboard");
    expect(container).toBeInTheDocument();
  });

  it("renders a rectangle container", () => {
    render(<AdBanner size="rectangle" adSlot="0987654321" />);
    const container = screen.getByTestId("ad-rectangle");
    expect(container).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest components/__tests__/AdBanner.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../AdBanner'`

- [ ] **Step 3: Implement AdBanner.tsx**

Create `web/components/AdBanner.tsx`:

```tsx
"use client";

import { useEffect } from "react";

type AdSize = "leaderboard" | "rectangle";

interface Props {
  size: AdSize;
  adSlot: string;
}

const DIMENSIONS: Record<AdSize, { w: number; h: number }> = {
  leaderboard: { w: 728, h: 90 },
  rectangle: { w: 300, h: 250 },
};

export default function AdBanner({ size, adSlot }: Props) {
  const { w, h } = DIMENSIONS[size];

  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle is injected by AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div
      data-testid={`ad-${size}`}
      className="overflow-hidden flex justify-center"
      style={{ minHeight: h }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: w, height: h }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest components/__tests__/AdBanner.test.tsx --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/components/
git commit -m "feat: add AdBanner component for AdSense leaderboard and rectangle"
```

---

## Task 8: globals.css + layout.tsx

**Files:**
- Modify: `web/app/globals.css`
- Modify: `web/app/layout.tsx`

- [ ] **Step 1: Update globals.css with theme variables**

Replace `web/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #f5f5f5;
  --card-bg: #ffffff;
  --text: #111111;
}

.dark {
  --bg: #0d0d0d;
  --card-bg: #1a1a1a;
  --text: #f5f5f5;
}

body {
  background-color: var(--bg);
  color: var(--text);
}
```

- [ ] **Step 2: Update tailwind.config.ts to enable class-based dark mode**

In `web/tailwind.config.ts`, set `darkMode`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Update layout.tsx**

Replace `web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ThemeToggle from "@/components/ThemeToggle";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MYPINMONEY — Free Wallpapers",
  description: "Thousands of free HD wallpapers. Download and use on any device.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <header className="sticky top-0 z-50 bg-[var(--bg)] border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
              <a href="/" className="font-bold text-xl text-[#e60023]">MYPINMONEY</a>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create .env.local**

Create `web/.env.local`:

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

(Fill in real values after Cloudinary and AdSense accounts are set up.)

- [ ] **Step 5: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/app/globals.css web/app/layout.tsx web/tailwind.config.ts
git commit -m "feat: configure Tailwind dark mode, layout with navbar and AdSense script"
```

---

## Task 9: Home page

**Files:**
- Modify: `web/app/page.tsx`

- [ ] **Step 1: Update page.tsx**

Replace `web/app/page.tsx`:

```tsx
import { readFileSync } from "fs";
import { join } from "path";
import Gallery from "@/components/Gallery";
import AdBanner from "@/components/AdBanner";
import type { Pin } from "@/types";

function getPins(): Pin[] {
  const filePath = join(process.cwd(), "public", "pins.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as Pin[];
}

export const revalidate = 86400; // ISR: rebuild once per day

export default function Home() {
  const pins = getPins();

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <AdBanner size="leaderboard" adSlot={process.env.ADSENSE_SLOT_HOME ?? ""} />
      <h1 className="text-2xl font-bold mt-6 mb-4">Free HD Wallpapers</h1>
      <Gallery pins={pins} />
    </main>
  );
}
```

- [ ] **Step 2: Add ADSENSE_SLOT_HOME to .env.local**

Append to `web/.env.local`:

```env
ADSENSE_SLOT_HOME=1234567890
ADSENSE_SLOT_PIN=0987654321
```

- [ ] **Step 3: Verify the dev server starts without errors**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npm run dev &
sleep 5
curl -s http://localhost:3000 | grep -c "MYPINMONEY"
```

Expected: prints `1` or more (MYPINMONEY appears in the HTML).

Kill the dev server: `pkill -f "next dev"`

- [ ] **Step 4: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/app/page.tsx web/
git commit -m "feat: home page with Gallery and AdSense banner"
```

---

## Task 10: Pin detail page

**Files:**
- Create: `web/app/pin/[id]/page.tsx`

- [ ] **Step 1: Create pin detail page**

Create `web/app/pin/[id]/page.tsx`:

```tsx
import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import AdBanner from "@/components/AdBanner";
import type { Pin } from "@/types";

function getPins(): Pin[] {
  const filePath = join(process.cwd(), "public", "pins.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as Pin[];
}

export async function generateStaticParams() {
  const pins = getPins();
  return pins.map((pin) => ({ id: pin.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const pins = getPins();
  const pin = pins.find((p) => p.id === params.id);
  if (!pin) return {};
  return {
    title: `Wallpaper ${pin.id} — MYPINMONEY`,
    description: "Free HD wallpaper. Download for desktop, phone, or tablet.",
    openGraph: {
      images: [{ url: pin.cloudinary_url }],
    },
  };
}

export const revalidate = 86400;

export default function PinPage({ params }: { params: { id: string } }) {
  const pins = getPins();
  const pin = pins.find((p) => p.id === params.id);
  if (!pin) notFound();

  const fullUrl = pin.cloudinary_url.replace(
    /\/upload\//,
    "/upload/w_1920,q_auto/"
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[var(--card-bg)] mb-6">
        <Image
          src={pin.cloudinary_url}
          alt={`Wallpaper ${pin.id}`}
          fill
          sizes="(max-width: 1024px) 100vw, 896px"
          className="object-contain"
          priority
        />
      </div>

      <div className="flex items-center justify-between mb-8">
        <a
          href={fullUrl}
          download
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#e60023] text-white font-semibold hover:bg-[#c0001e] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Wallpaper
        </a>
        <a href="/" className="text-sm text-gray-500 hover:underline">← Back to gallery</a>
      </div>

      <AdBanner size="rectangle" adSlot={process.env.ADSENSE_SLOT_PIN ?? ""} />
    </main>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` or `Route (app)` table with no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/app/pin/
git commit -m "feat: pin detail page with full image, download button, and AdSense"
```

---

## Task 11: SEO — sitemap + robots.txt + metadata

**Files:**
- Create: `web/app/sitemap.ts`
- Create: `web/public/robots.txt`

- [ ] **Step 1: Create sitemap.ts**

Create `web/app/sitemap.ts`:

```typescript
import { readFileSync } from "fs";
import { join } from "path";
import type { MetadataRoute } from "next";
import type { Pin } from "@/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mypinmoney.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const pins: Pin[] = JSON.parse(
    readFileSync(join(process.cwd(), "public", "pins.json"), "utf-8")
  );

  const pinPages = pins.map((pin) => ({
    url: `${SITE_URL}/pin/${pin.id}`,
    lastModified: new Date(pin.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...pinPages,
  ];
}
```

- [ ] **Step 2: Create robots.txt**

Create `web/public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://mypinmoney.vercel.app/sitemap.xml
```

- [ ] **Step 3: Add NEXT_PUBLIC_SITE_URL to .env.local**

Append to `web/.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

(Change to production URL after Vercel deployment.)

- [ ] **Step 4: Verify sitemap generates**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npm run build 2>&1 | grep sitemap
```

Expected: `○ /sitemap.xml` appears in the route table.

- [ ] **Step 5: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/app/sitemap.ts web/public/robots.txt web/
git commit -m "feat: sitemap.xml and robots.txt for SEO"
```

---

## Task 12: Run all web tests

- [ ] **Step 1: Run full test suite**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/web"
npx jest --no-coverage
```

Expected: all tests PASS. Tally should be 9 tests across PinCard, Gallery, ThemeToggle, AdBanner.

- [ ] **Step 2: Fix any failures before continuing**

If any test fails, fix it before moving to the sync pipeline tasks.

- [ ] **Step 3: Commit (if fixes were needed)**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/
git commit -m "fix: resolve test failures in web components"
```

---

## Task 13: sync.py — core functions (TDD with pytest)

**Files:**
- Create: `sync/requirements.txt`
- Create: `sync/sync.py`
- Create: `sync/tests/__init__.py`
- Create: `sync/tests/test_sync.py`

- [ ] **Step 1: Create requirements.txt**

Create `sync/requirements.txt`:

```
gallery-dl>=1.27
cloudinary>=1.36
python-dotenv>=1.0
pytest>=8.0
pytest-mock>=3.12
```

- [ ] **Step 2: Install dependencies**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/sync"
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Expected: installs cleanly, `gallery-dl --version` works.

- [ ] **Step 3: Write failing tests**

Create `sync/tests/__init__.py` (empty).

Create `sync/tests/test_sync.py`:

```python
import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from sync import make_pin_id, load_pins, prepend_pin, upload_to_cloudinary


def test_make_pin_id_is_deterministic():
    url = "https://res.cloudinary.com/demo/image/upload/mypinmoney/test.jpg"
    assert make_pin_id(url) == make_pin_id(url)


def test_make_pin_id_is_12_chars():
    assert len(make_pin_id("https://example.com/image.jpg")) == 12


def test_load_pins_returns_empty_list_when_file_missing(tmp_path):
    assert load_pins(tmp_path / "nonexistent.json") == []


def test_load_pins_returns_list_from_file(tmp_path):
    pins_file = tmp_path / "pins.json"
    pins_file.write_text(json.dumps([{"id": "abc"}]))
    assert load_pins(pins_file) == [{"id": "abc"}]


def test_prepend_pin_adds_to_front(tmp_path):
    pins_file = tmp_path / "pins.json"
    pins_file.write_text(json.dumps([{"id": "old"}]))
    prepend_pin(pins_file, {"id": "new"})
    result = json.loads(pins_file.read_text())
    assert result[0]["id"] == "new"
    assert result[1]["id"] == "old"


def test_prepend_pin_skips_duplicate(tmp_path):
    pins_file = tmp_path / "pins.json"
    pins_file.write_text(json.dumps([{"id": "abc"}]))
    prepend_pin(pins_file, {"id": "abc"})
    result = json.loads(pins_file.read_text())
    assert len(result) == 1


def test_upload_to_cloudinary_returns_secure_url():
    mock_result = {"secure_url": "https://res.cloudinary.com/demo/image/upload/mypinmoney/test.jpg"}
    with patch("cloudinary.uploader.upload", return_value=mock_result):
        url = upload_to_cloudinary(Path("/tmp/test.jpg"))
    assert url == mock_result["secure_url"]
```

- [ ] **Step 4: Run tests — expect FAIL**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/sync"
source .venv/bin/activate
pytest tests/test_sync.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'sync'`

- [ ] **Step 5: Implement sync.py core functions**

Create `sync/sync.py`:

```python
import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

PINTEREST_URL = "https://www.pinterest.com/murad980"
ARCHIVE_DB = Path.home() / ".pinterest-archive.db"
TMP_DIR = Path("/tmp/pinterest_new")
REPO_ROOT = Path(__file__).parent.parent
PINS_JSON = REPO_ROOT / "web" / "public" / "pins.json"


def configure_cloudinary() -> None:
    cloudinary.config(cloudinary_url=os.environ["CLOUDINARY_URL"])


def upload_to_cloudinary(filepath: Path) -> str:
    result = cloudinary.uploader.upload(
        str(filepath),
        folder="mypinmoney",
        resource_type="image",
    )
    return result["secure_url"]


def make_pin_id(source_url: str) -> str:
    return hashlib.md5(source_url.encode()).hexdigest()[:12]


def load_pins(pins_json: Path) -> list:
    if pins_json.exists():
        return json.loads(pins_json.read_text())
    return []


def prepend_pin(pins_json: Path, pin: dict) -> None:
    pins = load_pins(pins_json)
    existing_ids = {p["id"] for p in pins}
    if pin["id"] not in existing_ids:
        pins.insert(0, pin)
        pins_json.write_text(json.dumps(pins, indent=2))


def run_gallery_dl() -> list[Path]:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "gallery-dl",
            "--archive", str(ARCHIVE_DB),
            "--dest", str(TMP_DIR),
            PINTEREST_URL,
        ],
        check=True,
    )
    extensions = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    files: list[Path] = []
    for ext in extensions:
        files.extend(TMP_DIR.rglob(ext))
    return files


def git_push(repo_root: Path) -> None:
    subprocess.run(["git", "add", "web/public/pins.json"], cwd=repo_root, check=True)
    subprocess.run(
        ["git", "commit", "-m", "chore: sync new pins [skip ci]"],
        cwd=repo_root,
        check=True,
    )
    subprocess.run(["git", "push"], cwd=repo_root, check=True)


def sync() -> None:
    configure_cloudinary()
    new_files = run_gallery_dl()
    if not new_files:
        print("No new pins.")
        return

    for filepath in new_files:
        cloudinary_url = upload_to_cloudinary(filepath)
        pin = {
            "id": make_pin_id(cloudinary_url),
            "source_url": filepath.name,
            "cloudinary_url": cloudinary_url,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        prepend_pin(PINS_JSON, pin)
        filepath.unlink(missing_ok=True)

    git_push(REPO_ROOT)
    print(f"Synced {len(new_files)} new pins.")


if __name__ == "__main__":
    sync()
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/sync"
source .venv/bin/activate
pytest tests/test_sync.py -v
```

Expected: PASS (7 tests)

- [ ] **Step 7: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add sync/
git commit -m "feat: sync.py core functions with pytest coverage"
```

---

## Task 14: launchd plist

**Files:**
- Create: `sync/mypinmoney.plist`

- [ ] **Step 1: Create the plist**

Create `sync/mypinmoney.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.mypinmoney.sync</string>

  <key>ProgramArguments</key>
  <array>
    <string>/Users/muradhajyev/Claude Works/MYPINMONEY/sync/.venv/bin/python3</string>
    <string>/Users/muradhajyev/Claude Works/MYPINMONEY/sync/sync.py</string>
  </array>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>3</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>

  <key>StandardOutPath</key>
  <string>/Users/muradhajyev/Claude Works/MYPINMONEY/sync/sync.log</string>

  <key>StandardErrorPath</key>
  <string>/Users/muradhajyev/Claude Works/MYPINMONEY/sync/sync.err</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>CLOUDINARY_URL</key>
    <string>FILL_IN_AFTER_CLOUDINARY_SETUP</string>
  </dict>
</dict>
</plist>
```

- [ ] **Step 2: Install plist (run manually after Cloudinary is configured)**

```bash
# First: edit CLOUDINARY_URL in the plist
cp "/Users/muradhajyev/Claude Works/MYPINMONEY/sync/mypinmoney.plist" \
   ~/Library/LaunchAgents/com.mypinmoney.sync.plist

launchctl load ~/Library/LaunchAgents/com.mypinmoney.sync.plist
launchctl list | grep mypinmoney
```

Expected: `com.mypinmoney.sync` appears with no error code.

- [ ] **Step 3: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add sync/mypinmoney.plist
git commit -m "feat: launchd plist for daily sync at 03:00"
```

---

## Task 15: Cloudinary account + first upload test

> **Prerequisite:** Sign up at https://cloudinary.com (free tier). Get your `CLOUDINARY_URL` from the Dashboard.

- [ ] **Step 1: Set CLOUDINARY_URL in sync .env**

Create `sync/.env`:

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

- [ ] **Step 2: Update web/.env.local**

Replace the placeholder `CLOUDINARY_URL` line in `web/.env.local` with your real value.

- [ ] **Step 3: Test upload with a sample image**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/sync"
source .venv/bin/activate
python3 - <<'EOF'
from pathlib import Path
from sync import configure_cloudinary, upload_to_cloudinary
import urllib.request

configure_cloudinary()
urllib.request.urlretrieve(
    "https://picsum.photos/800/600",
    "/tmp/test_upload.jpg"
)
url = upload_to_cloudinary(Path("/tmp/test_upload.jpg"))
print("Uploaded:", url)
EOF
```

Expected: prints a `https://res.cloudinary.com/...` URL.

- [ ] **Step 4: Replace mock pins.json with real first entry**

Copy the URL printed above and update `web/public/pins.json`:

```json
[
  {
    "id": "PASTE_MAKE_PIN_ID_RESULT",
    "source_url": "test_upload.jpg",
    "cloudinary_url": "PASTE_URL_FROM_STEP_3",
    "created_at": "2026-06-05T03:00:00Z"
  }
]
```

To get the id:

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/sync"
source .venv/bin/activate
python3 -c "from sync import make_pin_id; print(make_pin_id('PASTE_URL_FROM_STEP_3'))"
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
git add web/public/pins.json sync/.env
git commit -m "feat: real Cloudinary entry in pins.json"
```

---

## Task 16: GitHub + Vercel deployment

- [ ] **Step 1: Create GitHub repository**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY"
gh repo create mypinmoney --private --source=. --push
```

Expected: repository created and code pushed.

- [ ] **Step 2: Connect Vercel to GitHub**

1. Go to https://vercel.com/new
2. Import `mypinmoney` repository
3. Set **Root Directory** to `web`
4. Add environment variables:
   - `CLOUDINARY_URL` → your Cloudinary URL
   - `NEXT_PUBLIC_ADSENSE_ID` → `ca-pub-XXXXXXXXXXXXXXXX` (from AdSense after approval)
   - `NEXT_PUBLIC_SITE_URL` → `https://mypinmoney.vercel.app`
   - `ADSENSE_SLOT_HOME` → your slot ID
   - `ADSENSE_SLOT_PIN` → your slot ID
5. Click **Deploy**

Expected: Vercel builds and provides a live URL.

- [ ] **Step 3: Update robots.txt with real URL**

Edit `web/public/robots.txt` — replace `mypinmoney.vercel.app` with your actual Vercel URL.

- [ ] **Step 4: Run full sync for the first time (downloads and uploads all 5 500 pins)**

```bash
cd "/Users/muradhajyev/Claude Works/MYPINMONEY/sync"
source .venv/bin/activate
python3 sync.py
```

> ⚠️ This will take a long time (5 500+ images, ~3 GB). Run in a terminal you can leave open. Cloudinary free tier has 25 GB — the initial load fits.

- [ ] **Step 5: Verify live site**

Open your Vercel URL. You should see:
- Navbar with MYPINMONEY logo and theme toggle
- AdSense banner space (initially empty until AdSense approves)
- 4-column grid of wallpapers
- Pagination controls

- [ ] **Step 6: Apply for Google AdSense**

1. Go to https://adsense.google.com
2. Add your Vercel site URL
3. Paste the AdSense `<script>` tag — it's already in `layout.tsx` via `NEXT_PUBLIC_ADSENSE_ID`
4. Wait for approval (1–14 days, requires real content indexed by Google)

---

## Done ✓

The full system is live:
- `sync.py` runs nightly at 03:00 → new pins appear on site within ~2 min
- SEO-optimized pages for every wallpaper (sitemap.xml, og:image, metadata)
- AdSense banner on home + rectangle on each pin page
- Dark/light auto theme, mobile-responsive 4-column grid
