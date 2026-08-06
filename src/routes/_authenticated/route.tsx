import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolveAccess } from "@/lib/route-access";
import {
  clearAuthGateCache,
  readAuthGate,
  writeAuthGate,
  type AuthGate,
} from "@/lib/auth-gate";

/**
 * The gate used to run three network round-trips on every navigation, which
 * made the whole app feel sluggish. Now it is cached briefly per user.
 */
async function loadGate(userId: string): Promise<AuthGate> {
  const hit = readAuthGate(userId);
  if (hit) return hit;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("profile_completed").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const value: AuthGate = {
    userId,
    isAdmin: Boolean(roles?.some((r) => r.role === "admin")),
    profileCompleted: profile ? profile.profile_completed : null,
  };
  writeAuthGate(value);
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
