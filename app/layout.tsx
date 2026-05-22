import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Trending Sounds",
  description: "Track TikTok + Spotify performance for a project roster.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;
  if (supabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
        <SiteNav user={userEmail ? { email: userEmail } : null} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
