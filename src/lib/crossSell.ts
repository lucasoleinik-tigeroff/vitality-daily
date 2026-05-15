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

  console.log("[crossSell] userId:", userId, "logs found in last 14:", logs?.length ?? 0);

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

  console.log("[crossSell] computed concern:", concern, {
    avgSleep, poorSleepDays, stressDom, highStressDays, avgActivity, avgHydration,
  });

  const { data: product, error } = await supabase
    .from("cross_sell_products")
    .select("id,product_name,headline,body_text,cta_url,active")
    .eq("concern", concern)
    .eq("active", true)
    .maybeSingle();

  console.log("[crossSell] fetched product:", product, error);

  if (!product || !product.cta_url || product.cta_url.trim() === "") {
    CACHE.set(userId, { at: Date.now(), value: null });
    return null;
  }

  const value: CrossSellResult = {
    concern,
    product: {
      id: product.id,
      product_name: product.product_name,
      headline: product.headline,
      subline: "",
      body_text: product.body_text,
      cta_url: product.cta_url,
    },
  };
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
