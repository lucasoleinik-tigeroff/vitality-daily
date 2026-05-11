import { supabase } from "@/integrations/supabase/client";

export async function isAdmin(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export interface AdminLogEntry {
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
}

export async function logAdminAction(adminUserId: string, entry: AdminLogEntry) {
  await supabase.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action: entry.action,
    entity_type: entry.entity_type ?? null,
    entity_id: entry.entity_id ?? null,
    details: (entry.details ?? null) as never,
  });
}

export function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
