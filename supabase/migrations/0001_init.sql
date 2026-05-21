-- Trending Sounds — initial schema.
-- Multi-user: every project belongs to an auth.users row. Sounds inherit via project.
-- Chart rankings are global (cron writes via service role; users read).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- projects (formerly "artists" in the spec)
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  spotify_artist_id text,
  tiktok_handle text,
  notes text,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (user_id, slug)
);
create index projects_user_id_idx on public.projects(user_id);

-- ---------------------------------------------------------------------------
-- sounds (formerly "songs"). Many sounds per project.
-- ---------------------------------------------------------------------------
create table public.sounds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  platform text not null check (platform in ('tiktok','spotify')),
  platform_id text not null,
  is_tracked boolean not null default false,
  identification_status text not null default 'pending' check (identification_status in ('pending','identified','failed')),
  created_at timestamptz not null default now(),
  unique (platform, platform_id)
);
create index sounds_project_id_idx on public.sounds(project_id);
create index sounds_platform_id_idx on public.sounds(platform_id);

-- ---------------------------------------------------------------------------
-- tiktok_accounts — one per project
-- ---------------------------------------------------------------------------
create table public.tiktok_accounts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  username text not null unique,
  is_tracked boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sound_snapshots — per-sound daily metrics
-- ---------------------------------------------------------------------------
create table public.sound_snapshots (
  id bigserial primary key,
  sound_id uuid not null references public.sounds(id) on delete cascade,
  snapshot_date date not null,
  tiktok_total_video_count bigint,
  tiktok_last_7_days_video_count bigint,
  tiktok_last_24_hours_video_count bigint,
  tiktok_total_video_views bigint,
  spotify_total_streams bigint,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (sound_id, snapshot_date)
);
create index sound_snapshots_sound_date_idx on public.sound_snapshots(sound_id, snapshot_date desc);

-- ---------------------------------------------------------------------------
-- account_snapshots — per-TikTok-account daily follower stats
-- ---------------------------------------------------------------------------
create table public.account_snapshots (
  id bigserial primary key,
  tiktok_account_id uuid not null references public.tiktok_accounts(id) on delete cascade,
  snapshot_date date not null,
  total_followers bigint,
  last_7_days_followers_count bigint,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (tiktok_account_id, snapshot_date)
);

-- ---------------------------------------------------------------------------
-- chart_rankings — full top 1,000 daily, across country scopes. Global table.
-- ---------------------------------------------------------------------------
create table public.chart_rankings (
  id bigserial,
  snapshot_date date not null,
  sort_platform text not null,
  sort_column text not null,
  country_code text not null,
  rank int not null check (rank >= 1),
  song_platform_id text not null,
  metric_value bigint,
  title text,
  artist_name text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  primary key (snapshot_date, sort_platform, sort_column, country_code, rank)
);
create index chart_rankings_today_lookup_idx
  on public.chart_rankings (snapshot_date, song_platform_id);
create index chart_rankings_history_idx
  on public.chart_rankings (song_platform_id, snapshot_date desc);

-- ---------------------------------------------------------------------------
-- job_runs — cron observability
-- ---------------------------------------------------------------------------
create table public.job_runs (
  id bigserial primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','success','partial','failed')),
  sounds_processed int default 0,
  sounds_failed int default 0,
  accounts_processed int default 0,
  accounts_failed int default 0,
  chart_pulls_processed int default 0,
  chart_pulls_failed int default 0,
  error_log jsonb
);

-- ---------------------------------------------------------------------------
-- Project preview view — feeds the home/dashboard cards.
-- ---------------------------------------------------------------------------
create or replace view public.project_previews as
with latest_chart_date as (
  select max(snapshot_date) as d from public.chart_rankings
),
ranked_today as (
  select
    s.project_id,
    s.title,
    cr.rank
  from public.sounds s
  join public.chart_rankings cr
    on cr.song_platform_id = s.platform_id
   and cr.snapshot_date = (select d from latest_chart_date)
   and cr.country_code = 'WW'
   and cr.sort_platform = 'tiktok'
   and cr.sort_column = 'tiktok_last_7_days_video_count'
  where s.platform = 'tiktok'
),
best_per_project as (
  select distinct on (project_id)
    project_id, title as highest_rank_title, rank as highest_rank
  from ranked_today
  order by project_id, rank asc
),
sound_counts as (
  select project_id, count(*)::int as sound_count
  from public.sounds
  group by project_id
),
charting_counts as (
  select project_id, count(*)::int as charting_count
  from ranked_today
  group by project_id
),
latest_snapshots as (
  select s.project_id, max(ss.snapshot_date) as latest_snapshot_date
  from public.sounds s
  left join public.sound_snapshots ss on ss.sound_id = s.id
  group by s.project_id
)
select
  p.id,
  p.user_id,
  p.slug,
  p.name,
  coalesce(sc.sound_count, 0) as sound_count,
  coalesce(cc.charting_count, 0) as charting_count,
  bp.highest_rank,
  bp.highest_rank_title,
  ls.latest_snapshot_date
from public.projects p
left join sound_counts sc on sc.project_id = p.id
left join charting_counts cc on cc.project_id = p.id
left join best_per_project bp on bp.project_id = p.id
left join latest_snapshots ls on ls.project_id = p.id
where p.archived_at is null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.sounds enable row level security;
alter table public.tiktok_accounts enable row level security;
alter table public.sound_snapshots enable row level security;
alter table public.account_snapshots enable row level security;
alter table public.chart_rankings enable row level security;
alter table public.job_runs enable row level security;

-- projects: owner-only.
create policy "own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sounds: scoped via parent project.
create policy "own sounds" on public.sounds
  for all using (
    exists (select 1 from public.projects p where p.id = sounds.project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = sounds.project_id and p.user_id = auth.uid())
  );

create policy "own tiktok_accounts" on public.tiktok_accounts
  for all using (
    exists (select 1 from public.projects p where p.id = tiktok_accounts.project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = tiktok_accounts.project_id and p.user_id = auth.uid())
  );

create policy "own sound_snapshots" on public.sound_snapshots
  for select using (
    exists (
      select 1 from public.sounds s
      join public.projects p on p.id = s.project_id
      where s.id = sound_snapshots.sound_id and p.user_id = auth.uid()
    )
  );

create policy "own account_snapshots" on public.account_snapshots
  for select using (
    exists (
      select 1 from public.tiktok_accounts ta
      join public.projects p on p.id = ta.project_id
      where ta.id = account_snapshots.tiktok_account_id and p.user_id = auth.uid()
    )
  );

-- chart_rankings: any signed-in user can read; writes are service-role only.
create policy "auth read chart" on public.chart_rankings
  for select to authenticated using (true);

-- job_runs: not exposed to end users in v1.
-- (No select policy = no rows visible. Admin tooling uses service role.)
