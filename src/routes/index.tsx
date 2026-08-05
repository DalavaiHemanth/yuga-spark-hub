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
    <div className="paper-bg flex min-h-screen flex-col overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <SparkMark />
          <Button asChild size="sm">
            <Link to="/auth">Enter the club</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
          <div className="glow-blob -left-24 top-0 h-72 w-72" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="rise">
              <span className="chip">RGMCET · Hackathon Club</span>
              <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
                Build all night.
                <br />
                <span className="ember-text">Ship before dawn.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Yuga Spark is where campus builders find hackathons, form squads, collect
                certificates and climb the leaderboard — all from one club account.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link to="/auth">Sign in / Join</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                  <Link to="/auth">I&apos;m an admin</Link>
                </Button>
              </div>
              <dl className="mt-10 grid gap-3 sm:grid-cols-3">
                {STATS.map((s) => (
                  <div key={s.k} className="surface-quiet px-5 py-4">
                    <dt className="label-mono text-muted-foreground">{s.k}</dt>
                    <dd className="mt-1.5 font-display text-base font-bold">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="surface-ink rise relative overflow-hidden p-7 sm:p-8">
              <div className="glow-blob -right-16 -top-20 h-56 w-56 opacity-40" />
              <p className="label-mono relative text-white/60">Member badge preview</p>
              <div className="relative mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-spark)] font-display font-bold text-primary-foreground">
                    Y
                  </span>
                  <span className="leading-tight">
                    <span className="block font-display text-base font-bold">Yuga Spark</span>
                    <span className="label-mono block text-[10px] text-white/50">Hackathon club</span>
                  </span>
                </div>
                <p className="mt-7 font-display text-2xl font-bold">Your name here</p>
                <p className="label-mono mt-1 text-white/50">Yuga Spark member</p>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div className="grid h-24 w-24 place-items-center rounded-xl bg-white/10 font-mono text-[10px] text-white/60">
                    QR
                  </div>
                  <p className="label-mono text-right text-[10px] leading-relaxed text-white/40">
                    Auto-generated
                    <br />
                    on profile completion
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything the club runs on
            </h2>
            <p className="label-mono text-muted-foreground">One account · six tools</p>
          </div>
          <div className="mt-8 grid auto-rows-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                className={`surface lift group relative overflow-hidden p-6 ${
                  i === 0 ? "sm:col-span-2 xl:col-span-1 xl:row-span-2 xl:flex xl:flex-col xl:justify-between" : ""
                }`}
              >
                <div>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground transition-transform duration-300 group-hover:-rotate-6">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.copy}</p>
                </div>
                {i === 0 ? (
                  <div className="mt-6 hidden rounded-xl border border-border bg-secondary/60 p-4 xl:block">
                    <p className="label-mono text-muted-foreground">Live ranking</p>
                    <div className="mt-3 space-y-2">
                      {["01 · Squad Nova", "02 · Byte Raiders", "03 · Null Pointers"].map((row) => (
                        <div
                          key={row}
                          className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-xs font-medium"
                        >
                          <span>{row}</span>
                          <span className="font-mono text-primary">pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className="surface-ember mt-6 flex flex-wrap items-center justify-between gap-6 p-8">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready for the next build night?</h2>
              <p className="mt-2 max-w-xl text-sm opacity-90">
                Create your profile, get your QR badge and register for the next hackathon in under two minutes.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="rounded-full px-7">
              <Link to="/auth">Join Yuga Spark</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
