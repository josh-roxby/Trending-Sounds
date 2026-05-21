import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listProjectPreviews } from "@/lib/db/projects";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const previews = user ? await listProjectPreviews(user.id) : [];

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}.
        </h1>
        <p className="max-w-2xl text-[var(--color-muted-foreground)]">
          One screen to see how every sound in your roster is moving on TikTok and Spotify.
          Pick a project below, or jump into the full dashboard.
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
              Trending previews from the most recent snapshot.
            </p>
          </div>
          <Link href="/projects" className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
            View all →
          </Link>
        </div>

        {previews.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>
                Create a project to start tracking sounds across TikTok and Spotify.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects/new">
                <Button>Create your first project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previews.map((p) => (
              <Link key={p.id} href={`/projects/${p.slug}`} className="block">
                <Card className="h-full transition-colors hover:border-[var(--color-foreground)]/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="truncate">{p.name}</CardTitle>
                      {p.charting_count > 0 ? (
                        <Badge variant="success">
                          {p.charting_count}/{p.sound_count} on chart
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {p.sound_count} sounds
                        </Badge>
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
        )}
      </section>
    </div>
  );
}
