# Chartex Artist Dashboard — Build Spec

**Owner:** Josh / Exhale Studios Lab
**Status:** v1.1 spec, ready for build
**Last updated:** 2026-05-20

---

## 1. Goal

Build a small internal dashboard that tracks a curated set of music artists on the [Chartex API](https://api.chartex.com), takes a daily snapshot of their key metrics on TikTok and Spotify **and their position within the global TikTok chart**, and surfaces both absolute metrics and chart-rank movement over time through a simple web frontend.

**Primary user:** One operator (me). Internal tool, not customer-facing.

**Core loop:**
1. I add an artist (name + Spotify artist ID + TikTok handle + a list of song identifiers).
2. A daily cron job pulls (a) fresh metrics for every tracked song and account, and (b) the top 1,000 of the Chartex TikTok 7-day chart across 4 country scopes.
3. The dashboard shows current metrics, trends, and — crucially — **where each of an artist's songs ranks on the chart today, with day-over-day movement**.

The signature view: "Zach Bryan has 20 tracked songs. 12 are on the global TikTok 7-day chart today. #34 (▲ 8), #67 (▼ 12), #142 (new entry)..."

---

## 2. Non-goals (v1)

- Instagram, YouTube, Shazam.
- Multi-user auth — single operator, password gate.
- Multi-sort chart tracking (Spotify rank, Shazam rank). TikTok 7-day only in v1.
- Country-by-country drilldown UI beyond showing rank per country. No country comparison views.
- Multi-artist projects — 1 project = 1 artist.
- Push notifications, email digests, anomaly detection.
- Public-facing pages or sharing.
- Custom design system — shadcn/ui defaults.
- Tracking songs that aren't attached to one of our artists (chart data is stored fully, but UI only surfaces tracked-artist songs).

---

## 3. Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | Vercel-native, server components for clean DB reads |
| UI | shadcn/ui + Tailwind | Default aesthetic, ship fast |
| Charts | Recharts | Default for shadcn examples |
| Database | Supabase (Postgres) | Existing stack, SQL queries trivial for time-series |
| Cron | Vercel Cron → Next.js Route Handler | Same vendor as hosting |
| Hosting | Vercel | — |
| External API | Chartex REST API | See `chartex-api-reference.md` |

---

## 4. Data model

Postgres schema, managed via Supabase migrations.

### `artists`
One row per tracked artist. 1:1 with a "project" — no separate projects table in v1.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `name` | text | Display name |
| `slug` | text (unique) | URL slug, e.g. `zach-bryan` |
| `spotify_artist_id` | text (nullable) | For future artist-level Spotify pulls |
| `tiktok_handle` | text (nullable) | Without `@` |
| `notes` | text (nullable) | Free-form |
| `created_at` | timestamptz | |
| `archived_at` | timestamptz (nullable) | Soft delete |

### `songs`
The Chartex-trackable assets attached to an artist.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `artist_id` | uuid (fk → artists.id) | |
| `title` | text | Display title, manually entered |
| `platform` | text | `spotify` \| `tiktok` |
| `platform_id` | text | Spotify track ID or TikTok sound ID |
| `is_tracked` | boolean | Whether `/songs/track/` has been called |
| `identification_status` | text | `pending` \| `identified` \| `failed` |
| `created_at` | timestamptz | |

**Unique constraint:** `(platform, platform_id)`.

**Index:** `(platform_id)` — critical for the chart-rank join.

### `tiktok_accounts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `artist_id` | uuid (fk → artists.id, unique) | |
| `username` | text (unique) | |
| `is_tracked` | boolean | |
| `created_at` | timestamptz | |

### `song_snapshots`
Per-song daily metrics. Independent of chart ranking.

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial (pk) | |
| `song_id` | uuid (fk → songs.id) | |
| `snapshot_date` | date | UTC |
| `tiktok_total_video_count` | bigint (nullable) | |
| `tiktok_last_7_days_video_count` | bigint (nullable) | |
| `tiktok_last_24_hours_video_count` | bigint (nullable) | |
| `tiktok_total_video_views` | bigint (nullable) | Only if tracked |
| `spotify_total_streams` | bigint (nullable) | |
| `raw_payload` | jsonb | |
| `created_at` | timestamptz | |

**Unique constraint:** `(song_id, snapshot_date)` — idempotent upsert.

### `account_snapshots`

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial (pk) | |
| `tiktok_account_id` | uuid (fk) | |
| `snapshot_date` | date | |
| `total_followers` | bigint | |
| `last_7_days_followers_count` | bigint (nullable) | |
| `raw_payload` | jsonb | |
| `created_at` | timestamptz | |

**Unique constraint:** `(tiktok_account_id, snapshot_date)`.

### `chart_rankings` — NEW
The core ranking table. One row per (date, sort, country, rank position). Stores the **entire top 1,000** every day across 4 country scopes — not filtered to our artists. This matters because:
1. Lets us answer "which songs broke the top 100 today" even for songs we don't track yet.
2. Trivial join to surface tracked-artist songs.
3. Storage is cheap; flexibility is valuable.

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial (pk) | |
| `snapshot_date` | date | UTC |
| `sort_platform` | text | `tiktok` (only value in v1) |
| `sort_column` | text | `tiktok_last_7_days_video_count` (only value in v1) |
| `country_code` | text | `WW` for worldwide, else ISO (US, GB, IE) |
| `rank` | int | 1-based position |
| `song_platform_id` | text | The TikTok sound ID (joins to `songs.platform_id` where `songs.platform = 'tiktok'`) |
| `metric_value` | bigint | The sort-column value at this rank |
| `title` | text (nullable) | Song title from Chartex response — useful for unmatched-rank display |
| `artist_name` | text (nullable) | From Chartex response |
| `raw_payload` | jsonb | |
| `created_at` | timestamptz | |

**Primary key:** `(snapshot_date, sort_platform, sort_column, country_code, rank)`.
**Index:** `(snapshot_date, song_platform_id)` — critical for "show me today's rank for these songs" queries.
**Index:** `(song_platform_id, snapshot_date DESC)` — for historical movement queries.

**Volume math:** 1,000 rows × 4 countries × 1 sort × 365 days = ~1.5M rows/year. Trivial for Postgres.

### `job_runs`

| Column | Type | Notes |
|---|---|---|
| `id` | bigserial (pk) | |
| `started_at` | timestamptz | |
| `finished_at` | timestamptz (nullable) | |
| `status` | text | `running` \| `success` \| `partial` \| `failed` |
| `songs_processed` | int | |
| `songs_failed` | int | |
| `accounts_processed` | int | |
| `accounts_failed` | int | |
| `chart_pulls_processed` | int | Out of 4 (one per country scope) |
| `chart_pulls_failed` | int | |
| `error_log` | jsonb | |

---

## 5. Chartex endpoints used (v1)

### On artist onboarding (one-off per song/account)
| Endpoint | Purpose | Free? |
|---|---|---|
| `POST /external/v1/songs/add/` | Register song in Chartex DB | ✅ Free |
| `POST /external/v1/songs/track/` with `scopes: ['tiktok']` | Enable TikTok video-level stats | Counts |
| `POST /external/v1/tiktok/accounts/add/` | Register + track TikTok account | Counts |

### Daily cron — per-song snapshot
| Endpoint | Purpose |
|---|---|
| `GET /external/v1/songs/{platform_id}/{platform}/stats/all/?mode=total&limit_by_latest_days=2` | TikTok video counts + Spotify streams |

### Daily cron — per-account snapshot
| Endpoint | Purpose |
|---|---|
| `GET /external/v1/tiktok/accounts/{username}/metadata/` | Current total_followers |
| `GET /external/v1/tiktok/accounts/{username}/stats/follower-counts/?mode=total&limit_by_latest_days=2` | Recent followers |

### Daily cron — chart pull (NEW)
| Endpoint | Purpose |
|---|---|
| `GET /external/v1/songs/?sort_platform=tiktok&sort_column=tiktok_last_7_days_video_count&country_codes={CC}&page={N}&limit=100` | Top 1,000 TikTok 7-day chart for a given country scope |

Loop logic:
- For each country scope in `['', 'US', 'GB', 'IE']` (empty string = worldwide):
  - For `page` in `1..10`:
    - Fetch. Each item's index in the full sequence → `rank` (page 1 item 0 = rank 1, page 10 item 99 = rank 1000).
    - Store TikTok sound ID as `song_platform_id`.
- Total: 10 pages × 4 countries = 40 requests.

Worldwide is stored with `country_code = 'WW'` regardless of how Chartex labels an empty param.

### Endpoints NOT used in v1
Influencer stats, video stats, country statistics, sounds stats, Spotify chart, Shazam chart, Instagram, YouTube. Deferred.

### Rate-limit math
At 1,000 req/min, daily run with:
- ~20 artists × ~5 songs each = ~100 song requests
- ~20 accounts × 2 requests each = ~40 account requests
- Chart pull: 40 requests
- **Total: ~180 requests/day**

Comfortably inside per-minute limit. Single Vercel function should complete in 30-60s sequentially. Pro plan (300s function timeout) recommended.

**Monthly budget watch:** 180/day × 30 = ~5,400 requests/month. Verify against your Chartex plan before first deploy.

---

## 6. Daily cron job

### Schedule
`vercel.json` cron: `0 6 * * *` (06:00 UTC daily) → `/api/cron/daily-snapshot`.

### Auth
Verify `Authorization: Bearer <CRON_SECRET>` header.

### Algorithm
1. Insert `job_runs` row, `status: 'running'`.
2. **Phase 1 — Chart pull** (most critical, runs first so even partial failure doesn't lose chart data):
   - For each country in `['', 'US', 'GB', 'IE']`:
     - For page 1..10: fetch, compute global rank, upsert into `chart_rankings`.
     - On error: log and continue to next country (don't abort).
3. **Phase 2 — Per-song snapshots**:
   - Query all non-archived artists → their songs.
   - For each song: fetch stats, upsert into `song_snapshots`.
4. **Phase 3 — Per-account snapshots**:
   - For each TikTok account: fetch metadata + follower stats, upsert.
5. Update `job_runs` with final status:
   - `success` if 0 failures
   - `partial` if some failures
   - `failed` if all of Phase 1 failed
6. Return 200 always; details in response body.

### Idempotency
All writes are upserts on unique constraints. Re-running the cron same-day is safe and even desirable when Chartex recalculates historical values.

### Concurrency
Sequential `for...of` with `await`. No parallelism. At 180 requests in ~30-60s, we're nowhere near the per-minute ceiling and we keep error attribution clean.

---

## 7. Frontend routes

```
/                          → Artist list
/artists/new               → Add artist form
/artists/[slug]            → Artist detail (the main view)
/artists/[slug]/edit       → Edit metadata, add/remove songs
/chart                     → Today's global chart browser (top 1K, optional country filter)
/admin/jobs                → job_runs observability
```

### `/` — Artist list
Table columns:
- Name
- # tracked songs
- # songs on global chart today
- Highest-ranked song today (e.g. "#34 — 'Heading South'")
- Latest snapshot date

Sortable. shadcn `<DataTable>`.

### `/artists/[slug]` — Artist detail (the signature view)
**Top:** artist name, TikTok link, Spotify artist link.

**Top metrics row (cards):**
- Songs on global chart today: `12 / 20`
- Highest rank today: `#34`
- Best 7-day movement: `▲ 18 (King of Oklahoma)`
- TikTok account followers: `Xm (Δ 7d: +Xk)`

**Main table — Songs ranked:**
| Title | Today (WW) | 7d ago (WW) | Movement | US | GB | IE | TikTok 7d videos |
|---|---|---|---|---|---|---|---|
| Heading South | #34 | #42 | ▲ 8 | #28 | #51 | #19 | 124,500 |
| Pink Skies | #67 | — | NEW | #71 | — | #44 | 89,300 |
| Something in the Orange | — | — | — | — | — | — | 12,400 |

Songs not in top 1K show `—`. Click a row → expand inline mini-chart of rank over last 30 days.

**Movement glyphs:** ▲ green, ▼ red, NEW gold, — grey.

**Below:** existing line charts (TikTok video count over time per song, follower count over time). Kept from v1, just below the rank table now.

### `/chart` — Global chart browser
shadcn `<DataTable>` of today's top 1,000 for a selected country (default WW). Rows belonging to tracked artists get a subtle highlight. Useful for "did we miss anyone?" scans.

### `/admin/jobs`
Existing v1 spec — unchanged.

---

## 8. Auth
Single-operator. Env-var password + httpOnly cookie + middleware. No user accounts in v1.

---

## 9. Environment variables

```
# Chartex
CHARTEX_APP_ID=
CHARTEX_APP_TOKEN=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
APP_PASSWORD=
CRON_SECRET=
```

All Chartex calls server-side only. Never expose service-role key or Chartex token to client.

---

## 10. Chartex API client

`lib/chartex.ts` — typed wrapper, ~200 lines.

Methods used in v1:
- `addSong(identifier, type)`
- `trackSong(identifier, type, scopes)`
- `addTikTokAccount(username)`
- `getSongStats(platformId, platform, opts)`
- `getTikTokAccountMetadata(username)`
- `getTikTokAccountFollowerStats(username, opts)`
- `getSongsChart({ sortPlatform, sortColumn, countryCodes, page, limit })` — for chart pull

Pattern: build URL, attach `X-APP-ID` + `X-APP-TOKEN`, single 429-retry with 2s delay, throw typed errors on non-2xx.

---

## 11. Build order (suggested for Claude Code)

1. Bootstrap: Next.js 14 + Tailwind + shadcn/ui.
2. Supabase migrations for all tables incl. `chart_rankings` and indexes.
3. `lib/chartex.ts` API client (all methods).
4. `/api/cron/daily-snapshot` route — implement Phase 1 (chart pull) first and verify in isolation.
5. Add Phase 2 (song snapshots), then Phase 3 (account snapshots).
6. `vercel.json` cron config.
7. Auth middleware + login.
8. `/artists/new` onboarding form + server action.
9. `/` artist list.
10. `/artists/[slug]` detail page — rank table first (it's the signature view), charts second.
11. `/chart` global chart browser.
12. `/admin/jobs`.
13. Trigger cron manually, verify data, ship.

---

## 12. Open questions / phase 2

- **Multi-sort chart tracking.** v1 is TikTok 7-day only. Spotify streams rank and TikTok 24-hour rank are obvious next adds — schema already supports it via `sort_column`. Multiplier on request budget.
- **Songs outside top 1K.** Status quo: shows `—`. Phase 2 could pull deeper (top 5K) or do per-song chart-position lookups via a different query.
- **Late-data recalculation.** Chartex notes they recalculate past values. Weekly job re-pulling last 30 days of chart + song snapshots = clean data. Not in v1.
- **Identification status polling.** v1 just shows pending banner. Phase 2: ping `/songs/tracked/` to flip status.
- **Multi-artist songs.** Features force single attribution in v1.
- **Project layer.** Add `projects` table with `artists.project_id` when grouping is needed.
- **Instagram, YouTube, Shazam.** Schema extends — add sibling snapshot tables and new `sort_platform` values.
- **Scale ceiling.** Past ~200 songs in our roster or pulling top 5K, refactor cron to enqueue jobs and process in a worker pattern.
- **Movement alerts.** "Notify me if any tracked song moves >20 positions" — natural phase 2.

---

## 13. Reference: Chartex API

Save the full Chartex API doc as `chartex-api-reference.md` alongside this spec. Base URL `https://api.chartex.com`, all endpoints require `X-APP-ID` + `X-APP-TOKEN` headers. Rate limit 1,000 req/min. Free endpoint: `POST /songs/add/`.
