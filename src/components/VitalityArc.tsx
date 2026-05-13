import { useEffect, useState } from "react";

export type VitalityStatus = "Peak" | "Strong" | "Stable" | "Building" | "Low";

const STATUS_COLOR: Record<VitalityStatus, string> = {
  Peak: "var(--color-success)",
  Strong: "var(--color-success)",
  Stable: "var(--color-primary)",
  Building: "var(--color-warning)",
  Low: "var(--color-warning)",
};

export function statusFromScore(score: number | null): VitalityStatus | null {
  if (score == null) return null;
  if (score >= 90) return "Peak";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Stable";
  if (score >= 40) return "Building";
  return "Low";
}

interface Props {
  score: number | null;
  journeyDay: number;
}

// Build an SVG arc path that sweeps `sweepDeg` degrees, starting from the
// bottom-left and ending at the bottom-right (centered around the bottom).
function arcPath(cx: number, cy: number, r: number, sweepDeg: number): { d: string; length: number } {
  const startAngle = 90 + sweepDeg / 2; // degrees, measured from positive x-axis, going CW
  const endAngle = 90 - sweepDeg / 2;
  const toXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = toXY(startAngle);
  const end = toXY(endAngle);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  const length = (sweepDeg / 360) * 2 * Math.PI * r;
  return { d, length };
}

export function VitalityArc({ score, journeyDay }: Props) {
  const [animated, setAnimated] = useState(0);
  const status = statusFromScore(score);
  const safeScore = score ?? 0;

  useEffect(() => {
    setAnimated(0);
    if (score == null) return;
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setAnimated(safeScore * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, safeScore]);

  const sweep = 220;
  const { d, length } = arcPath(100, 110, 80, sweep);
  const dashFill = (animated / 100) * length;

  return (
    <div className="relative w-full flex flex-col items-center" style={{ minHeight: 220 }}>
      <svg viewBox="0 0 200 200" className="w-full max-w-[280px]" aria-hidden>
        <path d={d} stroke="#243044" strokeWidth={14} fill="none" strokeLinecap="round" />
        {score != null && (
          <path
            d={d}
            stroke="var(--color-primary)"
            strokeWidth={14}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dashFill} ${length}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 pointer-events-none">
        {score == null ? (
          <>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>
              —
            </div>
            <div className="mt-2 text-sm" style={{ color: "#8B9CB5" }}>
              Log to calculate
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>
              {Math.round(animated)}
            </div>
            {status && (
              <div
                className="mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                style={{ background: STATUS_COLOR[status], color: "var(--color-text-primary)" }}
              >
                {status}
              </div>
            )}
          </>
        )}
        <div className="mt-2 text-xs" style={{ color: "#8B9CB5" }}>
          Day {journeyDay} of your journey
        </div>
      </div>
    </div>
  );
}
