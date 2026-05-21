import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { listProjectPreviews } from "@/lib/db/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const previews = await listProjectPreviews(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            One project per artist or campaign. Each has one or more sounds.
          </p>
        </div>
        <Link href="/projects/new">
          <Button>New project</Button>
        </Link>
      </div>

      {previews.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>Spin up the first one.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/projects/new">
              <Button>Create project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
          {previews.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-muted)]"
            >
              <div className="flex flex-col">
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {p.sound_count} sounds · {p.latest_snapshot_date ?? "no snapshots"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {p.highest_rank ? (
                  <span className="text-[var(--color-muted-foreground)]">
                    #{p.highest_rank} {p.highest_rank_title}
                  </span>
                ) : null}
                <Badge variant={p.charting_count > 0 ? "success" : "outline"}>
                  {p.charting_count}/{p.sound_count}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
