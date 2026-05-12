import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ClipboardList, MessageCircle, TrendingUp } from "lucide-react";

const tabs = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/log", label: "Log", icon: ClipboardList, exact: false },
  { to: "/app/coach", label: "Coach", icon: MessageCircle, exact: false },
  { to: "/app/progress", label: "Progress", icon: TrendingUp, exact: false },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ background: "#080606", borderTop: "1px solid #0E3A56" }}
    >
      <div className="max-w-[768px] mx-auto grid grid-cols-4">
        {tabs.map((t) => {
          const active = t.exact ? path === t.to : path.startsWith(t.to);
          const Icon = t.icon;
          const color = active ? "#770101" : "#4A6070";
          return (
            <Link
              key={t.to}
              to={t.to}
              className="relative flex flex-col items-center gap-1 py-2.5 text-xs"
              style={{ color }}
            >
              {active && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    width: 18,
                    height: 2,
                    background: "#770101",
                    borderRadius: 2,
                  }}
                />
              )}
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              <span style={{ fontWeight: active ? 600 : 500 }}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
