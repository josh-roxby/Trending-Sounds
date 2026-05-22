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

## Local quickstart

```bash
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, NEXT_PUBLIC_SITE_URL
npm run dev
```

Apply the schema:
```bash
supabase db push          # if you have the Supabase CLI linked, or
# paste supabase/migrations/0001_init.sql into the SQL editor
```

## Supabase setup checklist

1. Create a Supabase project. Grab the URL + anon key + service-role key.
2. **Authentication → Providers → Email**: enable Email. For prototype use the built-in Supabase SMTP; for production set your own SMTP.
3. **Authentication → URL Configuration**:
   - Site URL: your Vercel production URL (e.g. `https://your-app.vercel.app`)
   - Additional redirect URLs: add `http://localhost:3000/auth/callback` and `https://your-app.vercel.app/auth/callback`
4. Run `supabase/migrations/0001_init.sql` in SQL Editor (or `supabase db push`).
5. Confirm `projects`, `sounds`, `chart_rankings`, etc. exist under **Database → Tables**.

## Deploying to Vercel

If you previously hit `Error: No Output Directory named "public" found`, it means Vercel didn't recognise the project as a Next.js app and fell back to static-site behaviour. Both of the below fix it; the second is the durable one.

1. The repo now ships a `public/` directory (Next.js convention) so the immediate error is gone.
2. In **Vercel → Project Settings → General → Framework Preset**, ensure it's set to **Next.js** (not "Other"). With `package.json` containing `next` and `next.config.ts` present, Vercel should auto-detect — but if you imported the project before those existed, the preset may be stuck on "Other". Re-deploy after toggling.

Then:

1. Add env vars in **Vercel → Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CHARTEX_APP_ID`
   - `CHARTEX_APP_TOKEN`
   - `CRON_SECRET` (long random string)
   - `NEXT_PUBLIC_SITE_URL` (your Vercel URL)
2. The cron in `vercel.json` runs `/api/cron/daily-snapshot` every day at 06:00 UTC. The route currently stubs out the work (returns 200 with auth) until TODO section D lands.
3. Vercel Cron needs at least 60s function timeout for the full chart pull — Pro plan recommended.

## Routes

| Path | Purpose |
|---|---|
| `/` | Home — welcome + project preview cards |
| `/dashboard` | Roster-wide stats + previews |
| `/projects` | All projects, list view |
| `/projects/new` | Create a project |
| `/projects/[slug]` | Project detail — sounds + rank table |
| `/projects/[slug]/edit` | Edit metadata + sounds (stub) |
| `/chart` | Global TikTok 7-day chart browser (post-first-cron) |
| `/login` | Magic-link sign in |
| `/auth/callback` | Supabase OAuth code → session |
| `/api/cron/daily-snapshot` | Cron endpoint, bearer-authed via `CRON_SECRET` |

`proxy.ts` (Next 16's rename of `middleware.ts`) gates everything except `/login`, `/auth/*`, and `/api/cron/*` behind Supabase Auth.

## Environment variables

See `.env.example`. **Never** expose `SUPABASE_SERVICE_ROLE_KEY` or `CHARTEX_APP_TOKEN` client-side. The service-role key only lives in server-only code paths (`lib/supabase/server.ts#createServiceClient`, the cron route).
