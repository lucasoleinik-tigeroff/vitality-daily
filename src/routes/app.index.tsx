import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Moon, Activity, Droplet, Brain } from "lucide-react";
import { LegalModal } from "@/components/LegalModals";
import { todayIsoDate } from "@/lib/health";

export const Route = createFileRoute("/app/")({
  component: Home,
});

interface Profile {
  name: string | null;
  streak_count: number;
  journey_start_date: string;
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

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [todayLog, setTodayLog] = useState<Log | null>(null);
  const [todayScore, setTodayScore] = useState<Score | null>(null);
  const [trend, setTrend] = useState<Score[]>([]);
  const [tip, setTip] = useState<{ title: string; body: string } | null>(null);
  const [legal, setLegal] = useState<"medical" | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = todayIsoDate();
      const [p, hm, dl, vs, tipRes] = await Promise.all([
        supabase.from("profiles").select("name,streak_count,journey_start_date").eq("id", user.id).maybeSingle(),
        supabase.from("user_health_metrics").select("hydration_target_oz").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("daily_logs").select("sleep_hours,sleep_quality,stress_level,activity_minutes,hydration_oz,supplement_taken").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
        supabase.from("vitality_scores").select("score_date,score,status").eq("user_id", user.id).order("score_date", { ascending: false }).limit(7),
        supabase.from("coach_tips").select("title,body").eq("status", "published").limit(1).maybeSingle(),
      ]);
      if (p.data) setProfile(p.data as Profile);
      if (hm.data) setMetrics(hm.data as Metrics);
      if (dl.data) setTodayLog(dl.data as Log);
      if (vs.data) {
        const sorted = (vs.data as Score[]).slice().reverse();
        setTrend(sorted);
        const today0 = sorted.find((s) => s.score_date === today);
        if (today0) setTodayScore(today0);
      }
      if (tipRes.data) setTip(tipRes.data as { title: string; body: string });
    })();
  }, [user]);

  const dayOfJourney = profile
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.journey_start_date).getTime()) / 86400000) + 1)
    : 1;

  const score = todayScore?.score ?? null;
  const status = todayScore?.status ?? "stable";

  const hydrationTarget = metrics?.hydration_target_oz ?? 64;
  const hydrationCurrent = todayLog?.hydration_oz ?? 0;
  const sleepHours = todayLog?.sleep_hours ?? null;
  const stress = todayLog?.stress_level ?? null;
  const activityMin = todayLog?.activity_minutes ?? 0;

  const statusLabel = status === "improving" ? "Improving" : status === "needs_attention" ? "Needs Attention" : "Stable";
  const statusColor = status === "improving" ? "var(--color-success)" : status === "needs_attention" ? "var(--color-warning)" : "var(--color-accent)";

  return (
    <div className="px-5 pt-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight">VitalMan</h1>
          <p className="text-xs text-muted-foreground">Men's Health Coach</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface border border-border">
            {profile?.streak_count ?? 0}d streak
          </span>
          <Link to="/app/settings" className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
            <UserIcon size={18} color="var(--color-primary)" />
          </Link>
        </div>
      </div>

      {/* Vitality Score */}
      <div className="mt-5 p-5 rounded-xl bg-surface border border-border text-center">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Vitality Score</div>
        <div className="mt-2 text-6xl font-bold text-primary leading-none">{score ?? "—"}</div>
        <div className="mt-3 text-sm text-muted-foreground">Today's Score</div>
        <div className="mt-2 inline-block text-xs font-semibold px-3 py-1 rounded-full" style={{ background: statusColor, color: "white" }}>
          {statusLabel}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Day {dayOfJourney} of your journey</div>
      </div>

      {/* 7-day trend */}
      <div className="mt-4 p-4 rounded-xl bg-surface border border-border">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">7-Day Trend</div>
          <div className="text-2xl font-bold text-primary">{score ?? "—"}</div>
        </div>
        <TrendBars trend={trend} />
      </div>

      {/* Today's Metrics */}
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Today's Metrics</div>
        <div className="grid grid-cols-2 gap-3">
          <MetricTile icon={Moon} label="Sleep" value={sleepHours != null ? `${sleepHours}h` : "—"} sub={todayLog?.sleep_quality ?? "Not logged"} />
          <MetricTile icon={Brain} label="Stress" value={stress ? capitalize(stress) : "—"} sub={stress === "low" ? "OK" : stress ? "" : "Not logged"} />
          <MetricTile icon={Activity} label="Activity" value={`${activityMin}m`} sub={activityMin > 0 ? "Logged" : "Not logged"} />
          <MetricTile icon={Droplet} label="Hydration" value={`${hydrationCurrent} / ${hydrationTarget} oz`} sub={`${Math.round((hydrationCurrent / hydrationTarget) * 100)}%`} />
        </div>
      </div>

      {/* Today's Protocol — placeholder until protocols table seeded */}
      <ProtocolCard />

      {/* Coach Tip */}
      <div className="mt-4 p-4 rounded-xl bg-surface border border-border">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Coach Tip</div>
        {tip ? (
          <>
            <h3 className="mt-2 text-base font-semibold text-primary">{tip.title}</h3>
            <p className="mt-1 text-sm text-foreground leading-relaxed">{tip.body}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Your coach tips will appear here as you log your daily habits.</p>
        )}
      </div>

      <button onClick={() => navigate({ to: "/app/log" })} className="mt-5 w-full h-11 rounded-md border-2 border-primary text-primary font-semibold">
        {todayLog ? "Update today's log" : "Log today"}
      </button>

      <button onClick={() => setLegal("medical")} className="mt-6 w-full text-center text-xs text-muted-foreground underline">
        Medical Disclaimer
      </button>

      <LegalModal type={legal} onClose={() => setLegal(null)} />
    </div>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function MetricTile({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string; value: string; sub: string }) {
  return (
    <Link to="/app/log" className="p-3 rounded-xl bg-surface border border-border block">
      <Icon size={20} color="var(--color-accent)" />
      <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-bold text-primary leading-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </Link>
  );
}

function TrendBars({ trend }: { trend: Score[] }) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const padded = Array.from({ length: 7 }, (_, i) => trend[i]?.score ?? 0);
  const last = trend[trend.length - 1]?.score ?? 0;
  return (
    <div className="mt-3 flex items-end justify-between gap-2 h-20">
      {padded.map((v, i) => {
        const isToday = i === padded.length - 1 && last > 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{
              height: `${Math.max(4, v)}%`,
              background: isToday ? "var(--color-primary)" : "var(--color-accent)",
              opacity: isToday ? 1 : 0.4,
              minHeight: "4px",
            }} />
            <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProtocolCard() {
  // Phase 1: render an empty state until protocols are seeded by admin (Phase 3)
  return (
    <div className="mt-4 p-4 rounded-xl bg-surface border border-border">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Today's Protocol</div>
      <p className="mt-2 text-sm text-muted-foreground">Your daily protocol will appear here once one is assigned by your coach.</p>
    </div>
  );
}
