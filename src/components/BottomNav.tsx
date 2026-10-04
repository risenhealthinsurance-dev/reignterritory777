import type { AppScreen } from "../types";

interface BottomNavProps {
  current: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  unsyncedCount: number;
  completedCount: number;
  totalCount: number;
}

const TERRITORY_SCREENS: AppScreen[] = ["territory", "quadrant", "quad_route"];
const ROUTE_SCREENS: AppScreen[] = [
  "kickoff",
  "route",
  "stop",
  "disposition",
  "followup",
  "recovery",
];

function activeGroup(s: AppScreen): "territory" | "route" | "chat" | "summary" {
  if (TERRITORY_SCREENS.includes(s)) return "territory";
  if (ROUTE_SCREENS.includes(s)) return "route";
  if (s === "chat" || s === "enrichment") return "chat";
  return "summary";
}

export function BottomNav({
  current,
  onNavigate,
  unsyncedCount,
  completedCount,
  totalCount,
}: BottomNavProps) {
  const group = activeGroup(current);

  const items = [
    {
      key: "territory" as const,
      icon: "📍",
      label: "Territory",
      group: "territory" as const,
    },
    {
      key: "route" as const,
      icon: "🗺",
      label: `${completedCount}/${totalCount}`,
      group: "route" as const,
    },
    {
      key: "chat" as const,
      icon: "🤖",
      label: "Field AI",
      group: "chat" as const,
    },
    {
      key: "summary" as const,
      icon: "📊",
      label: "Summary",
      group: "summary" as const,
      badge: unsyncedCount > 0 ? unsyncedCount : undefined,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        borderTop: "1px solid #111520",
        background: "#080a10",
        flexShrink: 0,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {items.map((item) => {
        const isActive = group === item.group;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key === "route" ? "route" : item.key)}
            style={{
              flex: 1,
              padding: "10px 8px 8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              position: "relative",
              transition: "opacity .15s",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "25%",
                  right: "25%",
                  height: 2,
                  background: "linear-gradient(90deg,#1d4ed8,#22d3ee)",
                  borderRadius: "0 0 2px 2px",
                }}
              />
            )}
            {item.badge && item.badge > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: "24%",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#f59e0b",
                  color: "#000",
                  fontSize: 8,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "DM Mono,monospace",
                }}
              >
                {item.badge}
              </div>
            )}
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span
              style={{
                fontSize: 9,
                fontFamily: "DM Mono,monospace",
                color: isActive ? "#93c5fd" : "#374151",
                letterSpacing: 0.5,
              }}
            >
              {item.label.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
