import { supabase } from "@/integrations/supabase/client";

export type Concern =
  | "sleep_recovery"
  | "stress_cognitive"
  | "metabolism_weight"
  | "hydration_metabolism"
  | "amplify";

export interface CrossSellResult {
  concern: Concern;
  product: {
    id: string;
    product_name: string;
    headline: string;
    subline: string;
    body_text: string;
    cta_url: string;
  };
}

const PRODUCTS: Record<Concern, CrossSellResult["product"]> = {
  sleep_recovery: {
    id: "breatheasex",
    product_name: "BreatheaseX",
    headline: "Your recovery window is broken.",
    subline: "Sleep starts with breath.",
    body_text:
      "Over 14 days, your sleep data shows you're not recovering fully. Your Phase 2 targets the root cause — respiratory and overnight recovery support.",
    cta_url: "BREATHEASEX_URL",
  },
  stress_cognitive: {
    id: "marobrain",
    product_name: "Marobrain",
    headline: "Chronic stress is your hidden blocker.",
    subline: "Your focus and memory are paying the price.",
    body_text:
      "Your logs show sustained high stress over 14 days. Elevated cortisol affects memory, focus, and vitality. Phase 2 targets cognitive resilience.",
    cta_url: "MAROBRAIN_URL",
  },
  metabolism_weight: {
    id: "lipotrine",
    product_name: "Lipotrine",
    headline: "Movement is your missing piece.",
    subline: "Your metabolism needs more than habit.",
    body_text:
      "Your activity data shows your metabolism needs support beyond routine. Phase 2 addresses what lifestyle changes alone can't fully reach.",
    cta_url: "LIPOTRINE_URL",
  },
  hydration_metabolism: {
    id: "lipobliss",
    product_name: "Lipobliss",
    headline: "Low hydration is slowing your metabolism.",
    subline: "Your cells are running below capacity.",
    body_text:
      "14 days of data shows your hydration is consistently low — a key driver of sluggish metabolism and weight retention. Phase 2 targets metabolic support from the inside out.",
    cta_url: "LIPOBLISS_URL",
  },
  amplify: {
    id: "vigorlong_prostafense",
    product_name: "VigorLong + Prostafense",
    headline: "You've built the foundation.",
    subline: "Time to amplify your protocol.",
    body_text:
      "Your habits are solid. Phase 2 delivers a more advanced support formula for men who've already built consistency. Add more firepower to your daily protocol.",
    cta_url: "VIGORLONG_PROSTAFENSE_URL",
  },
};

const CACHE = new Map<string, { at: number; value: CrossSellResult | null }>();
const TTL = 60 * 60 * 1000;

function mode<T extends string>(arr: (T | null)[]): T | null {
  const counts = new Map<T, number>();
  for (const v of arr) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: T | null = null;
  let bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { best = k; bestN = n; }
  return best;
}

export async function getCrossSell(userId: string): Promise<CrossSellResult | null> {
  const cached = CACHE.get(userId);
  if (cached && Date.now() - cached.at < TTL) return cached.value;

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("log_date,sleep_hours,sleep_quality,stress_level,activity_minutes,hydration_oz")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(14);

  if (!logs || logs.length < 14) {
    CACHE.set(userId, { at: Date.now(), value: null });
    return null;
  }

  const avgSleep = logs.reduce((s, l) => s + (Number(l.sleep_hours) || 0), 0) / logs.length;
  const poorSleepDays = logs.filter((l) => l.sleep_quality === "poor").length;
  const stressDom = mode(logs.map((l) => l.stress_level as string | null));
  const highStressDays = logs.filter((l) => l.stress_level === "high").length;
  const avgActivity = logs.reduce((s, l) => s + (l.activity_minutes ?? 0), 0) / logs.length;
  const avgHydration = logs.reduce((s, l) => s + (l.hydration_oz ?? 0), 0) / logs.length;

  let concern: Concern = "amplify";
  if (avgSleep < 6 || poorSleepDays >= 8) concern = "sleep_recovery";
  else if (stressDom === "high" && highStressDays >= 10) concern = "stress_cognitive";
  else if (avgActivity < 10) concern = "metabolism_weight";
  else if (avgHydration < 32) concern = "hydration_metabolism";

  const value: CrossSellResult = { concern, product: PRODUCTS[concern] };
  CACHE.set(userId, { at: Date.now(), value });
  return value;
}

export async function logImpression(userId: string, concern: Concern, productId: string) {
  await supabase.from("cross_sell_impressions").insert({ user_id: userId, concern, product_id: productId }).then(() => {}, () => {});
}

export async function logClick(userId: string, productId: string) {
  await supabase
    .from("cross_sell_impressions")
    .update({ clicked: true, clicked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("clicked", false)
    .then(() => {}, () => {});
}
