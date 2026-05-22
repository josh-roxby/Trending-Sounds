export default function Loading() {
  return (
    <div className="flex flex-col gap-4 py-10">
      <div className="h-8 w-48 animate-pulse rounded-md bg-[var(--color-muted)]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/40"
          />
        ))}
      </div>
    </div>
  );
}
