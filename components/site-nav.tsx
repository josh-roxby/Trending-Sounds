import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";

const NAV_AUTH = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/chart", label: "Chart" },
] as const;

export function SiteNav({ user }: { user: { email: string } | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)]/70 bg-[var(--color-background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            <span className="font-mono text-sm font-semibold tracking-tight">
              trending-sounds
            </span>
          </Link>
          {user ? (
            <nav className="hidden gap-1 text-sm sm:flex">
              {NAV_AUTH.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-2.5 py-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden font-mono text-xs text-[var(--color-muted-foreground)] sm:inline">
                {user.email}
              </span>
              <form action={logout}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
