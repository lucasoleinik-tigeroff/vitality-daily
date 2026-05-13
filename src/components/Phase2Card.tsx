import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getCrossSell, logImpression, logClick, type CrossSellResult } from "@/lib/crossSell";

const DISMISS_KEY = "vm_phase2_dismiss";

export function Phase2Card({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const [data, setData] = useState<CrossSellResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  });
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

  const GOLD = "#C8973A";
  const DARK = "#0F1923";

  return (
    <>
      <div className="relative rounded-[14px] p-5" style={{ background: GOLD, color: DARK }}>
        <button onClick={dismiss} aria-label="Dismiss" className="absolute top-3 right-3">
          <X size={16} color={DARK} />
        </button>
        <span
          className="inline-block px-2.5 py-1 rounded-full"
          style={{
            background: DARK,
            color: GOLD,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Phase 2 Ready
        </span>
        <h3 className="mt-3 font-bold leading-snug" style={{ color: DARK, fontSize: "1.1rem" }}>
          {data.product.headline}
        </h3>
        <p className="mt-1" style={{ color: DARK, fontSize: "0.9rem", fontWeight: 500, opacity: 0.85 }}>
          {data.product.subline}
        </p>
        {!compact && (
          <p className="mt-2 leading-relaxed" style={{ color: DARK, fontSize: "0.85rem" }}>
            {data.product.body_text}
          </p>
        )}
        <div
          className="mt-3"
          style={{ color: DARK, fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
        >
          {data.product.product_name}
        </div>
        <button
          onClick={handleClick}
          disabled={!data.product.cta_url}
          className="mt-4 w-full h-11 rounded-md font-semibold text-[15px] disabled:opacity-60"
          style={{ background: DARK, color: GOLD }}
        >
          See My Phase 2 →
        </button>
        <p className="mt-3 text-center" style={{ color: DARK, fontSize: 11, opacity: 0.7 }}>
          Based on your 14-day data · Optional upgrade
        </p>
        <button
          onClick={() => setWhyOpen(true)}
          className="mt-1 w-full text-center underline"
          style={{ color: DARK, fontWeight: 500, fontSize: 11, opacity: 0.7 }}
        >
          Why am I seeing this?
        </button>
      </div>
      <WhyAmISeeingThisModal open={whyOpen} onClose={() => setWhyOpen(false)} />
    </>
  );
}
