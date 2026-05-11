import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { computeBaseline, type ActivityLevel } from "@/lib/health";
import { LegalModal } from "@/components/LegalModals";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

interface State {
  age: string;
  feet: string;
  inches: string;
  weight: string;
  waist: string;
  activity: ActivityLevel | "";
  concern: string;
  habits: string[];
  goal: string;
  agreeTerms: boolean;
  age18: boolean;
}

const initial: State = {
  age: "", feet: "", inches: "", weight: "", waist: "",
  activity: "", concern: "", habits: [], goal: "",
  agreeTerms: false, age18: false,
};

const ACTIVITY_OPTIONS: Array<{ v: ActivityLevel; label: string }> = [
  { v: "sedentary", label: "Sedentary (little or no exercise)" },
  { v: "lightly_active", label: "Lightly active (1 to 3 days per week)" },
  { v: "moderately_active", label: "Moderately active (3 to 5 days per week)" },
  { v: "very_active", label: "Very active (6 to 7 days per week)" },
];

const CONCERNS = [
  "Performance and confidence",
  "Energy and vitality",
  "Stress and sleep",
  "General wellness",
];

const HABITS = [
  "I sleep at least 7 hours most nights",
  "I drink alcohol often (more than 3 drinks per week)",
  "I feel stressed most days",
  "I already take supplements",
];

const GOALS = [
  "Build a consistent daily routine",
  "Improve sleep and recovery",
  "Increase energy",
  "Support overall sexual health",
];

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [s, setS] = useState<State>(initial);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  const [tooltip, setTooltip] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/signin" });
  }, [user, loading, navigate]);

  function next() { setStep((x) => Math.min(7, x + 1)); }
  function back() { setStep((x) => Math.max(1, x - 1)); }

  function validStep2() {
    const age = +s.age, ft = +s.feet, inc = +s.inches, wt = +s.weight, wa = +s.waist;
    return age >= 18 && age <= 99 && ft >= 3 && ft <= 7 && inc >= 0 && inc <= 11 && wt >= 50 && wt <= 500 && wa >= 20 && wa <= 80;
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    const baseline = computeBaseline({
      age: +s.age,
      heightFeet: +s.feet,
      heightInches: +s.inches,
      weightLbs: +s.weight,
      waistInches: +s.waist,
      activity: s.activity as ActivityLevel,
    });
    const now = new Date().toISOString();
    const { error: pErr } = await supabase.from("profiles").update({
      age: +s.age,
      height_feet: +s.feet,
      height_inches: +s.inches,
      weight_lbs: +s.weight,
      waist_inches: +s.waist,
      activity_level: s.activity as ActivityLevel,
      main_concern: s.concern,
      main_goal: s.goal,
      current_habits: s.habits,
      onboarding_completed: true,
      terms_accepted_at: now,
      privacy_accepted_at: now,
    }).eq("id", user.id);

    if (pErr) { toast.error(pErr.message); setSaving(false); return; }

    const { error: mErr } = await supabase.from("user_health_metrics").insert({
      user_id: user.id,
      weight_lbs: +s.weight,
      waist_inches: +s.waist,
      activity_level: s.activity as ActivityLevel,
      ...baseline,
    });
    if (mErr) { toast.error(mErr.message); setSaving(false); return; }

    setSaving(false);
    navigate({ to: "/onboarding/baseline" });
  }

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background px-6 py-6 max-w-[768px] mx-auto flex flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-between mb-4">
        {step > 1 ? (
          <button onClick={back} className="text-sm text-accent">&larr; Back</button>
        ) : <span />}
        <span className="text-xs text-muted-foreground">{step} of 7</span>
      </div>
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < step ? "var(--color-primary)" : "var(--color-border)" }} />
        ))}
      </div>

      <div className="flex-1 max-w-[420px] w-full mx-auto">
        {step === 1 && (
          <div className="text-center pt-6">
            <h1 className="text-3xl font-bold tracking-tight">VitalMan</h1>
            <h2 className="mt-10 text-2xl font-bold leading-tight">Your daily companion for men's vitality</h2>
            <p className="mt-3 text-base text-muted-foreground">Track. Improve. Feel the difference.</p>
            <button onClick={next} className="mt-12 w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold">Get Started</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold">Tell us a bit about you</h2>
            <div className="mt-6 space-y-4">
              <NumField label="Age" value={s.age} onChange={(v) => setS({ ...s, age: v })} min={18} max={99} />
              <div>
                <label className="block text-sm font-medium mb-1.5">Height</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Feet" min={3} max={7} value={s.feet} onChange={(e) => setS({ ...s, feet: e.target.value })} className="h-11 px-3 rounded-md border border-input" />
                  <input type="number" placeholder="Inches" min={0} max={11} value={s.inches} onChange={(e) => setS({ ...s, inches: e.target.value })} className="h-11 px-3 rounded-md border border-input" />
                </div>
              </div>
              <NumField label="Weight (lbs)" value={s.weight} onChange={(v) => setS({ ...s, weight: v })} min={50} max={500} />
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Waist circumference (inches){" "}
                  <button type="button" onClick={() => setTooltip(!tooltip)} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs">?</button>
                </label>
                {tooltip && (
                  <p className="text-xs text-muted-foreground mb-2 p-2 bg-surface rounded-md border border-border">
                    Measure around your belly button while standing relaxed. This helps us assess your vascular health risk.
                  </p>
                )}
                <input type="number" min={20} max={80} value={s.waist} onChange={(e) => setS({ ...s, waist: e.target.value })} className="w-full h-11 px-3 rounded-md border border-input" />
              </div>
            </div>
            <button disabled={!validStep2()} onClick={next} className="mt-8 w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50">Continue</button>
          </div>
        )}

        {step === 3 && (
          <SingleSelect
            title="How active are you?"
            options={ACTIVITY_OPTIONS.map((o) => ({ value: o.v, label: o.label }))}
            value={s.activity}
            onChange={(v) => setS({ ...s, activity: v as ActivityLevel })}
            onContinue={next}
          />
        )}

        {step === 4 && (
          <SingleSelect
            title="What brings you to VitalMan?"
            options={CONCERNS.map((c) => ({ value: c, label: c }))}
            value={s.concern}
            onChange={(v) => setS({ ...s, concern: v })}
            onContinue={next}
          />
        )}

        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold">How would you describe your current habits?</h2>
            <p className="text-sm text-muted-foreground mt-1">Select all that apply.</p>
            <div className="mt-6 space-y-2">
              {HABITS.map((h) => {
                const checked = s.habits.includes(h);
                return (
                  <button
                    key={h}
                    onClick={() => setS({ ...s, habits: checked ? s.habits.filter((x) => x !== h) : [...s.habits, h] })}
                    className="w-full text-left p-4 rounded-lg border-2 flex items-center gap-3"
                    style={{ borderColor: checked ? "var(--color-primary)" : "var(--color-border)", background: checked ? "var(--color-surface)" : "var(--color-background)" }}
                  >
                    <span className="w-5 h-5 rounded border-2 flex items-center justify-center" style={{ borderColor: "var(--color-primary)", background: checked ? "var(--color-primary)" : "transparent" }}>
                      {checked && <span className="text-primary-foreground text-xs">✓</span>}
                    </span>
                    <span className="text-sm">{h}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={next} className="mt-8 w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold">Continue</button>
          </div>
        )}

        {step === 6 && (
          <SingleSelect
            title="What's your main goal for the next 30 days?"
            options={GOALS.map((g) => ({ value: g, label: g }))}
            value={s.goal}
            onChange={(v) => setS({ ...s, goal: v })}
            onContinue={next}
          />
        )}

        {step === 7 && (
          <div>
            <h2 className="text-xl font-bold">Before we begin</h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground">
              VitalMan is a wellness coaching app. It is not a medical device and does not diagnose, treat, cure, or prevent any condition. It does not replace professional medical advice. The health metrics shown are calculated from general formulas and are for educational purposes only — they are not a medical diagnosis. By continuing, you confirm you are at least 18 years old and agree to our{" "}
              <button type="button" onClick={() => setLegal("terms")} className="text-accent underline">Terms of Service</button> and{" "}
              <button type="button" onClick={() => setLegal("privacy")} className="text-accent underline">Privacy Policy</button>.
            </p>
            <div className="mt-6 space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <input type="checkbox" checked={s.agreeTerms} onChange={(e) => setS({ ...s, agreeTerms: e.target.checked })} className="mt-0.5 w-5 h-5 accent-[var(--color-primary)]" />
                <span className="text-sm">I have read and agree to the Terms of Service and Privacy Policy</span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <input type="checkbox" checked={s.age18} onChange={(e) => setS({ ...s, age18: e.target.checked })} className="mt-0.5 w-5 h-5 accent-[var(--color-primary)]" />
                <span className="text-sm">I confirm I am 18 years of age or older</span>
              </label>
            </div>
            <button
              disabled={!s.agreeTerms || !s.age18 || saving}
              onClick={finish}
              className="mt-8 w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {saving ? "Setting up your profile…" : "Start my journey"}
            </button>
          </div>
        )}
      </div>

      <LegalModal type={legal} onClose={() => setLegal(null)} />
    </div>
  );
}

function NumField({ label, value, onChange, min, max }: { label: string; value: string; onChange: (v: string) => void; min: number; max: number }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 px-3 rounded-md border border-input" />
    </div>
  );
}

function SingleSelect({ title, options, value, onChange, onContinue }: { title: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; onContinue: () => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-6 space-y-2">
        {options.map((o) => {
          const sel = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className="w-full text-left p-4 rounded-lg border-2 text-sm"
              style={{ borderColor: sel ? "var(--color-primary)" : "var(--color-border)", background: sel ? "var(--color-surface)" : "var(--color-background)", fontWeight: sel ? 600 : 400 }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <button disabled={!value} onClick={onContinue} className="mt-8 w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50">Continue</button>
    </div>
  );
}
