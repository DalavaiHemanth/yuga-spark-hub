import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  LayoutDashboard,
  Trophy,
  Users,
  BookOpen,
  Award,
  Megaphone,
  MessageSquare,
  QrCode,
  UserCog,
  Shield,
  Menu,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function SparkMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-spark)] font-display text-base font-bold text-primary-foreground shadow-[var(--shadow-spark)]">
        Y
      </span>
      <span className="leading-none">
        <span className="hidden whitespace-nowrap font-display text-lg font-bold sm:block tracking-tight">Yuga Spark</span>
        <span className="label-mono block text-[10px] text-muted-foreground">Hackathon Club</span>
      </span>
    </span>
  );
}

const STUDENT_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/squads", label: "Squads", icon: Users },
  { to: "/playbook", label: "Playbook", icon: BookOpen },
  { to: "/certificates", label: "Certificates", icon: Award },
  { to: "/notices", label: "Notices", icon: Megaphone },
  { to: "/chat", label: "Ask admin", icon: MessageSquare },
  { to: "/badge", label: "Badge", icon: QrCode },
  { to: "/profile", label: "Profile", icon: UserCog },
] as const;

const ADMIN_LINKS = [
  { to: "/admin", label: "Console", icon: Shield },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/notices", label: "Notices", icon: Megaphone },
  { to: "/playbook", label: "Playbook", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: UserCog },
] as const;

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        {eyebrow ? <p className="label-mono text-primary">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = isAdmin ? ADMIN_LINKS : STUDENT_LINKS;

  const initials = (profile?.full_name ?? profile?.email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navLink = (l: (typeof links)[number], onClick?: () => void) => (
    <Link
      key={l.to}
      to={l.to}
      onClick={onClick}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "bg-secondary text-foreground" }}
    >
      <l.icon className="h-4 w-4" />
      {l.label}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col paper-bg">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/dashboard">
            <SparkMark />
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary font-mono text-xs font-semibold text-secondary-foreground">
                {initials}
              </span>
              <span className="hidden max-w-[180px] flex-col leading-tight md:flex">
                <span className="truncate text-xs font-medium">
                  {profile?.full_name ?? profile?.email}
                </span>
                <span className="label-mono text-[9px] text-muted-foreground">
                  {isAdmin ? "Admin" : "Member"}
                </span>
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth", replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-6">
                <SparkMark />
                <nav className="mt-8 flex flex-col gap-1">
                  {links.map((l) => navLink(l, () => setOpen(false)))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="hidden border-t border-border/60 md:block">
          <nav className="mx-auto flex max-w-7xl items-center gap-0.5 overflow-x-auto px-4 py-1.5 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((l) => navLink(l))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <Footer />
    </div>
  );
}
