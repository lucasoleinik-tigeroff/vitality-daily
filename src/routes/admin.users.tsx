import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

interface Row { id: string; email: string; name: string | null; status: string; streak_count: number; journey_start_date: string | null; created_at: string }

function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    let qb = supabase.from("profiles").select("id,email,name,status,streak_count,journey_start_date,created_at").order("created_at", { ascending: false }).limit(200);
    if (q.trim()) qb = qb.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    const { data } = await qb;
    if (data) setRows(data as Row[]);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Users</h1>
      <div className="mt-3 flex gap-2">
        <input className="h-9 px-3 border rounded text-sm flex-1" style={{ borderColor: "var(--color-border)" }}
          placeholder="Search by email or name" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()} />
        <button onClick={load} className="px-3 h-9 rounded bg-primary text-primary-foreground text-sm">Search</button>
      </div>
      <div className="mt-4 bg-white border rounded-[14px]" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-sm">
          <thead><tr className="text-left" style={{ color: "#8FA8B8" }}>
            <th className="p-3">Email</th><th>Name</th><th>Status</th><th>Streak</th><th>Joined</th><th></th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="p-3">{r.email}</td>
                <td>{r.name ?? "—"}</td>
                <td>{r.status}</td>
                <td>{r.streak_count}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td><Link to="/admin/users/$id" params={{ id: r.id }} className="text-primary underline">View</Link></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-4 text-center" style={{ color: "#8FA8B8" }}>No users.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
