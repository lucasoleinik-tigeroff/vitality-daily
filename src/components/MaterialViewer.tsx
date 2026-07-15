import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// pdfjs worker setup (Vite-friendly)
import * as pdfjsLib from "pdfjs-dist";
// @ts-expect-error - vite worker import
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker as string;

type PDFDoc = Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>;

interface Props {
  materialId: string;
  title: string;
  onClose: () => void;
}

export function MaterialViewer({ materialId, title, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDoc | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) throw new Error("no-session");
        const res = await fetch(`/api/materials/${materialId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(String(res.status));
        const buf = await res.arrayBuffer();
        const loaded = await pdfjsLib.getDocument({ data: buf }).promise;
        if (cancelled) return;
        setDoc(loaded);
        setTotal(loaded.numPages);
        setPage(1);
      } catch (e) {
        if (!cancelled) setError("We couldn't display this file right now. Please try again in a moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [materialId]);

  useEffect(() => {
    if (!doc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await doc.getPage(page);
        const viewport = p.getViewport({ scale: zoom * 1.5 });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await p.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch {
        if (!cancelled) setError("We couldn't display this file right now. Please try again in a moment.");
      }
    })();
    return () => { cancelled = true; };
  }, [doc, page, zoom]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="text-sm font-semibold truncate pr-3" style={{ color: "#F5F5F5" }}>{title}</div>
        <button onClick={onClose} className="p-1" aria-label="Close">
          <X size={22} color="#F5F5F5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        {loading && <div style={{ color: "#B0B0B0", fontSize: 14, marginTop: 40 }}>Loading…</div>}
        {error && !loading && (
          <div style={{ color: "#E8E8E8", fontSize: 14, marginTop: 40, textAlign: "center", maxWidth: 320 }}>
            {error}
          </div>
        )}
        {!error && (
          <canvas
            ref={canvasRef}
            style={{ maxWidth: "100%", height: "auto", boxShadow: "0 4px 24px rgba(0,0,0,0.5)", background: "#fff" }}
          />
        )}
      </div>

      {doc && !error && (
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--color-border)", background: "#1A1A1A" }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={20} color="#F5F5F5" />
            </button>
            <div style={{ color: "#E8E8E8", fontSize: 13, minWidth: 80, textAlign: "center" }}>
              Page {page} of {total}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(total, p + 1))}
              disabled={page >= total}
              className="p-2 rounded disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={20} color="#F5F5F5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              disabled={zoom <= 0.5}
              className="p-2 rounded disabled:opacity-40"
              aria-label="Zoom out"
            >
              <ZoomOut size={18} color="#F5F5F5" />
            </button>
            <div style={{ color: "#E8E8E8", fontSize: 13, minWidth: 48, textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
              disabled={zoom >= 2}
              className="p-2 rounded disabled:opacity-40"
              aria-label="Zoom in"
            >
              <ZoomIn size={18} color="#F5F5F5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
