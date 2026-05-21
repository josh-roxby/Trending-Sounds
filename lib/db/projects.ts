import { createClient } from "@/lib/supabase/server";

export type ProjectPreview = {
  id: string;
  slug: string;
  name: string;
  sound_count: number;
  charting_count: number;
  highest_rank: number | null;
  highest_rank_title: string | null;
  latest_snapshot_date: string | null;
};

export type ProjectRow = {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  spotify_artist_id: string | null;
  tiktok_handle: string | null;
  notes: string | null;
  created_at: string;
  archived_at: string | null;
};

export type SoundRow = {
  id: string;
  project_id: string;
  title: string;
  platform: "tiktok" | "spotify";
  platform_id: string;
  is_tracked: boolean;
  identification_status: "pending" | "identified" | "failed";
  created_at: string;
};

export async function listProjectPreviews(userId: string): Promise<ProjectPreview[]> {
  const supabase = await createClient();
  // Reads through RLS — userId is enforced at the policy layer; we still pass it
  // to keep this helper usable from service-role callers later.
  const { data, error } = await supabase
    .from("project_previews")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  if (error) {
    if (error.code === "42P01") return []; // view not yet migrated
    throw error;
  }
  return (data ?? []) as ProjectPreview[];
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as ProjectRow | null) ?? null;
}

export async function listSoundsForProject(projectId: string): Promise<SoundRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sounds")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SoundRow[];
}

export async function listAllProjects(userId: string): Promise<ProjectRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []) as ProjectRow[];
}
