import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function InboxPanel() {
  const { user } = useAuth();
  const [active, setActive] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const messages = useQuery({
    queryKey: ["admin-messages"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const members = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,full_name,email");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const list = messages.data ?? [];
  const threads = Array.from(new Set(list.map((m) => m.student_id)));
  const current = active ?? threads[0] ?? null;
  const nameOf = (id: string) => {
    const m = members.data?.find((x) => x.id === id);
    return m?.full_name ?? m?.email ?? "Member";
  };

  async function send() {
    if (!user || !current || !reply.trim()) return;
    const { error } = await supabase
      .from("messages")
      .insert({ student_id: current, sender_id: user.id, from_admin: true, body: reply.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    setReply("");
    void messages.refetch();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="surface h-fit overflow-hidden">
        {threads.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No student messages yet.</p>
        ) : (
          threads.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`block w-full border-b border-border px-4 py-3 text-left text-sm last:border-0 ${
                current === t ? "bg-secondary font-medium" : "hover:bg-secondary/60"
              }`}
            >
              {nameOf(t)}
            </button>
          ))
        )}
      </div>

      <div className="surface flex h-[520px] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {current
            ? list
                .filter((m) => m.student_id === current)
                .map((m) => (
                  <div key={m.id} className={`flex ${m.from_admin ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.from_admin
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="mt-1 text-[10px] opacity-70">
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
            : null}
        </div>
        <div className="flex items-end gap-2 border-t border-border p-4">
          <Textarea
            rows={2}
            value={reply}
            placeholder="Reply to this student…"
            onChange={(e) => setReply(e.target.value)}
          />
          <Button size="icon" onClick={send} disabled={!reply.trim()} aria-label="Send reply">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
