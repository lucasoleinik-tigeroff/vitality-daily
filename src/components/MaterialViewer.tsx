import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import * as pdfjsLib from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker as string;

type PDFDoc = Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>;

interface Props {
  materialId: string;
  title: string;
  onClose: () => void;
}

const ERROR_MESSAGE = "We couldn't display this file right now. Please try again in a moment.";

export function MaterialViewer({ materialId, title, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDoc | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Lock body scroll while viewer is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Load PDF bytes
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
      } catch {
        if (!cancelled) setError(ERROR_MESSAGE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [materialId]);

  // Render current page
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
        if (!cancelled) setError(ERROR_MESSAGE);
      }
    })();
    return () => { cancelled = true; };
  }, [doc, page, zoom]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--color-background)" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}
      >
        <button
          onClick={onClose}
          className="p-1 -ml-1"
          aria-label="Close"
          style={{ color: "var(--color-text-foreground)" }}
        >
          <X size={22} />
        </button>
        <div
          className="flex-1 truncate text-base font-semibold"
          style={{ color: "var(--color-text-foreground)", letterSpacing: "-0.01em" }}
        >
          {title}
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto flex items-start justify-center px-4 py-5"
        style={{ background: "var(--color-background)" }}
      >
        {loading && (
          <div style={{ color: "var(--color-text-secondary)", fontSize: 14, marginTop: 40 }}>
            Loading…
          </div>
        )}
        {error && !loading && (
          <div
            className="rounded-[14px] border p-5 text-center"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-foreground)",
              fontSize: 14,
              marginTop: 40,
              maxWidth: 340,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}
        {!error && (
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: 8,
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
              background: "#fff",
            }}
          />
        )}
      </div>

      {/* Footer controls */}
      {doc && !error && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface)" }}
        >
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-md disabled:opacity-40"
              style={{ color: "var(--color-text-foreground)" }}
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            <div
              style={{
                color: "var(--color-text-foreground)",
                fontSize: 13,
                fontWeight: 500,
                minWidth: 92,
                textAlign: "center",
              }}
            >
              Page {page} of {total}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(total, p + 1))}
              disabled={page >= total}
              className="p-2 rounded-md disabled:opacity-40"
              style={{ color: "var(--color-text-foreground)" }}
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              disabled={zoom <= 0.5}
              className="p-2 rounded-md disabled:opacity-40"
              style={{ color: "var(--color-text-foreground)" }}
              aria-label="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <div
              style={{
                color: "var(--color-text-secondary)",
                fontSize: 12,
                fontWeight: 500,
                minWidth: 44,
                textAlign: "center",
              }}
            >
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
              disabled={zoom >= 2}
              className="p-2 rounded-md disabled:opacity-40"
              style={{ color: "var(--color-text-foreground)" }}
              aria-label="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
