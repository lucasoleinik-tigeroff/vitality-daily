import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ClipboardList, MessageCircle, TrendingUp } from "lucide-react";

const tabs = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/log", label: "Log", icon: ClipboardList },
  { to: "/app/coach", label: "Coach", icon: MessageCircle },
  { to: "/app/progress", label: "Progress", icon: TrendingUp },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="max-w-[768px] mx-auto grid grid-cols-4">
        {tabs.map((t) => {
          const active = t.exact ? path === t.to : path.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="flex flex-col items-center gap-1 py-2.5 text-xs"
              style={{ color: active ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              <span style={{ fontWeight: active ? 600 : 400 }}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
