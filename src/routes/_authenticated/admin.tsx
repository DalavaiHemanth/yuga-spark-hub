import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { adminCreateStudents, adminDeleteUser, adminSetPassword } from "@/lib/club.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const { isAdmin, loading } = useAuth();

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
        <h1 className="text-3xl font-bold">Admins only</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This console is restricted to Yuga Spark club admins.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <p className="label-mono text-primary">Club operations</p>
      <h1 className="mt-3 text-4xl font-bold">Admin console</h1>
      <Tabs defaultValue="members" className="mt-8">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="mt-6">
          <MembersPanel />
        </TabsContent>
        <TabsContent value="hackathons" className="mt-6">
          <HackathonsPanel />
        </TabsContent>
        <TabsContent value="access" className="mt-6">
          <AccessPanel />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function MembersPanel() {
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-6">
        <div className="space-y-3 rounded-[4px] border border-border bg-card p-6">
          <h2 className="label-mono text-muted-foreground">Add members</h2>
          <p className="text-xs text-muted-foreground">
            One roll number or email per line. Bare roll numbers get {DOMAIN} appended. Default
            password: <span className="font-mono text-foreground">yugaspark123</span>
          </p>
          <Textarea
            rows={6}
            value={emails}
            placeholder={`21091A0501\nsomeone${DOMAIN}`}
            onChange={(e) => setEmails(e.target.value)}
          />
          <Button
            disabled={busy}
            onClick={() => createFromList(emails.split(/[\n,;\s]+/).map(normalize))}
          >
            {busy ? "Working…" : "Create accounts"}
          </Button>
        </div>

        <div className="space-y-3 rounded-[4px] border border-border bg-card p-6">
          <h2 className="label-mono text-muted-foreground">Bulk import from Excel</h2>
          <Label htmlFor="sheet" className="text-xs text-muted-foreground">
            Any .xlsx/.csv — only email-like cells are used.
          </Label>
          <Input
            id="sheet"
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

      <div className="rounded-[4px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="label-mono text-muted-foreground">
            Members ({members.data?.length ?? 0})
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {(members.data ?? []).map((m) => (
            <MemberRow key={m.id} member={m} onChanged={() => members.refetch()} />
          ))}
          {members.data?.length === 0 ? (
            <li className="px-5 py-6 text-sm text-muted-foreground">No members yet.</li>
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
          <p className="truncate text-sm font-medium">{member.full_name ?? "Unnamed member"}</p>
          <p className="font-mono text-xs text-muted-foreground">{member.email}</p>
          <p className="label-mono mt-1 text-muted-foreground">
            {member.registration_number ?? "no reg"} · {member.year ?? "no year"} ·{" "}
            {member.profile_completed ? "profile complete" : "profile pending"}
          </p>
        </div>
        <div className="flex gap-2">
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
      });
      await hackathons.refetch();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={create} className="space-y-4 rounded-[4px] border border-border bg-card p-6">
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
        <Button type="submit" disabled={busy}>
          {busy ? "Publishing…" : "Publish hackathon"}
        </Button>
      </form>

      <div className="rounded-[4px] border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="label-mono text-muted-foreground">
            All hackathons ({hackathons.data?.length ?? 0})
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {(hackathons.data ?? []).map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-medium">{h.title}</p>
                <p className="label-mono text-muted-foreground">
                  {new Date(h.event_date).toLocaleDateString()} · teams {h.team_min}–{h.team_max}
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
                    else await hackathons.refetch();
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm(`Delete "${h.title}"?`)) return;
                    const { error } = await supabase.from("hackathons").delete().eq("id", h.id);
                    if (error) toast.error(error.message);
                    else await hackathons.refetch();
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
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
    <div className="max-w-xl space-y-4 rounded-[4px] border border-border bg-card p-6">
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