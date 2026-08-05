import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { SparkMark } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

const TITLE = "Yuga Spark — Hackathon Club at RGMCET";
const DESCRIPTION =
  "The home of Yuga Spark: upcoming hackathons, member badges, squads and the club leaderboard for RGMCET builders.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

const STATS = [
  { k: "Hackathons", v: "Run by the club" },
  { k: "Squads", v: "Built in minutes" },
  { k: "Certificates", v: "Issued to every finisher" },
];

function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <SparkMark />
          <Button asChild size="sm">
            <Link to="/auth">Enter the club</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
          <p className="label-mono text-primary">RGMCET · Student Hackathon Club</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[1.05] sm:text-7xl">
            Build all night.
            <br />
            <span className="bg-[image:var(--gradient-spark)] bg-clip-text text-transparent">
              Ship before dawn.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground">
            Yuga Spark is where the campus&apos; builders find hackathons, form squads, collect
            certificates and climb the leaderboard — all from one club account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Sign in / Join</Link>
            </Button>
          </div>

          <dl className="mt-16 grid gap-px overflow-hidden rounded-[4px] border border-border bg-border sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.k} className="bg-card px-6 py-7">
                <dt className="label-mono text-muted-foreground">{s.k}</dt>
                <dd className="mt-2 font-display text-lg">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <Footer />
    </div>
  );
}
