import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

interface Kpi { label: string; value: number | string }

function Dashboard() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [recentSignups, setRecentSignups] = useState<{ created_at: string; email: string; name: string | null }[]>([]);

  useEffect(() => {
    (async () => {
      const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
      const [users, active, logs7, guides, tips] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("daily_logs").select("user_id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("daily_logs").select("id", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("guides").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("coach_tips").select("id", { count: "exact", head: true }).eq("status", "published"),
      ]);
      setKpis([
        { label: "Total users", value: users.count ?? 0 },
        { label: "Active (7d)", value: active.count ?? 0 },
        { label: "Logs (7d)", value: logs7.count ?? 0 },
        { label: "Published guides", value: guides.count ?? 0 },
        { label: "Published tips", value: tips.count ?? 0 },
      ]);
      const recent = await supabase
        .from("profiles")
        .select("created_at,email,name")
        .gte("created_at", since30)
        .order("created_at", { ascending: false })
        .limit(8);
      if (recent.data) setRecentSignups(recent.data);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
      <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-[14px] border p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: "#8FA8B8" }}>{k.label}</div>
            <div className="mt-1 text-2xl font-bold text-primary">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-[14px] border p-4" style={{ borderColor: "var(--color-border)" }}>
        <div className="font-semibold text-primary">Recent signups (30d)</div>
        <table className="w-full mt-3 text-sm">
          <thead><tr className="text-left" style={{ color: "#8FA8B8" }}>
            <th className="py-2">When</th><th>Email</th><th>Name</th>
          </tr></thead>
          <tbody>
            {recentSignups.map((r, i) => (
              <tr key={i} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.email}</td>
                <td>{r.name ?? "—"}</td>
              </tr>
            ))}
            {recentSignups.length === 0 && <tr><td colSpan={3} className="py-3 text-center" style={{ color: "#8FA8B8" }}>No recent signups.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
