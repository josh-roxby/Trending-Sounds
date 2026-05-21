import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

async function createProject(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return;
  const slug = (formData.get("slug") as string | null)?.trim() || slugify(name);
  const spotify_artist_id = (formData.get("spotify_artist_id") as string | null)?.trim() || null;
  const tiktok_handle = (formData.get("tiktok_handle") as string | null)?.trim().replace(/^@/, "") || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    name,
    slug,
    spotify_artist_id,
    tiktok_handle,
    notes,
  });
  if (error) throw error;
  redirect(`/projects/${slug}`);
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>New project</CardTitle>
          <CardDescription>
            One project usually maps to one artist or campaign. Add sounds after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProject} className="flex flex-col gap-4">
            <Field name="name" label="Name" placeholder="Zach Bryan" required />
            <Field name="slug" label="Slug" placeholder="zach-bryan (auto if empty)" />
            <Field name="spotify_artist_id" label="Spotify artist ID" placeholder="40ZNYROS4zLfyyBSs2PGe2" />
            <Field name="tiktok_handle" label="TikTok handle" placeholder="zachlanebryan (no @)" />
            <Field name="notes" label="Notes" placeholder="Free-form" />
            <div className="flex justify-end">
              <Button type="submit">Create project</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder={placeholder} required={required} />
    </div>
  );
}
