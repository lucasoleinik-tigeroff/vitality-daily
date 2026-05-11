import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, BookOpen, MessageSquare, Lightbulb, ListChecks,
  ShoppingBag, Users, FileClock, LogOut,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/guides", label: "Guides", icon: BookOpen },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/tips", label: "Coach Tips", icon: Lightbulb },
  { to: "/admin/protocols", label: "Protocols", icon: ListChecks },
  { to: "/admin/cross-sell", label: "Cross-sell", icon: ShoppingBag },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/logs", label: "Audit Logs", icon: FileClock },
] as const;

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (path === "/admin/login") { setChecked(true); setAllowed(true); return; }
    if (!user) { navigate({ to: "/admin/login" }); return; }
    isAdmin(user.id).then((ok) => {
      if (!ok) navigate({ to: "/admin/login" });
      setAllowed(ok);
      setChecked(true);
    });
  }, [user, loading, path, navigate]);

  if (path === "/admin/login") return <Outlet />;
  if (!checked) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading admin…</div>;
  if (!allowed) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "#F4EFE6" }}>
      <aside className="w-60 shrink-0 border-r bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="font-bold text-primary">VitalMan Admin</div>
          <div className="text-xs" style={{ color: "#6B6760" }}>{user?.email}</div>
        </div>
        <nav className="p-2 flex flex-col gap-0.5">
          {NAV.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm"
                style={{
                  background: active ? "var(--color-primary)" : "transparent",
                  color: active ? "white" : "#14181F",
                }}>
                <n.icon size={16} /> {n.label}
              </Link>
            );
          })}
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm mt-4"
            style={{ color: "#14181F" }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto"><Outlet /></main>
    </div>
  );
}
