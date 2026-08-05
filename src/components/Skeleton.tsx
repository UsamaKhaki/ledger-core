// Loading placeholders that mirror the real layouts, so screens don't jump when
// data arrives. Uses `animate-pulse` on a subtle `--elevate` fill.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-md ${className}`} aria-hidden />;
}

const keys = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Mirrors the dashboard (Overview) — header, summary strip, cards, loans. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading your dashboard">
      {/* header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-9 w-60" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-2 gap-y-6 border-y border-[var(--border)] py-5 sm:grid-cols-4">
        {keys(4).map((i) => (
          <div
            key={i}
            className={`space-y-2 px-1 sm:px-5 ${i > 0 ? "sm:border-l sm:border-[var(--border)]" : ""}`}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* accounts heading + add button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-32 rounded-xl" />
      </div>

      {/* card tiles */}
      <div>
        <Skeleton className="mb-3 h-3 w-28" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {keys(3).map((i) => (
            <Skeleton key={i} className="aspect-[1.585/1] w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* loan rows */}
      <div>
        <Skeleton className="mb-3 h-3 w-32" />
        <div className="space-y-2">
          {keys(2).map((i) => (
            <Skeleton key={i} className="h-[104px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mirrors the card/loan detail page — hero, two panels, history. */
export function DetailSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading account">
      <Skeleton className="h-4 w-32" />

      {/* hero */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <Skeleton className="aspect-[1.585/1] w-full max-w-[400px] rounded-2xl lg:w-[400px]" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-9 w-52" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-16 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 border-t border-[var(--border)] pt-6 sm:grid-cols-4">
            {keys(4).map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>

      {/* history */}
      <Skeleton className="h-44 rounded-xl" />
    </div>
  );
}
