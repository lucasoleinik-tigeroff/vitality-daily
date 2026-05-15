import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { bmiCategoryLabel } from "@/lib/health";

const HR_TOOLTIP = "These zones are calculated from general formulas based on your age. Individual results may vary. If you have any cardiovascular concerns, consult a healthcare professional before starting an exercise program.";

export const Route = createFileRoute("/app/baseline")({
  component: BaselineView,
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



function BaselineView() {
  const { user } = useAuth();
  const [m, setM] = useState<Metrics | null>(null);
  const [hrTipOpen, setHrTipOpen] = useState(false);

  useEffect(() => {
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
  }, [user]);

  return (
    <div className="px-5 pt-5 pb-28">
      <Link to="/app/settings" className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--color-primary)" }}>
        <ChevronLeft size={16} /> Back
      </Link>
      <h1 className="mt-3 text-2xl font-bold" style={{ letterSpacing: "-0.02em" }}>Your Baseline</h1>
      <span className="section-accent-bar" />
      <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>A read-only view of your computed health metrics.</p>

      {!m ? (
        <p className="mt-8 text-sm" style={{ color: "var(--color-text-secondary)" }}>No baseline metrics yet. Complete onboarding or update your body metrics on the Progress screen.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {[
            ...(m.waist_risk_category
              ? [{ label: "Waist risk category", value: m.waist_risk_category, sub: "Correlated with vascular health" }]
              : []),
            { label: "Body Mass Index (BMI)", value: `${m.bmi}`, sub: bmiCategoryLabel(m.bmi_category) },
            { label: "Estimated daily calorie burn", value: `${m.tdee_kcal} kcal/day`, sub: "TDEE" },
            { label: "Daily hydration target", value: `${m.hydration_target_oz} oz`, sub: "Personalized to your body weight" },
            { label: "Target heart rate zones", value: `${m.hr_moderate_low}–${m.hr_moderate_high} bpm`, sub: `Vigorous: ${m.hr_vigorous_low}–${m.hr_vigorous_high} bpm` },
          ].map((it) => (
            <div key={it.label} className="p-5 rounded-[14px] bg-surface border border-border">
              <div className="section-label">{it.label}</div>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold text-foreground">{it.value}</span>
                <span className="text-sm text-muted-foreground">{it.sub}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
