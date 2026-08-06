import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolveAccess } from "@/lib/route-access";

type Gate = { userId: string; isAdmin: boolean; profileCompleted: boolean | null };

/**
 * The auth gate ran three network round-trips on every single navigation,
 * which made the whole app feel sluggish. Cache it briefly per user instead.
 */
let cached: { userId: string; at: number; value: Gate } | null = null;
const GATE_TTL = 60_000;

export function clearAuthGateCache() {
  cached = null;
}

async function loadGate(userId: string): Promise<Gate> {
  if (cached && cached.userId === userId && Date.now() - cached.at < GATE_TTL) {
    return cached.value;
  }
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("profile_completed").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const value: Gate = {
    userId,
    isAdmin: Boolean(roles?.some((r) => r.role === "admin")),
    profileCompleted: profile ? profile.profile_completed : null,
  };
  cached = { userId, at: Date.now(), value };
  return value;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // getSession reads the local session — no network round-trip per navigation.
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      clearAuthGateCache();
      throw redirect({ to: "/auth" });
    }

    const gate = await loadGate(user.id);

    const access = resolveAccess({
      pathname: location.pathname,
      isAdmin: gate.isAdmin,
      profileCompleted: gate.profileCompleted,
    });
    if (access.kind === "redirect") {
      throw redirect({ to: access.to, search: access.search, replace: true } as never);
    }

    return { user };
  },
  component: () => <Outlet />,
});
