import { useEffect, useMemo, useState } from "react";
import { FileText, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeader } from "@/components/SectionHeader";
import { MaterialViewer } from "@/components/MaterialViewer";

interface Product {
  id: string;
  name: string;
  sort_order: number;
}

interface Material {
  id: string;
  product_id: string;
  title: string;
  material_type: "user_guide" | "better_results" | "other";
  unlock_type: "immediate" | "log_count";
  unlock_value: number;
  sort_order: number;
}

interface Props {
  userId: string | undefined;
}

export function ProductMaterialsSection({ userId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [logCount, setLogCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [viewer, setViewer] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    (async () => {
      const [p, m] = await Promise.all([
        supabase
          .from("materials_products")
          .select("id,name,sort_order")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("materials_items")
          .select("id,product_id,title,material_type,unlock_type,unlock_value,sort_order")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
      ]);
      if (p.data) setProducts(p.data as Product[]);
      if (m.data) setMaterials(m.data as Material[]);

      if (userId) {
        const { count } = await supabase
          .from("daily_logs")
          .select("log_date", { count: "exact", head: true })
          .eq("user_id", userId);
        setLogCount(count ?? 0);
      }
    })();
  }, [userId]);

  const productMaterials = useMemo(
    () => materials.filter((m) => m.product_id === selectedProduct),
    [materials, selectedProduct]
  );

  const isUnlocked = (m: Material) =>
    m.unlock_type === "immediate" || logCount >= (m.unlock_value ?? 0);

  return (
    <div className="mt-5">
      <SectionHeader label="Product Materials" />
      <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
        Guides and resources for your products
      </p>

      <select
        value={selectedProduct}
        onChange={(e) => setSelectedProduct(e.target.value)}
        className="w-full h-10 rounded-md border px-3 text-sm"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-foreground)",
          maxHeight: 240,
        }}
        size={1}
      >
        <option value="">Select a product</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {selectedProduct && (
        <div className="mt-3 rounded-[14px] bg-card border border-border overflow-hidden">
          {productMaterials.length === 0 ? (
            <div className="p-5 text-center" style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
              No materials available yet.
            </div>
          ) : (
            productMaterials.map((m, i) => {
              const unlocked = isUnlocked(m);
              const daysLeft = Math.max(0, (m.unlock_value ?? 0) - logCount);
              return (
                <button
                  key={m.id}
                  onClick={() => unlocked && setViewer({ id: m.id, title: m.title })}
                  disabled={!unlocked}
                  className="w-full flex items-center gap-3 p-3 text-left"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                    cursor: unlocked ? "pointer" : "not-allowed",
                    opacity: unlocked ? 1 : 0.6,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--color-surface)" }}
                  >
                    {unlocked ? (
                      <FileText size={20} color="var(--color-accent)" />
                    ) : (
                      <Lock size={18} color="var(--color-text-secondary)" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-semibold truncate"
                      style={{ color: unlocked ? "var(--color-text-foreground)" : "var(--color-text-secondary)" }}
                    >
                      {m.title}
                    </div>
                    {!unlocked && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        Unlocks in {daysLeft} {daysLeft === 1 ? "day" : "days"} of activity
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {viewer && (
        <MaterialViewer
          materialId={viewer.id}
          title={viewer.title}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
