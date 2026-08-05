import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, Download, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCertificate } from "@/lib/certificate";

const TITLE = "Certificates — Yuga Spark";
const DESCRIPTION = "Download participation and winner certificates for every hackathon you attended.";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { user, profile } = useAuth();

  const results = useQuery({
    queryKey: ["my-results", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hackathon_results")
        .select("*, hackathons(title,event_date)")
        .eq("user_id", user!.id)
        .eq("attended", true);
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function openUploaded(path: string) {
    const { data, error } = await supabase.storage.from("certificates").createSignedUrl(path, 3600);
    if (error || !data) {
      toast.error("Could not open that certificate");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const list = results.data ?? [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Certificates"
        title="Your proof of work"
        description="Every hackathon you attended earns a certificate — winner certificates for podium finishes."
      />
      {list.length === 0 ? (
        <div className="surface mt-8 p-10 text-center">
          <Award className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No certificates yet. They unlock once admins mark you as attended.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const h = r.hackathons as { title: string; event_date: string } | null;
            const won = r.placement !== null && r.placement <= 3;
            const date = h ? new Date(h.event_date).toLocaleDateString(undefined, {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }) : "";
            return (
              <article key={r.id} className="surface lift flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <Award className={`h-6 w-6 ${won ? "text-primary" : "text-muted-foreground"}`} />
                  <Badge variant={won ? "default" : "secondary"}>
                    {won ? `Rank #${r.placement}` : "Participation"}
                  </Badge>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{h?.title ?? "Hackathon"}</h3>
                <p className="label-mono mt-1 text-muted-foreground">{date}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      downloadCertificate({
                        name: profile?.full_name ?? profile?.email ?? "Member",
                        hackathon: h?.title ?? "Hackathon",
                        date,
                        placement: r.placement,
                      })
                    }
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                  </Button>
                  {r.certificate_url ? (
                    <Button size="sm" variant="outline" onClick={() => openUploaded(r.certificate_url!)}>
                      <FileDown className="mr-1.5 h-3.5 w-3.5" /> Official file
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
