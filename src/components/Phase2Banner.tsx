import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { currentJourneyDay } from "@/lib/journey";

interface Props { userId: string; journeyStart: string | null }

export function Phase2Banner({ userId, journeyStart }: Props) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !journeyStart) return;
    const day = currentJourneyDay(journeyStart);
    if (day < 14) return;
    (async () => {
      const { data } = await supabase
        .from("phase2_notifications_sent")
        .select("user_id").eq("user_id", userId).maybeSingle();
      if (!data) setShow(true);
    })();
  }, [userId, journeyStart]);

  if (!show) return null;
  return (
    <button
      onClick={async () => {
        await supabase.from("phase2_notifications_sent").insert({ user_id: userId });
        setShow(false);
        navigate({ to: "/app/coach" });
      }}
      className="mt-3 w-full text-left px-4 py-3 rounded-[10px] flex items-center justify-between"
      style={{ background: "#D97A34", color: "white" }}
    >
      <span className="text-sm font-semibold">You've reached Day 14 — explore your Coach hub</span>
      <span className="text-sm">→</span>
    </button>
  );
}
