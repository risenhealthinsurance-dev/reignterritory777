import { useState, useEffect } from "react";
import type { Account } from "../data/accounts";
import {
  APEX_AUDIT,
  APEX_SUPPLY_OPPS,
  APEX_PROFILE_EDITS,
  FINDING_CONFIG,
  OPP_CONFIG,
} from "../data/territory_grid";
import type { AuditSection, ProfileEdit } from "../data/territory_grid";
import type { FindingStatus, ConfidenceLevel, QuadrantContext } from "../types";

interface EnrichmentScreenProps {
  account: Account;
  action: string;
  quadrantContext?: QuadrantContext;
  isOffline?: boolean;
  onBack: () => void;
}

type Phase = "loading" | "results" | "edit_review";

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};
const CONFIDENCE_COLOR: Record<ConfidenceLevel, string> = {
  high: "#10b981",
  medium: "#f59e0b",
  low: "#6b7490",
};

const LOADING_STEPS = [
  "Fetching public web presence…",
  "Scanning Google Business Profile…",
  "Reviewing social channels…",
  "Running local search analysis…",
  "Checking conversion readiness…",
  "Identifying supply opportunities…",
];

export function EnrichmentScreen({
  account,
  action,
  quadrantContext,
  isOffline,
  onBack,
}: EnrichmentScreenProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadStep, setLoadStep] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>("Website");
  const [reviewingEdit, setReviewingEdit] = useState<ProfileEdit | null>(null);
  const [approvedEdits, setApprovedEdits] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (phase !== "loading") return;
    if (isOffline) {
      // In offline mode don't actually load — show cached/local state
      setTimeout(() => setPhase("results"), 800);
      return;
    }
    const interval = setInterval(() => {
      setLoadStep((s) => {
        if (s >= LOADING_STEPS.length - 1) {
          clearInterval(interval);
          setTimeout(() => setPhase("results"), 400);
          return s;
        }
        return s + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [phase, isOffline]);

  // ── Loading phase ────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Header
          account={account}
          action={action}
          quadrantContext={quadrantContext}
          onBack={onBack}
          isOffline={isOffline}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: 28,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#1d4ed8,#22d3ee)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(34,211,238,0.4)",
              animation: "spin 1.4s linear infinite",
              fontSize: 22,
            }}
          >
            🔍
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#e8eaf0",
                marginBottom: 6,
              }}
            >
              Enriching business profile
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#22d3ee",
                fontFamily: "DM Mono,monospace",
              }}
            >
              {LOADING_STEPS[loadStep]}
            </div>
          </div>
          <div
            style={{
              width: "100%",
              background: "#0d1117",
              borderRadius: 12,
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {LOADING_STEPS.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: i < loadStep ? "#10b981" : i === loadStep ? "#22d3ee" : "#1a2236",
                    border: `2px solid ${
                      i < loadStep ? "#10b981" : i === loadStep ? "#22d3ee" : "#1a2236"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 7,
                    color: "#fff",
                  }}
                >
                  {i < loadStep ? "✓" : ""}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: i < loadStep ? "#10b981" : i === loadStep ? "#c8cbd6" : "#2d3748",
                    fontFamily: "DM Mono,monospace",
                  }}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "DM Mono,monospace",
              color: "#374151",
              textAlign: "center",
            }}
          >
            All results are evidence-backed drafts for your review. No data is written
            automatically.
          </div>
        </div>
      </div>
    );
  }

  // ── Edit review sub-screen ────────────────────────────────────────────────
  if (phase === "edit_review" && reviewingEdit) {
    const isApproved = approvedEdits.has(reviewingEdit.field);
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div
          style={{
            flexShrink: 0,
            padding: "11px 14px 10px",
            borderBottom: "1px solid #111520",
            background: "#0b0d14",
          }}
        >
          <button
            onClick={() => setPhase("results")}
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
            ← Back to audit
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
            REVIEW PROPOSED EDIT
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e8eaf0" }}>{account.name}</div>
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
          {/* Warning */}
          <div
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, flexShrink: 0 }}>ℹ️</span>
            <div style={{ fontSize: 11, color: "#9ba3b8", lineHeight: 1.4 }}>
              This is a <strong style={{ color: "#e8eaf0" }}>proposed edit</strong>. Approving flags
              it for rep review — nothing is saved or synced until a manager confirms.
            </div>
          </div>

          {/* Field comparison */}
          <div
            style={{
              background: "#0d1117",
              border: "1px solid #1a2030",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {[
              { label: "FIELD", value: reviewingEdit.field, color: undefined },
              {
                label: "CURRENT VALUE",
                value: reviewingEdit.current || "(not set)",
                color: "#ef4444" as string | undefined,
              },
              {
                label: "PROPOSED VALUE",
                value: reviewingEdit.proposed,
                color: "#22d3ee" as string | undefined,
              },
              {
                label: "EVIDENCE",
                value: reviewingEdit.evidence,
                color: undefined,
              },
              {
                label: "CONFIDENCE",
                value: CONFIDENCE_LABEL[reviewingEdit.confidence],
                color: CONFIDENCE_COLOR[reviewingEdit.confidence] as string | undefined,
              },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  padding: "10px 13px",
                  borderBottom: i < arr.length - 1 ? "1px solid #111520" : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: "DM Mono,monospace",
                    color: "#374151",
                    marginBottom: 3,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: row.color ?? "#9ba3b8",
                    lineHeight: 1.4,
                  }}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval actions */}
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
          {!isApproved ? (
            <>
              <button
                onClick={() => {
                  setApprovedEdits((prev) => new Set(prev).add(reviewingEdit.field));
                  setPhase("results");
                }}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg,#064e3b,#10b981)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                ✓ Approve this edit
              </button>
              <button
                onClick={() => setPhase("results")}
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
                ✕ Reject — keep current
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: "11px",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 12,
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#10b981",
                    fontFamily: "DM Mono,monospace",
                  }}
                >
                  ✓ Edit approved · pending manager confirmation
                </span>
              </div>
              <button
                onClick={() => setPhase("results")}
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
                ← Back to audit
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Results phase ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header
        account={account}
        action={action}
        quadrantContext={quadrantContext}
        onBack={onBack}
        isOffline={isOffline}
      />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: "10px 14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Offline banner */}
        {isOffline && (
          <div
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 10,
              padding: "8px 11px",
              display: "flex",
              gap: 7,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13 }}>⚡</span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#f59e0b",
              }}
            >
              Offline · Showing cached enrichment data · not synced
            </span>
          </div>
        )}

        {/* Evidence disclaimer */}
        <div
          style={{
            background: "rgba(34,211,238,0.05)",
            border: "1px solid rgba(34,211,238,0.15)",
            borderRadius: 12,
            padding: "9px 12px",
            display: "flex",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, flexShrink: 0 }}>🔒</span>
          <div
            style={{
              fontSize: 10,
              color: "#6b7490",
              lineHeight: 1.4,
              fontFamily: "DM Mono,monospace",
            }}
          >
            All findings are <strong style={{ color: "#9ba3b8" }}>evidence-backed drafts</strong>.
            No data has been written, no outreach sent, no enrollment made. Each edit requires
            explicit approval.
          </div>
        </div>

        {/* Audit sections */}
        {APEX_AUDIT.map((section: AuditSection) => (
          <AuditSectionBlock
            key={section.title}
            section={section}
            expanded={expandedSection === section.title}
            onToggle={() =>
              setExpandedSection(expandedSection === section.title ? null : section.title)
            }
          />
        ))}

        {/* Supply opportunities */}
        <div>
          <div
            style={{
              fontSize: 9,
              fontFamily: "DM Mono,monospace",
              color: "#374151",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            SUPPLY & OFFER OPPORTUNITIES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {APEX_SUPPLY_OPPS.map((opp) => {
              const labelCfg = OPP_CONFIG[opp.label];
              return (
                <div
                  key={opp.vendor}
                  style={{
                    background: "#0d1117",
                    border: "1px solid #1a2030",
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{opp.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#c8cbd6",
                        }}
                      >
                        {opp.vendor}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono,monospace",
                          color: "#374151",
                        }}
                      >
                        {opp.category}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "DM Mono,monospace",
                        color: labelCfg.color,
                        background: `${labelCfg.color}18`,
                        borderRadius: 5,
                        padding: "2px 7px",
                      }}
                    >
                      {labelCfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7490", lineHeight: 1.45 }}>
                    {opp.detail}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 10,
                      color: CONFIDENCE_COLOR[opp.confidence],
                      fontFamily: "DM Mono,monospace",
                    }}
                  >
                    {CONFIDENCE_LABEL[opp.confidence]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Proposed profile edits */}
        <div>
          <div
            style={{
              fontSize: 9,
              fontFamily: "DM Mono,monospace",
              color: "#374151",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            PROPOSED PROFILE EDITS · REQUIRES APPROVAL
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {APEX_PROFILE_EDITS.map((edit: ProfileEdit) => {
              const isApproved = approvedEdits.has(edit.field);
              return (
                <div
                  key={edit.field}
                  style={{
                    background: isApproved ? "rgba(16,185,129,0.05)" : "#0d1117",
                    border: `1px solid ${isApproved ? "rgba(16,185,129,0.25)" : "#1a2030"}`,
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono,monospace",
                          color: "#374151",
                          marginBottom: 2,
                        }}
                      >
                        {edit.field}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#ef4444",
                          textDecoration: "line-through",
                          marginBottom: 2,
                        }}
                      >
                        {edit.current || "(not set)"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#22d3ee",
                        }}
                      >
                        {edit.proposed}
                      </div>
                    </div>
                    {isApproved ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "DM Mono,monospace",
                          color: "#10b981",
                          flexShrink: 0,
                        }}
                      >
                        ✓ Approved
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "DM Mono,monospace",
                          color: CONFIDENCE_COLOR[edit.confidence],
                          background: `${CONFIDENCE_COLOR[edit.confidence]}18`,
                          borderRadius: 5,
                          padding: "2px 7px",
                          flexShrink: 0,
                        }}
                      >
                        {edit.confidence}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#4b5563",
                      fontFamily: "DM Mono,monospace",
                      marginBottom: 7,
                    }}
                  >
                    {edit.evidence}
                  </div>
                  <button
                    onClick={() => {
                      setReviewingEdit(edit);
                      setPhase("edit_review");
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 9,
                      border: `1px solid ${isApproved ? "rgba(16,185,129,0.3)" : "#1a2236"}`,
                      background: isApproved ? "rgba(16,185,129,0.08)" : "#080a10",
                      color: isApproved ? "#10b981" : "#6b7490",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    {isApproved
                      ? "✓ Approved — tap to review again"
                      : "Review & approve this edit →"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* No-evidence note */}
        <div
          style={{
            background: "#0a0c14",
            border: "1px solid #111520",
            borderRadius: 12,
            padding: "10px 12px",
            display: "flex",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, flexShrink: 0 }}>ℹ️</span>
          <div
            style={{
              fontSize: 10,
              color: "#374151",
              fontFamily: "DM Mono,monospace",
              lineHeight: 1.4,
            }}
          >
            Some fields show "Unknown" where no public evidence was found. These are not inferred —
            Field AI only reports what it can verify.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Header({
  account,
  action,
  quadrantContext,
  onBack,
  isOffline,
}: {
  account: Account;
  action: string;
  quadrantContext?: QuadrantContext;
  isOffline?: boolean;
  onBack: () => void;
}) {
  return (
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
        ← {account.name}
      </button>

      {/* Context strip */}
      {quadrantContext && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
          {[
            `ZIP ${quadrantContext.zipCode}`,
            `Quadrant ${quadrantContext.quadrantId}`,
            `Stop ${quadrantContext.stopIndex}/${quadrantContext.totalStops}`,
          ].map((label) => (
            <span
              key={label}
              style={{
                fontSize: 9,
                fontFamily: "DM Mono,monospace",
                color: "#374151",
                background: "#0d1117",
                border: "1px solid #1a2030",
                borderRadius: 5,
                padding: "2px 7px",
              }}
            >
              {label}
            </span>
          ))}
          {isOffline && (
            <span
              style={{
                fontSize: 9,
                fontFamily: "DM Mono,monospace",
                color: "#f59e0b",
                background: "rgba(245,158,11,0.1)",
                borderRadius: 5,
                padding: "2px 7px",
              }}
            >
              ⚡ Offline
            </span>
          )}
        </div>
      )}

      <div
        style={{
          fontSize: 10,
          fontFamily: "DM Mono,monospace",
          color: "#22d3ee",
          letterSpacing: 0.8,
          marginBottom: 3,
        }}
      >
        ● FIELD AI · {action.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#e8eaf0",
          lineHeight: 1.2,
        }}
      >
        @{account.name}
      </div>
      <div
        style={{
          fontSize: 10,
          fontFamily: "DM Mono,monospace",
          color: "#6b7490",
          marginTop: 2,
        }}
      >
        {account.tier} · {account.industry} ·{" "}
        {account.address.split(",").slice(-2).join(",").trim()}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: FindingStatus }) {
  const cfg = FINDING_CONFIG[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: cfg.dot,
        }}
      />
      <span
        style={{
          fontSize: 9,
          fontFamily: "DM Mono,monospace",
          color: cfg.color,
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

function AuditSectionBlock({
  section,
  expanded,
  onToggle,
}: {
  section: AuditSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const strongCount = section.findings.filter((f) => f.status === "strong").length;
  const issueCount = section.findings.filter(
    (f) => f.status === "missing" || f.status === "partial",
  ).length;

  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #1a2030",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "11px 13px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 9,
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 17, flexShrink: 0 }}>{section.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#c8cbd6" }}>{section.title}</div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "DM Mono,monospace",
              color: "#374151",
              marginTop: 2,
            }}
          >
            {strongCount > 0 && <span style={{ color: "#10b981" }}>{strongCount} strong</span>}
            {strongCount > 0 && issueCount > 0 && <span style={{ color: "#374151" }}> · </span>}
            {issueCount > 0 && (
              <span style={{ color: "#f59e0b" }}>{issueCount} need attention</span>
            )}
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "#374151",
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform .2s",
          }}
        >
          ▶
        </span>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid #111520" }}>
          {section.findings.map((finding, i) => (
            <div
              key={i}
              style={{
                padding: "10px 13px",
                borderBottom: i < section.findings.length - 1 ? "1px solid #0d1117" : "none",
                background: "#080a12",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 5,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#c8cbd6",
                    lineHeight: 1.3,
                    flex: 1,
                  }}
                >
                  {finding.finding}
                </div>
                <StatusDot status={finding.status} />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#22d3ee",
                  marginBottom: 4,
                  lineHeight: 1.35,
                }}
              >
                → {finding.recommendation}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "DM Mono,monospace",
                    color: "#374151",
                  }}
                >
                  SOURCE:
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "DM Mono,monospace",
                    color: "#2d3748",
                  }}
                >
                  {finding.evidence}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 9,
                    fontFamily: "DM Mono,monospace",
                    color: CONFIDENCE_COLOR[finding.confidence],
                  }}
                >
                  {finding.confidence} conf.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
