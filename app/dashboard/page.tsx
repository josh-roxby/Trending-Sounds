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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Roster-wide snapshot. Drill into a project for the per-sound view.
          </p>
        </div>
        <Link href="/projects/new">
          <Button>New project</Button>
        </Link>
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
        <h2 className="text-lg font-semibold tracking-tight">Project trending previews</h2>
        {previews.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nothing tracked yet</CardTitle>
              <CardDescription>
                Add a project to start pulling daily snapshots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects/new">
                <Button>New project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {previews.map((p) => (
              <Link key={p.id} href={`/projects/${p.slug}`}>
                <Card className="h-full transition-colors hover:border-[var(--color-foreground)]/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="truncate">{p.name}</CardTitle>
                      <Badge variant={p.charting_count > 0 ? "success" : "outline"}>
                        {p.charting_count}/{p.sound_count} charting
                      </Badge>
                    </div>
                    <CardDescription>
                      {p.highest_rank
                        ? `Top: #${p.highest_rank} — ${p.highest_rank_title}`
                        : "No chart presence today"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-[var(--color-muted-foreground)]">
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
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
