import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.onboarding_completed) {
        navigate({ to: "/app" });
      } else {
        navigate({ to: "/onboarding" });
      }
    })();
  }, [user, loading, navigate]);

  if (loading || (user && checking)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-background)" }}>
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-[768px] w-full mx-auto">
        <div className="w-full max-w-[420px] text-center">
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>VitalMan</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Men's Health Coach</p>

          <h2 className="mt-12 text-2xl font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
            Your daily companion for men's vitality
          </h2>
          <p className="mt-3 text-base" style={{ color: "var(--color-text-secondary)" }}>
            Track. Improve. Feel the difference.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            <Link
              to="/signup"
              className="h-12 inline-flex items-center justify-center rounded-md font-bold text-base"
              style={{ background: "var(--color-primary)", color: "var(--color-text-primary)" }}
            >
              Get Started
            </Link>
            <Link
              to="/signin"
              className="h-12 inline-flex items-center justify-center rounded-md font-semibold text-base"
              style={{ background: "transparent", border: "2px solid var(--color-primary)", color: "var(--color-primary)" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
        For adults 18+. Your daily wellness companion.
      </footer>
    </div>
  );
}
