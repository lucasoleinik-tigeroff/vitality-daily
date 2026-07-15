import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/materials/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (!token) return new Response("Unauthorized", { status: 401 });

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;

        // Validate the user token
        const authClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userRes, error: userErr } = await authClient.auth.getUser(token);
        if (userErr || !userRes?.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = userRes.user.id;

        // Load material and (server-side) recompute unlock
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: material, error: matErr } = await supabaseAdmin
          .from("materials_items")
          .select("id, file_url, unlock_type, unlock_value, active")
          .eq("id", params.id)
          .maybeSingle();

        if (matErr || !material || !material.active) {
          return new Response("Not found", { status: 404 });
        }

        if (material.unlock_type === "log_count") {
          const { count, error: countErr } = await supabaseAdmin
            .from("daily_logs")
            .select("log_date", { count: "exact", head: true })
            .eq("user_id", userId);
          if (countErr) return new Response("Error", { status: 500 });
          const days = count ?? 0;
          if (days < (material.unlock_value ?? 0)) {
            return new Response("Locked", { status: 403 });
          }
        }

        // Stream the PDF from private storage
        const path = material.file_url.replace(/^\/+/, "");
        const { data: file, error: dlErr } = await supabaseAdmin.storage
          .from("product-materials")
          .download(path);
        if (dlErr || !file) return new Response("File unavailable", { status: 404 });

        const buf = await file.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});
