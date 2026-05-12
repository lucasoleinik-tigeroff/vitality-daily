import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/admin";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/admin/users/$id")({
  component: UserDetail,
});

interface Profile {
  id: string; email: string; name: string | null; status: string;
  streak_count: number; journey_start_date: string | null; created_at: string;
  age: number | null; weight_lbs: number | null; waist_inches: number | null;
  main_concern: string | null; main_goal: string | null;
}
interface Log { log_date: string; sleep_hours: number | null; activity_minutes: number | null; hydration_oz: number | null }

function UserDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [accessCount, setAccessCount] = useState(0);

  async function load() {
    const [p, l, ga] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("daily_logs").select("log_date,sleep_hours,activity_minutes,hydration_oz").eq("user_id", id).order("log_date", { ascending: false }).limit(30),
      supabase.from("guide_access").select("id", { count: "exact", head: true }).eq("user_id", id),
    ]);
    if (p.data) setProfile(p.data as Profile);
    if (l.data) setLogs(l.data as Log[]);
    setAccessCount(ga.count ?? 0);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function setStatus(status: "active" | "suspended" | "deleted") {
    if (!user || !profile) return;
    if (!confirm(`Set status to "${status}"?`)) return;
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logAdminAction(user.id, { action: "update_status", entity_type: "user", entity_id: id, details: { status } });
    toast.success(`Status set to ${status}`);
    load();
  }

  if (!profile) return <div className="text-sm" style={{ color: "#8FA8B8" }}>Loading…</div>;

  return (
    <div>
      <Link to="/admin/users" className="text-sm flex items-center gap-1 text-primary"><ChevronLeft size={14}/> Back to users</Link>
      <h1 className="mt-2 text-2xl font-bold text-primary">{profile.name ?? profile.email}</h1>
      <div className="text-sm" style={{ color: "#8FA8B8" }}>{profile.email}</div>

      <div className="mt-5 grid md:grid-cols-3 gap-4">
        <Card label="Status" value={profile.status}/>
        <Card label="Streak" value={String(profile.streak_count)}/>
        <Card label="Joined" value={new Date(profile.created_at).toLocaleDateString()}/>
        <Card label="Journey start" value={profile.journey_start_date ?? "—"}/>
        <Card label="Main concern" value={profile.main_concern ?? "—"}/>
        <Card label="Main goal" value={profile.main_goal ?? "—"}/>
        <Card label="Age" value={profile.age?.toString() ?? "—"}/>
        <Card label="Weight (lbs)" value={profile.weight_lbs?.toString() ?? "—"}/>
        <Card label="Waist (in)" value={profile.waist_inches?.toString() ?? "—"}/>
        <Card label="Guides accessed" value={String(accessCount)}/>
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={() => setStatus("active")} className="px-3 h-9 rounded border text-sm" style={{ borderColor: "var(--color-border)" }}>Activate</button>
        <button onClick={() => setStatus("suspended")} className="px-3 h-9 rounded border text-sm" style={{ borderColor: "var(--color-border)", color: "#770101" }}>Suspend</button>
        <button onClick={() => setStatus("deleted")} className="px-3 h-9 rounded border text-sm" style={{ borderColor: "var(--color-border)", color: "#dc2626" }}>Soft-delete</button>
      </div>

      <div className="mt-6 bg-white border rounded-[14px] p-4" style={{ borderColor: "var(--color-border)" }}>
        <div className="font-semibold text-primary">Recent logs</div>
        <table className="w-full mt-3 text-sm">
          <thead><tr className="text-left" style={{ color: "#8FA8B8" }}><th className="py-2">Date</th><th>Sleep</th><th>Activity</th><th>Hydration</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.log_date} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="py-2">{l.log_date}</td>
                <td>{l.sleep_hours ?? "—"}</td>
                <td>{l.activity_minutes ?? 0}m</td>
                <td>{l.hydration_oz ?? 0}oz</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} className="py-3 text-center" style={{ color: "#8FA8B8" }}>No logs yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-[14px] p-4" style={{ borderColor: "var(--color-border)" }}>
      <div className="text-xs uppercase tracking-wide" style={{ color: "#8FA8B8" }}>{label}</div>
      <div className="mt-1 text-base font-semibold text-primary">{value}</div>
    </div>
  );
}
