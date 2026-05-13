import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/guide/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { id } = params;

        const { data: guide, error } = await supabaseAdmin
          .from("guides")
          .select("file_url, external_url, title")
          .eq("id", id)
          .maybeSingle();

        if (error || !guide) {
          return new Response("Guide not found", { status: 404 });
        }

        // Determine storage path (file_url or extract from external_url)
        let storagePath = guide.file_url;
        if (!storagePath && guide.external_url) {
          const m = guide.external_url.match(/\/storage\/v1\/object\/public\/guides\/(.+)$/);
          if (m) storagePath = decodeURIComponent(m[1]);
        }

        if (!storagePath) {
          return new Response("Guide file not available", { status: 404 });
        }

        const { data: blob, error: dlErr } = await supabaseAdmin.storage
          .from("guides")
          .download(storagePath);

        if (dlErr || !blob) {
          return new Response("Unable to load guide file", { status: 502 });
        }

        const safeName = (guide.title || "guide").replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "guide";

        return new Response(blob.stream(), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${safeName}.pdf"`,
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
