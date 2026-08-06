import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RowsSkeleton, StatTilesSkeleton, IndeterminateBar } from "@/components/admin/Skeletons";

type Filter = "all" | "sent" | "failed";

const PAGE_SIZE = 25;

/** Read-only record of every email the app has delivered. */
export function EmailLogPanel() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);

  // Debounce the search box so each keystroke does not hit the server.
  useEffect(() => {
    const id = setTimeout(() => {
      setTerm(q.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  // Totals are computed server-side with head-only count queries.
  const totals = useQuery({
    queryKey: ["email-log-totals", term],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const base = () => {
        let b = supabase.from("email_logs").select("id", { count: "exact", head: true });
        if (term) b = b.or(`recipient.ilike.%${term}%,recipient_name.ilike.%${term}%,subject.ilike.%${term}%`);
        return b;
      };
      const [all, sent] = await Promise.all([base(), base().eq("status", "sent")]);
      if (all.error) throw new Error(all.error.message);
      if (sent.error) throw new Error(sent.error.message);
      const total = all.count ?? 0;
      const delivered = sent.count ?? 0;
      return { total, sent: delivered, failed: total - delivered };
    },
  });

  const logs = useQuery({
    queryKey: ["email-logs", term, filter, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("email_logs")
        .select("id,recipient,recipient_name,subject,kind,status,error,created_at", { count: "exact" });
      if (filter !== "all") query = query.eq("status", filter);
      if (term) query = query.or(`recipient.ilike.%${term}%,recipient_name.ilike.%${term}%,subject.ilike.%${term}%`);
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const rows = logs.data?.rows ?? [];
  const matched = logs.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(matched / PAGE_SIZE));
  const sent = totals.data?.sent ?? 0;
  const failed = totals.data?.failed ?? 0;

  return (
    <div className="space-y-4" aria-busy={logs.isFetching}>
      {logs.isFetching && !logs.isLoading ? <IndeterminateBar label="Refreshing delivery log…" /> : null}
      {totals.isLoading ? (
        <StatTilesSkeleton />
      ) : (
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface p-4">
          <p className="label-mono text-muted-foreground">Total logged</p>
          <p className="mt-1 text-2xl font-semibold">{totals.data?.total ?? 0}</p>
        </div>
        <div className="surface p-4">
          <p className="label-mono text-muted-foreground">Delivered</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{sent}</p>
        </div>
        <div className="surface p-4">
          <p className="label-mono text-muted-foreground">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-destructive">{failed}</p>
        </div>
      </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search recipient or subject…"
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          {(["all", "sent", "failed"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              className="capitalize"
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
            >
              {f}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={logs.isFetching}
            onClick={() => {
              void logs.refetch();
              void totals.refetch();
            }}
          >
            {logs.isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="surface divide-y divide-border overflow-hidden">
        {logs.isLoading ? (
          <RowsSkeleton rows={6} />
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No emails sent yet. Announcements and results emails appear here once delivered.
          </p>
        ) : (
          rows.map((l) => (
            <div key={l.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.subject}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {l.recipient_name ? `${l.recipient_name} · ` : ""}
                  {l.recipient}
                </p>
                {l.error ? (
                  <p className="mt-1 text-xs text-destructive break-words">{l.error}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {l.kind}
                </Badge>
                <Badge variant={l.status === "sent" ? "secondary" : "destructive"}>{l.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          {matched === 0
            ? "No matching emails"
            : `Showing ${page * PAGE_SIZE + 1}–${Math.min(matched, (page + 1) * PAGE_SIZE)} of ${matched}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0 || logs.isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {pageCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page + 1 >= pageCount || logs.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}