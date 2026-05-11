import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { computeVitalityScore, type SleepQuality, type StressLevel } from "@/lib/score";
import { todayIsoDate, formatLongDate } from "@/lib/health";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/log")({
  component: LogPage,
});

const ACTIVITY_TYPES = ["Walking", "Strength", "Stretching", "Other"];
const SUPP_TIMES = ["With breakfast", "With lunch", "Other"];

function LogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hydrationTarget, setHydrationTarget] = useState(64);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [stress, setStress] = useState<StressLevel | null>(null);
  const [activityMin, setActivityMin] = useState(0);
  const [activityType, setActivityType] = useState("Walking");
  const [hydrationOz, setHydrationOz] = useState(0);
  const [supplement, setSupplement] = useState<boolean | null>(null);
  const [supplementTime, setSupplementTime] = useState(SUPP_TIMES[0]);
  const [notes, setNotes] = useState("");
  const [existing, setExisting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = todayIsoDate();
      const [hm, dl] = await Promise.all([
        supabase.from("user_health_metrics").select("hydration_target_oz").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
      ]);
      if (hm.data) setHydrationTarget(hm.data.hydration_target_oz);
      if (dl.data) {
        setExisting(true);
        setSleepHours(dl.data.sleep_hours ?? 7);
        setSleepQuality(dl.data.sleep_quality as SleepQuality | null);
        setStress(dl.data.stress_level as StressLevel | null);
        setActivityMin(dl.data.activity_minutes ?? 0);
        setActivityType(dl.data.activity_type ?? "Walking");
        setHydrationOz(dl.data.hydration_oz ?? 0);
        setSupplement(dl.data.supplement_taken);
        setSupplementTime(dl.data.supplement_time ?? SUPP_TIMES[0]);
        setNotes(dl.data.notes ?? "");
      }
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const today = todayIsoDate();
    const payload = {
      user_id: user.id,
      log_date: today,
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      stress_level: stress,
      activity_minutes: activityMin,
      activity_type: activityType,
      hydration_oz: hydrationOz,
      supplement_taken: supplement ?? false,
      supplement_time: supplement ? supplementTime : null,
      notes: notes || null,
    };
    const { error } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,log_date" });
    if (error) { toast.error(error.message); setSaving(false); return; }

    // Vitality score
    const breakdown = computeVitalityScore({
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      stress_level: stress,
      activity_minutes: activityMin,
      hydration_oz: hydrationOz,
      hydration_target_oz: hydrationTarget,
      supplement_taken: supplement ?? false,
    });
    // 7-day rolling avg (excluding today) for status
    const { data: prior } = await supabase
      .from("vitality_scores")
      .select("score")
      .eq("user_id", user.id)
      .lt("score_date", today)
      .order("score_date", { ascending: false })
      .limit(7);
    const avg = prior && prior.length > 0 ? prior.reduce((s, r) => s + r.score, 0) / prior.length : breakdown.total;
    const status =
      breakdown.total < 60
        ? "needs_attention"
        : breakdown.total > avg && breakdown.total >= 60
        ? "improving"
        : "stable";

    await supabase.from("vitality_scores").upsert({
      user_id: user.id,
      score_date: today,
      score: breakdown.total,
      status,
    }, { onConflict: "user_id,score_date" });

    // Streak
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yIso = yesterday.toISOString().slice(0, 10);
    const { data: ylog } = await supabase
      .from("daily_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("log_date", yIso)
      .maybeSingle();
    const { data: prof } = await supabase
      .from("profiles")
      .select("streak_count,last_log_date")
      .eq("id", user.id)
      .maybeSingle();
    const newStreak = prof?.last_log_date === today
      ? (prof.streak_count ?? 1)
      : ylog ? (prof?.streak_count ?? 0) + 1 : 1;
    await supabase.from("profiles").update({ streak_count: newStreak, last_log_date: today }).eq("id", user.id);

    setSaving(false);
    toast.success(`Saved. Today's score: ${breakdown.total}`);
    navigate({ to: "/app" });
  }

  const hydrationCups = Math.round(hydrationOz / 8);
  const hydrationPct = Math.min(100, Math.round((hydrationOz / hydrationTarget) * 100));

  return (
    <div className="px-5 pt-5 pb-28">
      <h1 className="text-2xl font-bold">Log Today</h1>
      <p className="text-sm text-muted-foreground">{formatLongDate()}</p>

      <div className="mt-5 space-y-4">
        {/* Sleep */}
        <Card label="Hours of sleep">
          <Stepper value={sleepHours} setValue={setSleepHours} step={0.5} min={0} max={12} suffix="h" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["poor", "ok", "great"] as SleepQuality[]).map((q) => (
              <Pill key={q} active={sleepQuality === q} onClick={() => setSleepQuality(q)} label={q === "poor" ? "Poor" : q === "ok" ? "OK" : "Great"} />
            ))}
          </div>
        </Card>

        {/* Stress */}
        <Card label="Stress level today">
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as StressLevel[]).map((l) => (
              <Pill key={l} active={stress === l} onClick={() => setStress(l)} label={l === "low" ? "Low" : l === "medium" ? "Medium" : "High"} />
            ))}
          </div>
        </Card>

        {/* Activity */}
        <Card label="Minutes of activity">
          <Stepper value={activityMin} setValue={setActivityMin} step={5} min={0} max={240} suffix="m" />
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="mt-3 w-full h-11 px-3 rounded-md border border-input bg-background">
            {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Card>

        {/* Hydration */}
        <Card label="Water intake">
          <div className="flex items-center justify-between">
            <button onClick={() => setHydrationOz(Math.max(0, hydrationOz - 8))} className="w-11 h-11 rounded-md border-2 border-primary text-primary flex items-center justify-center">
              <Minus size={18} />
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{hydrationOz} oz</div>
              <div className="text-xs text-muted-foreground">{hydrationCups} {hydrationCups === 1 ? "cup" : "cups"} of {Math.round(hydrationTarget / 8)} target</div>
            </div>
            <button onClick={() => setHydrationOz(hydrationOz + 8)} className="w-11 h-11 rounded-md border-2 border-primary text-primary flex items-center justify-center">
              <Plus size={18} />
            </button>
          </div>
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "#ECE6DC" }}>
            <div className="h-full" style={{ width: `${hydrationPct}%`, background: "#D97A34" }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground text-center">{hydrationOz} oz of {hydrationTarget} oz target</p>
        </Card>

        {/* Supplement */}
        <Card label="Did you take your VitalMan capsule?">
          <div className="grid grid-cols-2 gap-2">
            <Pill active={supplement === true} onClick={() => setSupplement(true)} label="Yes" />
            <Pill active={supplement === false} onClick={() => setSupplement(false)} label="Not yet" />
          </div>
          {supplement && (
            <select value={supplementTime} onChange={(e) => setSupplementTime(e.target.value)} className="mt-3 w-full h-11 px-3 rounded-md border border-input bg-background">
              {SUPP_TIMES.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
        </Card>

        {/* Notes */}
        <Card label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 200))}
            rows={3}
            className="w-full p-3 rounded-md border border-input bg-background text-sm resize-none"
            placeholder="How are you feeling today?"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{notes.length}/200</p>
        </Card>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-50"
      >
        {saving ? "Saving…" : existing ? "Update Today's Log" : "Save Today's Log"}
      </button>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border">
      <div className="text-sm font-semibold text-foreground mb-3">{label}</div>
      {children}
    </div>
  );
}

function Pill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="h-11 rounded-md border-2 text-sm font-medium"
      style={{
        borderColor: active ? "var(--color-primary)" : "var(--color-border)",
        background: active ? "var(--color-primary)" : "var(--color-background)",
        color: active ? "var(--color-primary-foreground)" : "var(--color-foreground)",
      }}
    >
      {label}
    </button>
  );
}

function Stepper({ value, setValue, step, min, max, suffix }: { value: number; setValue: (n: number) => void; step: number; min: number; max: number; suffix: string }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={() => setValue(Math.max(min, +(value - step).toFixed(1)))} className="w-11 h-11 rounded-md border-2 border-primary text-primary flex items-center justify-center">
        <Minus size={18} />
      </button>
      <div className="text-2xl font-bold text-primary">{value}{suffix}</div>
      <button onClick={() => setValue(Math.min(max, +(value + step).toFixed(1)))} className="w-11 h-11 rounded-md border-2 border-primary text-primary flex items-center justify-center">
        <Plus size={18} />
      </button>
    </div>
  );
}
