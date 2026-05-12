import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getCrossSell, logImpression, logClick, type CrossSellResult } from "@/lib/crossSell";
import { WhyAmISeeingThisModal } from "./WhyAmISeeingThisModal";

const DISMISS_KEY = "vm_phase2_dismiss";

export function Phase2Card({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const [data, setData] = useState<CrossSellResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  });
  const [whyOpen, setWhyOpen] = useState(false);
  const [impressed, setImpressed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCrossSell(userId).then((r) => {
      if (cancelled) return;
      setData(r);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (data && !impressed && !dismissed) {
      logImpression(userId, data.concern, data.product.id).catch(() => {});
      setImpressed(true);
    }
  }, [data, impressed, dismissed, userId]);

  if (!loaded || !data || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const handleClick = () => {
    logClick(userId, data.product.id).catch(() => {});
    if (data.product.cta_url) window.open(data.product.cta_url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div
        className="relative rounded-[14px] p-5"
        style={{ background: "#0E3A56", border: "1.5px solid #770101" }}
      >
        <button onClick={dismiss} aria-label="Dismiss" className="absolute top-3 right-3"><X size={16} color="#8FA8B8" /></button>
        <span
          className="inline-block px-2.5 py-1 rounded-full text-white"
          style={{ background: "#5C0101", fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          Phase 2 Ready
        </span>
        <h3 className={`mt-3 font-bold leading-snug ${compact ? "text-base" : "text-lg"}`} style={{ color: "#F0EDDE" }}>
          {data.product.headline}
        </h3>
        {!compact && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "#F0EDDE" }}>{data.product.body_text}</p>
        )}
        <div
          className="mt-3"
          style={{ color: "#8FA8B8", fontWeight: 600, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          {data.product.product_name}
        </div>
        <button
          onClick={handleClick}
          disabled={!data.product.cta_url}
          className="mt-4 w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold text-[15px] disabled:opacity-60"
        >
          See My Phase 2
        </button>
        <p className="mt-3 text-center" style={{ color: "#8FA8B8", fontSize: 11 }}>
          Based on your 14-day data · Optional upgrade
        </p>
        <button
          onClick={() => setWhyOpen(true)}
          className="mt-1 w-full text-center underline"
          style={{ color: "#8FA8B8", fontWeight: 500, fontSize: 11 }}
        >
          Why am I seeing this?
        </button>
      </div>
      <WhyAmISeeingThisModal open={whyOpen} onClose={() => setWhyOpen(false)} />
    </>
  );
}
