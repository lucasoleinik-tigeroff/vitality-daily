import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Download, ExternalLink, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/coach/guide/$id")({
  component: GuideViewer,
});

interface Guide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  content_type: string;
  external_url: string | null;
  body_text: string | null;
  file_url: string | null;
}

function GuideViewer() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [marked, setMarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("guides").select("id,title,subtitle,description,content_type,external_url,body_text,file_url").eq("id", id).maybeSingle();
      if (data) {
        setGuide(data as Guide);
        if (data.content_type === "pdf" && data.file_url) {
          const { data: signed, error: signErr } = await supabase.storage
            .from("guides")
            .createSignedUrl(data.file_url, 3600);
          if (signErr || !signed?.signedUrl) {
            setPdfError("Unable to load this guide. Please try again.");
          } else {
            setSignedPdfUrl(signed.signedUrl);
          }
        }
      }
      if (user) {
        const today = new Date().toISOString().slice(0, 10);
        const { data: acc } = await supabase
          .from("guide_access")
          .select("id")
          .eq("user_id", user.id)
          .eq("guide_id", id)
          .gte("accessed_at", today + "T00:00:00")
          .maybeSingle();
        if (acc) setMarked(true);
      }
    })();
  }, [id, user]);

  const markRead = async () => {
    if (!user || marked || saving) return;
    setSaving(true);
    const { error } = await supabase.from("guide_access").insert({ user_id: user.id, guide_id: id });
    setSaving(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    setMarked(true);
    toast.success("Marked as read");
    setTimeout(() => navigate({ to: "/app/coach" }), 800);
  };

  if (!guide) return <div className="px-5 pt-5 pb-24 text-sm" style={{ color: "var(--color-text-secondary)" }}>Loading...</div>;

  const RightIcon = guide.content_type === "pdf" ? Download : guide.content_type === "link" ? ExternalLink : null;

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <button onClick={() => navigate({ to: "/app/coach" })} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-primary)" />
        </button>
        <div className="flex-1 px-3 text-center text-base font-semibold text-foreground truncate">{guide.title}</div>
        {RightIcon ? <RightIcon size={20} color="var(--color-primary)" /> : <span style={{ width: 20 }} />}
      </div>

      <div className="flex-1 px-5 py-5">
        {guide.content_type === "pdf" && guide.file_url && signedPdfUrl && (
          <iframe src={signedPdfUrl} title={guide.title} className="w-full" style={{ height: "70vh", border: "none" }} />
        )}
        {guide.content_type === "pdf" && guide.file_url && !signedPdfUrl && pdfError && (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{pdfError}</p>
        )}
        {guide.content_type === "pdf" && !guide.file_url && (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>This PDF is not yet available.</p>
        )}

        {guide.content_type === "link" && (
          <div>
            <h1 className="text-[22px] font-bold text-foreground leading-tight">{guide.title}</h1>
            {guide.subtitle && <p className="mt-1 text-[15px]" style={{ color: "var(--color-text-secondary)" }}>{guide.subtitle}</p>}
            {guide.description && (
              <p className="mt-4 text-[15px]" style={{ lineHeight: 1.6, color: "var(--color-text-foreground)" }}>{guide.description}</p>
            )}
            <button
              onClick={() => guide.external_url && window.open(guide.external_url, "_blank", "noopener,noreferrer")}
              disabled={!guide.external_url}
              className="mt-6 w-full h-11 rounded-md bg-primary text-foreground-foreground font-semibold disabled:opacity-60"
            >
              Open in browser
            </button>
          </div>
        )}

        {guide.content_type === "text" && (
          <div className="max-w-[680px] mx-auto">
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-foreground)" }}>{guide.title}</h1>
            {guide.subtitle && <p className="mt-1 text-[15px]" style={{ color: "var(--color-text-secondary)" }}>{guide.subtitle}</p>}
            <div className="prose prose-sm mt-4 max-w-none" style={{ color: "var(--color-text-foreground)" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.body_text ?? ""}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card p-4" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="max-w-[768px] mx-auto">
          <button
            onClick={markRead}
            disabled={marked || saving}
            className="w-full h-11 rounded-md bg-primary text-foreground-foreground font-semibold disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {marked && <Check size={16} />} {marked ? "Marked as read" : saving ? "Saving..." : "Mark as read"}
          </button>
        </div>
      </div>
    </div>
  );
}
