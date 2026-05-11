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
          background: "#FAF8F5",
          borderColor: "#E8E2D9",
        }}
      >
        <Flame size={16} color="#8C8780" />
        <span style={{ fontWeight: 700, fontSize: 14, color: "#6B6760" }}>0</span>
        <span style={{ fontWeight: 500, fontSize: 12, color: "#6B6760" }}>no streak yet</span>
      </div>
    );
  }
  const flameColor = MILESTONES.has(count) ? "#B8621F" : "#D97A34";
  const label = count === 1 ? "day streak" : "days streak";
  return (
    <div
      className="inline-flex items-center rounded-full border"
      style={{
        height: 32,
        padding: "6px 12px",
        gap: 6,
        background: "#FFF4E8",
        borderColor: "#D97A34",
      }}
    >
      <Flame size={16} color={flameColor} />
      <span style={{ fontWeight: 700, fontSize: 14, color: "#0F2A44" }}>{count}</span>
      <span style={{ fontWeight: 500, fontSize: 12, color: "#6B6760" }}>{label}</span>
    </div>
  );
}
