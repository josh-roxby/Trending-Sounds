"use server";

import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signInWithEmail(formData: FormData) {
  if (!supabaseConfigured()) redirect("/login?error=not_configured");

  const email = (formData.get("email") as string | null)?.trim();
  if (!email) return;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });
  if (error) throw error;
  redirect(`/login?sent=1&email=${encodeURIComponent(email)}`);
}

export async function logout() {
  if (!supabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
