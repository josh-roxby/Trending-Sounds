import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">404</h1>
      <p className="text-[var(--color-muted-foreground)]">
        Couldn't find that page.
      </p>
      <Link href="/">
        <Button>Back home</Button>
      </Link>
    </div>
  );
}
