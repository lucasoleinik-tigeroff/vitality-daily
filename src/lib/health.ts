// VitalMan health calculations. All inputs imperial; metric only used internally.

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active";

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly active",
  moderately_active: "Moderately active",
  very_active: "Very active",
};

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};

export function calcBmi(weightLbs: number, heightFeet: number, heightInches: number) {
  const totalIn = heightFeet * 12 + heightInches;
  const bmi = (weightLbs * 703) / (totalIn * totalIn);
  return Math.round(bmi * 10) / 10;
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obesity Class I";
  if (bmi < 40) return "Obesity Class II";
  return "Obesity Class III";
}

export function calcBmrTdee(
  weightLbs: number,
  heightFeet: number,
  heightInches: number,
  age: number,
  activity: ActivityLevel,
) {
  const weightKg = weightLbs * 0.453592;
  const heightCm = (heightFeet * 12 + heightInches) * 2.54;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const tdee = bmr * ACTIVITY_MULTIPLIER[activity];
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee / 10) * 10,
  };
}

export function calcHydrationOz(_weightLbs: number, _activityMinutes = 0) {
  // Standardized daily water target across the app.
  return 64;
}

export function calcHrZones(age: number) {
  const hrMax = Math.round(208 - 0.7 * age);
  return {
    hr_max: hrMax,
    hr_moderate_low: Math.round(hrMax * 0.5),
    hr_moderate_high: Math.round(hrMax * 0.7),
    hr_vigorous_low: Math.round(hrMax * 0.7),
    hr_vigorous_high: Math.round(hrMax * 0.85),
  };
}

export function waistRiskCategory(waistInches: number): string {
  if (waistInches < 37) return "Low risk";
  if (waistInches < 40) return "Increased risk";
  return "High risk";
}

// Display-only swap for BMI category. The DB and computeBaseline keep the
// medical label; UIs render this friendlier copy.
export function bmiCategoryLabel(category: string): string {
  return category === "Overweight" ? "Opportunity Zone" : category;
}

export function computeBaseline(input: {
  weightLbs: number;
  heightFeet: number;
  heightInches: number;
  waistInches: number | null;
  age: number;
  activity: ActivityLevel;
}) {
  const bmi = calcBmi(input.weightLbs, input.heightFeet, input.heightInches);
  const { bmr, tdee } = calcBmrTdee(
    input.weightLbs,
    input.heightFeet,
    input.heightInches,
    input.age,
    input.activity,
  );
  return {
    bmi,
    bmi_category: bmiCategory(bmi),
    bmr_kcal: bmr,
    tdee_kcal: tdee,
    hydration_target_oz: calcHydrationOz(input.weightLbs),
    ...calcHrZones(input.age),
    waist_risk_category:
      input.waistInches != null ? waistRiskCategory(input.waistInches) : null,
  };
}

export function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatLongDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
