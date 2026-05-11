import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Phase2Card } from "@/components/Phase2Card";
import { todayIsoDate, computeBaseline, type ActivityLevel, ACTIVITY_LABELS } from "@/lib/health";
import { toast } from "sonner";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});

interface ScoreRow { score_date: string; score: number }
interface LogRow { log_date: string; sleep_hours: number | null; sleep_quality: string | null; stress_level: string | null }
interface CompletionRow { completion_date: string; completed_items: number[]; total_items: number }
interface MetricsRow { weight_lbs: number; waist_inches: number; activity_level: ActivityLevel; snapshot_date: string }

function ProgressPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<30 | 60 | 90>(30);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [profile, setProfile] = useState<{ streak_count: number; journey_start_date: string; height_feet: number | null; height_inches: number | null; age: number | null } | null>(null);
  const [metricsHist, setMetricsHist] = useState<MetricsRow[]>([]);
  const [logCount, setLogCount] = useState(0);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      const [s, l, c, p, mh, lc] = await Promise.all([
        supabase.from("vitality_scores").select("score_date,score").eq("user_id", user.id).gte("score_date", since).order("score_date"),
        supabase.from("daily_logs").select("log_date,sleep_hours,sleep_quality,stress_level").eq("user_id", user.id).gte("log_date", since).order("log_date"),
        supabase.from("protocol_completions").select("completion_date,completed_items,total_items").eq("user_id", user.id).gte("completion_date", since),
        supabase.from("profiles").select("streak_count,journey_start_date,height_feet,height_inches,age").eq("id", user.id).maybeSingle(),
        supabase.from("user_health_metrics").select("weight_lbs,waist_inches,activity_level,snapshot_date").eq("user_id", user.id).order("snapshot_date", { ascending: true }),
        supabase.from("daily_logs").select("log_date", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (s.data) setScores(s.data as ScoreRow[]);
      if (l.data) setLogs(l.data as LogRow[]);
      if (c.data) setCompletions(c.data as CompletionRow[]);
      if (p.data) setProfile(p.data as typeof profile extends infer T ? T : never);
      if (mh.data) setMetricsHist(mh.data as MetricsRow[]);
      setLogCount(lc.count ?? 0);
    })();
  }, [user]);

  const filteredScores = useMemo(() => {
    const cutoff = new Date(Date.now() - range * 86400000).toISOString().slice(0, 10);
    return scores.filter((s) => s.score_date >= cutoff);
  }, [scores, range]);

  const stats = useMemo(() => {
    if (filteredScores.length === 0) return { avg: "—", best: "—", streak: profile?.streak_count ?? 0 };
    const avg = Math.round(filteredScores.reduce((s, r) => s + r.score, 0) / filteredScores.length);
    const best = Math.max(...filteredScores.map((r) => r.score));
    return { avg, best, streak: profile?.streak_count ?? 0 };
  }, [filteredScores, profile]);

  const summary = useMemo(() => buildWeeklySummary(scores, logs, completions, logCount), [scores, logs, completions, logCount]);
  const eligible = logCount >= 14;
  const latestMetrics = metricsHist.at(-1);

  return (
    <div className="px-5 pt-5 pb-24">
      <h1 className="text-2xl font-bold text-primary" style={{ letterSpacing: "-0.02em" }}>Progress</h1>
      <p className="text-sm" style={{ color: "#6B6760" }}>Your journey so far</p>
      <div className="mt-2 mb-5" style={{ width: 24, height: 2, background: "var(--color-accent)", borderRadius: 2 }} />

      {/* Vitality Score Trend */}
      <SectionHeader label="Vitality Score Trend" />
      <div className="p-4 rounded-[14px] bg-surface border border-border">
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {[30, 60, 90].map((r) => {
            const active = range === r;
            return (
              <button
                key={r}
                onClick={() => setRange(r as 30 | 60 | 90)}
                className="h-9 rounded-md text-sm"
                style={
                  active
                    ? { background: "#0F2A44", color: "white", fontWeight: 600 }
                    : { background: "white", border: "1px solid #E8E2D9", color: "#6B6760", fontWeight: 500 }
                }
              >
                {r} days
              </button>
            );
          })}
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={filteredScores}>
              <CartesianGrid stroke="#ECE6DC" vertical={false} />
              <XAxis dataKey="score_date" tick={{ fontSize: 11, fill: "#8C8780" }} tickFormatter={(d: string) => { const x = new Date(d); return `${x.getMonth() + 1}/${x.getDate()}`; }} minTickGap={20} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: "#8C8780" }} width={28} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#D97A34" strokeWidth={2} dot={{ r: 4, fill: "#D97A34" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <StatTile label="Avg Score" value={stats.avg} />
          <StatTile label="Best" value={stats.best} />
          <StatTile label="Streak" value={stats.streak} />
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="mt-6">
        <SectionHeader label="Streak Calendar" />
        <Calendar month={calMonth} onPrev={() => setCalMonth(addMonths(calMonth, -1))} onNext={() => setCalMonth(addMonths(calMonth, 1))} logs={logs} completions={completions} journeyStart={profile?.journey_start_date} />
      </div>

      {/* Body Metrics */}
      <div className="mt-6">
        <SectionHeader label="Body Metrics" />
        <BodyMetricsEditor latest={latestMetrics} userId={user?.id} profile={profile} onSaved={async () => {
          if (!user) return;
          const { data: mh } = await supabase.from("user_health_metrics").select("weight_lbs,waist_inches,activity_level,snapshot_date").eq("user_id", user.id).order("snapshot_date", { ascending: true });
          if (mh) setMetricsHist(mh as MetricsRow[]);
        }} />
        {metricsHist.length >= 2 && (
          <div className="mt-3 p-4 rounded-[14px] bg-surface border border-border">
            <div className="text-[13px] font-semibold" style={{ color: "#6B6760" }}>Weight trend</div>
            <div style={{ height: 120 }}>
              <ResponsiveContainer>
                <LineChart data={metricsHist.map((m) => ({ d: m.snapshot_date.slice(0, 10), w: Number(m.weight_lbs) }))}>
                  <Line type="monotone" dataKey="w" stroke="#0F2A44" strokeWidth={2} dot={{ r: 3, fill: "#0F2A44" }} />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#8C8780" }} hide />
                  <YAxis tick={{ fontSize: 10, fill: "#8C8780" }} width={28} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs" style={{ color: "#6B6760" }}>Personalized targets are educational only and not a medical diagnosis.</p>
      </div>

      {/* Last Week Summary */}
      <div className="mt-6">
        <SectionHeader label="Last Week Summary" />
        <div className="p-5 rounded-[14px] bg-surface border border-border text-[14px]" style={{ color: "#14181F", lineHeight: 1.55 }}>
          {summary}
        </div>
      </div>

      {/* Phase 2 Readiness */}
      {eligible && user && (
        <div className="mt-6">
          <SectionHeader label="Your Next Phase" />
          <Phase2Card userId={user.id} compact />
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[12px] p-3.5" style={{ background: "#FAF8F5", border: "1px solid #E8E2D9" }}>
      <div className="text-[18px] font-bold text-primary leading-none">{value}</div>
      <div className="mt-1.5 section-label" style={{ fontSize: 10 }}>{label}</div>
    </div>
  );
}

function addMonths(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

function Calendar({ month, onPrev, onNext, logs, completions, journeyStart }: { month: Date; onPrev: () => void; onNext: () => void; logs: LogRow[]; completions: CompletionRow[]; journeyStart: string | undefined }) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = todayIsoDate();
  const journey = journeyStart ?? today;

  const logsByDate = new Map(logs.map((l) => [l.log_date, l]));
  const compByDate = new Map(completions.map((c) => [c.completion_date, c]));

  const cells: { date: string | null; n: number | null }[] = [];
  for (let i = 0; i < startDow; i++) cells.push({ date: null, n: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: iso, n: d });
  }
  while (cells.length < 42) cells.push({ date: null, n: null });

  const monthName = first.toLocaleString("en-US", { month: "long", year: "numeric" });
  const isCurrentMonth = y === new Date().getFullYear() && m === new Date().getMonth();

  return (
    <div className="p-4 rounded-[14px] bg-surface border border-border">
      <div className="flex items-center justify-between">
        <button onClick={onPrev} aria-label="Previous"><ChevronLeft size={20} color="#0F2A44" /></button>
        <div className="text-base font-semibold text-primary">{monthName}</div>
        <button onClick={onNext} disabled={isCurrentMonth} aria-label="Next" className="disabled:opacity-30"><ChevronRight size={20} color="#0F2A44" /></button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-center" style={{ color: "#8C8780", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>{d}</div>
        ))}
        {cells.map((c, i) => {
          if (!c.date) return <div key={i} style={{ width: 36, height: 36 }} />;
          const beforeJourney = c.date < journey;
          const future = c.date > today;
          const isToday = c.date === today;
          const log = logsByDate.get(c.date);
          const comp = compByDate.get(c.date);
          let bg = "#FAF8F5", color = "#8C8780", border = "1px solid #ECE6DC";
          if (comp && comp.completed_items.length === comp.total_items && comp.total_items > 0) {
            bg = "#0F2A44"; color = "white"; border = "none";
          } else if (comp && comp.completed_items.length > 0) {
            bg = "#D97A34"; color = "white"; border = "none";
          } else if (log) {
            bg = "#FFF4E8"; color = "#14181F"; border = "1px solid #D97A34";
          }
          const opacity = beforeJourney || future ? 0.3 : 1;
          const todayBorder = isToday ? "2px solid #0F2A44" : border;
          return (
            <div key={i} className="flex items-center justify-center rounded-lg text-xs" style={{ width: 36, height: 36, background: bg, color, border: todayBorder, opacity, fontWeight: 500 }}>
              {c.n}
            </div>
          );
        })}
      </div>
      <div className="mt-3 space-y-1.5">
        {[
          { c: "#0F2A44", b: "none", l: "Protocol completed" },
          { c: "#D97A34", b: "none", l: "Partial completion" },
          { c: "#FFF4E8", b: "1px solid #D97A34", l: "Logged" },
          { c: "#FAF8F5", b: "1px solid #ECE6DC", l: "No activity" },
        ].map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "#6B6760" }}>
            <span style={{ width: 14, height: 14, background: it.c, border: it.b, borderRadius: 3 }} /> {it.l}
          </div>
        ))}
      </div>
    </div>
  );
}

function BodyMetricsEditor({
  latest,
  userId,
  profile,
  onSaved,
}: {
  latest: MetricsRow | undefined;
  userId: string | undefined;
  profile: { height_feet: number | null; height_inches: number | null; age: number | null } | null;
  onSaved: () => void;
}) {
  const [weight, setWeight] = useState<string>(latest ? String(latest.weight_lbs) : "");
  const [waist, setWaist] = useState<string>(latest ? String(latest.waist_inches) : "");
  const [activity, setActivity] = useState<ActivityLevel>(latest?.activity_level ?? "lightly_active");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (latest) {
      setWeight(String(latest.weight_lbs));
      setWaist(String(latest.waist_inches));
      setActivity(latest.activity_level);
    }
  }, [latest]);

  const save = async () => {
    if (!userId || !profile?.height_feet || !profile?.age) {
      toast.error("Complete your baseline first");
      return;
    }
    setSaving(true);
    const w = Number(weight), wa = Number(waist);
    const m = computeBaseline({
      age: profile.age,
      heightFeet: profile.height_feet,
      heightInches: profile.height_inches ?? 0,
      weightLbs: w,
      waistInches: wa,
      activity,
    });
    const { error } = await supabase.from("user_health_metrics").insert({
      user_id: userId,
      weight_lbs: w,
      waist_inches: wa,
      activity_level: activity,
      bmi: m.bmi,
      bmi_category: m.bmi_category,
      bmr_kcal: m.bmr_kcal,
      tdee_kcal: m.tdee_kcal,
      hydration_target_oz: m.hydration_target_oz,
      hr_max: m.hr_max,
      hr_moderate_low: m.hr_moderate_low,
      hr_moderate_high: m.hr_moderate_high,
      hr_vigorous_low: m.hr_vigorous_low,
      hr_vigorous_high: m.hr_vigorous_high,
      waist_risk_category: m.waist_risk_category,
    });
    await supabase.from("profiles").update({ weight_lbs: w, waist_inches: wa, activity_level: activity }).eq("id", userId);
    setSaving(false);
    setConfirming(false);
    if (error) { toast.error("Save failed"); return; }
    toast.success("Body metrics updated");
    onSaved();
  };

  return (
    <div className="p-4 rounded-[14px] bg-surface border border-border space-y-3">
      <Field label="Weight (lbs)"><input className="w-24 h-9 rounded-md border px-2 text-sm" style={{ borderColor: "#E8E2D9" }} value={weight} onChange={(e) => setWeight(e.target.value)} type="number" /></Field>
      <Field label="Waist (in)"><input className="w-24 h-9 rounded-md border px-2 text-sm" style={{ borderColor: "#E8E2D9" }} value={waist} onChange={(e) => setWaist(e.target.value)} type="number" /></Field>
      <Field label="Activity">
        <select className="h-9 rounded-md border px-2 text-sm" style={{ borderColor: "#E8E2D9" }} value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)}>
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>)}
        </select>
      </Field>
      <button onClick={() => setConfirming(true)} className="w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold mt-2">
        Update body metrics
      </button>
      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirming(false)}>
          <div className="bg-white rounded-xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-primary">Confirm update</h3>
            <p className="mt-2 text-sm" style={{ color: "#14181F" }}>
              Updating your body metrics will recalculate your personalized targets (hydration, calorie burn, heart rate zones). Continue?
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 h-10 rounded-md border" style={{ borderColor: "#E8E2D9", color: "#14181F" }}>Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 h-10 rounded-md bg-primary text-primary-foreground font-semibold disabled:opacity-60">
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "#14181F" }}>{label}</span>
      {children}
    </div>
  );
}

function buildWeeklySummary(scores: ScoreRow[], logs: LogRow[], completions: CompletionRow[], logCount: number): string {
  if (logCount < 7) return "Your weekly summary will appear after you've logged 7 days.";
  const cutoff7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const cutoff14 = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const recent = scores.filter((s) => s.score_date >= cutoff7);
  const prior = scores.filter((s) => s.score_date >= cutoff14 && s.score_date < cutoff7);
  const recentLogs = logs.filter((l) => l.log_date >= cutoff7);
  const avg = recent.length ? Math.round(recent.reduce((s, r) => s + r.score, 0) / recent.length) : 0;
  const sleep = recentLogs.filter((l) => l.sleep_hours != null);
  const avgSleep = sleep.length ? (sleep.reduce((s, l) => s + Number(l.sleep_hours), 0) / sleep.length).toFixed(1) : "—";
  // Real protocol completions: count distinct days in last 7 where every item was completed.
  const completedDays = completions.filter(
    (c) => c.completion_date >= cutoff7 && c.total_items > 0 && c.completed_items.length === c.total_items
  ).length;
  const priorAvg = prior.length ? prior.reduce((s, r) => s + r.score, 0) / prior.length : avg;
  const delta = Math.round(avg - priorAvg);
  let trend = "";
  if (delta > 2) trend = ` Your overall score improved by ${delta} compared to the previous week.`;
  else if (delta < -2) trend = ` Your overall score dropped by ${Math.abs(delta)} — focus on it this week.`;
  return `Your average score last week was ${avg}. You completed your full protocol on ${completedDays} of 7 days. Your sleep averaged ${avgSleep} hours.${trend}`;
}
