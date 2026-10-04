import { useState } from "react";
import { A1_STOPS, BADGE_CONFIG } from "../data/territory_grid";
import type { QuadrantStop } from "../data/territory_grid";

interface QuadrantRouteScreenProps {
  quadrantId: string;
  onStartLoop: (firstStopAccountId?: string) => void;
  onSelectStop: (stop: QuadrantStop) => void;
  onBack: () => void;
  isOffline?: boolean;
}

const BADGE_ORDER: Record<string, number> = {
  follow_up: 0,
  reloop: 1,
  retention: 2,
  new_door: 3,
};

export function QuadrantRouteScreen({
  quadrantId,
  onStartLoop,
  onSelectStop,
  onBack,
  isOffline,
}: QuadrantRouteScreenProps) {
  const [showConflict, setShowConflict] = useState(false);
  const [conflictResolved, setConflictResolved] = useState(false);

  const stops = A1_STOPS;

  // Route conflict: Follow-up at Meridian (stop 1) clashes with Retention at Solano (stop 4) timing
  const hasConflict = !conflictResolved;

  function handleStartLoop() {
    if (hasConflict && !showConflict) {
      setShowConflict(true);
    } else {
      onStartLoop(stops[0].accountId);
    }
  }

  // Conflict resolution modal
  if (showConflict) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div
          style={{
            flexShrink: 0,
            padding: "12px 14px 10px",
            borderBottom: "1px solid #111520",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: "DM Mono,monospace",
              color: "#f59e0b",
              letterSpacing: 0.8,
              marginBottom: 4,
            }}
          >
            ⚠ ROUTE CONFLICT DETECTED
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf0" }}>
            Commitment vs. Loop Order
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              background: "rgba(245,158,11,0.07)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 14,
              padding: "12px 13px",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#f59e0b",
                marginBottom: 6,
              }}
            >
              What's conflicting
            </div>
            <div style={{ fontSize: 12, color: "#9ba3b8", lineHeight: 1.5 }}>
              Your counter-clockwise loop puts{" "}
              <strong style={{ color: "#e8eaf0" }}>Solano Healthcare (stop 4)</strong> at 11:30 AM.
              But Maria Trevino's calendar window is{" "}
              <strong style={{ color: "#e8eaf0" }}>10:00–11:00 AM</strong> only — she's in a board
              meeting after that.
            </div>
          </div>

          <div
            style={{
              fontSize: 9,
              fontFamily: "DM Mono,monospace",
              color: "#374151",
              letterSpacing: 0.5,
            }}
          >
            CHOOSE HOW TO PROCEED
          </div>

          {[
            {
              label: "Prioritize Solano — visit by 10:50 AM",
              sub: "Reorder loop: Solano first, then continue counter-clockwise. Saves the commitment.",
              icon: "✅",
              color: "#10b981",
              bg: "rgba(16,185,129,0.08)",
              border: "rgba(16,185,129,0.25)",
              action: () => {
                setConflictResolved(true);
                setShowConflict(false);
              },
            },
            {
              label: "Keep current loop order",
              sub: "Accept that Solano may not be available. Field AI will reschedule the commitment.",
              icon: "🔄",
              color: "#3b82f6",
              bg: "rgba(59,130,246,0.08)",
              border: "rgba(59,130,246,0.25)",
              action: () => {
                setConflictResolved(true);
                setShowConflict(false);
              },
            },
            {
              label: "Call Solano ahead of arrival",
              sub: "Call Maria now to confirm or reschedule. No loop change made.",
              icon: "📞",
              color: "#8b5cf6",
              bg: "rgba(139,92,246,0.08)",
              border: "rgba(139,92,246,0.25)",
              action: () => {
                setConflictResolved(true);
                setShowConflict(false);
              },
            },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              style={{
                width: "100%",
                background: opt.bg,
                border: `1px solid ${opt.border}`,
                borderRadius: 14,
                padding: "13px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{opt.icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: opt.color,
                    marginBottom: 3,
                  }}
                >
                  {opt.label}
                </div>
                <div style={{ fontSize: 11, color: "#6b7490", lineHeight: 1.4 }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
        <div
          style={{
            flexShrink: 0,
            padding: "10px 14px 14px",
            borderTop: "1px solid #111520",
          }}
        >
          <button
            onClick={() => setShowConflict(false)}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 12,
              cursor: "pointer",
              background: "transparent",
              border: "1px solid #1a2030",
              color: "#6b7490",
              fontSize: 13,
            }}
          >
            ← Back to route plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: "11px 14px 10px",
          borderBottom: "1px solid #111520",
          background: "#0b0d14",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#6b7490",
            cursor: "pointer",
            fontSize: 12,
            padding: 0,
            marginBottom: 8,
          }}
        >
          ← {quadrantId} quadrant
        </button>
        <div
          style={{
            fontSize: 10,
            fontFamily: "DM Mono,monospace",
            color: "#22d3ee",
            letterSpacing: 0.8,
            marginBottom: 3,
          }}
        >
          ● {quadrantId} · DAILY ROUTE PLAN · THU OCT 3
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#e8eaf0",
            marginBottom: 8,
          }}
        >
          Counter-clockwise loop
        </div>

        {/* Offline banner */}
        {isOffline && (
          <div
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 8,
              padding: "6px 10px",
              marginBottom: 8,
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11 }}>⚡</span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#f59e0b",
              }}
            >
              Offline · Local only route · will sync when online
            </span>
          </div>
        )}

        {/* Rationale */}
        <div
          style={{
            background: "rgba(34,211,238,0.06)",
            border: "1px solid rgba(34,211,238,0.15)",
            borderRadius: 10,
            padding: "8px 10px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: "DM Mono,monospace",
              color: "#22d3ee",
              marginBottom: 4,
            }}
          >
            AI ROUTE RATIONALE
          </div>
          <div style={{ fontSize: 11, color: "#9ba3b8", lineHeight: 1.45 }}>
            <strong style={{ color: "#e8eaf0" }}>2 commitments due</strong> ·{" "}
            <strong style={{ color: "#f59e0b" }}>1 nearby reloop</strong> ·{" "}
            <strong style={{ color: "#10b981" }}>5 new doors</strong> ·{" "}
            <strong style={{ color: "#22d3ee" }}>12 min saved</strong> by staying in quadrant
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 0, marginTop: 8 }}>
          {[
            { v: `${stops.length} stops`, label: "planned" },
            { v: "14.4 mi", label: "total" },
            { v: "5h 10m", label: "est." },
            { v: "2:15 PM", label: "done by" },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                paddingLeft: i > 0 ? 10 : 0,
                borderLeft: i > 0 ? "1px solid #1a2030" : "none",
                marginLeft: i > 0 ? 10 : 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#c8cbd6",
                  fontFamily: "DM Mono,monospace",
                }}
              >
                {s.v}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: "#374151",
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
          padding: "6px 0 4px",
        }}
      >
        {/* Start point */}
        <div style={{ padding: "0 14px", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22d3ee",
                flexShrink: 0,
                marginLeft: 9,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#22d3ee",
              }}
            >
              START · Current location
            </span>
          </div>
          <div
            style={{
              width: 1,
              height: 10,
              background: "#1a2236",
              marginLeft: 12.5,
            }}
          />
        </div>

        {stops.map((stop, i) => {
          const badge = BADGE_CONFIG[stop.type];
          const isHighPriority = BADGE_ORDER[stop.type] <= 1;
          return (
            <button
              key={stop.id}
              onClick={() => onSelectStop(stop)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0 14px 0 0",
                textAlign: "left",
                display: "flex",
                alignItems: "stretch",
              }}
            >
              {/* Timeline */}
              <div
                style={{
                  width: 30,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "4px 0",
                }}
              >
                <div style={{ width: 1, flex: "0 0 6px", background: "#1a2236" }} />
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontFamily: "DM Mono,monospace",
                    fontWeight: 700,
                    background: isHighPriority ? `${badge.color}22` : "#0d1117",
                    border: `1.5px solid ${isHighPriority ? badge.color : "#1a2236"}`,
                    color: isHighPriority ? badge.color : "#374151",
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    width: 1,
                    flex: 1,
                    background: i < stops.length - 1 ? "#1a2236" : "transparent",
                  }}
                />
              </div>

              {/* Card */}
              <div
                style={{
                  flex: 1,
                  margin: "4px 0",
                  minHeight: 44,
                  background: isHighPriority ? "rgba(13,17,27,0.8)" : "transparent",
                  border: `1px solid ${isHighPriority ? "#1a2236" : "transparent"}`,
                  borderRadius: 12,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "DM Mono,monospace",
                        color: badge.color,
                        background: badge.bg,
                        borderRadius: 5,
                        padding: "2px 6px",
                      }}
                    >
                      {badge.label}
                    </span>
                    {isHighPriority && (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "DM Mono,monospace",
                          color: "#ef4444",
                        }}
                      >
                        ● DUE
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#c8cbd6",
                      lineHeight: 1.2,
                      marginBottom: 2,
                    }}
                  >
                    {stop.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#374151",
                      fontFamily: "DM Mono,monospace",
                    }}
                  >
                    {stop.address}
                  </div>
                  {/* Direction arrow suggestion */}
                  <div
                    style={{
                      fontSize: 9,
                      color: "#1d2535",
                      fontFamily: "DM Mono,monospace",
                      marginTop: 3,
                    }}
                  >
                    {i < stops.length - 1 ? "↙ Continue CCW" : "↩ Loop complete"}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#9ba3b8",
                      fontFamily: "DM Mono,monospace",
                    }}
                  >
                    {stop.eta}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#374151",
                      fontFamily: "DM Mono,monospace",
                      marginTop: 1,
                    }}
                  >
                    {stop.distance}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* End point */}
        <div style={{ padding: "0 14px", marginTop: 2, marginBottom: 8 }}>
          <div
            style={{
              width: 1,
              height: 8,
              background: "#1a2236",
              marginLeft: 12.5,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "#1a2236",
                border: "1px solid #374151",
                flexShrink: 0,
                marginLeft: 8,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#374151",
              }}
            >
              EXIT · Return or next quadrant
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 14px 16px",
          borderTop: "1px solid #111520",
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <button
          onClick={handleStartLoop}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg,#0c2a5e,#1d4ed8,#22d3ee)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span>🔄</span>
          <span>Start quadrant loop</span>
        </button>
        <button
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 12,
            border: "1px solid #1a2030",
            background: "transparent",
            color: "#6b7490",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Schedule for later
        </button>
      </div>
    </div>
  );
}
