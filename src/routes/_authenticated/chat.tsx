import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const TITLE = "Ask an admin — Yuga Spark";
const DESCRIPTION = "Direct line to the Yuga Spark club admins for doubts and requests.";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const messages = useQuery({
    queryKey: ["messages", user?.id],
    enabled: Boolean(user?.id),
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length]);

  async function send() {
    if (!user || !body.trim()) return;
    const { error } = await supabase
      .from("messages")
      .insert({ student_id: user.id, sender_id: user.id, from_admin: false, body: body.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    void messages.refetch();
  }

  const list = messages.data ?? [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Doubt desk"
        title="Ask an admin"
        description="Ask anything about events, teams, certificates or your account. Admins reply here."
      />
      <div className="surface mt-8 flex h-[540px] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {list.length === 0 ? (
            <p className="mt-20 text-center text-sm text-muted-foreground">
              No messages yet. Say hello 👋
            </p>
          ) : (
            list.map((m) => (
              <div key={m.id} className={`flex ${m.from_admin ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.from_admin
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-1 text-[10px] opacity-70">
                    {m.from_admin ? "Admin" : "You"} ·{" "}
                    {new Date(m.created_at).toLocaleString(undefined, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
        <div className="flex items-end gap-2 border-t border-border p-4">
          <Textarea
            rows={2}
            value={body}
            placeholder="Type your doubt…"
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button size="icon" onClick={send} disabled={!body.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
