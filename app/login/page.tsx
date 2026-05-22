import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "@/app/(auth)/actions";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; next?: string; error?: string }>;
}) {
  const { sent, email, error } = await searchParams;
  const configured = supabaseConfigured();

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trending Sounds</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Sign in to view your roster and the global TikTok 7-day chart.
        </p>
      </div>

      {!configured ? <SetupBanner /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Email magic link</CardTitle>
          <CardDescription>
            We'll email you a one-tap login link. No password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                Link sent to <span className="font-medium">{email}</span>.
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Check your inbox (and spam). The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <form action={signInWithEmail} className="flex flex-col gap-4">
              {error ? (
                <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600">
                  {error === "callback_failed"
                    ? "That link expired or was already used. Try again."
                    : error === "not_configured"
                      ? "Supabase isn't configured. Add env vars on Vercel."
                      : error}
                </p>
              ) : null}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={!configured}
                />
              </div>
              <Button type="submit" disabled={!configured}>
                Send magic link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-[var(--color-muted-foreground)]">
        Internal tool · single-operator preview
      </p>
    </div>
  );
}

function SetupBanner() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <p className="font-medium text-amber-700 dark:text-amber-400">
        Supabase isn't configured yet.
      </p>
      <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
        Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{" "}
        <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in Vercel → Project
        Settings → Environment Variables, then redeploy. See <code>README.md</code> for the
        full Supabase Auth checklist.
      </p>
    </div>
  );
}
