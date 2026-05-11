import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/admin";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/tips")({
  component: AdminTips,
});

const METRICS = ["sleep", "stress", "activity", "hydration", "supplement", "general"] as const;

interface Tip { id: string; title: string; body: string; target_metric: string; status: string }

const SEED_TIPS: Omit<Tip, "id">[] = [
  ...buildSeed("sleep", [
    "Wind down 30 minutes before bed", "Keep your bedroom cool and dark",
    "No screens 60 minutes before sleep", "Stop caffeine after 2pm",
    "Wake at the same time every day",
  ]),
  ...buildSeed("stress", [
    "Box breathing for 2 minutes", "Step outside for sunlight",
    "Write down what's on your mind", "Walk 10 minutes after lunch",
    "Try 4-7-8 breath before bed",
  ]),
  ...buildSeed("activity", [
    "10-minute walk after each meal", "Take the stairs today",
    "Stretch for 5 minutes when you wake up", "Park further from the door",
    "20 squats during your next break",
  ]),
  ...buildSeed("hydration", [
    "Drink a glass of water on waking", "One glass before each meal",
    "Carry a water bottle today", "Add a slice of citrus to your water",
    "Replace one coffee with water",
  ]),
  ...buildSeed("supplement", [
    "Take with breakfast for best absorption", "Set a phone reminder",
    "Pair it with a daily habit", "Keep the bottle next to your toothbrush",
    "Don't double up if you forget",
  ]),
  ...buildSeed("general", [
    "Small daily habits beat big weekly efforts", "Track today, even briefly",
    "Sleep, hydration, movement: pick one to win today",
    "Notice what's working and double down",
    "Consistency, not intensity, builds vitality",
  ]),
];

function buildSeed(metric: string, titles: string[]): Omit<Tip, "id">[] {
  return titles.map((t) => ({
    title: t, body: `${t}. A small action to help your ${metric} score.`,
    target_metric: metric, status: "published",
  }));
}

function AdminTips() {
  const { user } = useAuth();
  const [list, setList] = useState<Tip[]>([]);
  const [editing, setEditing] = useState<Partial<Tip> | null>(null);

  async function load() {
    const { data } = await supabase.from("coach_tips").select("*").order("target_metric").order("title");
    if (data) setList(data as Tip[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing || !user || !editing.title || !editing.body) { toast.error("Title and body required"); return; }
    const payload = { title: editing.title, body: editing.body, target_metric: editing.target_metric ?? "general", status: editing.status ?? "published" };
    if (editing.id) {
      const { error } = await supabase.from("coach_tips").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      await logAdminAction(user.id, { action: "update", entity_type: "coach_tip", entity_id: editing.id, details: payload });
    } else {
      const { data, error } = await supabase.from("coach_tips").insert(payload).select("id").single();
      if (error) { toast.error(error.message); return; }
      await logAdminAction(user.id, { action: "create", entity_type: "coach_tip", entity_id: data.id, details: payload });
    }
    setEditing(null); load(); toast.success("Saved");
  }

  async function remove(t: Tip) {
    if (!user || !confirm(`Delete "${t.title}"?`)) return;
    await supabase.from("coach_tips").delete().eq("id", t.id);
    await logAdminAction(user.id, { action: "delete", entity_type: "coach_tip", entity_id: t.id });
    load();
  }

  async function seed() {
    if (!user || !confirm("Seed 30 starter tips?")) return;
    for (const t of SEED_TIPS) await supabase.from("coach_tips").insert(t);
    await logAdminAction(user.id, { action: "seed", entity_type: "coach_tips", details: { count: SEED_TIPS.length } });
    load(); toast.success("Seeded");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Coach Tips</h1>
        <div className="flex gap-2">
          <button onClick={seed} className="px-3 h-9 rounded border text-sm" style={{ borderColor: "var(--color-border)" }}>Seed starter tips</button>
          <button onClick={() => setEditing({ target_metric: "general", status: "published" })} className="px-3 h-9 rounded bg-primary text-primary-foreground text-sm flex items-center gap-1"><Plus size={14}/> New</button>
        </div>
      </div>

      <div className="mt-5 bg-white rounded-[14px] border" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-sm">
          <thead><tr className="text-left" style={{ color: "#6B6760" }}><th className="p-3">Metric</th><th>Title</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                <td className="p-3">{t.target_metric}</td>
                <td><button className="text-primary underline" onClick={() => setEditing(t)}>{t.title}</button></td>
                <td>{t.status}</td>
                <td><button className="text-red-600 p-2" onClick={() => remove(t)}><Trash2 size={14}/></button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="p-4 text-center" style={{ color: "#6B6760" }}>No tips.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[14px] w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <div className="font-semibold">{editing.id ? "Edit tip" : "New tip"}</div>
              <button onClick={() => setEditing(null)}><X size={18}/></button>
            </div>
            <div className="p-4 space-y-3">
              <label className="block"><div className="text-xs mb-1">Title</div><input className="input" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}/></label>
              <label className="block"><div className="text-xs mb-1">Body</div><textarea className="input min-h-24" value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })}/></label>
              <label className="block"><div className="text-xs mb-1">Target metric</div>
                <select className="input" value={editing.target_metric ?? "general"} onChange={(e) => setEditing({ ...editing, target_metric: e.target.value })}>
                  {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
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
