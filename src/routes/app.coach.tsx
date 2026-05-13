import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ChevronRight, ChevronLeft, BookOpen, Search } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { Phase2Card } from "@/components/Phase2Card";
import { currentJourneyDay, currentJourneyWeek } from "@/lib/journey";
import { computeVitalityScore, weakestMetric, type SleepQuality, type StressLevel } from "@/lib/score";
import { todayIsoDate } from "@/lib/health";
import { toast } from "sonner";

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
  external_url?: string | null;
  body_text?: string | null;
  file_url?: string | null;
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
  const [openGuide, setOpenGuide] = useState<Guide | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = todayIsoDate();
      const [p, m, log, ct, gs, lc] = await Promise.all([
        supabase.from("profiles").select("journey_start_date").eq("id", user.id).maybeSingle(),
        supabase.from("user_health_metrics").select("hydration_target_oz").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("daily_logs").select("sleep_hours,sleep_quality,stress_level,activity_minutes,hydration_oz,supplement_taken").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
        supabase.from("coach_tip_shows").select("tip_id,shown_at").eq("user_id", user.id).gte("shown_at", new Date(Date.now() - 5 * 86400000).toISOString()),
        supabase.from("guides").select("id,title,subtitle,description,category,cover_url,unlock_day,status,content_type,external_url,body_text,file_url").in("status", ["published", "coming_soon"]).order("unlock_day", { ascending: true }),
        supabase.from("daily_logs").select("log_date", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      if (p.data) setProfile(p.data as { journey_start_date: string });
      if (gs.data) setGuides(gs.data as Guide[]);
      setLogCount(lc.count ?? 0);

      const week = currentJourneyWeek(p.data?.journey_start_date);
      setMessage(weeklyMessage(week));

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
      type TipRow = { id: string; title: string; body: string; target_metric: string };
      const recentIds = new Set((ct.data ?? []).map((r) => r.tip_id));
      let pickedTip: TipRow | null = null;
      for (const target of [weakest, "general"]) {
        const { data: tips } = await supabase.from("coach_tips").select("id,title,body,target_metric").eq("status", "published").eq("target_metric", target);
        const list = (tips ?? []) as TipRow[];
        const fresh = list.find((t) => !recentIds.has(t.id)) ?? list[0];
        if (fresh) { pickedTip = fresh; break; }
      }
      if (pickedTip) {
        setTip(pickedTip);
        await supabase.from("coach_tip_shows").insert({ user_id: user.id, tip_id: pickedTip.id });
      }
    })();
  }, [user]);

  const journeyDay = currentJourneyDay(profile?.journey_start_date) || 0;
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

  const tipMetricLabel = tip
    ? tip.target_metric.charAt(0).toUpperCase() + tip.target_metric.slice(1) + " tip"
    : "";

  return (
    <>
      <div className="px-5 pt-5 pb-24">
        <h1 className="text-2xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>Coach</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Guidance and resources for your journey</p>
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
              <h3 style={{ color: "var(--color-text-foreground)", fontWeight: 600, fontSize: 17 }}>{tip.title}</h3>
              <p className="mt-2" style={{ color: "var(--color-text-foreground)", fontSize: 15, lineHeight: 1.55 }}>{tip.body}</p>
              <span className="mt-3 inline-block px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>
                {tipMetricLabel}
              </span>
            </>
          ) : (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>No tips available yet.</p>
          )}
        </div>

        {/* Weekly Message */}
        <div className="mt-5">
          <SectionHeader label="Message of the Week" />
          <div className="p-5 rounded-[14px] bg-surface border border-border">
            <div style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>
              Week {currentJourneyWeek(profile?.journey_start_date)} of your journey
            </div>
            {message && (
              <>
                <h3 className="mt-1" style={{ color: "var(--color-text-foreground)", fontWeight: 600, fontSize: 18 }}>{message.title}</h3>
                <p className="mt-2" style={{ color: "var(--color-text-foreground)", fontSize: 15, lineHeight: 1.55 }}>{message.body}</p>
              </>
            )}
          </div>
        </div>

        {/* Your Guides — horizontal scroll */}
        <div className="mt-5">
          <SectionHeader label="Your Guides" />
          {guides.length === 0 ? (
            <div className="p-5 rounded-[14px] bg-surface border border-border text-center" style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              Guides will appear here as your journey unfolds.
            </div>
          ) : (
            <div className="-mx-5 px-5 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {guides.slice(0, 8).map((g) => (
                <GuideCard key={g.id} guide={g} journeyDay={journeyDay} onOpen={setOpenGuide} />
              ))}
            </div>
          )}
        </div>

        {/* Browse All */}
        <div className="mt-6">
          <SectionHeader label="Browse All" />
          <div className="relative">
            <Search size={16} color="var(--color-text-secondary)" style={{ position: "absolute", left: 12, top: 12 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides..."
              className="w-full h-10 rounded-md border pl-9 pr-3 text-sm"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-foreground)" }}
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
                      : { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", fontWeight: 500 }
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-[14px] bg-card border border-border overflow-hidden">
            {filteredBrowse.length === 0 ? (
              <div className="p-5 text-center" style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                No guides match your filters.
              </div>
            ) : (
              filteredBrowse.map((g, i) => {
                const locked = g.unlock_day > journeyDay;
                const handleTap = () => {
                  if (locked) { toast(`Unlocks at Day ${g.unlock_day}. Keep going.`); return; }
                  setOpenGuide(g);
                };
                return (
                  <button
                    key={g.id}
                    onClick={handleTap}
                    className="w-full flex items-center gap-3 p-3 text-left cursor-pointer"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
                  >
                    <div className="w-14 h-[72px] rounded-lg overflow-hidden flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
                      {g.cover_url ? (
                        <img src={g.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen size={24} color="var(--color-accent)" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{g.title}</div>
                      {g.subtitle && (
                        <div className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>{g.subtitle}</div>
                      )}
                      {g.category && (
                        <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
                          {g.category}
                        </span>
                      )}
                    </div>
                    <ChevronRight size={18} color="var(--color-text-secondary)" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {openGuide && (
        <GuideModal guide={openGuide} userId={user?.id} onClose={() => setOpenGuide(null)} />
      )}
    </>
  );
}

function GuideCard({ guide, journeyDay, onOpen }: { guide: Guide; journeyDay: number; onOpen: (g: Guide) => void }) {
  const day = journeyDay || 0;
  const locked = guide.status === "published" && guide.unlock_day > day;
  const comingSoon = guide.status === "coming_soon";
  const available = !locked && !comingSoon;

  const handleTap = () => {
    if (comingSoon) { toast("Coming soon"); return; }
    if (locked) { toast(`Unlocks at Day ${guide.unlock_day}. Keep going.`); return; }
    onOpen(guide);
  };

  return (
    <div
      onClick={handleTap}
      role="button"
      tabIndex={0}
      className="rounded-xl bg-card border border-border overflow-hidden flex-shrink-0 flex flex-col cursor-pointer"
      style={{ width: 240, height: 280 }}
    >
      <div className="w-full flex items-center justify-center" style={{ height: 140, background: "var(--color-surface)" }}>
        {guide.cover_url ? (
          <img src={guide.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={40} color="var(--color-accent)" />
        )}
      </div>
      <div className="p-3.5 flex-1 flex flex-col">
        <div className="text-[15px] font-semibold text-foreground line-clamp-2">{guide.title}</div>
        {guide.subtitle && (
          <div className="mt-1 text-[13px] line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{guide.subtitle}</div>
        )}
        <div className="mt-auto pt-2">
          {available && (
            <span className="px-2 py-1 rounded-full text-[10px]" style={{ background: "rgba(61,170,110,0.15)", color: "var(--color-success)", border: "1px solid var(--color-success)", fontWeight: 600, textTransform: "uppercase" }}>
              Available
            </span>
          )}
          {locked && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px]" style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
              <Lock size={10} /> Unlocks at Day {guide.unlock_day}
            </span>
          )}
          {comingSoon && (
            <span className="px-2 py-1 rounded-full text-[10px]" style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GuideModal({ guide, userId, onClose }: { guide: Guide; userId: string | undefined; onClose: () => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.history.pushState({ guideModal: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.guideModal) window.history.back();
    };
  }, [onClose]);

  useEffect(() => {
    if (guide.content_type !== "pdf" || !guide.file_url) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.storage.from("guides").createSignedUrl(guide.file_url!, 3600);
      setSignedUrl(data?.signedUrl ?? null);
      setLoading(false);
    })();
  }, [guide]);

  const markRead = async () => {
    if (!userId || saving) return;
    setSaving(true);
    await supabase.from("guide_access").upsert(
      { user_id: userId, guide_id: guide.id },
      { onConflict: "user_id,guide_id" } as never
    );
    setSaving(false);
    toast.success("Marked as read");
    onClose();
  };

  const isLinkCard = guide.content_type === "link" && !!guide.external_url;
  const openLink = () => guide.external_url && window.open(guide.external_url, "_blank", "noopener,noreferrer");

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 50, background: "#0A0A0A" }}>
      {/* Top bar */}
      <div className="flex items-center px-3" style={{ height: 56, background: "#141414", borderBottom: "1px solid #252525", flexShrink: 0 }}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1">
          <ChevronLeft size={24} color="#F5F5F5" />
        </button>
        <div className="flex-1 text-center px-3 truncate" style={{ fontWeight: 600, fontSize: 16, color: "#F5F5F5" }}>
          {guide.title}
        </div>
        <div style={{ width: 32 }} />
      </div>

      {/* Body */}
      <div
        onClick={isLinkCard ? openLink : undefined}
        role={isLinkCard ? "button" : undefined}
        tabIndex={isLinkCard ? 0 : undefined}
        className={`flex-1 flex flex-col items-center justify-center p-8 gap-8 ${isLinkCard ? "cursor-pointer" : ""}`}
      >
        {/* Book icon as cover placeholder */}
        <div className="flex items-center justify-center rounded-2xl" style={{ width: 120, height: 160, background: "#1E1E1E", border: "1px solid #252525" }}>
          {guide.cover_url
            ? <img src={guide.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} />
            : <BookOpen size={48} color="#C0392B" />
          }
        </div>

        {/* Info */}
        <div className="text-center" style={{ maxWidth: 340 }}>
          <h2 style={{ color: "#F5F5F5", fontWeight: 700, fontSize: 20 }}>{guide.title}</h2>
          {guide.subtitle && <p className="mt-1" style={{ color: "#ABABAB", fontSize: 14 }}>{guide.subtitle}</p>}
          {guide.description && <p className="mt-3" style={{ color: "#ABABAB", fontSize: 14, lineHeight: 1.6 }}>{guide.description}</p>}
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3" style={{ maxWidth: 360 }}>
          {guide.content_type === "pdf" && (
            <button
              onClick={() => signedUrl && window.open(signedUrl, "_blank", "noopener,noreferrer")}
              disabled={loading || !signedUrl}
              className="w-full h-12 rounded-lg font-semibold disabled:opacity-50"
              style={{ background: "#C0392B", color: "white", fontSize: 15 }}
            >
              {loading ? "Loading..." : "Read Guide"}
            </button>
          )}

          {guide.content_type === "link" && (
            <button
              onClick={() => guide.external_url && window.open(guide.external_url, "_blank", "noopener,noreferrer")}
              disabled={!guide.external_url}
              className="w-full h-12 rounded-lg font-semibold disabled:opacity-50"
              style={{ background: "#C0392B", color: "white", fontSize: 15 }}
            >
              Open in browser
            </button>
          )}

          {guide.content_type === "text" && guide.body_text && (
            <div className="w-full overflow-y-auto prose prose-invert prose-sm text-left" style={{ color: "#F5F5F5", maxHeight: 300 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.body_text}</ReactMarkdown>
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); markRead(); }}
            disabled={saving}
            className="w-full h-12 rounded-lg font-semibold disabled:opacity-50"
            style={{ background: "transparent", color: "#ABABAB", border: "1px solid #252525", fontSize: 15 }}
          >
            {saving ? "Saving..." : "Mark as read"}
          </button>
        </div>
      </div>
    </div>
  );
}

function weeklyMessage(week: number): { title: string; body: string } {
  if (week <= 1) return {
    title: "Week 1: Build the Habit",
    body: "Show up every day, even when you don't feel like it. The first 7 days are the hardest — and the most important. Your only job this week is to log.",
  };
  if (week === 2) return {
    title: "Week 2: Hydration is the First Domino",
    body: "When you drink enough, everything else gets easier. Energy improves. Sleep improves. Focus sharpens. Hit 64 oz every single day this week.",
  };
  if (week === 3) return {
    title: "Week 3: Protect Your Recovery Window",
    body: "Sleep is not rest — it's repair. Cortisol drops, testosterone rebuilds, and cells regenerate only during quality sleep. Lights out by 10:30pm this week.",
  };
  return {
    title: "Week 4: Consistency Over Perfection",
    body: "You've built the foundation. A 90% week beats a missed week every time. Don't break the chain — keep logging, keep moving.",
  };
}
