# Trending Sounds

Internal dashboard for tracking TikTok + Spotify performance of a roster of sounds, organised by **project** (1 project ≈ 1 artist or campaign). Pulls daily snapshots from the [Chartex API](https://api.chartex.com) and joins them against the global TikTok 7-day chart for rank movement.

See `CHARTEXDASHBOARDSPEC.md` for the full spec and `TODO.md` for the build plan (A-1-1 format).

## Stack

- Next.js 16 (App Router, Turbopack, React Compiler stable)
- React 19.2
- Tailwind CSS v4 (CSS-first config in `app/globals.css`)
- shadcn-pattern UI primitives under `components/ui/`
- Supabase (Postgres + Auth via `@supabase/ssr`)
- Vercel hosting + cron

## Quickstart

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env.local
# fill in Supabase + Chartex values

# 3. Apply schema
#    Either via Supabase CLI:
supabase db push
#    or paste supabase/migrations/0001_init.sql into the SQL editor.

# 4. Dev
npm run dev
```

Open <http://localhost:3000>. The middleware will bounce you to `/login` — sign in with a magic link (configure SMTP in Supabase Auth first, or use the Supabase dashboard to add a user manually).

## Routes

| Path | Purpose |
|---|---|
| `/` | Home — welcome + project previews |
| `/dashboard` | Roster-wide stats |
| `/projects` | All projects, list view |
| `/projects/new` | Create a project |
| `/projects/[slug]` | Project detail — sounds + rank table |
| `/chart` | Global TikTok 7-day chart browser (post-first-cron) |
| `/login` | Magic-link sign in |
| `/api/cron/daily-snapshot` | Cron — to be implemented (TODO section D) |

## Environment variables

See `.env.example`. **Never** expose `SUPABASE_SERVICE_ROLE_KEY` or `CHARTEX_APP_TOKEN` client-side.

## Deploy

Push to `main`, connect on Vercel, paste env vars, deploy. The cron in `vercel.json` runs daily at 06:00 UTC and needs the project on a plan with ≥60s function timeout (Pro recommended for the full 40-request chart pull).
