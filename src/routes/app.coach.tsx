import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ChevronRight, BookOpen, Search } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Phase2Card } from "@/components/Phase2Card";
import { currentJourneyDay, currentJourneyWeek } from "@/lib/journey";
import { computeVitalityScore, weakestMetric, type SleepQuality, type StressLevel } from "@/lib/score";
import { todayIsoDate } from "@/lib/health";

export const Route = createFileRoute("/app/coach")({
  component: CoachPage,
});

const PRIORITY = ["sleep", "stress", "activity", "hydration", "supplement"] as const;
const CATEGORIES = ["All", "Sleep", "Circulation", "Nutrition", "Stress", "Performance", "General"] as const;

interface Guide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  unlock_day: number;
  status: string;
  content_type: string;
}

function CoachPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ journey_start_date: string } | null>(null);
  const [tip, setTip] = useState<{ id: string; title: string; body: string; target_metric: string } | null>(null);
  const [message, setMessage] = useState<{ title: string; body: string } | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [logCount, setLogCount] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = todayIsoDate();
      const [p, m, log, ct, gs, lc] = await Promise.all([
        supabase.from("profiles").select("journey_start_date").eq("id", user.id).maybeSingle(),
        supabase.from("user_health_metrics").select("hydration_target_oz").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("daily_logs").select("sleep_hours,sleep_quality,stress_level,activity_minutes,hydration_oz,supplement_taken").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
        supabase.from("coach_tip_shows").select("tip_id,shown_at").eq("user_id", user.id).gte("shown_at", new Date(Date.now() - 5 * 86400000).toISOString()),
        supabase.from("guides").select("id,title,subtitle,description,category,cover_url,unlock_day,status,content_type").in("status", ["published", "coming_soon"]).order("unlock_day", { ascending: true }),
        supabase.from("daily_logs").select("log_date", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      if (p.data) setProfile(p.data as { journey_start_date: string });
      if (gs.data) setGuides(gs.data as Guide[]);
      setLogCount(lc.count ?? 0);

      const week = currentJourneyWeek(p.data?.journey_start_date);
      const wm = await supabase.from("coach_messages").select("title,body").eq("status", "published").eq("target_week", week).maybeSingle();
      setMessage(wm.data ?? { title: "Keep going", body: "You're building momentum. Check back next week for new guidance." });

      const hydrationTarget = m.data?.hydration_target_oz ?? 64;
      let weakest: string = "general";
      if (log.data) {
        const breakdown = computeVitalityScore({
          sleep_hours: log.data.sleep_hours,
          sleep_quality: (log.data.sleep_quality as SleepQuality | null) ?? null,
          stress_level: (log.data.stress_level as StressLevel | null) ?? null,
          activity_minutes: log.data.activity_minutes,
          hydration_oz: log.data.hydration_oz,
          hydration_target_oz: hydrationTarget,
          supplement_taken: log.data.supplement_taken,
        });
        const min = Math.min(...PRIORITY.map((k) => breakdown[k]));
        weakest = PRIORITY.find((k) => breakdown[k] === min) ?? weakestMetric(breakdown);
      }
      const recentIds = new Set((ct.data ?? []).map((r) => r.tip_id));
      let pickedTip: { id: string; title: string; body: string; target_metric: string } | null = null;
      for (const target of [weakest, "general"]) {
        const { data: tips } = await supabase.from("coach_tips").select("id,title,body,target_metric").eq("status", "published").eq("target_metric", target);
        const fresh = (tips ?? []).find((t) => !recentIds.has(t.id)) ?? (tips ?? [])[0];
        if (fresh) { pickedTip = fresh as typeof pickedTip; break; }
      }
      if (pickedTip) {
        setTip(pickedTip);
        await supabase.from("coach_tip_shows").insert({ user_id: user.id, tip_id: pickedTip.id });
      }
    })();
  }, [user]);

  const journeyDay = currentJourneyDay(profile?.journey_start_date);
  const eligible = logCount >= 14;

  const visibleGuides = useMemo(
    () => guides.filter((g) => g.status === "published" && g.unlock_day <= journeyDay),
    [guides, journeyDay]
  );

  const filteredBrowse = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleGuides.filter((g) => {
      if (category !== "All" && (g.category ?? "").toLowerCase() !== category.toLowerCase()) return false;
      if (!q) return true;
      return (g.title + " " + (g.subtitle ?? "")).toLowerCase().includes(q);
    });
  }, [visibleGuides, search, category]);

  const tipMetricLabel = tip ? tip.target_metric.charAt(0).toUpperCase() + tip.target_metric.slice(1) + " tip" : "";

  return (
    <div className="px-5 pt-5 pb-24">
      <h1 className="text-2xl font-bold text-primary" style={{ letterSpacing: "-0.02em" }}>Coach</h1>
      <p className="text-sm" style={{ color: "#6B6760" }}>Guidance and resources for your journey</p>
      <div className="mt-2 mb-5" style={{ width: 24, height: 2, background: "var(--color-accent)", borderRadius: 2 }} />

      {eligible && user && (
        <div className="mb-5">
          <Phase2Card userId={user.id} />
        </div>
      )}

      {/* Tip of the Day */}
      <SectionHeader label="Tip of the Day" />
      <div className="p-5 rounded-[14px] bg-surface border border-border">
        {tip ? (
          <>
            <h3 style={{ color: "#14181F", fontWeight: 600, fontSize: 17 }}>{tip.title}</h3>
            <p className="mt-2" style={{ color: "#14181F", fontSize: 15, lineHeight: 1.55 }}>{tip.body}</p>
            <span className="mt-3 inline-block px-2 py-0.5 rounded-full" style={{ background: "#FFF4E8", color: "#B8621F", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>
              {tipMetricLabel}
            </span>
          </>
        ) : (
          <p style={{ color: "#6B6760", fontSize: 14 }}>No tips available yet.</p>
        )}
      </div>

      {/* Weekly Message */}
      <div className="mt-5">
        <SectionHeader label="Message of the Week" />
        <div className="p-5 rounded-[14px] bg-surface border border-border">
          <div style={{ color: "#6B6760", fontSize: 12 }}>Week {currentJourneyWeek(profile?.journey_start_date)} of your journey</div>
          {message && (
            <>
              <h3 className="mt-1" style={{ color: "#14181F", fontWeight: 600, fontSize: 18 }}>{message.title}</h3>
              <p className="mt-2" style={{ color: "#14181F", fontSize: 15, lineHeight: 1.55 }}>{message.body}</p>
            </>
          )}
        </div>
      </div>

      {/* Your Guides — horizontal */}
      <div className="mt-5">
        <SectionHeader label="Your Guides" />
        {guides.length === 0 ? (
          <div className="p-5 rounded-[14px] bg-surface border border-border text-center" style={{ color: "#6B6760", fontSize: 14 }}>
            Guides will appear here as your journey unfolds.
          </div>
        ) : (
          <div className="-mx-5 px-5 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {guides.slice(0, 8).map((g) => (
              <GuideCard key={g.id} guide={g} journeyDay={journeyDay} />
            ))}
          </div>
        )}
      </div>

      {/* Browse All */}
      <div className="mt-6">
        <SectionHeader label="Browse All" />
        <div className="relative">
          <Search size={16} color="#8C8780" style={{ position: "absolute", left: 12, top: 12 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides..."
            className="w-full h-10 rounded-md border pl-9 pr-3 text-sm"
            style={{ background: "white", borderColor: "#E8E2D9", color: "#14181F" }}
          />
        </div>
        <div className="mt-3 -mx-5 px-5 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="px-3 h-8 rounded-full text-xs whitespace-nowrap"
                style={
                  active
                    ? { background: "var(--color-primary)", color: "white", fontWeight: 600 }
                    : { background: "white", border: "1px solid #E8E2D9", color: "#6B6760", fontWeight: 500 }
                }
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-[14px] bg-white border border-border overflow-hidden">
          {filteredBrowse.length === 0 ? (
            <div className="p-5 text-center" style={{ color: "#6B6760", fontSize: 14 }}>No guides match your filters.</div>
          ) : (
            filteredBrowse.map((g, i) => (
              <Link
                key={g.id}
                to="/app/coach/guide/$id"
                params={{ id: g.id }}
                className="flex items-center gap-3 p-3"
                style={{ borderTop: i === 0 ? "none" : "1px solid #ECE6DC" }}
              >
                <div className="w-14 h-[72px] rounded-lg overflow-hidden flex items-center justify-center" style={{ background: "#FAF8F5" }}>
                  {g.cover_url ? (
                    <img src={g.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={24} color="var(--color-accent)" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-primary truncate">{g.title}</div>
                  {g.subtitle && <div className="text-xs truncate" style={{ color: "#6B6760" }}>{g.subtitle}</div>}
                  {g.category && (
                    <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#FAF8F5", color: "#6B6760" }}>
                      {g.category}
                    </span>
                  )}
                </div>
                <ChevronRight size={18} color="#8C8780" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function GuideCard({ guide, journeyDay }: { guide: Guide; journeyDay: number }) {
  const locked = guide.status === "published" && guide.unlock_day > journeyDay;
  const comingSoon = guide.status === "coming_soon";
  const available = !locked && !comingSoon;

  const card = (
    <div
      className="rounded-xl bg-white border border-border overflow-hidden flex-shrink-0 flex flex-col"
      style={{ width: 240, height: 280 }}
    >
      <div className="w-full flex items-center justify-center" style={{ height: 140, background: "#FAF8F5" }}>
        {guide.cover_url ? (
          <img src={guide.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={40} color="var(--color-accent)" />
        )}
      </div>
      <div className="p-3.5 flex-1 flex flex-col">
        <div className="text-[15px] font-semibold text-primary line-clamp-2">{guide.title}</div>
        {guide.subtitle && (
          <div className="mt-1 text-[13px] line-clamp-2" style={{ color: "#6B6760" }}>{guide.subtitle}</div>
        )}
        <div className="mt-auto pt-2">
          {available && (
            <span className="px-2 py-1 rounded-full text-[10px]" style={{ background: "#FFF4E8", color: "#B8621F", fontWeight: 600, textTransform: "uppercase" }}>
              Available
            </span>
          )}
          {locked && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px]" style={{ background: "#FAF8F5", color: "#8C8780" }}>
              <Lock size={10} /> Unlocks at Day {guide.unlock_day}
            </span>
          )}
          {comingSoon && (
            <span className="px-2 py-1 rounded-full text-[10px]" style={{ background: "#FAF8F5", color: "#8C8780", fontWeight: 600, textTransform: "uppercase" }}>
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (available) return <Link to="/app/coach/guide/$id" params={{ id: guide.id }}>{card}</Link>;
  return <div onClick={() => alert(locked ? `This guide unlocks at Day ${guide.unlock_day}. Keep going.` : "Coming soon")}>{card}</div>;
}
