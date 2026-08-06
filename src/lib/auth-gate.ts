import { supabase } from "@/integrations/supabase/client";

export type GateProfile = {
  id: string;
  email: string;
  full_name: string | null;
  registration_number: string | null;
  year: string | null;
  personal_email: string | null;
  photo_url: string | null;
  resume_url: string | null;
  profile_completed: boolean;
};

export type AuthGate = {
  userId: string;
  isAdmin: boolean;
  isOwner: boolean;
  profileCompleted: boolean | null;
  profile: GateProfile | null;
};

let cached: { userId: string; at: number; value: AuthGate } | null = null;
let pending: { userId: string; promise: Promise<AuthGate> } | null = null;
const TTL = 5 * 60_000;

export function readAuthGate(userId: string): AuthGate | null {
  if (cached && cached.userId === userId && Date.now() - cached.at < TTL) return cached.value;
  return null;
}

export function writeAuthGate(value: AuthGate) {
  cached = { userId: value.userId, at: Date.now(), value };
}

/** One shared request for the route guard and AuthProvider prevents both from
 * independently loading the same profile and role during startup/navigation. */
export function loadAuthGate(userId: string, force = false): Promise<AuthGate> {
  const hit = force ? null : readAuthGate(userId);
  if (hit) return Promise.resolve(hit);
  if (!force && pending?.userId === userId) return pending.promise;

  const promise = Promise.all([
    supabase.from("profiles").select("id,email,full_name,registration_number,year,personal_email,photo_url,resume_url,profile_completed").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.rpc("is_owner", { _user_id: userId }),
  ]).then(([profileResult, rolesResult, ownerResult]) => {
    if (profileResult.error) throw new Error(profileResult.error.message);
    if (rolesResult.error) throw new Error(rolesResult.error.message);
    const profile = (profileResult.data as GateProfile | null) ?? null;
    const value: AuthGate = {
      userId,
      profile,
      isAdmin: Boolean(rolesResult.data?.some((role) => role.role === "admin")),
      isOwner: Boolean(ownerResult.data),
      profileCompleted: profile?.profile_completed ?? null,
    };
    writeAuthGate(value);
    return value;
  }).finally(() => {
    if (pending?.promise === promise) pending = null;
  });

  pending = { userId, promise };
  return promise;
}

export function clearAuthGateCache() {
  cached = null;
  pending = null;
}