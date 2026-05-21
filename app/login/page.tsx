import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "@/app/(auth)/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; next?: string }>;
}) {
  const { sent, email } = await searchParams;

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
            We'll send a one-tap login link. Configure Supabase Auth → Email to enable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm">
              Link sent to <span className="font-medium">{email}</span>. Check your inbox.
            </p>
          ) : (
            <form action={signInWithEmail} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <Button type="submit">Send magic link</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
