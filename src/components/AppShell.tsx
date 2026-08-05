import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export function SparkMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-7 w-7 place-items-center rounded-[3px] bg-primary text-primary-foreground font-mono text-sm font-bold">
        Y
      </span>
      <span className="font-display text-lg font-bold tracking-tight">Yuga Spark</span>
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const links = isAdmin
    ? [
        { to: "/admin", label: "Console" },
        { to: "/dashboard", label: "Dashboard" },
        { to: "/profile", label: "Profile" },
      ]
    : [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/badge", label: "Badge" },
        { to: "/profile", label: "Profile" },
      ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/dashboard">
            <SparkMark />
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-[3px] px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth", replace: true });
              }}
            >
              Sign out
            </Button>
          </nav>
        </div>
        {profile ? (
          <div className="border-t border-border/50 bg-secondary/30">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-1.5">
              <span className="label-mono text-muted-foreground">
                {isAdmin ? "Admin" : "Member"}
              </span>
              <span className="text-xs text-muted-foreground">{profile.email}</span>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      <Footer />
    </div>
  );
}