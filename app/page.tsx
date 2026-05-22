import Link from "next/link";
import { Activity, BarChart3, LineChart, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Signed-in operators skip the landing and go straight to the dashboard.
  if (supabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }

  return (
    <div className="relative -mt-8 flex flex-col">
      <BackgroundDecor />

      <section className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 pt-24 pb-20 text-center sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/60 px-3 py-1 font-mono text-xs tracking-tight text-[var(--color-muted-foreground)] backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          v0.1 · internal preview
        </span>

        <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          <span className="text-gradient">Track every sound</span>
          <br />
          <span className="text-accent-gradient">moving on TikTok.</span>
        </h1>

        <p className="max-w-xl text-balance text-base text-[var(--color-muted-foreground)] sm:text-lg">
          Daily snapshots of your roster's TikTok video counts, Spotify streams, and
          live position on the global 7-day chart — in one quiet dashboard.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/login">
            <Button size="lg" className="min-w-[180px]">
              Sign in
            </Button>
          </Link>
          <Link href="/chart">
            <Button size="lg" variant="outline" className="min-w-[180px]">
              Browse the chart
            </Button>
          </Link>
        </div>

        <p className="font-mono text-xs text-[var(--color-muted-foreground)]/70">
          Single operator · Magic-link auth · Powered by Chartex
        </p>
      </section>

      <section className="relative border-t border-[var(--color-border)]/60 bg-[var(--color-card)]/40 backdrop-blur">
        <div className="mx-auto grid w-full max-w-5xl gap-px overflow-hidden border-x border-[var(--color-border)]/60 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<ListMusic className="h-4 w-4" />}
            title="Projects → sounds"
            body="One project per artist or campaign, with as many tracked sounds as you need."
          />
          <Feature
            icon={<LineChart className="h-4 w-4" />}
            title="Daily snapshots"
            body="TikTok video counts and Spotify streams pulled once a day, idempotent."
          />
          <Feature
            icon={<BarChart3 className="h-4 w-4" />}
            title="Live chart rank"
            body="Top 1,000 of the TikTok 7-day chart across WW · US · GB · IE."
          />
          <Feature
            icon={<Activity className="h-4 w-4" />}
            title="Movement"
            body="Day-over-day deltas, weekly trends, and the highest mover at a glance."
          />
        </div>
      </section>

      <section className="relative border-t border-[var(--color-border)]/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16 sm:py-20">
          <div className="flex flex-col items-start gap-2">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted-foreground)]">
              The signature view
            </p>
            <h2 className="max-w-2xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              "Zach Bryan has 20 tracked sounds. 12 are on the chart today. #34 ▲ 8,
              #67 ▼ 12, #142 new entry…"
            </h2>
          </div>

          <RankCardPreview />
        </div>
      </section>

      <footer className="relative border-t border-[var(--color-border)]/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-xs text-[var(--color-muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono">Trending Sounds · Exhale Studios Lab</span>
          <div className="flex gap-4 font-mono">
            <Link href="/login" className="hover:text-[var(--color-foreground)]">
              Sign in
            </Link>
            <a
              href="https://api.chartex.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--color-foreground)]"
            >
              Chartex API ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-2 bg-[var(--color-background)] p-6">
      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/50 text-[var(--color-accent)]">
        {icon}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">{body}</p>
    </div>
  );
}

function RankCardPreview() {
  const rows = [
    { title: "Heading South", ww: 34, prev: 42, change: 8, us: 28, gb: 51, ie: 19 },
    { title: "Pink Skies", ww: 67, prev: null, change: null, us: 71, gb: null, ie: 44 },
    { title: "Something in the Orange", ww: null, prev: null, change: null, us: null, gb: null, ie: null },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
          <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
            zach-bryan · today
          </span>
        </div>
        <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
          TikTok 7-day · top 1,000
        </span>
      </div>
      <div className="grid grid-cols-[2fr_repeat(5,_1fr)] text-xs">
        <div className="bg-[var(--color-muted)]/40 px-5 py-2.5 font-mono uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Sound
        </div>
        {["WW", "Δ 7d", "US", "GB", "IE"].map((c) => (
          <div
            key={c}
            className="bg-[var(--color-muted)]/40 px-5 py-2.5 font-mono uppercase tracking-wider text-[var(--color-muted-foreground)]"
          >
            {c}
          </div>
        ))}
        {rows.map((r) => (
          <PreviewRow key={r.title} {...r} />
        ))}
      </div>
    </div>
  );
}

function PreviewRow({
  title,
  ww,
  change,
  us,
  gb,
  ie,
}: {
  title: string;
  ww: number | null;
  prev: number | null;
  change: number | null;
  us: number | null;
  gb: number | null;
  ie: number | null;
}) {
  const fmt = (v: number | null) => (v == null ? "—" : `#${v}`);
  return (
    <>
      <div className="border-t border-[var(--color-border)] px-5 py-3 font-medium">{title}</div>
      <div className="border-t border-[var(--color-border)] px-5 py-3 font-mono">{fmt(ww)}</div>
      <div className="border-t border-[var(--color-border)] px-5 py-3 font-mono">
        {change == null ? (
          ww == null ? (
            <span className="text-[var(--color-muted-foreground)]">—</span>
          ) : (
            <span className="text-amber-600">NEW</span>
          )
        ) : (
          <span className="text-emerald-600">▲ {change}</span>
        )}
      </div>
      <div className="border-t border-[var(--color-border)] px-5 py-3 font-mono text-[var(--color-muted-foreground)]">
        {fmt(us)}
      </div>
      <div className="border-t border-[var(--color-border)] px-5 py-3 font-mono text-[var(--color-muted-foreground)]">
        {fmt(gb)}
      </div>
      <div className="border-t border-[var(--color-border)] px-5 py-3 font-mono text-[var(--color-muted-foreground)]">
        {fmt(ie)}
      </div>
    </>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-grid opacity-[0.18] [mask-image:radial-gradient(ellipse_at_top,_black_30%,_transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(186 84% 44% / 0.20) 0%, transparent 60%)",
        }}
      />
    </>
  );
}
