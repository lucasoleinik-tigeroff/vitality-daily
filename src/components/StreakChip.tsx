import { Flame } from "lucide-react";

const MILESTONES = new Set([7, 14, 21, 30, 60, 90]);

export function StreakChip({ count }: { count: number }) {
  if (count === 0) {
    return (
      <div
        className="inline-flex items-center rounded-full border"
        style={{
          height: 32,
          padding: "6px 12px",
          gap: 6,
          background: "#023048",
          borderColor: "#0E3A56",
        }}
      >
        <Flame size={16} color="#8FA8B8" />
        <span style={{ fontWeight: 700, fontSize: 14, color: "#8FA8B8" }}>0</span>
        <span style={{ fontWeight: 500, fontSize: 12, color: "#8FA8B8" }}>no streak yet</span>
      </div>
    );
  }
  const flameColor = MILESTONES.has(count) ? "#5C0101" : "#770101";
  const label = count === 1 ? "day streak" : "days streak";
  return (
    <div
      className="inline-flex items-center rounded-full border"
      style={{
        height: 32,
        padding: "6px 12px",
        gap: 6,
        background: "#0E3A56",
        borderColor: "#770101",
      }}
    >
      <Flame size={16} color={flameColor} />
      <span style={{ fontWeight: 700, fontSize: 14, color: "#770101" }}>{count}</span>
      <span style={{ fontWeight: 500, fontSize: 12, color: "#8FA8B8" }}>{label}</span>
    </div>
  );
}
