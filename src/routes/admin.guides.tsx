import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/admin";
import { toast } from "sonner";
import { Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/admin/guides")({
  component: AdminGuides,
});

const CONTENT_TYPES = ["pdf", "link", "text"] as const;
const STATUSES = ["draft", "published", "coming_soon"] as const;
type ContentType = typeof CONTENT_TYPES[number];

interface Guide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  cover_url: string | null;
  file_url: string | null;
  external_url: string | null;
  body_text: string | null;
  content_type: string;
  unlock_day: number;
  status: string;
}

const DEFAULT_LIBRARY: Partial<Guide>[] = [
  { title: "The 7-Day Sleep Reset", subtitle: "A practical sleep protocol for men 40+", category: "Sleep", content_type: "text", unlock_day: 0, status: "published", description: "Improve sleep depth and morning energy with a one-week reset." },
  { title: "Walking for Heart Health", subtitle: "Simple cardio you'll actually do", category: "Circulation", content_type: "text", unlock_day: 7, status: "published", description: "Why walking 30 minutes a day works, and how to build the habit." },
  { title: "Hydration Made Easy", subtitle: "How much you really need", category: "Nutrition", content_type: "text", unlock_day: 14, status: "published", description: "Set a target, track it, and feel the difference within a week." },
  { title: "Stress Less in 5 Minutes", subtitle: "Three drills you can do at your desk", category: "Stress", content_type: "text", unlock_day: 21, status: "published", description: "Quick recovery drills that lower cortisol and reset focus." },
];

function AdminGuides() {
  const { user } = useAuth();
  const [list, setList] = useState<Guide[]>([]);
  const [editing, setEditing] = useState<Partial<Guide> | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("guides").select("*").order("unlock_day").order("created_at");
    if (data) setList(data as Guide[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing || !user) return;
    if (!editing.title) { toast.error("Title is required"); return; }
    const ct = (editing.content_type ?? "pdf") as ContentType;
    if (ct === "link" && !editing.external_url) { toast.error("External URL is required for link guides"); return; }
    if (ct === "text" && !editing.body_text) { toast.error("Body text is required for text guides"); return; }
    setBusy(true);
    const payload = {
      title: editing.title,
      subtitle: editing.subtitle ?? null,
      description: editing.description ?? null,
      category: editing.category ?? null,
      cover_url: editing.cover_url ?? null,
      file_url: ct === "pdf" ? (editing.file_url ?? null) : null,
      external_url: ct === "link" ? (editing.external_url ?? null) : null,
      body_text: ct === "text" ? (editing.body_text ?? null) : null,
      content_type: ct,
      unlock_day: editing.unlock_day ?? 0,
      status: (editing.status ?? "draft") as "draft" | "published" | "coming_soon",
    };
    let id = editing.id;
    if (id) {
      const { error } = await supabase.from("guides").update(payload).eq("id", id);
      if (error) { toast.error(error.message); setBusy(false); return; }
      await logAdminAction(user.id, { action: "update", entity_type: "guide", entity_id: id, details: payload });
    } else {
      const { data, error } = await supabase.from("guides").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setBusy(false); return; }
      id = data.id;
      await logAdminAction(user.id, { action: "create", entity_type: "guide", entity_id: id, details: payload });
    }
    toast.success("Saved");
    setEditing(null); setBusy(false); load();
  }

  async function remove(g: Guide) {
    if (!user) return;
    if (!confirm(`Delete "${g.title}"?`)) return;
    const { error } = await supabase.from("guides").delete().eq("id", g.id);
    if (error) { toast.error(error.message); return; }
    await logAdminAction(user.id, { action: "delete", entity_type: "guide", entity_id: g.id });
    load();
  }

  async function seedLibrary() {
    if (!user) return;
    if (!confirm("Seed 4 default guides?")) return;
    for (const g of DEFAULT_LIBRARY) {
      await supabase.from("guides").insert({
        title: g.title!, subtitle: g.subtitle ?? null, description: g.description ?? null,
        category: g.category ?? null, content_type: g.content_type ?? "text",
        unlock_day: g.unlock_day ?? 0, status: g.status ?? "published",
      });
    }
    await logAdminAction(user.id, { action: "seed", entity_type: "guides", details: { count: DEFAULT_LIBRARY.length } });
    toast.success("Seeded default library");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Guides</h1>
        <div className="flex gap-2">
          <button onClick={seedLibrary} className="px-3 h-9 rounded border text-sm" style={{ borderColor: "var(--color-border)" }}>
            Seed default library
          </button>
          <button onClick={() => setEditing({ content_type: "text", status: "draft", unlock_day: 0 })}
            className="px-3 h-9 rounded bg-primary text-primary-foreground text-sm flex items-center gap-1">
            <Plus size={14} /> New guide
          </button>
        </div>
      </div>

      <div className="mt-5 bg-white rounded-[14px] border" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-sm">
          <thead><tr className="text-left" style={{ color: "#6B6760" }}>
            <th className="p-3">Title</th><th>Category</th><th>Type</th><th>Unlock day</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {list.map((g) => (
              <tr key={g.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="p-3"><button onClick={() => setEditing(g)} className="text-primary underline">{g.title}</button></td>
                <td>{g.category ?? "—"}</td>
                <td>{g.content_type}</td>
                <td>{g.unlock_day}</td>
                <td>{g.status}</td>
                <td><button onClick={() => remove(g)} className="text-red-600 p-2"><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-4 text-center" style={{ color: "#6B6760" }}>No guides yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[14px] w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <div className="font-semibold">{editing.id ? "Edit guide" : "New guide"}</div>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <Field label="Title"><input className="input" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
              <Field label="Subtitle"><input className="input" value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></Field>
              <Field label="Description"><textarea className="input min-h-20" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
              <Field label="Category"><input className="input" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
              <Field label="Cover URL"><input className="input" value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} /></Field>
              <Field label="Unlock day"><input type="number" className="input" value={editing.unlock_day ?? 0} onChange={(e) => setEditing({ ...editing, unlock_day: parseInt(e.target.value || "0") })} /></Field>
              <Field label="Content type">
                <select className="input" value={editing.content_type ?? "pdf"} onChange={(e) => setEditing({ ...editing, content_type: e.target.value })}>
                  {CONTENT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              {editing.content_type === "pdf" && (
                <Field label="File URL (PDF)"><input className="input" value={editing.file_url ?? ""} onChange={(e) => setEditing({ ...editing, file_url: e.target.value })} /></Field>
              )}
              {editing.content_type === "link" && (
                <Field label="External URL"><input className="input" value={editing.external_url ?? ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} /></Field>
              )}
              {editing.content_type === "text" && (
                <Field label="Body (markdown)"><textarea className="input min-h-40" value={editing.body_text ?? ""} onChange={(e) => setEditing({ ...editing, body_text: e.target.value })} /></Field>
              )}
              <Field label="Status">
                <select className="input" value={editing.status ?? "draft"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: "var(--color-border)" }}>
              <button onClick={() => setEditing(null)} className="px-3 h-9 rounded border text-sm" style={{ borderColor: "var(--color-border)" }}>Cancel</button>
              <button disabled={busy} onClick={save} className="px-4 h-9 rounded bg-primary text-primary-foreground text-sm disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.input{width:100%;height:38px;padding:0 10px;border:1px solid var(--color-border);border-radius:6px;background:white}textarea.input{padding:8px 10px;height:auto}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs mb-1" style={{ color: "#6B6760" }}>{label}</div>{children}</label>;
}
