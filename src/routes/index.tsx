import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { SparkMark } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Trophy, Users, BookOpen, Award, Megaphone, QrCode } from "lucide-react";

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

const FEATURES = [
  { icon: Trophy, title: "Leaderboard", copy: "Club-wide and per-hackathon rankings, updated after every event." },
  { icon: Users, title: "Squad finder", copy: "Form teams inside the size limits admins set for each hackathon." },
  { icon: BookOpen, title: "Playbook", copy: "Starter kits, APIs and winning decks curated by the club leads." },
  { icon: Award, title: "Certificates", copy: "Participation and winner certificates, downloadable any time." },
  { icon: Megaphone, title: "Notice board", copy: "Outside hackathons, announcements, links and quick polls." },
  { icon: QrCode, title: "Member badge", copy: "A QR club badge generated the moment your profile is complete." },
];

function Index() {
  return (
    <div className="flex min-h-screen flex-col paper-bg">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <SparkMark />
          <Button asChild size="sm">
            <Link to="/auth">Enter the club</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-14">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="label-mono text-primary">RGMCET · Student Hackathon Club</p>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.03] sm:text-6xl xl:text-7xl">
                Build all night.
                <br />
                <span className="bg-[image:var(--gradient-spark)] bg-clip-text text-transparent">
                  Ship before dawn.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base text-muted-foreground">
                Yuga Spark is where campus builders find hackathons, form squads, collect
                certificates and climb the leaderboard — all from one club account.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">Sign in / Join</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">I&apos;m an admin</Link>
                </Button>
              </div>
            </div>

            <div className="surface relative overflow-hidden p-8">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[image:var(--gradient-spark)] opacity-20 blur-2xl" />
              <p className="label-mono text-muted-foreground">Member badge preview</p>
              <div className="mt-5 rounded-2xl border border-border bg-background p-6">
                <SparkMark />
                <p className="mt-6 font-display text-2xl font-bold">Your name here</p>
                <p className="label-mono mt-1 text-muted-foreground">Yuga Spark member</p>
                <div className="mt-6 grid h-24 w-24 place-items-center rounded-xl bg-secondary font-mono text-[10px] text-muted-foreground">
                  QR
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-16 grid gap-4 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.k} className="surface px-6 py-7">
                <dt className="label-mono text-muted-foreground">{s.k}</dt>
                <dd className="mt-2 font-display text-lg font-bold">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <h2 className="font-display text-3xl font-bold">Everything the club runs on</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="surface lift p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
