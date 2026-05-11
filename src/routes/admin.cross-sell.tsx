import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction, isValidUrl } from "@/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cross-sell")({
  component: AdminCrossSell,
});

const CONCERNS = ["sleep", "stress", "activity", "hydration", "amplify"] as const;

interface Product {
  id: string; concern: string; product_name: string; headline: string;
  body_text: string; cta_url: string; active: boolean;
}

function AdminCrossSell() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Record<string, Product>>({});

  async function load() {
    const { data } = await supabase.from("cross_sell_products").select("*");
    const map: Record<string, Product> = {};
    (data ?? []).forEach((r) => { map[r.concern] = r as Product; });
    // Ensure stub for any missing concern
    for (const c of CONCERNS) {
      if (!map[c]) {
        const { data: created } = await supabase.from("cross_sell_products")
          .insert({ concern: c, product_name: "", headline: "", body_text: "", cta_url: "", active: false })
          .select("*").single();
        if (created) map[c] = created as Product;
      }
    }
    setRows({ ...map });
  }
  useEffect(() => { load(); }, []);

  async function save(c: string) {
    if (!user) return;
    const r = rows[c];
    if (r.active) {
      if (!isValidUrl(r.cta_url)) { toast.error("CTA URL must be a valid http(s) URL when active"); return; }
      if (!r.product_name || !r.headline) { toast.error("Name and headline required when active"); return; }
    }
    const { error } = await supabase.from("cross_sell_products").update({
      product_name: r.product_name, headline: r.headline, body_text: r.body_text,
      cta_url: r.cta_url, active: r.active,
    }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    await logAdminAction(user.id, { action: "update", entity_type: "cross_sell_product", entity_id: r.id, details: { concern: c, active: r.active } });
    toast.success(`Saved ${c}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Cross-sell Products</h1>
      <p className="text-sm mt-1" style={{ color: "#6B6760" }}>One product per concern. Active rows must have a valid URL.</p>
      <div className="mt-5 grid gap-4">
        {CONCERNS.map((c) => {
          const r = rows[c];
          if (!r) return <div key={c} className="text-sm" style={{ color: "#6B6760" }}>Loading {c}…</div>;
          return (
            <div key={c} className="bg-white border rounded-[14px] p-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between">
                <div className="font-semibold capitalize text-primary">{c}</div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={r.active} onChange={(e) => setRows({ ...rows, [c]: { ...r, active: e.target.checked } })} />
                  Active
                </label>
              </div>
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <Field label="Product name"><input className="input" value={r.product_name} onChange={(e) => setRows({ ...rows, [c]: { ...r, product_name: e.target.value } })} /></Field>
                <Field label="Headline"><input className="input" value={r.headline} onChange={(e) => setRows({ ...rows, [c]: { ...r, headline: e.target.value } })} /></Field>
                <Field label="Body"><textarea className="input min-h-20" value={r.body_text} onChange={(e) => setRows({ ...rows, [c]: { ...r, body_text: e.target.value } })} /></Field>
                <Field label="CTA URL"><input className="input" value={r.cta_url} onChange={(e) => setRows({ ...rows, [c]: { ...r, cta_url: e.target.value } })} /></Field>
              </div>
              <div className="mt-3"><button onClick={() => save(c)} className="px-3 h-9 rounded bg-primary text-primary-foreground text-sm">Save</button></div>
            </div>
          );
        })}
      </div>
      <style>{`.input{width:100%;height:38px;padding:0 10px;border:1px solid var(--color-border);border-radius:6px;background:white}textarea.input{padding:8px 10px;height:auto}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs mb-1" style={{ color: "#6B6760" }}>{label}</div>{children}</label>;
}
