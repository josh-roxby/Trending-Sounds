import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listProjectPreviews } from "@/lib/db/projects";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts redirects unauthenticated requests to /login, so user is always set here.
  const previews = user ? await listProjectPreviews(user.id) : [];
  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome, {firstName}.
        </h1>
        <p className="max-w-2xl text-[var(--color-muted-foreground)]">
          One screen for every sound in your roster — TikTok rank movement, Spotify streams,
          follower trends. Pick a project below, or jump into the dashboard.
        </p>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
          <Link href="/projects/new">
            <Button variant="outline">New project</Button>
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Your projects</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Trending previews from the latest snapshot.
            </p>
          </div>
          <Link
            href="/projects"
            className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            View all →
          </Link>
        </div>

        {previews.length === 0 ? <EmptyProjects /> : <ProjectGrid previews={previews} />}
      </section>
    </div>
  );
}

function EmptyProjects() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No projects yet</CardTitle>
        <CardDescription>
          A project usually maps to one artist or campaign. Each project can hold many sounds —
          TikTok sound IDs and Spotify track IDs — and we'll snapshot them daily.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Link href="/projects/new">
          <Button>Create your first project</Button>
        </Link>
        <Link href="/chart">
          <Button variant="outline">Browse global chart</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ProjectGrid({
  previews,
}: {
  previews: Awaited<ReturnType<typeof listProjectPreviews>>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {previews.map((p) => (
        <Link key={p.id} href={`/projects/${p.slug}`} className="block">
          <Card className="h-full transition-colors hover:border-[var(--color-foreground)]/30">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="truncate">{p.name}</CardTitle>
                {p.charting_count > 0 ? (
                  <Badge variant="success">
                    {p.charting_count}/{p.sound_count} on chart
                  </Badge>
                ) : (
                  <Badge variant="outline">{p.sound_count} sounds</Badge>
                )}
              </div>
              <CardDescription className="truncate">
                {p.highest_rank
                  ? `Top rank #${p.highest_rank} (${p.highest_rank_title})`
                  : "No chart presence today"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-[var(--color-muted-foreground)]">
              {p.latest_snapshot_date
                ? `Last snapshot: ${p.latest_snapshot_date}`
                : "No snapshots yet"}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
