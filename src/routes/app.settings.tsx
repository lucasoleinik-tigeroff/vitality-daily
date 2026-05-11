import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { LegalModal } from "@/components/LegalModals";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { ACTIVITY_LABELS, type ActivityLevel } from "@/lib/health";

export const Route = createFileRoute("/app/settings")({
  component: Settings,
});

interface ProfileFull {
  name: string | null;
  email: string;
  age: number | null;
  height_feet: number | null;
  height_inches: number | null;
  weight_lbs: number | null;
  waist_inches: number | null;
  activity_level: ActivityLevel | null;
}
interface Baseline {
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

function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<ProfileFull | null>(null);
  const [b, setB] = useState<Baseline | null>(null);
  const [legal, setLegal] = useState<"medical" | "terms" | "privacy" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [pr, hm] = await Promise.all([
        supabase.from("profiles").select("name,email,age,height_feet,height_inches,weight_lbs,waist_inches,activity_level").eq("id", user.id).maybeSingle(),
        supabase.from("user_health_metrics").select("bmi,bmi_category,tdee_kcal,hydration_target_oz,hr_moderate_low,hr_moderate_high,hr_vigorous_low,hr_vigorous_high,waist_risk_category").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (pr.data) setP(pr.data as ProfileFull);
      if (hm.data) setB(hm.data as Baseline);
    })();
  }, [user]);

  async function saveAccount() {
    if (!user || !p) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: p.name,
      age: p.age,
      height_feet: p.height_feet,
      height_inches: p.height_inches,
      weight_lbs: p.weight_lbs,
      waist_inches: p.waist_inches,
      activity_level: p.activity_level,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved. Update body metrics on Progress to refresh your baseline.");
  }

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  if (!p) return <div className="px-5 py-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="px-5 pt-5 pb-28">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft size={16} /> Back
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Profile & Settings</h1>

      <Section title="Account">
        <Field label="Name"><input value={p.name ?? ""} onChange={(e) => setP({ ...p, name: e.target.value })} className="input" /></Field>
        <Field label="Email"><input value={p.email} disabled className="input opacity-60" /></Field>
        <Field label="Age"><input type="number" value={p.age ?? ""} onChange={(e) => setP({ ...p, age: +e.target.value })} className="input" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (ft)"><input type="number" value={p.height_feet ?? ""} onChange={(e) => setP({ ...p, height_feet: +e.target.value })} className="input" /></Field>
          <Field label="Height (in)"><input type="number" value={p.height_inches ?? ""} onChange={(e) => setP({ ...p, height_inches: +e.target.value })} className="input" /></Field>
        </div>
        <Field label="Weight (lbs)"><input type="number" value={p.weight_lbs ?? ""} onChange={(e) => setP({ ...p, weight_lbs: +e.target.value })} className="input" /></Field>
        <Field label="Waist (in)"><input type="number" value={p.waist_inches ?? ""} onChange={(e) => setP({ ...p, waist_inches: +e.target.value })} className="input" /></Field>
        <Field label="Activity level">
          <select value={p.activity_level ?? ""} onChange={(e) => setP({ ...p, activity_level: e.target.value as ActivityLevel })} className="input">
            {Object.entries(ACTIVITY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <button disabled={saving} onClick={saveAccount} className="w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </Section>

      <Section title="Health Baseline">
        {b ? (
          <div className="space-y-2 text-sm">
            <Row k="BMI" v={`${b.bmi} (${b.bmi_category})`} />
            <Row k="TDEE" v={`${b.tdee_kcal} kcal/day`} />
            <Row k="Hydration target" v={`${b.hydration_target_oz} oz`} />
            <Row k="Moderate HR zone" v={`${b.hr_moderate_low}–${b.hr_moderate_high} bpm`} />
            <Row k="Vigorous HR zone" v={`${b.hr_vigorous_low}–${b.hr_vigorous_high} bpm`} />
            <Row k="Waist risk" v={b.waist_risk_category} />
            <p className="text-xs text-muted-foreground italic mt-3">For educational purposes only. Consult a healthcare provider for medical evaluation.</p>
          </div>
        ) : <p className="text-sm text-muted-foreground">No baseline yet.</p>}
      </Section>

      <Section title="Legal">
        <button onClick={() => setLegal("terms")} className="w-full text-left p-3 rounded-md border border-border bg-background text-sm">Terms of Service</button>
        <button onClick={() => setLegal("privacy")} className="w-full text-left p-3 rounded-md border border-border bg-background text-sm">Privacy Policy</button>
        <button onClick={() => setLegal("medical")} className="w-full text-left p-3 rounded-md border border-border bg-background text-sm">Medical Disclaimer</button>
      </Section>

      <Section title="Support">
        <a href="mailto:support@vitalman.app" className="block p-3 rounded-md border border-border bg-background text-sm text-accent">support@vitalman.app</a>
      </Section>

      <button onClick={handleSignOut} className="mt-8 w-full h-11 rounded-md border-2 border-primary text-primary font-semibold">
        Sign out
      </button>

      <LegalModal type={legal} onClose={() => setLegal(null)} />

      <style>{`.input { width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--color-input); border-radius: 8px; background: var(--color-background); }`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-primary">{v}</span>
    </div>
  );
}
