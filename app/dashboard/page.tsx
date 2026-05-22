import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listProjectPreviews } from "@/lib/db/projects";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const previews = await listProjectPreviews(user.id);

  const totalProjects = previews.length;
  const totalSounds = previews.reduce((acc, p) => acc + p.sound_count, 0);
  const totalCharting = previews.reduce((acc, p) => acc + p.charting_count, 0);
  const bestRank = previews
    .map((p) => p.highest_rank)
    .filter((r): r is number => r !== null)
    .sort((a, b) => a - b)[0];

  const firstName = user.email?.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted-foreground)]">
          Dashboard
        </p>
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            <span className="text-gradient">Good to see you, {firstName}.</span>
          </h1>
          <Link href="/projects/new">
            <Button>New project</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Projects" value={totalProjects.toString()} />
        <Stat label="Sounds tracked" value={totalSounds.toString()} />
        <Stat
          label="On chart today"
          value={totalSounds === 0 ? "—" : `${totalCharting}/${totalSounds}`}
        />
        <Stat label="Best rank today" value={bestRank ? `#${bestRank}` : "—"} />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Trending previews</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Latest snapshot per project.
            </p>
          </div>
          <Link
            href="/projects"
            className="font-mono text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            View all →
          </Link>
        </div>
        {previews.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nothing tracked yet</CardTitle>
              <CardDescription>
                Add a project to start pulling daily snapshots from Chartex.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Link href="/projects/new">
                <Button>New project</Button>
              </Link>
              <Link href="/chart">
                <Button variant="outline">Browse global chart</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previews.map((p) => (
              <Link key={p.id} href={`/projects/${p.slug}`}>
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-[var(--color-foreground)]/30 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="truncate">{p.name}</CardTitle>
                      <Badge variant={p.charting_count > 0 ? "success" : "outline"}>
                        {p.charting_count}/{p.sound_count} charting
                      </Badge>
                    </div>
                    <CardDescription className="truncate">
                      {p.highest_rank
                        ? `Top: #${p.highest_rank} — ${p.highest_rank_title}`
                        : "No chart presence today"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="font-mono text-xs text-[var(--color-muted-foreground)]">
                    {p.latest_snapshot_date ?? "No snapshots yet"}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="font-mono text-xs uppercase tracking-wider">
          {label}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
