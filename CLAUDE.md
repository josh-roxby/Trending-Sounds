# CLAUDE.md — Chartex Artist Dashboard

Internal music-artist tracking dashboard. Pulls daily TikTok + Spotify metrics from the [Chartex API](https://api.chartex.com) for a curated artist roster, plus the global TikTok 7-day chart (top 1,000 across 4 country scopes), and surfaces rank movement over time.

**Single operator. Internal tool. Not customer-facing.**

The signature view: "Zach Bryan has 20 tracked songs. 12 are on the global TikTok 7-day chart today. #34 (▲ 8), #67 (▼ 12), #142 (new entry)..."

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack, React Compiler) |
| UI | Tailwind v4 (CSS-first) + shadcn-pattern primitives |
| Charts | Recharts |
| Database / Auth | Supabase (Postgres + Auth via `@supabase/ssr`) |
| Cron | Vercel Cron → Next.js Route Handler |
| Hosting | Vercel |
| External API | Chartex REST |

All Chartex calls server-side only. Never expose `SUPABASE_SERVICE_ROLE_KEY` or `CHARTEX_APP_TOKEN` to the client.

---

## Repo layout

```
app/
  (auth)/actions.ts           # signInWithEmail, logout server actions
  api/cron/daily-snapshot/    # cron route (TODO)
  auth/callback/route.ts      # Supabase OAuth code → session exchange
  chart/page.tsx              # global chart browser
  dashboard/page.tsx
  login/page.tsx              # magic-link form
  projects/
    page.tsx                  # list
    new/page.tsx              # create
    [slug]/page.tsx           # detail (signature view)
    [slug]/edit/page.tsx
  globals.css                 # Tailwind v4 CSS-first (@theme)
  layout.tsx
  page.tsx                    # /  home
proxy.ts                      # Next 16 proxy (was middleware) — auth gate
lib/
  chartex.ts                  # typed Chartex client (TODO)
  supabase/
    client.ts                 # browser client
    server.ts                 # server + service-role
    middleware.ts             # session refresh helper
  db/projects.ts              # query helpers
components/
  site-nav.tsx
  ui/                         # button, card, input, label, badge
supabase/
  migrations/0001_init.sql    # all tables + project_previews view + RLS
vercel.json                   # cron schedule
```

**Naming:** the spec uses `artists` + `songs`; this repo uses **projects** + **sounds**. One project ≈ one artist, but the schema is artist-agnostic so a project can also be a campaign.

**Auth:** Supabase Auth (magic link). Every `projects` row is scoped to `auth.users.id`; children inherit via RLS. The cron uses the service-role key and bypasses RLS.

---

## Key conventions

- **Idempotent writes.** Every snapshot/upsert keys on a unique constraint (`(song_id, snapshot_date)`, `(snapshot_date, sort_platform, sort_column, country_code, rank)`, etc.). Re-running cron same-day is safe.
- **Sequential cron.** No parallelism in the daily job — `for...of` with `await`. ~180 requests, well inside the 1,000 req/min Chartex ceiling, and error attribution stays clean.
- **Chart pull is Phase 1.** If anything is going to fail, fail later in the run — chart data is the most valuable artifact.
- **Worldwide is stored as `country_code = 'WW'`** regardless of how Chartex labels the empty `country_codes` param.
- **`chart_rankings` stores the full top-1,000 every day**, not filtered to our roster. Cheap, and lets us answer retroactive "did we miss anyone?" questions.
- **Soft delete artists** via `archived_at`. Cron skips non-null.
- **shadcn defaults.** No custom design system in v1.

---

## Environment variables

```
CHARTEX_APP_ID=
CHARTEX_APP_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_PASSWORD=
CRON_SECRET=
```

Cron route verifies `Authorization: Bearer <CRON_SECRET>`.

---

## Out of scope for v1

Instagram, YouTube, Shazam, multi-user auth, multi-sort chart tracking (Spotify rank, TikTok 24h), country comparison UI, multi-artist projects, push/email alerts, anomaly detection, public sharing, custom design system, late-data recalculation jobs.

See `TODO.md` for the build plan (A-1-1 format: section / task / subtask) and the source spec for full detail.

---

## Working agreements

- Develop on feature branches; merge to `main` via PR.
- `main` is the default branch and source of truth.
- Don't add backwards-compat shims, dead code, or speculative abstractions — v1 ships small.
- Comments only where the *why* is non-obvious. Identifiers carry the *what*.
