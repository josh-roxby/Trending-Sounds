import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; next?: string; error?: string }>;
}) {
  const { sent, email, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Magic link to your inbox. No password.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email magic link</CardTitle>
          <CardDescription>
            Enable Email under Supabase Auth → Providers, and add this site's
            <code className="mx-1">/auth/callback</code> URL under
            URL Configuration → Redirect URLs.
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
                />
              </div>
              <Button type="submit">Send magic link</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
