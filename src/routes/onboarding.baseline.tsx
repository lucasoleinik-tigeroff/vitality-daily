import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { bmiCategoryLabel } from "@/lib/health";

const HR_TOOLTIP = "These zones are calculated from general formulas based on your age. Individual results may vary. If you have any cardiovascular concerns, consult a healthcare professional before starting an exercise program.";

export const Route = createFileRoute("/onboarding/baseline")({
  component: Baseline,
});

interface Metrics {
  bmi: number;
  bmi_category: string;
  tdee_kcal: number;
  hydration_target_oz: number;
  hr_moderate_low: number;
  hr_moderate_high: number;
  hr_vigorous_low: number;
  hr_vigorous_high: number;
  waist_risk_category: string | null;
}

function Baseline() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [m, setM] = useState<Metrics | null>(null);
  const [hrTipOpen, setHrTipOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) { navigate({ to: "/signin" }); return; }
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_health_metrics")
        .select("bmi,bmi_category,tdee_kcal,hydration_target_oz,hr_moderate_low,hr_moderate_high,hr_vigorous_low,hr_vigorous_high,waist_risk_category")
        .eq("user_id", user.id)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setM(data as Metrics);
    })();
  }, [user, loading, navigate]);

  const items = m ? [
    ...(m.waist_risk_category
      ? [{ label: "Waist risk category", value: m.waist_risk_category, sub: "Correlated with vascular health" }]
      : []),
    { label: "Body Mass Index (BMI)", value: `${m.bmi}`, sub: bmiCategoryLabel(m.bmi_category) },
    { label: "Estimated daily calorie burn", value: `${m.tdee_kcal} kcal/day`, sub: "TDEE" },
    { label: "Daily hydration target", value: `${m.hydration_target_oz} oz`, sub: "Personalized to your body weight" },
    { label: "Target heart rate zones", value: `${m.hr_moderate_low}–${m.hr_moderate_high} bpm`, sub: `Vigorous: ${m.hr_vigorous_low}–${m.hr_vigorous_high} bpm` },
  ] : [];

  return (
    <div className="min-h-screen bg-background px-6 py-8 max-w-[768px] mx-auto pb-24">
      <h1 className="text-2xl font-bold">Your Baseline</h1>
      <p
        style={{ color: "var(--color-text-secondary)", fontSize: 15, lineHeight: 1.6, marginTop: 12, marginBottom: 24 }}
      >
        You've taken the first step. Here's where your journey begins.
      </p>

      <div className="mt-2 space-y-3">
        {!m && <p className="text-sm text-muted-foreground">Preparing your baseline…</p>}
        {items.map((it) => {
          const isHr = it.label === "Target heart rate zones";
          return (
            <div key={it.label} className="p-4 rounded-xl bg-surface border border-border">
              <div className="text-xs uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
                {it.label}
                {isHr && (
                  <button
                    type="button"
                    onClick={() => setHrTipOpen((o) => !o)}
                    aria-label="More info"
                    style={{ display: "inline-flex", padding: 0, background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    <Info size={14} color="var(--color-text-muted)" />
                  </button>
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{it.value}</span>
                <span className="text-sm text-muted-foreground">{it.sub}</span>
              </div>
              {isHr && hrTipOpen && (
                <p style={{ color: "var(--color-text-secondary)", fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>
                  {HR_TOOLTIP}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={async () => {
          await navigate({ to: "/app/", replace: true });
        }}
        className="fixed bottom-6 left-6 right-6 max-w-[720px] mx-auto h-12 rounded-md bg-primary text-foreground-foreground font-semibold"
      >
        Go to my dashboard
      </button>
    </div>
  );
}
