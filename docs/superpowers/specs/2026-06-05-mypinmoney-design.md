# MYPINMONEY — Design Spec

**Date:** 2026-06-05  
**Project:** MYPINMONEY  
**Pinterest account:** https://www.pinterest.com/murad980

---

## Goal

Monetize the existing Pinterest wallpapers account (5 500+ pins) by building a website that:
1. Automatically syncs new pins from Pinterest via gallery-dl
2. Serves a wallpaper gallery with SEO-optimized pages
3. Earns revenue through Google AdSense (affiliate links added later)

---

## Architecture

```
gallery-dl (Pinterest) → sync.py → Cloudinary (image CDN)
                                  ↓
                          pins.json (catalog in repo)
                                  ↓
                     git push → Vercel build (Next.js ISR)
                                  ↓
                         Public website + AdSense ads
```

---

## Components

### 1. Sync Pipeline (`sync/`)

**`sync.py`**
- Calls `gallery-dl --archive ~/.pinterest-archive.db https://www.pinterest.com/murad980`
- For each new image: uploads to Cloudinary, records `{id, source_url, cloudinary_url, created_at}` in `web/public/pins.json`
- After sync: runs `git add web/public/pins.json && git commit && git push` to trigger Vercel rebuild
- Skips already-archived pins (SQLite archive at `~/.pinterest-archive.db` is source of truth)

**`mypinmoney.plist`** (launchd)
- Runs `sync.py` once per day at 03:00
- Installed to `~/Library/LaunchAgents/`

**Dependencies:** `gallery-dl`, `cloudinary` (Python SDK), `python-dotenv`

---

### 2. Next.js App (`web/`)

**Pages**
- `/` — Home: AdSense leaderboard banner (728×90) + 4-column uniform grid of wallpapers, paginated (24 per page)
- `/pin/[id]` — Individual pin: full image, download button, AdSense rectangle (300×250), SEO meta tags (title, description, og:image)

**Theme**
- `next-themes` — auto dark/light mode matching system preference
- Dark: `bg #0d0d0d`, cards `#1a1a1a`
- Light: `bg #f5f5f5`, cards `#ffffff`
- Accent: `#e60023` (Pinterest red)

**Image handling**
- `next/image` with Cloudinary loader — automatic WebP conversion and responsive sizes
- Blurred placeholder on load

**Components**
- `Gallery.tsx` — 4-column CSS grid, pagination controls
- `PinCard.tsx` — image card with hover overlay (download icon)
- `AdBanner.tsx` — wraps AdSense units, renders only on client
- `ThemeToggle.tsx` — manual override button in navbar

**SEO**
- `metadata` export on each page
- `sitemap.xml` generated at build time from `pins.json`
- `robots.txt` allowing all crawlers

---

### 3. Storage

**Cloudinary (free tier)**
- 25 GB storage, 25 GB bandwidth/month — sufficient for ~3 GB initial load + growth
- Images uploaded once; served via Cloudinary CDN
- Transformation: `w_800,q_auto,f_auto` for gallery thumbnails; `w_1920,q_auto` for full view

**`pins.json`**
- Lives in `web/public/pins.json` (committed to repo, served as static asset)
- Schema:
  ```json
  [
    {
      "id": "abc123",
      "source_url": "https://i.pinimg.com/...",
      "cloudinary_url": "https://res.cloudinary.com/...",
      "created_at": "2026-06-05T03:00:00Z"
    }
  ]
  ```
- Grows with each sync; Next.js reads it at build time via ISR

---

### 4. Monetization

**Phase 1 — AdSense**
- Leaderboard `728×90` at top of home page (below navbar)
- Rectangle `300×250` on individual pin pages (sidebar or below image)
- AdSense script added to `app/layout.tsx`
- Apply for AdSense after ~50 pages of content are indexed

**Phase 2 — Affiliate links (future)**
- Add "Buy similar" links on `/pin/[id]` pages (Amazon Associates, AliExpress)
- No changes to sync pipeline required

---

### 5. Hosting & CI/CD

- **Vercel** (free Hobby tier) — auto-deploys on every `git push` to `main`
- **GitHub** — source of truth for code + `pins.json`
- Environment variables on Vercel: `CLOUDINARY_URL`, `NEXT_PUBLIC_ADSENSE_ID`
- Local `.env` for sync script: `CLOUDINARY_URL`

---

## Data Flow (step by step)

1. launchd runs `sync.py` at 03:00 daily
2. `gallery-dl` downloads new pins to `/tmp/pinterest_new/` (skips archived)
3. `sync.py` uploads each new image to Cloudinary → gets `secure_url`
4. `pins.json` is updated with new entries prepended (newest first)
5. `git push` to GitHub triggers Vercel build
6. Next.js reads `pins.json` at build → generates all pages with ISR (revalidate: 86400)
7. New wallpapers are live on the site within ~2 minutes of sync

---

## Project Structure

```
MYPINMONEY/
├── sync/
│   ├── sync.py              # Pinterest → Cloudinary → pins.json → git push
│   ├── mypinmoney.plist     # launchd daily trigger
│   └── requirements.txt     # gallery-dl, cloudinary, python-dotenv
├── web/
│   ├── app/
│   │   ├── layout.tsx       # AdSense script, ThemeProvider
│   │   ├── page.tsx         # Home: banner + Gallery
│   │   └── pin/[id]/page.tsx
│   ├── components/
│   │   ├── Gallery.tsx
│   │   ├── PinCard.tsx
│   │   ├── AdBanner.tsx
│   │   └── ThemeToggle.tsx
│   ├── public/
│   │   ├── pins.json        # auto-updated by sync.py
│   │   └── robots.txt
│   ├── next.config.ts
│   ├── package.json
│   └── .env.local           # CLOUDINARY_URL, NEXT_PUBLIC_ADSENSE_ID
├── .gitignore
└── docs/
    └── superpowers/specs/
        └── 2026-06-05-mypinmoney-design.md
```

---

## Constraints & Notes

- Do NOT delete `~/.pinterest-archive.db` — it prevents re-downloading 5 500+ pins
- Cloudinary free tier bandwidth (25 GB/month) is enough for ~40 000 thumbnail loads/day
- AdSense requires the site to have real traffic before approval — focus on SEO first
- `pins.json` will eventually grow large; if it exceeds ~10 MB, switch to a static API route that paginates reads from a SQLite file instead
