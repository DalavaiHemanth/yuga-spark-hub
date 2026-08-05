import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { adminCreateStudents, adminDeleteUser, adminSetPassword } from "@/lib/club.functions";
import { AppShell, PageHeader, EmptyState, StatCard } from "@/components/AppShell";
import {
  Users,
  Mail,
  CalendarPlus,
  Trophy,
  BarChart3,
  BookOpen,
  Megaphone,
  Inbox,
  Lock,
  ShieldCheck,
  KeyRound,
  Trash2,
  UserCheck,
  UserX,
  Pencil,
  CalendarDays,
  MapPin,
  Upload,
} from "lucide-react";
import { ResultsPanel } from "@/components/admin/ResultsPanel";
import { ResourcesPanel } from "@/components/admin/ResourcesPanel";
import { NoticesPanel } from "@/components/admin/NoticesPanel";
import { InboxPanel } from "@/components/admin/InboxPanel";
import { MailPanel } from "@/components/admin/MailPanel";
import { InsightsPanel } from "@/components/admin/InsightsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TITLE = "Admin console — Yuga Spark";
const DESCRIPTION = "Manage Yuga Spark members, hackathons and club access settings.";
const DOMAIN = "@rgmcet.edu.in";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading, profile } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <EmptyState
          icon={Lock}
          title="Admins only"
          description="This console is restricted to Yuga Spark club admins. If you think this is a mistake, message an admin from the Ask admin page."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Club operations"
        title="Admin console"
        description="Members, mail, hackathons, results, insights, playbook, notices and the student inbox."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {profile?.full_name ?? profile?.email ?? "Admin"}
          </span>
        }
      />
      <AdminOverview />
      <Tabs defaultValue="members" className="mt-8">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border bg-card p-1.5">
          {(
            [
              ["members", "Members", Users],
              ["mail", "Mail", Mail],
              ["hackathons", "Hackathons", CalendarPlus],
              ["results", "Results", Trophy],
              ["insights", "Insights", BarChart3],
              ["playbook", "Playbook", BookOpen],
              ["notices", "Notices", Megaphone],
              ["inbox", "Inbox", Inbox],
              ["access", "Access", Lock],
            ] as const
          ).map(([value, label, Icon]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-1.5 rounded-lg px-3 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="members" className="mt-6">
          <MembersPanel />
        </TabsContent>
        <TabsContent value="mail" className="mt-6">
          <MailPanel />
        </TabsContent>
        <TabsContent value="hackathons" className="mt-6">
          <HackathonsPanel />
        </TabsContent>
        <TabsContent value="results" className="mt-6">
          <ResultsPanel />
        </TabsContent>
        <TabsContent value="insights" className="mt-6">
          <InsightsPanel />
        </TabsContent>
        <TabsContent value="playbook" className="mt-6">
          <ResourcesPanel />
        </TabsContent>
        <TabsContent value="notices" className="mt-6">
          <NoticesPanel />
        </TabsContent>
        <TabsContent value="inbox" className="mt-6">
          <InboxPanel />
        </TabsContent>
        <TabsContent value="access" className="mt-6">
          <AccessPanel />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function MembersPanel() {
  return <MembersPanelInner />;
}

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [members, hackathons, registrations, messages] = await Promise.all([
        supabase.from("profiles").select("id,profile_completed,is_active"),
        supabase.from("hackathons").select("id,event_date,registration_open"),
        supabase.from("registrations").select("id"),
        supabase.from("messages").select("id,from_admin"),
      ]);
      const profiles = members.data ?? [];
      const events = hackathons.data ?? [];
      const today = new Date().toISOString().slice(0, 10);
      return {
        members: profiles.length,
        pending: profiles.filter((p) => !p.profile_completed).length,
        upcoming: events.filter((e) => e.event_date >= today).length,
        registrations: registrations.data?.length ?? 0,
        questions: (messages.data ?? []).filter((m) => !m.from_admin).length,
      };
    },
  });

  const s = stats.data;
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Members" value={s?.members ?? "—"} hint={`${s?.pending ?? 0} profiles pending`} />
      <StatCard label="Upcoming hackathons" value={s?.upcoming ?? "—"} hint="Visible to students now" />
      <StatCard label="Registrations" value={s?.registrations ?? "—"} hint="Across all events" />
      <StatCard label="Student questions" value={s?.questions ?? "—"} hint="Messages in the inbox" />
    </div>
  );
}

function MembersPanelInner() {
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "complete" | "pending" | "inactive">("all");
  const [sort, setSort] = useState<"recent" | "name" | "year">("recent");

  const members = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function createFromList(list: string[]) {
    const clean = Array.from(new Set(list.map((e) => e.trim().toLowerCase()).filter(Boolean)));
    if (clean.length === 0) {
      toast.error("No valid emails found");
      return;
    }
    setBusy(true);
    try {
      const res = await adminCreateStudents({ data: { emails: clean } });
      toast.success(
        `${res.created} created · ${res.existed} already existed${res.failed.length ? ` · ${res.failed.length} failed` : ""}`,
      );
      setEmails("");
      await members.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function normalize(raw: string) {
    const v = String(raw).trim().toLowerCase();
    if (!v) return "";
    return v.includes("@") ? v : `${v}${DOMAIN}`;
  }

  async function importSheet(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const found: string[] = [];
    for (const name of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name]!, {
        header: 1,
        defval: "",
      }) as unknown as unknown[][];
      for (const row of rows) {
        for (const cell of row) {
          const value = String(cell ?? "").trim();
          if (!value) continue;
          if (value.includes("@") || /^[a-z0-9._-]{3,}$/i.test(value)) {
            const email = normalize(value);
            if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) found.push(email);
          }
        }
      }
    }
    await createFromList(found);
  }

  const visible = (() => {
    const term = q.trim().toLowerCase();
    let rows = (members.data ?? []).filter((m) => {
      if (filter === "complete" && !m.profile_completed) return false;
      if (filter === "pending" && m.profile_completed) return false;
      if (filter === "inactive" && m.is_active) return false;
      if (!term) return true;
      return [m.email, m.full_name, m.registration_number, m.year, m.personal_email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
    if (sort === "name")
      rows = [...rows].sort((a, b) => (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email));
    if (sort === "year") rows = [...rows].sort((a, b) => (a.year ?? "").localeCompare(b.year ?? ""));
    return rows;
  })();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="surface p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
            <h2 className="font-display text-sm font-bold">Add members</h2>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            One roll number or email per line. Bare roll numbers get {DOMAIN} appended. Default
            password{" "}
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              yugaspark123
            </span>
          </p>
          <Textarea
            className="mt-3"
            rows={6}
            value={emails}
            placeholder={`21091A0501\nsomeone${DOMAIN}`}
            onChange={(e) => setEmails(e.target.value)}
          />
          <Button
            className="mt-3 w-full"
            disabled={busy}
            onClick={() => createFromList(emails.split(/[\n,;\s]+/).map(normalize))}
          >
            {busy ? "Working…" : "Create accounts"}
          </Button>

          <Separator className="my-5" />

          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Upload className="h-4 w-4" />
            </span>
            <h2 className="font-display text-sm font-bold">Bulk import</h2>
          </div>
          <Label htmlFor="sheet" className="mt-3 block text-xs font-normal text-muted-foreground">
            Any .xlsx/.csv — only email-like cells are used.
          </Label>
          <Input
            id="sheet"
            className="mt-2"
            type="file"
            accept=".xlsx,.xls,.csv"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importSheet(f);
            }}
          />
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="space-y-3 border-b border-border bg-secondary/30 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-bold">Members</h2>
            <Badge variant="secondary" className="font-mono text-[11px]">
              {visible.length}/{members.data?.length ?? 0}
            </Badge>
          </div>
          <Input
            className="bg-background"
            value={q}
            placeholder="Search name, email, roll number, year…"
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
              {(["all", "complete", "pending", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span>Sort</span>
              {(["recent", "name", "year"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded-md px-2 py-1 capitalize transition-colors ${
                    sort === s ? "bg-secondary font-medium text-foreground" : "hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <ul className="max-h-[720px] divide-y divide-border overflow-y-auto">
          {visible.map((m) => (
            <MemberRow key={m.id} member={m} onChanged={() => members.refetch()} />
          ))}
          {visible.length === 0 ? (
            <li className="p-5">
              <EmptyState
                tone="quiet"
                icon={Users}
                title="No members match this view"
                description="Add members with the form on the left, or bulk import an Excel sheet of register numbers."
              />
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

type MemberRowProps = {
  member: {
    id: string;
    email: string;
    full_name: string | null;
    registration_number: string | null;
    year: string | null;
    personal_email: string | null;
    profile_completed: boolean;
    is_active: boolean;
    photo_url: string | null;
    resume_url: string | null;
  };
  onChanged: () => void;
};

function MemberRow({ member, onChanged }: MemberRowProps) {
  const [pwd, setPwd] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            {member.full_name ?? "Unnamed member"}
            {!member.is_active ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                inactive
              </span>
            ) : null}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{member.email}</p>
          <p className="label-mono mt-1 text-muted-foreground">
            {member.registration_number ?? "no reg"} · {member.year ?? "no year"} ·{" "}
            {member.profile_completed ? "profile complete" : "profile pending"}
          </p>
          {member.personal_email ? (
            <p className="label-mono text-muted-foreground">{member.personal_email}</p>
          ) : null}
          <p className="label-mono text-muted-foreground">
            photo {member.photo_url ? "✓" : "—"} · resume {member.resume_url ? "✓" : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const { error } = await supabase
                .from("profiles")
                .update({ is_active: !member.is_active })
                .eq("id", member.id);
              if (error) toast.error(error.message);
              else {
                toast.success(member.is_active ? "Member deactivated" : "Member reactivated");
                onChanged();
              }
            }}
          >
            {member.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
            Password
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (!confirm(`Delete ${member.email}? This cannot be undone.`)) return;
              try {
                await adminDeleteUser({ data: { userId: member.id } });
                toast.success("Member removed");
                onChanged();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Delete failed");
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      {open ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await adminSetPassword({ data: { userId: member.id, password: pwd } });
              setPwd("");
              setOpen(false);
              toast.success("Password updated");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not set password");
            }
          }}
        >
          <Input
            type="text"
            minLength={6}
            required
            value={pwd}
            placeholder="New password"
            onChange={(e) => setPwd(e.target.value)}
          />
          <Button size="sm" type="submit">
            Set
          </Button>
        </form>
      ) : null}
    </li>
  );
}

function HackathonsPanel() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    event_date: "",
    start_time: "",
    end_time: "",
    team_min: 2,
    team_max: 4,
    mode: "offline",
    registration_deadline: "",
    banner_url: "",
  });
  const [busy, setBusy] = useState(false);

  const hackathons = useQuery({
    queryKey: ["admin-hackathons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hackathons")
        .select("*")
        .order("event_date", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (form.team_min > form.team_max) {
      toast.error("Minimum team size cannot exceed the maximum");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("hackathons").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      venue: form.venue.trim() || null,
      event_date: form.event_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      team_min: Number(form.team_min),
      team_max: Number(form.team_max),
      mode: form.mode,
      registration_deadline: form.registration_deadline
        ? new Date(form.registration_deadline).toISOString()
        : null,
      banner_url: form.banner_url.trim() || null,
      created_by: user.id,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Hackathon published");
      setForm({
        title: "",
        description: "",
        venue: "",
        event_date: "",
        start_time: "",
        end_time: "",
        team_min: 2,
        team_max: 4,
        mode: "offline",
        registration_deadline: "",
        banner_url: "",
      });
      await hackathons.refetch();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={create} className="space-y-4 surface p-6">
        <h2 className="label-mono text-muted-foreground">New hackathon</h2>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="event_date">Date</Label>
            <Input
              id="event_date"
              type="date"
              required
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_time">Start</Label>
            <Input
              id="start_time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time">End</Label>
            <Input
              id="end_time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team_min">Team min</Label>
            <Input
              id="team_min"
              type="number"
              min={1}
              max={10}
              value={form.team_min}
              onChange={(e) => setForm({ ...form, team_min: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team_max">Team max</Label>
            <Input
              id="team_max"
              type="number"
              min={1}
              max={10}
              value={form.team_max}
              onChange={(e) => setForm({ ...form, team_max: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <select
              id="mode"
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Registration deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={form.registration_deadline}
              onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="banner">Banner image URL (optional)</Label>
          <Input
            id="banner"
            type="url"
            value={form.banner_url}
            placeholder="https://…"
            onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Publishing…" : "Publish hackathon"}
        </Button>
      </form>

      <div className="surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="label-mono text-muted-foreground">
            All hackathons ({hackathons.data?.length ?? 0})
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {(hackathons.data ?? []).map((h) => (
            <HackathonRow key={h.id} hackathon={h} onChanged={() => hackathons.refetch()} />
          ))}
          {hackathons.data?.length === 0 ? (
            <li className="px-5 py-6 text-sm text-muted-foreground">No hackathons yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function AccessPanel() {
  return <AccessPanelInner />;
}

type HackathonRowProps = {
  hackathon: {
    id: string;
    title: string;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    venue: string | null;
    team_min: number;
    team_max: number;
    mode: string;
    registration_open: boolean;
  };
  onChanged: () => void;
};

function HackathonRow({ hackathon: h, onChanged }: HackathonRowProps) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({
    title: h.title,
    event_date: h.event_date,
    start_time: h.start_time ?? "",
    end_time: h.end_time ?? "",
    venue: h.venue ?? "",
    team_min: h.team_min,
    team_max: h.team_max,
    mode: h.mode,
  });

  async function save() {
    if (draft.team_min > draft.team_max) {
      toast.error("Minimum team size cannot exceed the maximum");
      return;
    }
    const { error } = await supabase
      .from("hackathons")
      .update({
        title: draft.title.trim(),
        event_date: draft.event_date,
        start_time: draft.start_time || null,
        end_time: draft.end_time || null,
        venue: draft.venue.trim() || null,
        team_min: Number(draft.team_min),
        team_max: Number(draft.team_max),
        mode: draft.mode,
      })
      .eq("id", h.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Hackathon updated");
      setEdit(false);
      onChanged();
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{h.title}</p>
          <p className="label-mono text-muted-foreground">
            {new Date(h.event_date).toLocaleDateString()} · teams {h.team_min}–{h.team_max} ·{" "}
            {h.mode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="label-mono text-muted-foreground">Reg</span>
          <Switch
            checked={h.registration_open}
            onCheckedChange={async (v) => {
              const { error } = await supabase
                .from("hackathons")
                .update({ registration_open: v })
                .eq("id", h.id);
              if (error) toast.error(error.message);
              else onChanged();
            }}
          />
          <Button size="sm" variant="secondary" onClick={() => setEdit((v) => !v)}>
            {edit ? "Cancel" : "Edit"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (!confirm(`Delete "${h.title}"?`)) return;
              const { error } = await supabase.from("hackathons").delete().eq("id", h.id);
              if (error) toast.error(error.message);
              else onChanged();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      {edit ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Title"
          />
          <Input
            type="date"
            value={draft.event_date}
            onChange={(e) => setDraft({ ...draft, event_date: e.target.value })}
          />
          <Input
            type="time"
            value={draft.start_time}
            onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
          />
          <Input
            type="time"
            value={draft.end_time}
            onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
          />
          <Input
            value={draft.venue}
            placeholder="Venue"
            onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          />
          <select
            value={draft.mode}
            onChange={(e) => setDraft({ ...draft, mode: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="offline">Offline</option>
            <option value="online">Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <Input
            type="number"
            min={1}
            value={draft.team_min}
            onChange={(e) => setDraft({ ...draft, team_min: Number(e.target.value) })}
          />
          <Input
            type="number"
            min={1}
            value={draft.team_max}
            onChange={(e) => setDraft({ ...draft, team_max: Number(e.target.value) })}
          />
          <Button size="sm" onClick={save}>
            Save changes
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function AccessPanelInner() {
  const setting = useQuery({
    queryKey: ["access-mode"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "access_mode")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.value ?? "open";
    },
  });

  const open = setting.data === "open";

  return (
    <div className="max-w-xl space-y-4 surface p-6">
      <h2 className="label-mono text-muted-foreground">Who can join the club portal</h2>
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-sm font-medium">{open ? "Open to any email" : "Invite-only"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {open
              ? "Anyone with any email address can create an account."
              : "Only emails added by an admin (individually or by Excel import) can create an account."}
          </p>
        </div>
        <Switch
          checked={open}
          onCheckedChange={async (v) => {
            const { error } = await supabase
              .from("app_settings")
              .upsert({ key: "access_mode", value: v ? "open" : "restricted" }, { onConflict: "key" });
            if (error) toast.error(error.message);
            else {
              toast.success(v ? "Access opened to all emails" : "Access restricted to added emails");
              await setting.refetch();
            }
          }}
        />
      </div>
    </div>
  );
}