import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface p-5">
      <p className="label-mono text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

export function InsightsPanel() {
  const [hid, setHid] = useState("");

  const hackathons = useQuery({
    queryKey: ["insight-hackathons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hackathons")
        .select("id,title,event_date,registration_open")
        .order("event_date", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const counts = useQuery({
    queryKey: ["insight-counts"],
    queryFn: async () => {
      const [members, regs, results, squads] = await Promise.all([
        supabase.from("profiles").select("id,profile_completed,is_active"),
        supabase.from("registrations").select("id,hackathon_id"),
        supabase.from("hackathon_results").select("id,attended,placement"),
        supabase.from("squads").select("id"),
      ]);
      return {
        members: members.data ?? [],
        regs: regs.data ?? [],
        results: results.data ?? [],
        squads: squads.data?.length ?? 0,
      };
    },
  });

  const board = useQuery({
    queryKey: ["insight-board", hid],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_leaderboard",
        hid ? { _hackathon_id: hid } : {},
      );
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const c = counts.data;
  const regCount = (id: string) => (c?.regs ?? []).filter((r) => r.hackathon_id === id).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Members" value={c?.members.length ?? "—"} />
        <Stat
          label="Profiles complete"
          value={c ? c.members.filter((m) => m.profile_completed).length : "—"}
        />
        <Stat label="Registrations" value={c?.regs.length ?? "—"} />
        <Stat label="Squads formed" value={c?.squads ?? "—"} />
      </div>

      <div className="surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <h2 className="label-mono text-muted-foreground">Top performers</h2>
          <select
            value={hid}
            onChange={(e) => setHid(e.target.value)}
            className="ml-auto h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All hackathons</option>
            {(hackathons.data ?? []).map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => board.refetch()}>
            Refresh
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {(board.data ?? []).slice(0, 20).map((row, i) => (
            <li key={row.user_id} className="flex items-center gap-4 px-5 py-3">
              <span className="w-6 font-mono text-sm text-muted-foreground">{i + 1}</span>
              <span className="flex-1 truncate text-sm font-medium">{row.full_name}</span>
              <span className="label-mono text-muted-foreground">
                {row.events} events · {row.wins} wins
              </span>
              <span className="font-display text-base font-bold text-primary">{row.points} pts</span>
            </li>
          ))}
          {(board.data ?? []).length === 0 ? (
            <li className="px-5 py-7 text-center">
              <p className="font-display text-sm font-bold">No results recorded yet</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Open the Results tab, mark attendance and award points — top performers appear here.
              </p>
            </li>
          ) : null}
        </ul>
      </div>

      <div className="surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="label-mono text-muted-foreground">Hackathon turnout</h2>
        </div>
        <ul className="divide-y divide-border">
          {(hackathons.data ?? []).map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium">{h.title}</p>
                <p className="label-mono text-muted-foreground">
                  {new Date(h.event_date).toLocaleDateString()} ·{" "}
                  {h.registration_open ? "registration open" : "registration closed"}
                </p>
              </div>
              <span className="label-mono text-muted-foreground">
                {regCount(h.id)} registered
              </span>
            </li>
          ))}
          {(hackathons.data ?? []).length === 0 ? (
            <li className="px-5 py-7 text-center">
              <p className="font-display text-sm font-bold">No hackathons yet</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Create one in the Hackathons tab to start tracking turnout.
              </p>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
