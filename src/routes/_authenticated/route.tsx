import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const OPEN_PATHS = ["/onboarding", "/profile"];

// Student-only surfaces. Admins are redirected to the admin panel.
const STUDENT_PATHS = [
  "/dashboard",
  "/profile",
  "/leaderboard",
  "/squads",
  "/playbook",
  "/certificates",
  "/chat",
  "/notices",
  "/badge",
  "/onboarding",
];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", data.user.id)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
    ]);
    const isAdmin = Boolean(roles?.some((r) => r.role === "admin"));

    if (isAdmin && STUDENT_PATHS.includes(location.pathname)) {
      throw redirect({ to: "/admin", search: { section: "members" }, replace: true });
    }

    if (!isAdmin && !OPEN_PATHS.includes(location.pathname) && profile && !profile.profile_completed) {
      throw redirect({ to: "/onboarding" });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
