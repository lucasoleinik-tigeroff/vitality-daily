// Vitality Score calculation per VitalMan spec.

export type SleepQuality = "poor" | "ok" | "great";
export type StressLevel = "low" | "medium" | "high";

export interface ScoreInput {
  sleep_hours: number | null;
  sleep_quality: SleepQuality | null;
  stress_level: StressLevel | null;
  activity_minutes: number | null;
  hydration_oz: number | null;
  hydration_target_oz: number;
  supplement_taken: boolean | null;
}

export interface ScoreBreakdown {
  sleep: number;
  stress: number;
  activity: number;
  hydration: number;
  supplement: number;
  total: number;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

function sleepComponent(hours: number | null, quality: SleepQuality | null) {
  if (hours == null) return 0;
  let s: number;
  if (hours >= 7) s = 100;
  else if (hours >= 6) s = 75;
  else if (hours >= 5) s = 50;
  else s = 25;
  if (quality === "poor") s -= 10;
  else if (quality === "great") s += 10;
  return clamp(s);
}

function stressComponent(level: StressLevel | null) {
  if (level === "low") return 100;
  if (level === "medium") return 60;
  if (level === "high") return 30;
  return 0;
}

function activityComponent(min: number | null) {
  if (!min || min <= 0) return 0;
  if (min <= 15) return 50;
  if (min <= 30) return 75;
  return 100;
}

function hydrationComponent(oz: number | null, target: number) {
  if (!oz || target <= 0) return 0;
  const pct = (oz / target) * 100;
  if (pct >= 100) return 100;
  if (pct >= 75) return 80;
  if (pct >= 50) return 60;
  return 40;
}

function supplementComponent(taken: boolean | null) {
  return taken ? 100 : 50;
}

export function computeVitalityScore(input: ScoreInput): ScoreBreakdown {
  const sleep = sleepComponent(input.sleep_hours, input.sleep_quality);
  const stress = stressComponent(input.stress_level);
  const activity = activityComponent(input.activity_minutes);
  const hydration = hydrationComponent(input.hydration_oz, input.hydration_target_oz);
  const supplement = supplementComponent(input.supplement_taken);
  const total = Math.round(
    sleep * 0.35 + stress * 0.25 + activity * 0.2 + hydration * 0.1 + supplement * 0.1,
  );
  return { sleep, stress, activity, hydration, supplement, total };
}

export function scoreStatus(today: number, rolling7Avg: number): "improving" | "stable" | "needs_attention" {
  if (today < 60) return "needs_attention";
  if (today > rolling7Avg && today >= 60) return "improving";
  return "stable";
}

export function weakestMetric(b: ScoreBreakdown): "sleep" | "stress" | "activity" | "hydration" | "supplement" {
  const entries: Array<["sleep" | "stress" | "activity" | "hydration" | "supplement", number]> = [
    ["sleep", b.sleep],
    ["stress", b.stress],
    ["activity", b.activity],
    ["hydration", b.hydration],
    ["supplement", b.supplement],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}
