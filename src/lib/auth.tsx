import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearAuthGateCache, loadAuthGate } from "@/lib/auth-gate";

export type Profile = {
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

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isOwner: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (uid: string | undefined, force = false) => {
    if (!uid) {
      setProfile(null);
      setIsAdmin(false);
      setIsOwner(false);
      return;
    }
    const gate = await loadAuthGate(uid, force);
    setProfile((gate.profile as Profile | null) ?? null);
    setIsAdmin(gate.isAdmin);
    setIsOwner(gate.isOwner);
  };

  useEffect(() => {
    let active = true;
    let initialized = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!active) return;
      if (event === "INITIAL_SESSION") {
        initialized = true;
      } else if (!initialized) {
        return;
      }
      setSession(s);
      void load(s?.user?.id).then(() => setLoading(false));
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (initialized) return;
      initialized = true;
      setSession(data.session);
      await load(data.session?.user?.id);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    isAdmin,
    isOwner,
    refresh: async () => {
      await load(session?.user?.id, true);
    },
    signOut: async () => {
      await supabase.auth.signOut();
      clearAuthGateCache();
      setProfile(null);
      setIsAdmin(false);
      setIsOwner(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}