import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { LegalModal } from "@/components/LegalModals";
import { AvatarUpload } from "@/components/AvatarUpload";
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
  avatar_url: string | null;
}

function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<ProfileFull | null>(null);
  const [legal, setLegal] = useState<"medical" | "terms" | "privacy" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name,email,age,height_feet,height_inches,weight_lbs,waist_inches,activity_level,avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) setP(data as ProfileFull);
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

  if (!p || !user) return <div className="px-5 py-10 text-center" style={{ color: "#8FA8B8" }}>Loading…</div>;

  return (
    <div className="px-5 pt-5 pb-28">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm" style={{ color: "#770101" }}>
        <ChevronLeft size={16} /> Back
      </Link>
      <h1 className="mt-3 text-2xl font-bold" style={{ letterSpacing: "-0.02em" }}>Profile & Settings</h1>

      <div className="mt-6">
        <AvatarUpload
          userId={user.id}
          avatarUrl={p.avatar_url}
          onChange={(url) => setP({ ...p, avatar_url: url })}
        />
      </div>

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

      <Section title="Your Baseline">
        <Link to="/app/baseline" className="flex items-center justify-between p-3 rounded-md border border-border bg-background text-sm">
          <span>
            <span className="block font-semibold text-primary">View your computed health metrics</span>
            <span className="block text-xs mt-0.5" style={{ color: "#8FA8B8" }}>BMI, TDEE, hydration, heart rate zones, waist risk</span>
          </span>
          <ChevronLeft size={16} className="rotate-180" color="#8FA8B8" />
        </Link>
      </Section>

      <Section title="Legal">
        <button onClick={() => setLegal("terms")} className="w-full text-left p-3 rounded-md border border-border bg-background text-sm">Terms of Service</button>
        <button onClick={() => setLegal("privacy")} className="w-full text-left p-3 rounded-md border border-border bg-background text-sm">Privacy Policy</button>
        <button onClick={() => setLegal("medical")} className="w-full text-left p-3 rounded-md border border-border bg-background text-sm">Medical Disclaimer</button>
      </Section>

      <button
        onClick={handleSignOut}
        className="mt-8 w-full h-11 rounded-md font-semibold"
        style={{ background: "#FFFFFF", color: "#770101", border: "1px solid #770101" }}
      >
        Sign out
      </button>

      <LegalModal type={legal} onClose={() => setLegal(null)} />

      <style>{`.input { width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--color-input); border-radius: 8px; background: var(--color-background); } .input:focus { outline: none; border-color: var(--color-primary); }`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="section-label">{title}</h2>
      <span className="section-accent-bar mb-3" />
      <div className="space-y-3 mt-3">{children}</div>
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
