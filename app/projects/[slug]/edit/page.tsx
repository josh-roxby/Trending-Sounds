import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectBySlug } from "@/lib/db/projects";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
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

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit {project.name}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Metadata edits and sound management land here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
          <CardDescription>
            Update project fields, add or remove sounds, attach a TikTok account. See
            <code className="ml-1">TODO.md</code> section <strong>F</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/projects/${project.slug}`}>
            <Button variant="outline">Back to project</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
