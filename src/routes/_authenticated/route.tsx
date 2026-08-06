import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolveAccess } from "@/lib/route-access";
import {
  clearAuthGateCache,
  loadAuthGate,
} from "@/lib/auth-gate";

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

    const gate = await loadAuthGate(user.id);

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
