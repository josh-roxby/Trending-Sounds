# TODO — Trending Sounds

Build plan in **A-1-1** format: `Section-Task-Subtask`. Sections mirror the natural build order. Check items off as they land.

Legend: `[ ]` open · `[x]` done · `[~]` in progress

> **Naming:** the spec calls the top-level unit "artist" and its children "songs". This repo uses **projects** + **sounds** in the schema and UI. A project can map 1:1 to an artist or to a campaign.

> **Auth:** multi-user via Supabase Auth (magic link). Every row in `projects` is scoped to `auth.users.id`. Children inherit via RLS. The cron uses the service-role key and bypasses RLS.

---

## A. Project Bootstrap

- [x] **A-1** Initialize Next.js 16 app
  - [x] A-1-1 App Router, TypeScript, Turbopack, React Compiler stable
  - [x] A-1-2 `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`
  - [x] A-1-3 `next build` succeeds with 10 routes registered
- [x] **A-2** Tailwind v4 + shadcn-pattern primitives
  - [x] A-2-1 CSS-first config in `app/globals.css` (`@theme`)
  - [x] A-2-2 Primitives in `components/ui/`: `button`, `card`, `input`, `label`, `badge`
  - [ ] A-2-3 Add `table`, `dialog`, `dropdown-menu`, `tabs`, `toast`, `select` as needed
  - [ ] A-2-4 Add a `<DataTable>` (TanStack) for the rank views
- [ ] **A-3** Charts
  - [ ] A-3-1 Install Recharts
  - [ ] A-3-2 `components/charts/LineChart.tsx` wrapper
- [x] **A-4** Repo hygiene
  - [x] A-4-1 `.env.example` with all keys
  - [x] A-4-2 `README.md` with quickstart
  - [ ] A-4-3 Prettier + lint-staged pre-commit hook (optional)

---

## B. Database Schema (Supabase)

- [ ] **B-1** Provision Supabase project, capture URL + keys
- [x] **B-2** Migrations directory
  - [x] B-2-1 `supabase/migrations/0001_init.sql` (pgcrypto extension)
- [x] **B-3** Core tables
  - [x] B-3-1 `projects` (id, user_id fk → auth.users, name, slug, spotify_artist_id, tiktok_handle, notes, created_at, archived_at) + `unique (user_id, slug)`
  - [x] B-3-2 `sounds` (id, project_id fk, title, platform, platform_id, is_tracked, identification_status, created_at) + `unique (platform, platform_id)` + index `(platform_id)`
  - [x] B-3-3 `tiktok_accounts` (id, project_id fk unique, username unique, is_tracked, created_at)
- [x] **B-4** Snapshot tables
  - [x] B-4-1 `sound_snapshots` + `unique (sound_id, snapshot_date)`
  - [x] B-4-2 `account_snapshots` + `unique (tiktok_account_id, snapshot_date)`
- [x] **B-5** Chart rankings
  - [x] B-5-1 `chart_rankings` PK `(snapshot_date, sort_platform, sort_column, country_code, rank)`
  - [x] B-5-2 Index `(snapshot_date, song_platform_id)`
  - [x] B-5-3 Index `(song_platform_id, snapshot_date DESC)`
- [x] **B-6** Observability — `job_runs`
- [x] **B-7** RLS
  - [x] B-7-1 Owner-only policies on `projects`, `sounds`, `tiktok_accounts`
  - [x] B-7-2 Authenticated read on `chart_rankings`
  - [x] B-7-3 Service-role-only writes everywhere (no insert/update policies for end users on snapshots/chart)
- [x] **B-8** `project_previews` view for home/dashboard cards
- [ ] **B-9** Generate TS types: `supabase gen types typescript --linked > lib/db/types.ts`

---

## C. Chartex API Client (`lib/chartex.ts`)

- [ ] **C-1** Foundation
  - [ ] C-1-1 Base URL constant, `X-APP-ID` + `X-APP-TOKEN` header injector
  - [ ] C-1-2 Typed error class `ChartexError`
  - [ ] C-1-3 Single retry on HTTP 429 with 2s delay
- [ ] **C-2** Methods
  - [ ] C-2-1 `addSound(identifier, type)`
  - [ ] C-2-2 `trackSound(identifier, type, scopes)`
  - [ ] C-2-3 `addTikTokAccount(username)`
  - [ ] C-2-4 `getSoundStats(platformId, platform, opts)`
  - [ ] C-2-5 `getTikTokAccountMetadata(username)`
  - [ ] C-2-6 `getTikTokAccountFollowerStats(username, opts)`
  - [ ] C-2-7 `getSoundsChart({ sortPlatform, sortColumn, countryCodes, page, limit })`
- [ ] **C-3** Response types — minimal, plus `raw_payload` jsonb
- [ ] **C-4** Smoke tests against live API

---

## D. Daily Cron (`/api/cron/daily-snapshot`)

- [ ] **D-1** Route scaffolding (bearer auth via `CRON_SECRET`, opens `job_runs` row)
- [ ] **D-2** Phase 1 — Chart pull (`['', 'US', 'GB', 'IE']` × pages 1..10, store `WW` for empty)
- [ ] **D-3** Phase 2 — Per-sound snapshots
- [ ] **D-4** Phase 3 — Per-account snapshots
- [ ] **D-5** Finalize `job_runs` row (success / partial / failed + counts + error_log)
- [x] **D-6** `vercel.json` cron `0 6 * * *`

---

## E. Auth

- [x] **E-1** Magic-link sign in
  - [x] E-1-1 `/login` page with email form
  - [x] E-1-2 `signInWithEmail` server action → Supabase OTP
  - [x] E-1-3 `/auth/callback` route exchanges code for session
  - [x] E-1-4 `logout` server action
- [x] **E-2** Proxy (was middleware) — redirects unauthenticated requests to `/login`, skips `/login`, `/auth/*`, `/api/cron/*`
- [ ] **E-3** Configure Supabase Auth in dashboard (enable email provider, SMTP, redirect URLs)

---

## F. Project Onboarding & Editing

- [x] **F-1** `/projects/new` — name, slug, spotify_artist_id, tiktok_handle, notes
- [x] **F-2** Server action inserts into `projects` with `user_id` from session
- [ ] **F-3** `/projects/[slug]/edit` (stub exists) — metadata edits
  - [ ] F-3-1 Dynamic sound list (title + platform + platform_id rows)
  - [ ] F-3-2 On save: `addSound` → `trackSound` (if tiktok) → insert `sounds`
  - [ ] F-3-3 Attach TikTok account: `addTikTokAccount` + insert `tiktok_accounts`
  - [ ] F-3-4 Pending banner if any sound is `identification_status='pending'`

---

## G. Home & Projects List

- [x] **G-1** `/` — welcome + project preview cards (sound_count, charting_count, highest_rank, latest_snapshot_date)
- [x] **G-2** `/projects` — flat list with badges
- [x] **G-3** `project_previews` view powers both

---

## H. Project Detail (`/projects/[slug]`) — Signature View

- [x] **H-1** Header (name, TikTok link, Spotify link, edit button)
- [x] **H-2** Metric cards row (placeholders until cron lands)
- [x] **H-3** Sounds table skeleton (Title, Platform, Status, WW, US, GB, IE)
- [ ] **H-4** Wire metric cards to live data once `chart_rankings` populates
- [ ] **H-5** Movement glyphs ▲ ▼ NEW —
- [ ] **H-6** Row expand → inline 30-day rank mini-chart (Recharts)
- [ ] **H-7** Time-series charts (TikTok video count, follower count over time)
- [ ] **H-8** Single SQL query joining `sounds` ⨝ `chart_rankings` (today + 7d ago) across 4 country scopes

---

## I. Global Chart Browser (`/chart`)

- [x] **I-1** Page stub
- [ ] **I-2** Country selector (WW default, US, GB, IE)
- [ ] **I-3** `<DataTable>` of today's top 1,000
- [ ] **I-4** Highlight rows that join to a tracked sound
- [ ] **I-5** Optional date picker (defaults to latest `snapshot_date`)

---

## J. Admin / Observability (`/admin/jobs`)

- [ ] **J-1** Table of recent `job_runs`
- [ ] **J-2** Expand row → render `error_log`
- [ ] **J-3** "Run cron now" button (POSTs with `CRON_SECRET` server-side)

---

## K. Deploy

- [ ] **K-1** Vercel project
  - [ ] K-1-1 Connect GitHub repo, configure env vars (prod + preview)
  - [ ] K-1-2 Pro plan if function timeout > 60s needed
- [ ] **K-2** Cron verification — manual trigger, inspect `chart_rankings` + `sound_snapshots` + `job_runs`
- [ ] **K-3** Monthly request budget check (~5,400 req/mo)

---

## L. Phase 2 backlog

- [ ] L-1 Multi-sort chart tracking (Spotify streams, TikTok 24h)
- [ ] L-2 Sounds outside top 1K — per-sound chart-position lookup
- [ ] L-3 Weekly recalc job (Chartex backfills past values)
- [ ] L-4 `identification_status` polling
- [ ] L-5 Movement alerts (">20 position moves")
- [ ] L-6 Team / collaborator sharing on projects
- [ ] L-7 Instagram / YouTube / Shazam siblings
- [ ] L-8 Worker pattern when roster > ~200 sounds

---

## Pinned dependencies (May 2026)

| Package | Version | Why |
|---|---|---|
| `next` | 16.2.6 | App Router stable, Turbopack default, React Compiler stable |
| `react` / `react-dom` | 19.2.6 | Latest stable |
| `tailwindcss` | 4.3.0 | CSS-first config, ~5× faster builds |
| `@tailwindcss/postcss` | 4.3.0 | v4 PostCSS plugin |
| `@supabase/ssr` | 0.10.3 | Current SSR pattern (replaces `@supabase/auth-helpers-*`) |
| `@supabase/supabase-js` | 2.106.1 | Current stable |
| `typescript` | 5.7+ (resolved 5.9.3) | |
| `lucide-react` | 0.469+ | Icons |
| `class-variance-authority` / `clsx` / `tailwind-merge` | latest | shadcn pattern utilities |

---

## Reference

- Spec: `CHARTEXDASHBOARDSPEC.md`
- Chartex API: `chartex-api-reference.md` (TODO: save alongside)
- Base URL: `https://api.chartex.com`, auth via `X-APP-ID` + `X-APP-TOKEN`
- Rate limit: 1,000 req/min; free endpoint: `POST /songs/add/`
