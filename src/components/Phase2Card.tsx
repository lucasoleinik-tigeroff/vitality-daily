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

  const RED = "#C0392B";

  return (
    <div
      className="relative rounded-[14px] p-5"
      style={{ background: "#1A1A1A", border: `1.5px solid ${RED}` }}
    >
      <button onClick={dismiss} aria-label="Dismiss" className="absolute top-3 right-3">
        <X size={16} color="#B0B0B0" />
      </button>
      <span
        className="inline-block px-2.5 py-1 rounded-full"
        style={{
          background: RED,
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Phase 2 Ready
      </span>
      <h3 className="mt-3 leading-snug" style={{ color: "#F5F5F5", fontSize: "1.1rem", fontWeight: 700 }}>
        {data.product.headline}
      </h3>
      {data.product.subline && (
        <p className="mt-1" style={{ color: "#E8E8E8", fontSize: "0.9rem", fontWeight: 500 }}>
          {data.product.subline}
        </p>
      )}
      {!compact && (
        <p className="mt-2 leading-relaxed" style={{ color: "#E8E8E8", fontSize: "0.85rem" }}>
          {data.product.body_text}
        </p>
      )}
      <div
        className="mt-3"
        style={{ color: RED, fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
      >
        {data.product.product_name}
      </div>
      <button
        onClick={handleClick}
        disabled={!data.product.cta_url}
        className="mt-4 w-full h-11 rounded-md font-semibold text-[15px] disabled:opacity-60"
        style={{ background: RED, color: "#FFFFFF" }}
      >
        See My Phase 2 →
      </button>
      <p className="mt-3 text-center" style={{ color: "#B0B0B0", fontSize: 11 }}>
        Based on your 14-day data · Optional upgrade
      </p>
    </div>
  );
}
