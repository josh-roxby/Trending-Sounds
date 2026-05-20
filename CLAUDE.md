# CLAUDE.md — Chartex Artist Dashboard

Internal music-artist tracking dashboard. Pulls daily TikTok + Spotify metrics from the [Chartex API](https://api.chartex.com) for a curated artist roster, plus the global TikTok 7-day chart (top 1,000 across 4 country scopes), and surfaces rank movement over time.

**Single operator. Internal tool. Not customer-facing.**

The signature view: "Zach Bryan has 20 tracked songs. 12 are on the global TikTok 7-day chart today. #34 (▲ 8), #67 (▼ 12), #142 (new entry)..."

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14+ (App Router) |
| UI | shadcn/ui + Tailwind |
| Charts | Recharts |
| Database | Supabase (Postgres) |
| Cron | Vercel Cron → Next.js Route Handler |
| Hosting | Vercel |
| External API | Chartex REST |

All Chartex calls server-side only. Never expose `SUPABASE_SERVICE_ROLE_KEY` or `CHARTEX_APP_TOKEN` to the client.

---

## Repo layout (target)

```
app/
  (auth)/login/
  api/cron/daily-snapshot/route.ts
  artists/
    page.tsx                  # /
    new/page.tsx
    [slug]/page.tsx
    [slug]/edit/page.tsx
  chart/page.tsx
  admin/jobs/page.tsx
  middleware.ts               # password-cookie gate
lib/
  chartex.ts                  # typed Chartex client (~200 LOC)
  supabase/
    server.ts
    client.ts
  db/                         # query helpers
supabase/
  migrations/                 # schema, all tables incl. chart_rankings
components/ui/                # shadcn primitives
vercel.json                   # cron config
```

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
