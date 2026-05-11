import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

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
  waist_risk_category: string;
}

const FOR_EDU = "For educational purposes only. Consult a healthcare provider for medical evaluation.";

function Baseline() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [m, setM] = useState<Metrics | null>(null);

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

  if (!m) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading your baseline…</div>;

  const items = [
    { label: "Body Mass Index (BMI)", value: `${m.bmi}`, sub: m.bmi_category, note: "BMI is a general indicator; combine with waist measurement for a fuller picture." },
    { label: "Estimated daily calorie burn", value: `${m.tdee_kcal} kcal/day`, sub: "TDEE", note: "This is a general estimate of calories burned per day. Actual needs vary." },
    { label: "Daily hydration target", value: `${m.hydration_target_oz} oz`, sub: "Personalized to your body weight", note: "Adjust based on climate and individual needs." },
    { label: "Target heart rate zones", value: `${m.hr_moderate_low}–${m.hr_moderate_high} bpm`, sub: `Vigorous: ${m.hr_vigorous_low}–${m.hr_vigorous_high} bpm`, note: "Consult a doctor before starting any vigorous exercise program." },
    { label: "Waist risk category", value: m.waist_risk_category, sub: "Correlated with vascular health", note: "Talk to your doctor for medical evaluation." },
  ];

  return (
    <div className="min-h-screen bg-background px-6 py-8 max-w-[768px] mx-auto pb-24">
      <h1 className="text-2xl font-bold">Your Baseline</h1>
      <p className="text-sm text-muted-foreground mt-1">Here's where you're starting from.</p>

      <div className="mt-6 space-y-3">
        {items.map((it) => (
          <div key={it.label} className="p-4 rounded-xl bg-surface border border-border">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{it.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{it.value}</span>
              <span className="text-sm text-muted-foreground">{it.sub}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{it.note} <span className="italic">{FOR_EDU}</span></p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate({ to: "/app" })}
        className="fixed bottom-6 left-6 right-6 max-w-[720px] mx-auto h-12 rounded-md bg-primary text-primary-foreground font-semibold"
      >
        Go to my dashboard
      </button>
    </div>
  );
}
