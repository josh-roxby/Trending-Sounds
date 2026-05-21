import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug, listSoundsForProject } from "@/lib/db/projects";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const sounds = await listSoundsForProject(project.id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
            {project.tiktok_handle && (
              <a
                className="hover:text-[var(--color-foreground)]"
                href={`https://www.tiktok.com/@${project.tiktok_handle}`}
                target="_blank"
                rel="noreferrer"
              >
                TikTok @{project.tiktok_handle}
              </a>
            )}
            {project.spotify_artist_id && (
              <a
                className="hover:text-[var(--color-foreground)]"
                href={`https://open.spotify.com/artist/${project.spotify_artist_id}`}
                target="_blank"
                rel="noreferrer"
              >
                Spotify ↗
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${project.slug}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Sounds tracked" value={sounds.length.toString()} />
        <Stat label="On chart today" value="—" hint="Wired after first snapshot" />
        <Stat label="Best rank" value="—" hint="WW today" />
        <Stat label="7d follower Δ" value="—" hint="TikTok account" />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Sounds</h2>
          <Link href={`/projects/${project.slug}/edit`}>
            <Button size="sm" variant="outline">
              Add / edit sounds
            </Button>
          </Link>
        </div>
        {sounds.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No sounds yet</CardTitle>
              <CardDescription>Attach TikTok sound IDs or Spotify track IDs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/projects/${project.slug}/edit`}>
                <Button>Add sounds</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-muted)] text-left text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Platform</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">WW</th>
                  <th className="px-4 py-2 font-medium">US</th>
                  <th className="px-4 py-2 font-medium">GB</th>
                  <th className="px-4 py-2 font-medium">IE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {sounds.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 font-medium">{s.title}</td>
                    <td className="px-4 py-2 text-[var(--color-muted-foreground)]">{s.platform}</td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          s.identification_status === "identified"
                            ? "success"
                            : s.identification_status === "failed"
                              ? "danger"
                              : "warn"
                        }
                      >
                        {s.identification_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-[var(--color-muted-foreground)]">—</td>
                    <td className="px-4 py-2 text-[var(--color-muted-foreground)]">—</td>
                    <td className="px-4 py-2 text-[var(--color-muted-foreground)]">—</td>
                    <td className="px-4 py-2 text-[var(--color-muted-foreground)]">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
        {hint ? <span className="text-xs text-[var(--color-muted-foreground)]">{hint}</span> : null}
      </CardHeader>
    </Card>
  );
}
