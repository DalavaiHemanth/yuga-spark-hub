import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TITLE = "Dashboard — Yuga Spark";
const DESCRIPTION = "Upcoming Yuga Spark hackathons, your registrations and club shortcuts.";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile && !profile.profile_completed && !isAdmin) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, profile, isAdmin, navigate]);

  const hackathons = useQuery({
    queryKey: ["hackathons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hackathons")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const registrations = useQuery({
    queryKey: ["registrations", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("hackathon_id")
        .eq("user_id", user!.id);
      if (error) throw new Error(error.message);
      return data.map((r) => r.hackathon_id);
    },
  });

  async function toggle(hackathonId: string, registered: boolean) {
    if (!user) return;
    const q = registered
      ? supabase.from("registrations").delete().eq("user_id", user.id).eq("hackathon_id", hackathonId)
      : supabase.from("registrations").insert({ user_id: user.id, hackathon_id: hackathonId });
    const { error } = await q;
    if (error) toast.error(error.message);
    else {
      toast.success(registered ? "Registration withdrawn" : "You're in. See you there.");
      await registrations.refetch();
    }
  }

  const now = Date.now();
  const list = hackathons.data ?? [];
  const upcoming = list.filter((h) => new Date(h.event_date).getTime() >= now - 864e5);
  const past = list.filter((h) => new Date(h.event_date).getTime() < now - 864e5);

  return (
    <AppShell>
      <p className="label-mono text-primary">Mission control</p>
      <h1 className="mt-3 text-4xl font-bold">
        {profile?.full_name ? `Hey, ${profile.full_name.split(" ")[0]}` : "Welcome"}
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Everything the club is running right now. Register early — team sizes are capped.
      </p>

      {!isAdmin ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link to="/badge">View my badge</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/profile">Edit profile</Link>
          </Button>
        </div>
      ) : null}

      <section className="mt-12">
        <h2 className="label-mono text-muted-foreground">Upcoming hackathons</h2>
        {hackathons.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing scheduled yet. Admins will post the next event here.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {upcoming.map((h) => {
              const registered = registrations.data?.includes(h.id) ?? false;
              return (
                <article
                  key={h.id}
                  className="rounded-[4px] border border-border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-spark)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold">{h.title}</h3>
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {h.team_min}–{h.team_max} per team
                    </Badge>
                  </div>
                  <p className="label-mono mt-3 text-primary">
                    {new Date(h.event_date).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {h.start_time ? ` · ${h.start_time.slice(0, 5)}` : ""}
                    {h.end_time ? `–${h.end_time.slice(0, 5)}` : ""}
                  </p>
                  {h.venue ? (
                    <p className="mt-1 text-xs text-muted-foreground">{h.venue}</p>
                  ) : null}
                  {h.description ? (
                    <p className="mt-3 text-sm text-muted-foreground">{h.description}</p>
                  ) : null}
                  {!isAdmin ? (
                    <Button
                      className="mt-5"
                      size="sm"
                      variant={registered ? "secondary" : "default"}
                      disabled={!h.registration_open && !registered}
                      onClick={() => toggle(h.id, registered)}
                    >
                      {registered
                        ? "Registered — withdraw"
                        : h.registration_open
                          ? "Register"
                          : "Registration closed"}
                    </Button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section className="mt-12">
          <h2 className="label-mono text-muted-foreground">Past events</h2>
          <ul className="mt-4 divide-y divide-border rounded-[4px] border border-border bg-card">
            {past.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <span className="text-sm">{h.title}</span>
                <span className="label-mono text-muted-foreground">
                  {new Date(h.event_date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12 rounded-[4px] border border-dashed border-border p-6">
        <h2 className="label-mono text-muted-foreground">Coming next</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Leaderboards, squad finder, playbook, certificates and the admin chat land in the next
          phase.
        </p>
      </section>
    </AppShell>
  );
}