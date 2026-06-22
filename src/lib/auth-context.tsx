import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  cleanupServiceWorkers,
  sanitizeStorage,
  clearAppStorage,
} from "@/lib/session-recovery";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const finish = () => { if (mounted) setLoading(false); };

    // Self-heal corrupted local state that breaks normal (non-incognito) tabs.
    cleanupServiceWorkers();
    sanitizeStorage();

    const forceSignOut = async () => {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("[auth] signOut during recovery failed", e);
      }
      clearAppStorage();
      if (mounted) {
        setSession(null);
        setUser(null);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      // Any auth event (INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED) means we're ready.
      finish();
    });

    // Validate the saved session before letting the app proceed.
    supabase.auth.getSession()
      .then(async ({ data, error }) => {
        if (!mounted) return;
        const s = data.session;

        // Error, missing, or expired session → clear it.
        if (error || !s) {
          if (error) await forceSignOut();
          return;
        }
        if (s.expires_at && s.expires_at * 1000 < Date.now()) {
          await forceSignOut();
          return;
        }

        // Confirm the user row still exists in profiles.
        try {
          const { data: profile, error: pErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", s.user.id)
            .maybeSingle();
          if (pErr) {
            console.error("[auth] profile check failed", pErr);
          } else if (!profile) {
            console.error("[auth] user row missing from profiles, signing out");
            await forceSignOut();
            return;
          }
        } catch (e) {
          console.error("[auth] profile validation error", e);
        }

        if (!mounted) return;
        setSession(s);
        setUser(s.user);
      })
      .catch((e) => { console.error("[auth] getSession failed", e); })
      .finally(finish);

    // Safety net: never let the app hang on the loading screen.
    const timeout = setTimeout(finish, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
