import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogs,
});

interface Row { id: string; created_at: string; admin_user_id: string; action: string; entity_type: string | null; entity_id: string | null; details: unknown }

const PAGE = 50;

function AdminLogs() {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const from = page * PAGE;
      const { data, count } = await supabase
        .from("admin_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (data) setRows(data as Row[]);
      if (count != null) setTotal(count);
    })();
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Audit Logs</h1>
      <div className="text-sm mt-1" style={{ color: "#6B6760" }}>{total} total entries</div>
      <div className="mt-4 bg-white border rounded-[14px]" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-sm">
          <thead><tr className="text-left" style={{ color: "#6B6760" }}>
            <th className="p-3">When</th><th>Admin</th><th>Action</th><th>Entity</th><th>Details</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="font-mono text-xs">{r.admin_user_id.slice(0, 8)}</td>
                <td>{r.action}</td>
                <td>{r.entity_type ?? "—"} {r.entity_id ? <span className="font-mono text-xs">({r.entity_id.slice(0,8)})</span> : null}</td>
                <td className="font-mono text-xs max-w-md truncate">{r.details ? JSON.stringify(r.details) : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-4 text-center" style={{ color: "#6B6760" }}>No entries.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-2 h-8 border rounded disabled:opacity-50" style={{ borderColor: "var(--color-border)" }}><ChevronLeft size={14}/></button>
        <span className="text-sm">Page {page + 1} / {Math.max(1, Math.ceil(total / PAGE))}</span>
        <button disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)} className="px-2 h-8 border rounded disabled:opacity-50" style={{ borderColor: "var(--color-border)" }}><ChevronRight size={14}/></button>
      </div>
    </div>
  );
}
