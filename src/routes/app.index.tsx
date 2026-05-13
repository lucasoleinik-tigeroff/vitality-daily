import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Moon, Activity, Droplet, Brain } from "lucide-react";
import { StreakChip } from "@/components/StreakChip";
import { todayIsoDate } from "@/lib/health";
import { computeVitalityScore, weakestMetric, type SleepQuality, type StressLevel } from "@/lib/score";
import { VitalityArc } from "@/components/VitalityArc";

export const Route = createFileRoute("/app/")({
  component: Home,
});

interface Profile {
  name: string | null;
  streak_count: number;
  journey_start_date: string;
  avatar_url: string | null;
}
interface Metrics { hydration_target_oz: number }
interface Log {
  sleep_hours: number | null;
  sleep_quality: string | null;
  stress_level: string | null;
  activity_minutes: number | null;
  hydration_oz: number | null;
  supplement_taken: boolean | null;
}
interface Score { score_date: string; score: number; status: string }

const METRIC_PRIORITY = ["sleep", "stress", "activity", "hydration", "supplement"] as const;

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [todayLog, setTodayLog] = useState<Log | null>(null);
  const [todayScore, setTodayScore] = useState<Score | null>(null);
  const [trend, setTrend] = useState<Score[]>([]);
  const [tip, setTip] = useState<{ title: string; body: string } | null>(null);
  const [hasAnyLog, setHasAnyLog] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = todayIsoDate();
      const [p, hm, dl, vs, lc] = await Promise.all([
        supabase.from("profiles").select("name,streak_count,journey_start_date,avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_health_metrics").select("hydration_target_oz").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("daily_logs").select("sleep_hours,sleep_quality,stress_level,activity_minutes,hydration_oz,supplement_taken").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
        supabase.from("vitality_scores").select("score_date,score,status").eq("user_id", user.id).order("score_date", { ascending: false }).limit(7),
        supabase.from("daily_logs").select("log_date", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (p.data) setProfile(p.data as Profile);
      if (hm.data) setMetrics(hm.data as Metrics);
      if (dl.data) setTodayLog(dl.data as Log);
      setHasAnyLog((lc.count ?? 0) > 0);
      if (vs.data) {
        const sorted = (vs.data as Score[]).slice().reverse();
        setTrend(sorted);
        const today0 = sorted.find((s) => s.score_date === today);
        if (today0) setTodayScore(today0);
      }

      // Determine weakest metric and fetch a matching tip.
      const hydrationTarget = (hm.data as Metrics | null)?.hydration_target_oz ?? 64;
      const log = dl.data as Log | null;
      let weakest: string = "general";
      if (log) {
        const breakdown = computeVitalityScore({
          sleep_hours: log.sleep_hours,
          sleep_quality: (log.sleep_quality as SleepQuality | null) ?? null,
          stress_level: (log.stress_level as StressLevel | null) ?? null,
          activity_minutes: log.activity_minutes,
          hydration_oz: log.hydration_oz,
          hydration_target_oz: hydrationTarget,
          supplement_taken: log.supplement_taken,
        });
        // Tie-break by priority order.
        const min = Math.min(...METRIC_PRIORITY.map((m) => breakdown[m]));
        weakest = METRIC_PRIORITY.find((m) => breakdown[m] === min) ?? weakestMetric(breakdown);
      }
      const targeted = await supabase.from("coach_tips").select("title,body").eq("status", "published").eq("target_metric", weakest).limit(1).maybeSingle();
      if (targeted.data) {
        setTip(targeted.data as { title: string; body: string });
      } else {
        const fallback = await supabase.from("coach_tips").select("title,body").eq("status", "published").eq("target_metric", "general").limit(1).maybeSingle();
        if (fallback.data) setTip(fallback.data as { title: string; body: string });
      }
    })();
  }, [user]);

  const dayOfJourney = profile
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.journey_start_date).getTime()) / 86400000) + 1)
    : 1;

  const score = hasAnyLog ? (todayScore?.score ?? null) : null;

  // Standardized daily hydration target.
  const hydrationTarget = 64;
  const hydrationCurrent = todayLog?.hydration_oz ?? 0;
  const sleepHours = todayLog?.sleep_hours ?? null;
  const stress = todayLog?.stress_level ?? null;
  const activityMin = todayLog?.activity_minutes ?? 0;

  return (
    <div className="px-5 pt-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight" style={{ letterSpacing: "-0.02em" }}>VitalMan</h1>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Men's Health Coach</p>
        </div>
        <div className="flex items-center gap-3">
          <StreakChip count={profile?.streak_count ?? 0} />
          <Link
            to="/app/settings"
            className="w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={16} color="var(--color-primary)" />
            )}
          </Link>
        </div>
      </div>


      {/* Vitality Score */}
      <div className="mt-5 p-5 rounded-[14px] bg-surface border border-border">
        <div className="section-label text-center">Vitality Score</div>
        <div className="mt-2">
          <VitalityArc score={score} journeyDay={dayOfJourney} />
        </div>
      </div>

      {/* 7-day trend */}
      <div className="mt-4 p-5 rounded-[14px] bg-surface border border-border">
        <div className="flex items-center justify-between">
          <div className="section-label">7-Day Trend</div>
          <div className="text-2xl font-bold text-foreground">{score ?? "—"}</div>
        </div>
        <TrendBars trend={trend} journeyStart={profile?.journey_start_date ?? null} today={todayIsoDate()} hasAnyLog={hasAnyLog} />
      </div>

      {/* Today's Metrics */}
      <div className="mt-4">
        <div className="section-label mb-2">Today's Metrics</div>
        <div className="grid grid-cols-2 gap-3">
          <MetricTile icon={Moon} label="Sleep" value={sleepHours != null ? `${sleepHours}h` : "—"} sub={todayLog?.sleep_quality ?? "Not logged"} />
          <MetricTile icon={Brain} label="Stress" value={stress ? capitalize(stress) : "—"} sub={stress === "low" ? "OK" : stress ? "" : "Not logged"} />
          <MetricTile icon={Activity} label="Activity" value={`${activityMin}m`} sub={activityMin > 0 ? "Logged" : "Not logged"} />
          <MetricTile icon={Droplet} label="Hydration" value={`${hydrationCurrent} / ${hydrationTarget} oz`} sub={`${Math.round((hydrationCurrent / hydrationTarget) * 100)}%`} />
        </div>
      </div>

      {/* Today's Protocol */}
      <ProtocolCard userId={user?.id ?? null} />

      {/* Coach Tip */}
      <div className="mt-4 p-5 rounded-[14px] bg-surface border border-border">
        <div className="section-label">Coach Tip</div>
        {tip ? (
          <>
            <h3 className="mt-2 text-base font-semibold text-foreground" style={{ fontWeight: 600, fontSize: 16 }}>{tip.title}</h3>
            <p className="mt-1 text-sm text-foreground leading-relaxed">{tip.body}</p>
          </>
        ) : (
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Your coach tips will appear here as you log your daily habits.</p>
        )}
      </div>

      <button
        onClick={() => navigate({ to: "/app/log" })}
        className="mt-5 w-full h-11 rounded-md bg-primary text-foreground-foreground font-semibold"
      >
        {todayLog ? "Update today's log" : "Log today"}
      </button>

    </div>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function MetricTile({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; label: string; value: string; sub: string }) {
  return (
    <Link to="/app/log" className="p-4 rounded-[14px] bg-surface border border-border block">
      <Icon size={22} color="var(--color-accent)" strokeWidth={1.75} />
      <div className="mt-1.5 section-label" style={{ fontSize: 10 }}>{label}</div>
      <div className="text-base font-bold text-foreground leading-tight">{value}</div>
      <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{sub}</div>
    </Link>
  );
}

function TrendBars({ trend, journeyStart, today, hasAnyLog }: { trend: Score[]; journeyStart: string | null; today: string; hasAnyLog: boolean }) {
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const days: { date: string; label: string; score: number | null; isToday: boolean; beforeJourney: boolean }[] = [];
  const todayDate = new Date(today + "T00:00:00");
  const startDate = journeyStart ? new Date(journeyStart + "T00:00:00") : null;
  const byDate = new Map(trend.map((t) => [t.score_date, t.score]));
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const beforeJourney = !!(startDate && d < startDate);
    days.push({
      date: iso,
      label: dayLabels[d.getDay()],
      score: byDate.get(iso) ?? null,
      isToday: iso === today,
      beforeJourney,
    });
  }

  return (
    <div className="mt-3">
      <div className="relative h-20">
        {/* Dashed reference line at score 75 (top:25%). */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: "25%", height: 0, borderTop: "1px dashed #252525" }}
        />
        <div className="relative flex items-end justify-between gap-2 h-full">
          {days.map((d, i) => {
            const hasData = !d.beforeJourney && d.score != null;
            if (!hasAnyLog || !hasData) {
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                  <div className="w-full h-full" />
                </div>
              );
            }
            const bg = d.isToday ? "var(--color-primary)" : "var(--color-border)";
            const heightPct = Math.max(4, d.score!);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full rounded-t"
                  style={{ height: `${heightPct}%`, background: bg, minHeight: "4px" }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        {days.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-muted-foreground">{d.label}</span>
        ))}
      </div>
      {!hasAnyLog && (
        <p className="mt-2 text-center" style={{ color: "#606060", fontSize: 13 }}>
          Start logging to build your trend.
        </p>
      )}
    </div>
  );
}

function ProtocolCard({ userId }: { userId: string | null }) {
  const [protocol, setProtocol] = useState<{ name: string; items: string[] } | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("assigned_protocol_id")
        .eq("id", userId)
        .maybeSingle();
      const assignedId = (p as { assigned_protocol_id: string | null } | null)?.assigned_protocol_id ?? null;
      const q = supabase.from("protocols").select("name,items").eq("status", "published");
      const { data } = assignedId
        ? await q.eq("id", assignedId).maybeSingle()
        : await q.eq("target_segment", "default").order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (data) setProtocol(data as { name: string; items: string[] });
    })();
  }, [userId]);

  return (
    <div className="mt-4 p-5 rounded-[14px] bg-surface border border-border">
      <div className="section-label">Today's Protocol</div>
      {protocol ? (
        <>
          <h3 className="mt-2 text-accent" style={{ fontWeight: 600, fontSize: 15 }}>{protocol.name}</h3>
          <ul className="mt-2 space-y-1.5">
            {protocol.items.map((it, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span style={{ color: "var(--color-text-secondary)" }}>{i + 1}.</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Your daily protocol will appear here once one is assigned by your coach.</p>
      )}
    </div>
  );
}
