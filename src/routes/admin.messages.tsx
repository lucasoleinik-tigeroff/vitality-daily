import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/admin";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/messages")({
  component: AdminMessages,
});

interface Msg { id: string; title: string; body: string; target_week: number | null; status: string }

const SEED_MESSAGES = Array.from({ length: 12 }, (_, i) => ({
  title: `Week ${i + 1}: Building Momentum`,
  body: `This week's focus message will be filled in by the admin. Edit me to set the actual coaching message for week ${i + 1}.`,
  target_week: i + 1,
  status: "published" as const,
}));

function AdminMessages() {
  const { user } = useAuth();
  const [list, setList] = useState<Msg[]>([]);
  const [editing, setEditing] = useState<Partial<Msg> | null>(null);

  async function load() {
    const { data } = await supabase.from("coach_messages").select("*").order("target_week", { ascending: true, nullsFirst: false });
    if (data) setList(data as Msg[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing || !user || !editing.title || !editing.body) { toast.error("Title and body required"); return; }
    const payload = { title: editing.title, body: editing.body, target_week: editing.target_week ?? null, status: (editing.status ?? "published") as "draft" | "published" | "coming_soon" };
    if (editing.id) {
      const { error } = await supabase.from("coach_messages").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      await logAdminAction(user.id, { action: "update", entity_type: "coach_message", entity_id: editing.id, details: payload });
    } else {
      const { data, error } = await supabase.from("coach_messages").insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      await logAdminAction(user.id, { action: "create", entity_type: "coach_message", entity_id: data.id, details: payload });
    }
    setEditing(null); load(); toast.success("Saved");
  }

  async function remove(m: Msg) {
    if (!user || !confirm(`Delete "${m.title}"?`)) return;
    await supabase.from("coach_messages").delete().eq("id", m.id);
    await logAdminAction(user.id, { action: "delete", entity_type: "coach_message", entity_id: m.id });
    load();
  }

  async function seed() {
    if (!user || !confirm("Seed 12 default weekly messages?")) return;
    for (const m of SEED_MESSAGES) await supabase.from("coach_messages").insert(m);
    await logAdminAction(user.id, { action: "seed", entity_type: "coach_messages", details: { count: 12 } });
    load(); toast.success("Seeded");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Coach Messages</h1>
        <div className="flex gap-2">
          <button onClick={seed} className="px-3 h-9 rounded border text-sm" style={{ borderColor: "var(--color-border)" }}>Seed weekly</button>
          <button onClick={() => setEditing({ status: "published" })} className="px-3 h-9 rounded bg-primary text-primary-foreground text-sm flex items-center gap-1"><Plus size={14}/> New</button>
        </div>
      </div>
      <div className="mt-5 bg-white rounded-[14px] border" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-sm">
          <thead><tr className="text-left" style={{ color: "#6B6760" }}><th className="p-3">Week</th><th>Title</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="p-3">{m.target_week ?? "—"}</td>
                <td><button className="text-primary underline" onClick={() => setEditing(m)}>{m.title}</button></td>
                <td>{m.status}</td>
                <td><button className="text-red-600 p-2" onClick={() => remove(m)}><Trash2 size={14}/></button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="p-4 text-center" style={{ color: "#6B6760" }}>No messages.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[14px] w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <div className="font-semibold">{editing.id ? "Edit message" : "New message"}</div>
              <button onClick={() => setEditing(null)}><X size={18}/></button>
            </div>
            <div className="p-4 space-y-3">
              <label className="block"><div className="text-xs mb-1">Title</div><input className="input" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}/></label>
              <label className="block"><div className="text-xs mb-1">Body</div><textarea className="input min-h-32" value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })}/></label>
              <label className="block"><div className="text-xs mb-1">Target week</div><input type="number" className="input" value={editing.target_week ?? ""} onChange={(e) => setEditing({ ...editing, target_week: e.target.value ? parseInt(e.target.value) : null })}/></label>
              <label className="block"><div className="text-xs mb-1">Status</div>
                <select className="input" value={editing.status ?? "published"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="draft">draft</option><option value="published">published</option>
                </select>
              </label>
            </div>
            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: "var(--color-border)" }}>
              <button onClick={() => setEditing(null)} className="px-3 h-9 rounded border text-sm" style={{ borderColor: "var(--color-border)" }}>Cancel</button>
              <button onClick={save} className="px-4 h-9 rounded bg-primary text-primary-foreground text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.input{width:100%;height:38px;padding:0 10px;border:1px solid var(--color-border);border-radius:6px;background:white}textarea.input{padding:8px 10px;height:auto}`}</style>
    </div>
  );
}
