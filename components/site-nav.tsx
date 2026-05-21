import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/chart", label: "Chart" },
] as const;

export function SiteNav({ user }: { user: { email: string } | null }) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            Trending Sounds
          </Link>
          <nav className="hidden gap-4 text-sm text-[var(--color-muted-foreground)] sm:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-[var(--color-foreground)]">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-[var(--color-muted-foreground)] sm:inline">
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
