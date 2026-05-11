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
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-[768px] w-full mx-auto">
        <div className="w-full max-w-[420px] text-center">
          <h1 className="text-4xl font-bold tracking-tight">VitalMan</h1>
          <p className="mt-2 text-sm text-muted-foreground">Men's Health Coach</p>

          <h2 className="mt-12 text-2xl font-bold leading-tight text-primary">
            Your daily companion for men's vitality
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Track. Improve. Feel the difference.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            <Link
              to="/signup"
              className="h-12 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-base"
            >
              Get Started
            </Link>
            <Link
              to="/signin"
              className="h-12 inline-flex items-center justify-center rounded-md border-2 border-primary text-primary font-semibold text-base"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        For adults 18+. Wellness coaching only — not medical advice.
      </footer>
    </div>
  );
}
