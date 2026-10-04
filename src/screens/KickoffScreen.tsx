import type { Territory } from "../data/territory";
import type { StopRecord } from "../types";
import { accounts } from "../data/accounts";

interface KickoffScreenProps {
  territory: Territory;
  stops: StopRecord[];
  onStartRoute: () => void;
  onOpenChat: () => void;
}

const S = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    overflowY: "auto" as const,
    scrollbarWidth: "none" as const,
  },
  header: {
    padding: "14px 16px 10px",
    borderBottom: "1px solid #111520",
    flexShrink: 0,
  },
  greeting: {
    fontSize: 11,
    fontFamily: "DM Mono,monospace",
    color: "#22d3ee",
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#e8eaf0",
    lineHeight: 1.2,
    marginBottom: 2,
  },
  date: { fontSize: 11, fontFamily: "DM Mono,monospace", color: "#6b7490" },
  body: {
    flex: 1,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  alertRow: {
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: 12,
    padding: "9px 12px",
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
  },
  alertIcon: { fontSize: 14, flexShrink: 0, marginTop: 1 },
  alertText: { fontSize: 12, lineHeight: 1.45, color: "#c8cbd6" },
  alertLabel: {
    fontSize: 10,
    fontFamily: "DM Mono,monospace",
    color: "#f59e0b",
    marginBottom: 2,
    display: "block",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  stat: {
    background: "#0d1117",
    border: "1px solid #1a2030",
    borderRadius: 12,
    padding: "10px 10px 9px",
    display: "flex",
    flexDirection: "column" as const,
  },
  statValue: { fontSize: 18, fontWeight: 700, color: "#e8eaf0", lineHeight: 1 },
  statLabel: {
    fontSize: 10,
    fontFamily: "DM Mono,monospace",
    color: "#6b7490",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "DM Mono,monospace",
    color: "#374151",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginBottom: 0,
  },
  priority: {
    background: "rgba(59,130,246,0.07)",
    border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 12,
    padding: "9px 12px",
  },
  priorityBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 9,
    fontFamily: "DM Mono,monospace",
    color: "#3b82f6",
    background: "rgba(59,130,246,0.15)",
    borderRadius: 6,
    padding: "2px 7px",
    marginBottom: 6,
  },
  priorityText: { fontSize: 12, color: "#c8cbd6", lineHeight: 1.45 },
  stopPreview: {
    background: "#0d1117",
    border: "1px solid #1a2030",
    borderRadius: 12,
    overflow: "hidden",
  },
  stopRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderBottom: "1px solid #111520",
  },
  stopNum: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    flexShrink: 0,
    background: "#131720",
    border: "1px solid #1e2535",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontFamily: "DM Mono,monospace",
    color: "#6b7490",
  },
  stopName: {
    flex: 1,
    fontSize: 12,
    color: "#c8cbd6",
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  stopEta: { fontSize: 10, fontFamily: "DM Mono,monospace", color: "#374151" },
  footer: {
    flexShrink: 0,
    padding: "10px 14px 16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  cta: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg,#1d4ed8,#0ea5e9)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    boxShadow: "0 4px 24px rgba(29,78,216,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    letterSpacing: 0.3,
  },
  secondary: {
    width: "100%",
    padding: "11px",
    borderRadius: 12,
    cursor: "pointer",
    background: "transparent",
    border: "1px solid #1a2030",
    color: "#6b7490",
    fontSize: 13,
    fontWeight: 500,
  },
};

const ETAS = [0, 10, 24, 38, 56, 74];

export function KickoffScreen({ territory, stops, onStartRoute, onOpenChat }: KickoffScreenProps) {
  const done = stops.filter((s) => s.status === "done").length;

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.greeting}>● GOOD MORNING · FIELD AI READY</div>
        <div style={S.title}>{territory.name}</div>
        <div style={S.date}>
          {territory.date} · {territory.repName}
        </div>
      </div>

      <div style={S.body}>
        {/* Traffic alert */}
        <div style={S.alertRow}>
          <span style={S.alertIcon}>⚠️</span>
          <div>
            <span style={S.alertLabel}>TRAFFIC ADVISORY</span>
            <div style={S.alertText}>{territory.trafficNote}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={S.statsRow}>
          <div style={S.stat}>
            <div style={S.statValue}>{territory.totalAccounts}</div>
            <div style={S.statLabel}>STOPS</div>
          </div>
          <div style={S.stat}>
            <div style={S.statValue}>
              18.4<span style={{ fontSize: 11, color: "#6b7490" }}>mi</span>
            </div>
            <div style={S.statLabel}>DISTANCE</div>
          </div>
          <div style={S.stat}>
            <div style={S.statValue}>
              3h<span style={{ fontSize: 11, color: "#6b7490" }}>52m</span>
            </div>
            <div style={S.statLabel}>EST. TIME</div>
          </div>
        </div>

        {/* Priority account */}
        <div style={S.priority}>
          <div style={S.priorityBadge}>
            <span>★</span>
            <span>PRIORITY STOP TODAY</span>
          </div>
          <div style={S.priorityText}>{territory.priorityNote}</div>
        </div>

        {/* Stop preview */}
        <div>
          <div style={{ ...S.sectionLabel, marginBottom: 8 }}>TODAY'S STOPS</div>
          <div style={S.stopPreview}>
            {accounts.map((acc, i) => {
              const stop = stops.find((s) => s.accountId === acc.id);
              const isDone = stop?.status === "done";
              return (
                <div
                  key={acc.id}
                  style={{
                    ...S.stopRow,
                    ...(i === accounts.length - 1 ? { borderBottom: "none" } : {}),
                  }}
                >
                  <div
                    style={{
                      ...S.stopNum,
                      ...(isDone
                        ? {
                            background: "#0f2010",
                            border: "1px solid #14532d",
                            color: "#10b981",
                          }
                        : {}),
                    }}
                  >
                    {isDone ? "✓" : acc.routeOrder}
                  </div>
                  <div style={S.stopName}>{acc.name}</div>
                  <div
                    style={{
                      ...S.stopEta,
                      color: isDone ? "#10b981" : "#374151",
                    }}
                  >
                    {isDone ? "Done" : i === 0 ? "Now" : `+${ETAS[i]}m`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={S.footer}>
        {done === 0 ? (
          <button style={S.cta} onClick={onStartRoute}>
            <span>🗺</span>
            <span>Start Today's Route</span>
            <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 2 }}>6 stops · 18.4 mi</span>
          </button>
        ) : (
          <button style={S.cta} onClick={onStartRoute}>
            <span>▶</span>
            <span>Resume Route</span>
            <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 2 }}>
              {done}/{territory.totalAccounts} done
            </span>
          </button>
        )}
        <button style={S.secondary} onClick={onOpenChat}>
          Ask Field AI for a pre-route brief
        </button>
      </div>
    </div>
  );
}
