import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/admin";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/protocols")({
  component: AdminProtocols,
});

interface Protocol { id: string; name: string; description: string | null; items: string[]; target_segment: string | null; status: string }

function AdminProtocols() {
  const { user } = useAuth();
  const [list, setList] = useState<Protocol[]>([]);
  const [editing, setEditing] = useState<Partial<Protocol> | null>(null);

  async function load() {
    const { data } = await supabase.from("protocols").select("*").order("name");
    if (data) setList(data as Protocol[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing || !user || !editing.name) { toast.error("Name required"); return; }
    const payload = {
      name: editing.name, description: editing.description ?? null,
      items: (editing.items ?? []).filter((x) => x.trim() !== ""),
      target_segment: editing.target_segment ?? null,
      status: (editing.status ?? "draft") as "draft" | "published" | "coming_soon",
    };
    if (editing.id) {
      const { error } = await supabase.from("protocols").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      await logAdminAction(user.id, { action: "update", entity_type: "protocol", entity_id: editing.id, details: payload });
    } else {
      const { data, error } = await supabase.from("protocols").insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      await logAdminAction(user.id, { action: "create", entity_type: "protocol", entity_id: data.id, details: payload });
    }
    setEditing(null); load(); toast.success("Saved");
  }

  async function remove(p: Protocol) {
    if (!user || !confirm(`Delete "${p.name}"?`)) return;
    await supabase.from("protocols").delete().eq("id", p.id);
    await logAdminAction(user.id, { action: "delete", entity_type: "protocol", entity_id: p.id });
    load();
  }

  async function seedStarter() {
    if (!user || !confirm("Seed Starter Protocol?")) return;
    await supabase.from("protocols").insert({
      name: "Starter Protocol",
      description: "Default protocol assigned to every new user.",
      items: [
        "Take supplement capsule with breakfast",
        "10-minute walk today",
        "Drink water before each meal",
        "Lights out by 11pm",
      ],
      status: "published" as const,
    });
    await logAdminAction(user.id, { action: "seed", entity_type: "protocol", details: { name: "Starter Protocol" } });
    load(); toast.success("Seeded");
  }

  const items = editing?.items ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Protocols</h1>
        <div className="flex gap-2">
          <button onClick={seedStarter} className="px-3 h-9 rounded border text-sm" style={{ borderColor: "var(--color-border)" }}>Seed Starter</button>
          <button onClick={() => setEditing({ status: "draft", items: [""] })} className="px-3 h-9 rounded bg-primary text-primary-foreground text-sm flex items-center gap-1"><Plus size={14}/> New</button>
        </div>
      </div>

      <div className="mt-5 bg-white rounded-[14px] border" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-sm">
          <thead><tr className="text-left" style={{ color: "#8FA8B8" }}><th className="p-3">Name</th><th>Items</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="p-3"><button className="text-primary underline" onClick={() => setEditing(p)}>{p.name}</button></td>
                <td>{p.items?.length ?? 0}</td>
                <td>{p.status}</td>
                <td><button className="text-red-600 p-2" onClick={() => remove(p)}><Trash2 size={14}/></button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="p-4 text-center" style={{ color: "#8FA8B8" }}>No protocols.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[14px] w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <div className="font-semibold">{editing.id ? "Edit protocol" : "New protocol"}</div>
              <button onClick={() => setEditing(null)}><X size={18}/></button>
            </div>
            <div className="p-4 space-y-3">
              <label className="block"><div className="text-xs mb-1">Name</div><input className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}/></label>
              <label className="block"><div className="text-xs mb-1">Description</div><textarea className="input min-h-20" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}/></label>
              <div>
                <div className="text-xs mb-1">Items</div>
                {items.map((it, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input className="input" value={it} onChange={(e) => {
                      const next = [...items]; next[i] = e.target.value; setEditing({ ...editing, items: next });
                    }}/>
                    <button onClick={() => setEditing({ ...editing, items: items.filter((_, j) => j !== i) })} className="px-2"><Trash2 size={14}/></button>
                  </div>
                ))}
                <button onClick={() => setEditing({ ...editing, items: [...items, ""] })} className="text-sm text-primary underline">+ Add item</button>
              </div>
              <label className="block"><div className="text-xs mb-1">Target segment</div><input className="input" value={editing.target_segment ?? ""} onChange={(e) => setEditing({ ...editing, target_segment: e.target.value })}/></label>
              <label className="block"><div className="text-xs mb-1">Status</div>
                <select className="input" value={editing.status ?? "draft"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
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
