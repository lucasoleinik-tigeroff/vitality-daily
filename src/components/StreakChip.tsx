import { Flame } from "lucide-react";

export function StreakChip({ count }: { count: number }) {
  const isZero = count === 0;
  const label = isZero ? "no streak yet" : count === 1 ? "day streak" : "days streak";
  return (
    <div
      className="inline-flex items-center rounded-full"
      style={{
        height: 32,
        padding: "6px 12px",
        gap: 6,
        background: isZero ? "var(--color-border)" : "var(--color-primary)",
      }}
    >
      <Flame size={16} color="var(--color-text-primary)" />
      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>{count}</span>
      <span style={{ fontWeight: 500, fontSize: 12, color: "var(--color-text-primary)", opacity: 0.85 }}>{label}</span>
    </div>
  );
}
