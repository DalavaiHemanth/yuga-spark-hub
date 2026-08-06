import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { SparkMark } from "@/components/SparkMark";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <SparkMark />
          <Button asChild size="sm">
            <Link to="/auth">Enter the club</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <section className="flex max-w-2xl flex-col items-center text-center">
          <span className="label-mono text-sm uppercase tracking-widest text-muted-foreground">
            The Hackathon Club
          </span>
          <h1 className="mt-4 font-display text-6xl font-bold tracking-tight text-foreground sm:text-8xl">
            Yuga Spark
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Welcome to Yuga Spark
          </p>
          <Button asChild size="lg" className="mt-10">
            <Link to="/auth">
              Enter the club <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
