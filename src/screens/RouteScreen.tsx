import type { StopRecord } from "../types";
import { accounts } from "../data/accounts";
import { OUTCOME_CONFIG } from "../data/territory";

interface RouteScreenProps {
  stops: StopRecord[];
  onSelectStop: (id: string) => void;
  onEndDay: () => void;
}

const TIER_COLOR: Record<string, string> = {
  Enterprise: "#8b5cf6",
  "Mid-Market": "#3b82f6",
  SMB: "#10b981",
};

// ETA from current active stop (after meridian + pacific done)
const ETAs = ["Now", "+14m", "+28m", "+46m", "+64m", "+82m"];

export function RouteScreen({ stops, onSelectStop, onEndDay }: RouteScreenProps) {
  const done = stops.filter((s) => s.status === "done");
  const failed = stops.filter((s) => s.status === "failed" || s.status === "skipped");
  const doneCount = done.length;
  const totalCount = stops.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header — Route / Readable */}
      <div
        style={{
          flexShrink: 0,
          padding: "11px 14px 10px",
          borderBottom: "1px solid #111520",
          background: "#0b0d14",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "DM Mono,monospace",
                color: "#22d3ee",
                letterSpacing: 0.8,
                marginBottom: 3,
              }}
            >
              ● ROUTE ACTIVE · 34950 · A1
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#e8eaf0",
                lineHeight: 1.1,
              }}
            >
              {doneCount} of {totalCount} stops complete
            </div>
          </div>
          <div
            style={{
              background: "#0d1117",
              border: "1px solid #1a2030",
              borderRadius: 11,
              padding: "7px 12px",
              textAlign: "center",
              minWidth: 56,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#e8eaf0",
                fontFamily: "DM Mono,monospace",
                lineHeight: 1,
              }}
            >
              {pct}%
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#6b7490",
                fontFamily: "DM Mono,monospace",
                marginTop: 2,
              }}
            >
              DONE
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            background: "#131720",
            borderRadius: 4,
            height: 4,
            overflow: "hidden",
            marginBottom: 9,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 4,
              background: "linear-gradient(90deg,#1d4ed8,#22d3ee)",
              transition: "width .5s ease",
            }}
          />
        </div>

        {/* Mini stats — improved contrast + spacing */}
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { v: "12.2 mi", label: "remaining" },
            { v: "2h 11m", label: "est. time" },
            { v: "4:42 PM", label: "done by" },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                paddingLeft: i > 0 ? 12 : 0,
                borderLeft: i > 0 ? "1px solid #1a2030" : "none",
                marginLeft: i > 0 ? 12 : 0,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#c8cbd6",
                  fontFamily: "DM Mono,monospace",
                }}
              >
                {s.v}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "#6b7490",
                  fontFamily: "DM Mono,monospace",
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stop list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: "6px 0 8px",
        }}
      >
        {accounts.map((acc, i) => {
          const stop = stops.find((s) => s.accountId === acc.id) ?? {
            accountId: acc.id,
            status: "pending" as const,
            syncStatus: "local_only" as const,
          };
          // Visual state is driven purely by stop.status so a stale activeStopId
          // (e.g. set by a map-pin tap) never makes a failed stop look active.
          const isDone = stop.status === "done";
          const isFailed = stop.status === "failed" || stop.status === "skipped";
          const isActive = stop.status === "active";

          const outcomeConf = stop.disposition ? OUTCOME_CONFIG[stop.disposition] : null;
          // Failed stops are tappable to open RecoveryScreen for review/edit
          const isTappable = true;

          return (
            <button
              key={acc.id}
              onClick={() => isTappable && onSelectStop(acc.id)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0 12px 0 0",
                textAlign: "left",
                display: "flex",
                alignItems: "stretch",
                // ≥44px touch target enforced via minHeight on inner card below
              }}
            >
              {/* Timeline column */}
              <div
                style={{
                  width: 44,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "8px 0",
                }}
              >
                <div
                  style={{
                    width: 1,
                    flex: "0 0 8px",
                    background:
                      i === 0
                        ? "transparent"
                        : isDone
                          ? "#10b981"
                          : isFailed
                            ? "#ef444466"
                            : "#1a2030",
                  }}
                />
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontFamily: "DM Mono,monospace",
                    fontWeight: 600,
                    background: isDone
                      ? "#0f2010"
                      : isActive
                        ? "#1d4ed8"
                        : isFailed
                          ? "#2d1515"
                          : "#0d1117",
                    border: `2px solid ${
                      isDone ? "#10b981" : isActive ? "#93c5fd" : isFailed ? "#ef4444" : "#1a2030"
                    }`,
                    color: isDone
                      ? "#10b981"
                      : isActive
                        ? "#fff"
                        : isFailed
                          ? "#ef4444"
                          : "#6b7490",
                    animation: isActive ? "pin-pulse 2s ease-in-out infinite" : "none",
                  }}
                >
                  {isDone ? "✓" : isFailed ? "✕" : acc.routeOrder}
                </div>
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    background:
                      i === accounts.length - 1
                        ? "transparent"
                        : isDone
                          ? "#10b981"
                          : isFailed
                            ? "#ef444466"
                            : "#1a2030",
                  }}
                />
              </div>

              {/* Stop card — min 44px touch height */}
              <div
                style={{
                  flex: 1,
                  margin: "5px 0",
                  minHeight: 44,
                  background: isActive
                    ? "rgba(29,78,216,0.08)"
                    : isFailed
                      ? "rgba(239,68,68,0.04)"
                      : "transparent",
                  border: `1px solid ${
                    isActive
                      ? "rgba(59,130,246,0.25)"
                      : isFailed
                        ? "rgba(239,68,68,0.18)"
                        : "transparent"
                  }`,
                  borderRadius: 12,
                  padding: "9px 12px",
                  transition: "all .15s",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Tier + status row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "DM Mono,monospace",
                        color: TIER_COLOR[acc.tier] ?? "#6b7490",
                        background: `${TIER_COLOR[acc.tier]}1a`,
                        borderRadius: 5,
                        padding: "2px 6px",
                      }}
                    >
                      {acc.tier}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono,monospace",
                          color: "#22d3ee",
                        }}
                      >
                        ● HERE NOW
                      </span>
                    )}
                    {isFailed && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono,monospace",
                          color: "#ef4444",
                        }}
                      >
                        ✕ {stop.status === "skipped" ? "SKIPPED" : "FAILED"}
                      </span>
                    )}
                  </div>

                  {/* Account name */}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.25,
                      marginBottom: 3,
                      color: isDone
                        ? "#6b7490"
                        : isFailed
                          ? "#9b7070"
                          : isActive
                            ? "#e8eaf0"
                            : "#c8cbd6",
                    }}
                  >
                    {acc.name}
                  </div>

                  {/* Address */}
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7490",
                      fontFamily: "DM Mono,monospace",
                    }}
                  >
                    {acc.address.split(",")[0]}
                  </div>

                  {/* Outcome badge */}
                  {isDone && outcomeConf && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 5,
                        fontSize: 10,
                        fontFamily: "DM Mono,monospace",
                        color: outcomeConf.color,
                        background: outcomeConf.bg,
                        borderRadius: 6,
                        padding: "3px 8px",
                      }}
                    >
                      <span>{outcomeConf.icon}</span>
                      <span>{outcomeConf.label}</span>
                    </div>
                  )}

                  {/* Failure reason + tap affordance */}
                  {isFailed && (
                    <div style={{ marginTop: 4 }}>
                      {stop.failureReason && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "#9b7070",
                            fontFamily: "DM Mono,monospace",
                            marginBottom: 3,
                          }}
                        >
                          {stop.failureReason.length > 48
                            ? stop.failureReason.slice(0, 48) + "…"
                            : stop.failureReason}
                        </div>
                      )}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10,
                          fontFamily: "DM Mono,monospace",
                          color: "#f59e0b",
                          background: "rgba(245,158,11,0.1)",
                          borderRadius: 6,
                          padding: "2px 7px",
                        }}
                      >
                        📋 Tap to review recovery plan
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column — ETA or status */}
                <div style={{ flexShrink: 0, textAlign: "right", minWidth: 52 }}>
                  {isDone ? (
                    <>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#10b981",
                          fontFamily: "DM Mono,monospace",
                        }}
                      >
                        Done
                      </div>
                      {stop.syncStatus === "local_only" && (
                        <div
                          style={{
                            fontSize: 9,
                            color: "#f59e0b",
                            fontFamily: "DM Mono,monospace",
                            marginTop: 2,
                          }}
                        >
                          ⚡ local
                        </div>
                      )}
                    </>
                  ) : isActive ? (
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "DM Mono,monospace",
                        background: "rgba(29,78,216,0.2)",
                        color: "#93c5fd",
                        borderRadius: 7,
                        padding: "4px 9px",
                      }}
                    >
                      Here now
                    </div>
                  ) : isFailed ? (
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "DM Mono,monospace",
                        color: "#6b3030",
                      }}
                    >
                      {stop.recoveryPlan === "reloop"
                        ? "🔄 Reloop"
                        : stop.recoveryPlan === "call_ahead"
                          ? "📞 Call"
                          : "⏭ Skip"}
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9ba3b8",
                          fontFamily: "DM Mono,monospace",
                        }}
                      >
                        {ETAs[i]}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#6b7490",
                          fontFamily: "DM Mono,monospace",
                          marginTop: 2,
                        }}
                      >
                        ${(acc.revenue / 1000000).toFixed(1)}M
                      </div>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* End day CTA */}
        {doneCount >= 2 && (
          <div style={{ padding: "10px 14px 4px" }}>
            <button
              onClick={onEndDay}
              style={{
                width: "100%",
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 12,
                cursor: "pointer",
                background: "transparent",
                border: "1px solid #1a2030",
                color: "#6b7490",
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <span>📊</span>
              <span>End Day &amp; View Summary</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
