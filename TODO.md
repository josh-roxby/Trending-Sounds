# TODO — Chartex Artist Dashboard

Build plan in **A-1-1** format: `Section-Task-Subtask`. Sections mirror the natural build order from the spec. Check items off as they land.

Legend: `[ ]` open · `[x]` done · `[~]` in progress

---

## A. Project Bootstrap

- [ ] **A-1** Initialize Next.js 14 app
  - [ ] A-1-1 `npx create-next-app@latest` with App Router, TypeScript, Tailwind, ESLint
  - [ ] A-1-2 Commit `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`
  - [ ] A-1-3 Verify `next dev` boots a blank page
- [ ] **A-2** Install and configure shadcn/ui
  - [ ] A-2-1 `npx shadcn@latest init` (default style, slate, CSS vars)
  - [ ] A-2-2 Add primitives: `button`, `input`, `label`, `card`, `table`, `dialog`, `dropdown-menu`, `badge`, `tabs`, `toast`, `select`
  - [ ] A-2-3 Add `data-table` pattern (TanStack table) for sortable tables
- [ ] **A-3** Charting
  - [ ] A-3-1 Install Recharts
  - [ ] A-3-2 Create `components/charts/LineChart.tsx` thin wrapper matching shadcn examples
- [ ] **A-4** Repo hygiene
  - [ ] A-4-1 Add `.env.example` with all env vars from CLAUDE.md
  - [ ] A-4-2 Add `README.md` with quickstart (install, env, dev, deploy)
  - [ ] A-4-3 Add Prettier + lint-staged pre-commit hook (optional)

---

## B. Database Schema (Supabase)

- [ ] **B-1** Provision Supabase project, capture URL + keys
- [ ] **B-2** Migrations directory
  - [ ] B-2-1 `supabase/migrations/0001_init.sql` — extensions (uuid-ossp / pgcrypto)
- [ ] **B-3** Core tables
  - [ ] B-3-1 `artists` (id, name, slug unique, spotify_artist_id, tiktok_handle, notes, created_at, archived_at)
  - [ ] B-3-2 `songs` (id, artist_id fk, title, platform, platform_id, is_tracked, identification_status, created_at) + unique `(platform, platform_id)` + index `(platform_id)`
  - [ ] B-3-3 `tiktok_accounts` (id, artist_id fk unique, username unique, is_tracked, created_at)
- [ ] **B-4** Snapshot tables
  - [ ] B-4-1 `song_snapshots` with all metric columns + unique `(song_id, snapshot_date)`
  - [ ] B-4-2 `account_snapshots` with follower columns + unique `(tiktok_account_id, snapshot_date)`
- [ ] **B-5** Chart rankings table (critical)
  - [ ] B-5-1 `chart_rankings` schema with PK `(snapshot_date, sort_platform, sort_column, country_code, rank)`
  - [ ] B-5-2 Index `(snapshot_date, song_platform_id)` — "today's rank for these songs"
  - [ ] B-5-3 Index `(song_platform_id, snapshot_date DESC)` — historical movement
- [ ] **B-6** Observability
  - [ ] B-6-1 `job_runs` table with counts + status + error_log jsonb
- [ ] **B-7** RLS / access
  - [ ] B-7-1 Disable RLS on internal tables OR add policies that deny anon — server-only access pattern
- [ ] **B-8** Generate TypeScript types from schema (`supabase gen types`)

---

## C. Chartex API Client (`lib/chartex.ts`)

- [ ] **C-1** Foundation
  - [ ] C-1-1 Base URL constant, `X-APP-ID` + `X-APP-TOKEN` header injector
  - [ ] C-1-2 Typed error class `ChartexError` (status, code, payload)
  - [ ] C-1-3 Single retry on HTTP 429 with 2s delay; throw on other non-2xx
- [ ] **C-2** Methods
  - [ ] C-2-1 `addSong(identifier, type)`
  - [ ] C-2-2 `trackSong(identifier, type, scopes)`
  - [ ] C-2-3 `addTikTokAccount(username)`
  - [ ] C-2-4 `getSongStats(platformId, platform, opts)`
  - [ ] C-2-5 `getTikTokAccountMetadata(username)`
  - [ ] C-2-6 `getTikTokAccountFollowerStats(username, opts)`
  - [ ] C-2-7 `getSongsChart({ sortPlatform, sortColumn, countryCodes, page, limit })`
- [ ] **C-3** Response shapes
  - [ ] C-3-1 Define minimal TypeScript types for every response we actually read
  - [ ] C-3-2 Keep `raw_payload` jsonb for everything else
- [ ] **C-4** Smoke tests against live API
  - [ ] C-4-1 Single song stats call
  - [ ] C-4-2 Page 1 of chart for `country_codes=US`
  - [ ] C-4-3 Verify rate-limit math against actual headers

---

## D. Daily Cron Job (`/api/cron/daily-snapshot`)

- [ ] **D-1** Route scaffolding
  - [ ] D-1-1 Route handler at `app/api/cron/daily-snapshot/route.ts`
  - [ ] D-1-2 Bearer-token auth via `CRON_SECRET`
  - [ ] D-1-3 Insert `job_runs` row with `status='running'`
  - [ ] D-1-4 Return 200 always; body carries detail
- [ ] **D-2** Phase 1 — Chart pull (build and verify first, in isolation)
  - [ ] D-2-1 Loop countries `['', 'US', 'GB', 'IE']` (empty → store as `WW`)
  - [ ] D-2-2 Loop pages 1..10, compute global rank from page index
  - [ ] D-2-3 Upsert into `chart_rankings` on the composite PK
  - [ ] D-2-4 Per-country try/catch — log + continue on error
- [ ] **D-3** Phase 2 — Per-song snapshots
  - [ ] D-3-1 Query non-archived artists → songs
  - [ ] D-3-2 Call `getSongStats` with `mode=total&limit_by_latest_days=2`
  - [ ] D-3-3 Upsert into `song_snapshots`
- [ ] **D-4** Phase 3 — Per-account snapshots
  - [ ] D-4-1 For each tracked TikTok account, fetch metadata + follower stats
  - [ ] D-4-2 Upsert into `account_snapshots`
- [ ] **D-5** Finalize
  - [ ] D-5-1 Update `job_runs` row: success / partial / failed
  - [ ] D-5-2 Populate counts (`*_processed`, `*_failed`) and `error_log`
- [ ] **D-6** Vercel cron registration
  - [ ] D-6-1 `vercel.json` with `0 6 * * *` → `/api/cron/daily-snapshot`
  - [ ] D-6-2 Pro plan note in README (300s function timeout)

---

## E. Auth

- [ ] **E-1** Password gate
  - [ ] E-1-1 `app/(auth)/login/page.tsx` form (single password input)
  - [ ] E-1-2 Server action: compare with `APP_PASSWORD`, set httpOnly cookie
  - [ ] E-1-3 Logout action
- [ ] **E-2** Middleware
  - [ ] E-2-1 `middleware.ts` redirects unauthenticated requests to `/login`
  - [ ] E-2-2 Skip `/api/cron/*` (uses bearer auth instead)

---

## F. Artist Onboarding (`/artists/new`)

- [ ] **F-1** Form UI
  - [ ] F-1-1 Fields: name, slug (auto from name), spotify_artist_id, tiktok_handle, notes
  - [ ] F-1-2 Dynamic song list — title + platform (tiktok/spotify) + platform_id rows
  - [ ] F-1-3 Validation (zod) + inline errors
- [ ] **F-2** Server action
  - [ ] F-2-1 Insert artist row
  - [ ] F-2-2 For each song: `addSong` → `trackSong` (if tiktok) → insert `songs` row with status
  - [ ] F-2-3 If tiktok_handle present: `addTikTokAccount` + insert `tiktok_accounts` row
  - [ ] F-2-4 Show pending banner if any `identification_status='pending'`
- [ ] **F-3** Edit page `/artists/[slug]/edit` — same fields, add/remove songs

---

## G. Artist List (`/`)

- [ ] **G-1** Server query
  - [ ] G-1-1 For each artist: count tracked songs, count songs on chart today (any country), find highest rank today, latest snapshot date
  - [ ] G-1-2 One SQL view or one query with CTEs — avoid N+1
- [ ] **G-2** UI
  - [ ] G-2-1 shadcn `<DataTable>` with sortable columns
  - [ ] G-2-2 Row click → `/artists/[slug]`
  - [ ] G-2-3 Empty state + "Add artist" button

---

## H. Artist Detail (`/artists/[slug]`) — Signature View

- [ ] **H-1** Header
  - [ ] H-1-1 Artist name, TikTok handle link, Spotify artist link
  - [ ] H-1-2 Archive / unarchive button
- [ ] **H-2** Metric cards row
  - [ ] H-2-1 Songs on global chart today: `X / Y`
  - [ ] H-2-2 Highest rank today
  - [ ] H-2-3 Best 7-day movement (song + delta)
  - [ ] H-2-4 TikTok followers + 7d delta
- [ ] **H-3** Rank table
  - [ ] H-3-1 Columns: Title, WW today, WW 7d ago, Movement, US, GB, IE, TikTok 7d videos
  - [ ] H-3-2 Movement glyphs: ▲ green / ▼ red / NEW gold / — grey
  - [ ] H-3-3 Songs not in top 1K render `—`
  - [ ] H-3-4 Row expand → inline 30-day rank mini-chart (Recharts)
- [ ] **H-4** Time-series charts (kept from v1)
  - [ ] H-4-1 TikTok video count over time per song
  - [ ] H-4-2 Follower count over time
- [ ] **H-5** Query layer
  - [ ] H-5-1 Single query joining `songs` ⨝ `chart_rankings` for today and 7d ago across 4 country scopes
  - [ ] H-5-2 Index sanity-check with `EXPLAIN ANALYZE`

---

## I. Chart Browser (`/chart`)

- [ ] **I-1** Country selector (WW default, US, GB, IE)
- [ ] **I-2** shadcn `<DataTable>` of today's top 1,000
- [ ] **I-3** Highlight rows that join to a tracked artist
- [ ] **I-4** Optional date picker (defaults to latest `snapshot_date`)

---

## J. Admin / Observability (`/admin/jobs`)

- [ ] **J-1** Table of recent `job_runs` (date, status, counts, duration)
- [ ] **J-2** Expand row → render `error_log` jsonb
- [ ] **J-3** "Run cron now" button — POSTs to the route with `CRON_SECRET` server-side

---

## K. Deploy

- [ ] **K-1** Vercel project link
  - [ ] K-1-1 Connect GitHub repo, configure env vars (prod + preview)
  - [ ] K-1-2 Confirm Pro plan if function timeout > 60s is needed
- [ ] **K-2** Cron verification
  - [ ] K-2-1 Trigger `/api/cron/daily-snapshot` manually with bearer header
  - [ ] K-2-2 Inspect `chart_rankings` row counts (4,000 rows for first run)
  - [ ] K-2-3 Inspect `song_snapshots` + `account_snapshots`
  - [ ] K-2-4 Inspect `job_runs` row for clean success
- [ ] **K-3** Monthly request budget check against Chartex plan (~5,400 req/mo)

---

## L. Phase 2 backlog (not v1 — keep visible)

- [ ] L-1 Multi-sort chart tracking (Spotify streams, TikTok 24h) — schema supports it via `sort_column`
- [ ] L-2 Songs outside top 1K — per-song chart-position lookup
- [ ] L-3 Weekly recalc job for last 30 days (Chartex backfills past values)
- [ ] L-4 `identification_status` polling against `/songs/tracked/`
- [ ] L-5 Movement alerts ("notify if any song moves > 20")
- [ ] L-6 Projects layer (`projects` table, `artists.project_id`)
- [ ] L-7 Instagram / YouTube / Shazam sibling snapshot tables
- [ ] L-8 Worker pattern when roster > ~200 songs

---

## Reference

- Spec: `CHARTEXDASHBOARDSPEC.md` (or the upload it came from)
- Chartex API: `chartex-api-reference.md` (to be saved alongside)
- Base URL: `https://api.chartex.com`, auth via `X-APP-ID` + `X-APP-TOKEN`
- Rate limit: 1,000 req/min; free endpoint: `POST /songs/add/`
