import { Skeleton } from "@/components/ui/skeleton";

/** Three stat tiles placeholder used above log tables. */
export function StatTilesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Generic stacked rows placeholder for list/table bodies. */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Thread list placeholder for the inbox sidebar. */
export function ThreadsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 border-b border-border px-4 py-3 last:border-0">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Chat bubbles placeholder for the inbox conversation pane. */
export function MessagesSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
          <Skeleton className={`h-14 rounded-2xl ${i % 2 ? "w-2/5" : "w-3/5"}`} />
        </div>
      ))}
    </div>
  );
}

/** Labelled field placeholders for settings/composer forms. */
export function FieldsSkeleton({ fields = 3, columns = 3 }: { fields?: number; columns?: number }) {
  return (
    <div className={`grid gap-3 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Indeterminate bar shown while a background action is running. */
export function IndeterminateBar({ label }: { label?: string }) {
  return (
    <div className="space-y-1.5" role="status" aria-live="polite">
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/3 animate-[indeterminate_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      {label ? <p className="text-xs text-muted-foreground">{label}</p> : null}
    </div>
  );
}
