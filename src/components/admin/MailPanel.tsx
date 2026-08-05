import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Audience = "all" | "complete" | "pending" | "hackathon";

export function MailPanel() {
  const [audience, setAudience] = useState<Audience>("all");
  const [hid, setHid] = useState("");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [usePersonal, setUsePersonal] = useState(false);

  const members = useQuery({
    queryKey: ["mail-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,personal_email,full_name,profile_completed,is_active")
        .order("full_name");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const hackathons = useQuery({
    queryKey: ["mail-hackathons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hackathons")
        .select("id,title,event_date")
        .order("event_date", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const registrations = useQuery({
    queryKey: ["mail-regs", hid],
    enabled: audience === "hackathon" && Boolean(hid),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("user_id")
        .eq("hackathon_id", hid);
      if (error) throw new Error(error.message);
      return data.map((r) => r.user_id);
    },
  });

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (members.data ?? []).filter((m) => {
      if (audience === "complete" && !m.profile_completed) return false;
      if (audience === "pending" && m.profile_completed) return false;
      if (audience === "hackathon" && !(registrations.data ?? []).includes(m.id)) return false;
      if (!term) return true;
      return [m.email, m.full_name, m.personal_email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [members.data, registrations.data, audience, q]);

  const selected = visible.filter((m) => picked[m.id]);
  const recipients = (selected.length ? selected : visible)
    .map((m) => (usePersonal && m.personal_email ? m.personal_email : m.email))
    .filter(Boolean);

  function mailto() {
    if (recipients.length === 0) {
      toast.error("No recipients");
      return;
    }
    const url = `mailto:?bcc=${encodeURIComponent(recipients.join(","))}&subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  async function copyList() {
    if (recipients.length === 0) return;
    await navigator.clipboard.writeText(recipients.join(", "));
    toast.success(`${recipients.length} address(es) copied`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="surface">
        <div className="space-y-3 border-b border-border px-5 py-4">
          <h2 className="label-mono text-muted-foreground">Audience</h2>
          <div className="flex flex-wrap gap-2">
            {(["all", "complete", "pending", "hackathon"] as const).map((a) => (
              <Button
                key={a}
                size="sm"
                variant={audience === a ? "default" : "outline"}
                className="capitalize"
                onClick={() => {
                  setAudience(a);
                  setPicked({});
                }}
              >
                {a === "hackathon" ? "By hackathon" : a}
              </Button>
            ))}
          </div>
          {audience === "hackathon" ? (
            <select
              value={hid}
              onChange={(e) => setHid(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a hackathon…</option>
              {(hackathons.data ?? []).map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} · {new Date(h.event_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          ) : null}
          <Input value={q} placeholder="Search members…" onChange={(e) => setQ(e.target.value)} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {selected.length ? `${selected.length} selected` : `${visible.length} in this list`}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setPicked(Object.fromEntries(visible.map((m) => [m.id, true])))
                }
              >
                Select all
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPicked({})}>
                Clear
              </Button>
            </div>
          </div>
        </div>
        <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
          {visible.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3">
              <Checkbox
                checked={Boolean(picked[m.id])}
                onCheckedChange={(v) => setPicked({ ...picked, [m.id]: Boolean(v) })}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.full_name ?? "Unnamed member"}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {usePersonal && m.personal_email ? m.personal_email : m.email}
                </p>
              </div>
            </li>
          ))}
          {visible.length === 0 ? (
            <li className="px-5 py-6 text-sm text-muted-foreground">Nobody matches this filter.</li>
          ) : null}
        </ul>
      </div>

      <div className="space-y-4 surface p-6">
        <h2 className="label-mono text-muted-foreground">Compose</h2>
        <p className="text-xs text-muted-foreground">
          Opens your mail app with everyone on BCC — send individually by picking one member, or in
          bulk by selecting many (or none, to mail the whole filtered list).
        </p>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={usePersonal}
            onCheckedChange={(v) => setUsePersonal(Boolean(v))}
          />
          Prefer personal email when available
        </label>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea id="body" rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={mailto}>Open mail app ({recipients.length})</Button>
          <Button variant="outline" onClick={copyList}>
            Copy addresses
          </Button>
        </div>
      </div>
    </div>
  );
}
