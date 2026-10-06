import { useState, useCallback, useRef, useEffect, Fragment, lazy, Suspense } from "react";
import type { SetStateAction } from "react";
import type {
  Message,
  CardData,
  ToolCall,
  AppScreen,
  StopRecord,
  DraftDisposition,
  FollowUpDraft,
} from "./types";
import { accounts } from "./data/accounts";
import { territory } from "./data/territory";
import { getAIResponse } from "./lib/ai";
import { BottomNav } from "./components/BottomNav";
import { RouteCard } from "./components/cards/RouteCard";
import { AccountCard } from "./components/cards/AccountCard";
import { DispositionCard } from "./components/cards/DispositionCard";
import { FollowUpCard } from "./components/cards/FollowUpCard";
import { SummaryCard } from "./components/cards/SummaryCard";
import { ActionSheet } from "./components/ActionSheet";
import { KickoffScreen } from "./screens/KickoffScreen";
import { RouteScreen } from "./screens/RouteScreen";
import { StopScreen } from "./screens/StopScreen";
import { DispositionScreen } from "./screens/DispositionScreen";
import { FollowUpScreen } from "./screens/FollowUpScreen";
import { RecoveryScreen } from "./screens/RecoveryScreen";
import { SummaryScreen } from "./screens/SummaryScreen";
import { TerritoryOverviewScreen } from "./screens/TerritoryOverviewScreen";
import { ActiveQuadrantScreen } from "./screens/ActiveQuadrantScreen";
import { QuadrantRouteScreen } from "./screens/QuadrantRouteScreen";
import { EnrichmentScreen } from "./screens/EnrichmentScreen";
import { FieldAIScreen } from "./screens/FieldAIScreen";
import { TodayCockpitScreen } from "./screens/TodayCockpitScreen";
import { A1_STOPS } from "./data/territory_grid";
import type { QuadrantStop } from "./data/territory_grid";
import type { QuadrantContext } from "./types";
import {
  applyRouteChange,
  closeRepDay,
  completeVisit,
  createInitialRepDay,
  failVisit,
  getSyncQueue,
  previewRouteChange,
  recordCorrection,
  resolveStop,
  sendManagerSummary,
  updateManagerSummary,
} from "./domain/repDay";
import type { DayStop, RouteProposal } from "./domain/repDay";
import { fixtureRepBrief, fetchRepBrief, readCachedRepBrief } from "./lib/repBrief";
import type { RepBriefResponse } from "./contracts/repBrief";

const MapView = lazy(() =>
  import("./components/MapView").then((module) => ({ default: module.MapView })),
);

const MAP_H = 340;
const PLACEHOLDERS = [
  "Ask anything…",
  "Log a call…",
  "Plan my route…",
  "Add a note…",
  "Look up an account…",
];

const TOOL_ICONS: Record<string, string> = {
  plan_route: "🗺",
  log_disposition: "📋",
  add_note: "📝",
  schedule_followup: "📅",
  lookup_account: "🏢",
  send_summary: "📤",
  update_crm: "🔄",
};

function ToolBadge({ tool }: { tool: ToolCall }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "#080c14",
        border: "1px solid #1a2336",
        borderRadius: 8,
        padding: "3px 9px",
        marginTop: 5,
        marginRight: 4,
      }}
    >
      <span style={{ fontSize: 11 }}>{TOOL_ICONS[tool.name] ?? "⚙"}</span>
      <span
        style={{
          fontSize: 10,
          fontFamily: "DM Mono,monospace",
          color: "#4b5563",
          textTransform: "capitalize",
        }}
      >
        {tool.name.replace(/_/g, " ")}
      </span>
      {tool.result && (
        <>
          <span style={{ color: "#2d3748", fontSize: 10 }}>→</span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "DM Mono,monospace",
              color: "#22d3ee",
            }}
          >
            {tool.result}
          </span>
        </>
      )}
    </div>
  );
}

function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return (
        <strong key={i} style={{ color: "#fff", fontWeight: 600 }}>
          {p.slice(2, -2)}
        </strong>
      );
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code
          key={i}
          style={{
            fontFamily: "DM Mono,monospace",
            fontSize: 11,
            background: "#080c14",
            color: "#22d3ee",
            padding: "1px 6px",
            borderRadius: 5,
          }}
        >
          {p.slice(1, -1)}
        </code>
      );
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CardRenderer({
  card,
  messageId,
  onCardUpdate,
  onLogVisit,
}: {
  card: CardData;
  messageId: string;
  onCardUpdate: (id: string, u: Partial<CardData>) => void;
  onLogVisit: (id: string) => void;
}) {
  if (card.type === "route") return <RouteCard data={card} />;
  if (card.type === "account") {
    const acc = accounts.find((a) => a.id === card.accountId);
    if (!acc) return null;
    return <AccountCard account={acc} onLogVisit={() => onLogVisit(acc.id)} />;
  }
  if (card.type === "disposition")
    return (
      <DispositionCard
        data={card}
        onUpdate={(o, n) => onCardUpdate(messageId, { selectedOutcome: o, note: n })}
      />
    );
  if (card.type === "followup")
    return (
      <FollowUpCard
        data={card}
        onUpdate={(d, t, n) =>
          onCardUpdate(messageId, { selectedDate: d, selectedTime: t, note: n })
        }
      />
    );
  if (card.type === "summary") return <SummaryCard data={card} />;
  return null;
}

// ── Seed chat messages ──────────────────────────────────────────────────────
const SEED_MESSAGES: Message[] = [
  {
    id: "init-1",
    role: "assistant",
    content:
      "Good morning. **6 stops planned** in Fort Pierce 34950 — Meridian and Pacific are already done. Your next stop is **Apex Manufacturing**, the highest-priority account today. Robert has a board meeting Oct 14. What do you need?",
    toolCalls: [],
    timestamp: new Date(Date.now() - 8 * 60000),
  },
];

interface AppProps {
  initialScreen?: AppScreen;
  initialAccountId?: string | null;
}

export default function App({ initialScreen = "today", initialAccountId = "apex" }: AppProps) {
  const [screen, setScreen] = useState<AppScreen>(initialScreen);
  const [activeStopId, setActiveStopId] = useState<string | null>(initialAccountId);
  const [day, setDay] = useState(createInitialRepDay);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [activeQuadrantId, setActiveQuadrantId] = useState<string>("A1");
  const [enrichmentAction, setEnrichmentAction] = useState<string>("enrich");
  const [quadrantContext, setQuadrantContext] = useState<QuadrantContext | null>(null);
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingGen, setStreamingGen] = useState<AsyncGenerator<string> | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [repBrief, setRepBrief] = useState<RepBriefResponse>(() => readCachedRepBrief() ?? fixtureRepBrief);
  const [briefCached, setBriefCached] = useState(() => Boolean(readCachedRepBrief()));
  const [briefLoading, setBriefLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [vh, setVh] = useState(window.innerHeight);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const mapHeight = mapExpanded ? Math.max(vh - 190, MAP_H) : MAP_H;
  const showMap = screen !== "chat" && screen !== "summary";

  const stops = day.stops;
  const setStops = useCallback((update: SetStateAction<DayStop[]>) => {
    setDay((current) => ({
      ...current,
      stops: typeof update === "function" ? update(current.stops) : update,
    }));
  }, []);
  const completedStops = stops.filter((s) => s.status === "done");
  const doneIds = completedStops.map((s) => s.accountId);
  const unsyncedCount = getSyncQueue(day).length;

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const updateConnectivity = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", updateConnectivity);
    window.addEventListener("offline", updateConnectivity);
    return () => {
      window.removeEventListener("online", updateConnectivity);
      window.removeEventListener("offline", updateConnectivity);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length), 3200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (screen === "chat") {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages.length, isTyping, screen]);

  // Streaming consumer
  useEffect(() => {
    if (!streamingId || !streamingGen) return;
    let cancelled = false;
    const id = streamingId;
    const gen = streamingGen;
    (async () => {
      for await (const char of gen) {
        if (cancelled) break;
        setMessages((p) => p.map((m) => (m.id === id ? { ...m, content: m.content + char } : m)));
        await new Promise((r) => setTimeout(r, 0));
      }
      if (!cancelled) {
        setMessages((p) => p.map((m) => (m.id === id ? { ...m, streaming: false } : m)));
        setStreamingId(null);
        setStreamingGen(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [streamingId, streamingGen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;
      setMessages((p) => [
        ...p,
        {
          id: `u-${Date.now()}`,
          role: "user",
          content: text.trim(),
          timestamp: new Date(),
        },
      ]);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setIsTyping(true);
      if (screen !== "chat") setScreen("chat");

      await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));

      const { textGen, card } = getAIResponse(text, []);
      const aiId = `a-${Date.now()}`;
      const toolName = card
        ? card.type === "route"
          ? "plan_route"
          : card.type === "account"
            ? "lookup_account"
            : card.type === "disposition"
              ? "log_disposition"
              : card.type === "followup"
                ? "schedule_followup"
                : "send_summary"
        : null;

      setMessages((p) => [
        ...p,
        {
          id: aiId,
          role: "assistant",
          content: "",
          streaming: true,
          card,
          toolCalls: toolName ? [{ name: toolName, args: "{}", result: "✓" }] : [],
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
      setStreamingId(aiId);
      setStreamingGen(textGen);
    },
    [isTyping, screen],
  );

  const onCardUpdate = useCallback(
    (messageId: string, update: Partial<CardData>) => {
      setMessages((p) =>
        p.map((m) =>
          m.id === messageId && m.card ? { ...m, card: { ...m.card, ...update } as CardData } : m,
        ),
      );
      const u = update as Record<string, string>;
      setTimeout(() => {
        if (u.selectedOutcome)
          sendMessage(`Logged as "${u.selectedOutcome}".${u.note ? ` Notes: ${u.note}` : ""}`);
        else if (u.selectedDate)
          sendMessage(`Follow-up confirmed for ${u.selectedDate} at ${u.selectedTime}.`);
      }, 600);
    },
    [sendMessage],
  );

  const onPinTap = useCallback((id: string) => {
    setActiveStopId(id);
    setDay((current) => ({ ...current, currentStopId: id }));
    setScreen("stop");
  }, []);

  const onLogVisit = useCallback((id: string) => {
    setActiveStopId(id);
    setDay((current) => ({ ...current, currentStopId: id }));
    setScreen("disposition");
  }, []);

  const handleDispositionConfirm = useCallback((draft: DraftDisposition) => {
    setDay((current) => completeVisit(current, draft, new Date()));
    setScreen("route");
    setActiveStopId(null);
  }, []);

  const handleFollowUpConfirm = useCallback((fu: FollowUpDraft) => {
    const mutatedAt = new Date();
    setDay((current) => ({
      ...current,
      stops: current.stops.map((stop) =>
        stop.accountId === fu.stopId
          ? {
              ...stop,
              followUpDate: fu.date,
              followUpTime: fu.time,
              nextAction: fu.agenda,
              syncStatus: "local_only",
              mutatedAt,
            }
          : stop,
      ),
    }));
    setScreen("stop");
  }, []);

  const handleSkip = useCallback(
    (failureReason?: string, recoveryPlan?: "skip" | "reloop" | "call_ahead") => {
      if (!activeStopId) return;
      setDay((current) =>
        failVisit(current, activeStopId, failureReason, recoveryPlan, new Date()),
      );
      setScreen("route");
      setActiveStopId(null);
    },
    [activeStopId],
  );

  const onAction = useCallback(
    (action: string) => {
      const m: Record<string, string> = {
        route: "Plan my optimized route for today.",
        pin: "Drop a pin at my current location.",
        photo: "Attach a photo to this account.",
        voice: "Add a voice note.",
        file: "Attach a file.",
      };
      sendMessage(m[action] ?? "Help.");
      setActionSheetOpen(false);
    },
    [sendMessage],
  );

  const doSend = () => {
    if (input.trim() && !isTyping) {
      sendMessage(input.trim());
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const activeAccount = activeStopId ? (accounts.find((a) => a.id === activeStopId) ?? null) : null;
  const activeStop = activeStopId
    ? (stops.find((s) => s.accountId === activeStopId) ?? null)
    : null;

  const confirmArrival = useCallback(() => {
    if (!activeStopId) return;
    setDay((current) => ({
      ...current,
      currentStopId: activeStopId,
      stops: current.stops.map((stop) =>
        stop.accountId === activeStopId
          ? {
              ...stop,
              status: "active",
              arrivedAt: new Date(),
              syncStatus: "local_only",
              mutatedAt: new Date(),
            }
          : stop,
      ),
    }));
  }, [activeStopId]);

  const startVisit = useCallback(() => {
    if (!activeStopId) return;
    setDay((current) => ({
      ...current,
      currentStopId: activeStopId,
      stops: current.stops.map((stop) =>
        stop.accountId === activeStopId
          ? {
              ...stop,
              visitStartedAt: new Date(),
              syncStatus: "local_only",
              mutatedAt: new Date(),
            }
          : stop,
      ),
    }));
  }, [activeStopId]);

  useEffect(() => {
    const requiresSelection = [
      "stop",
      "disposition",
      "followup",
      "recovery",
      "enrichment",
    ].includes(screen);
    if (requiresSelection && (!activeAccount || !activeStop)) {
      setScreen("route");
      setActiveStopId(null);
    }
  }, [screen, activeAccount, activeStop]);

  // Map pin highlight: show active stop when on stop screen, else show all
  const mapActiveId =
    screen === "stop" || screen === "disposition" || screen === "followup" || screen === "recovery"
      ? activeStopId
      : null;

  const nextBriefAccount = repBrief.accounts.find((account) => !stops.find((stop) => stop.accountId === account.businessId)?.status || stops.find((stop) => stop.accountId === account.businessId)?.status === "pending") ?? repBrief.accounts[0];

  const refreshBrief = async () => {
    setBriefLoading(true);
    try {
      const fresh = await fetchRepBrief();
      setRepBrief(fresh);
      setBriefCached(false);
    } catch {
      setBriefCached(true);
    } finally {
      setBriefLoading(false);
    }
  };

  // ── Render bottom panel content ─────────────────────────────────────────
  function renderPanel() {
    if (screen === "today" && nextBriefAccount) {
      return (
        <TodayCockpitScreen
          brief={repBrief}
          nextAccount={nextBriefAccount}
          cached={briefCached}
          loading={briefLoading}
          onRefresh={refreshBrief}
          onOpenBrief={() => {
            setActiveStopId(nextBriefAccount.businessId);
            setScreen("stop");
          }}
          onStartVisit={() => {
            setActiveStopId(nextBriefAccount.businessId);
            setDay((current) => ({ ...current, currentStopId: nextBriefAccount.businessId }));
            setScreen("stop");
          }}
          onOpenTerritory={() => setScreen("territory")}
        />
      );
    }

    if (screen === "kickoff") {
      return (
        <KickoffScreen
          territory={territory}
          stops={stops}
          onStartRoute={() => setScreen("route")}
          onOpenChat={() => setScreen("chat")}
        />
      );
    }

    if (screen === "route") {
      return (
        <RouteScreen
          stops={stops}
          routeStopIds={day.routeStopIds}
          currentStopId={day.currentStopId}
          mapExpanded={mapExpanded}
          onToggleMap={() => setMapExpanded((expanded) => !expanded)}
          onSelectStop={(id) => {
            setActiveStopId(id);
            setDay((current) => ({ ...current, currentStopId: id }));
            const s = stops.find((s) => s.accountId === id);
            // Failed/skipped stops open RecoveryScreen directly from route
            if (s?.status === "failed" || s?.status === "skipped") {
              setScreen("recovery");
            } else {
              setScreen("stop");
            }
          }}
          onEditRoute={() => setScreen("quad_route")}
          onEndDay={() => setScreen("summary")}
        />
      );
    }

    if (screen === "stop" && activeAccount && activeStop) {
      return (
        <StopScreen
          account={activeAccount}
          stop={activeStop}
          onConfirmArrival={confirmArrival}
          onStartVisit={startVisit}
          onLogVisit={() => setScreen("disposition")}
          onScheduleFollowUp={() => setScreen("followup")}
          onReportFailed={() => setScreen("recovery")}
          onBack={() => setScreen("route")}
          quadrantContext={quadrantContext ?? undefined}
          onEnrich={
            quadrantContext
              ? (action) => {
                  setEnrichmentAction(action);
                  setScreen("enrichment");
                }
              : undefined
          }
        />
      );
    }

    if (screen === "disposition" && activeAccount) {
      return (
        <DispositionScreen
          account={activeAccount}
          onConfirm={handleDispositionConfirm}
          onCancel={() => setScreen("stop")}
        />
      );
    }

    if (screen === "followup" && activeAccount) {
      return (
        <FollowUpScreen
          account={activeAccount}
          onConfirm={handleFollowUpConfirm}
          onCancel={() => setScreen("stop")}
        />
      );
    }

    if (screen === "recovery" && activeAccount) {
      // If the stop is already logged as failed, we came from Route — back goes to Route.
      // If the stop is active/pending, we came from StopScreen — back goes to Stop.
      const cameFromRoute = activeStop?.status === "failed" || activeStop?.status === "skipped";
      return (
        <RecoveryScreen
          account={activeAccount}
          initialFailureReason={activeStop?.failureReason}
          initialRecoveryPlan={activeStop?.recoveryPlan}
          onSkip={(reason, plan) => handleSkip(reason, plan)}
          onReloop={(id, reason) => handleSkip(reason, "reloop")}
          onCallAhead={(reason) => {
            handleSkip(reason, "call_ahead");
            setScreen("stop");
          }}
          onCancel={() => setScreen(cameFromRoute ? "route" : "stop")}
        />
      );
    }

    if (screen === "territory") {
      return (
        <TerritoryOverviewScreen
          onViewQuadrant={(id) => {
            setActiveQuadrantId(id);
            setScreen("quadrant");
          }}
          onPlanToday={() => {
            setActiveQuadrantId("A1");
            setScreen("quad_route");
          }}
        />
      );
    }

    if (screen === "quadrant") {
      return (
        <ActiveQuadrantScreen
          quadrantId={activeQuadrantId}
          onPlanRoute={() => setScreen("quad_route")}
          onBack={() => setScreen("territory")}
        />
      );
    }

    if (screen === "quad_route") {
      return (
        <QuadrantRouteScreen
          quadrantId={activeQuadrantId}
          routeStopIds={day.routeStopIds}
          onPreviewRoute={(ids) => {
            const proposal = previewRouteChange(day, ids);
            setDay((current) => ({ ...current, routeProposal: proposal }));
            return proposal;
          }}
          onApplyRoute={(proposal: RouteProposal) => {
            setDay((current) =>
              applyRouteChange({ ...current, routeProposal: proposal }, proposal.id),
            );
          }}
          onStartLoop={(firstAccountId) => {
            if (firstAccountId) {
              setActiveStopId(firstAccountId);
              setDay((current) => ({ ...current, currentStopId: firstAccountId }));
              setQuadrantContext({
                zipCode: "34950",
                quadrantId: activeQuadrantId,
                stopIndex: 1,
                totalStops: A1_STOPS.length,
              });
            }
            setScreen("route");
          }}
          onSelectStop={(stop: QuadrantStop) => {
            if (stop.accountId) {
              const idx = A1_STOPS.findIndex((s) => s.id === stop.id);
              setActiveStopId(stop.accountId);
              setQuadrantContext({
                zipCode: "34950",
                quadrantId: activeQuadrantId,
                stopIndex: idx + 1,
                totalStops: A1_STOPS.length,
              });
              setScreen("stop");
            }
          }}
          onBack={() => setScreen("quadrant")}
        />
      );
    }

    if (screen === "enrichment" && activeAccount) {
      return (
        <EnrichmentScreen
          account={activeAccount}
          action={enrichmentAction}
          quadrantContext={quadrantContext ?? undefined}
          onBack={() => setScreen("stop")}
        />
      );
    }

    if (screen === "summary") {
      return (
        <SummaryScreen
          day={day}
          onResolveStop={(accountId, resolution) =>
            setDay((current) => resolveStop(current, accountId, resolution))
          }
          onSync={() => {
            setStops((p) =>
              p.map((s) =>
                s.syncStatus === "local_only" || s.syncStatus === "error"
                  ? { ...s, syncStatus: "queued" as const }
                  : s,
              ),
            );
            setTimeout(
              () =>
                setDay((current) => ({
                  ...current,
                  stops: current.stops.map((stop) =>
                    stop.syncStatus === "queued"
                      ? { ...stop, syncStatus: "synced" as const }
                      : stop,
                  ),
                  closeoutSyncState: current.closedAt ? "fully_synced" : current.closeoutSyncState,
                })),
              1600,
            );
          }}
          onCloseDay={(isOffline) =>
            setDay((current) => closeRepDay(current, new Date(), isOffline))
          }
          isOffline={isOffline}
          onManagerDraftChange={(draft) =>
            setDay((current) => updateManagerSummary(current, draft))
          }
          onSendToManager={() => setDay((current) => sendManagerSummary(current, new Date()))}
          onRecordCorrection={(correction) =>
            setDay((current) => recordCorrection(current, correction))
          }
        />
      );
    }

    // Field AI screen
    return (
      <FieldAIScreen
        currentAccountId={day.currentStopId}
        isOffline={isOffline}
        onQueueAction={(action) => {
          if (!action.accountId) return;
          setDay((current) => ({
            ...current,
            stops: current.stops.map((stop) =>
              stop.accountId === action.accountId
                ? { ...stop, syncStatus: "queued" as const, mutatedAt: new Date() }
                : stop,
            ),
          }));
        }}
      />
    );
  }

  return (
    <div
      data-app-shell
      style={{
        position: "fixed",
        inset: "0 auto 0 50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 390,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#060810",
        fontFamily: "Inter,sans-serif",
        boxShadow: "0 0 48px rgba(0,0,0,.35)",
      }}
    >
      {/* ══ MAP ══════════════════════════════════════════ */}
      {showMap && (
        <div style={{ height: mapHeight, flexShrink: 0, position: "relative" }}>
          {vh > 0 && (
            <Suspense
              fallback={
                <div className="map-loading" aria-label="Loading territory map">
                  Loading map…
                </div>
              }
            >
              <MapView
                key={day.routeStopIds.join(">")}
                height={mapHeight}
                accounts={accounts}
                routeStopIds={day.routeStopIds}
                activeAccountId={mapActiveId}
                onPinTap={onPinTap}
                doneAccountIds={doneIds}
                showTerritoryMode={
                  screen === "territory" || screen === "quadrant" || screen === "quad_route"
                }
                activeQuadrantId={activeQuadrantId}
                onQuadrantTap={(id) => {
                  setActiveQuadrantId(id);
                  setScreen("quadrant");
                }}
              />
            </Suspense>
          )}
        </div>
      )}

      {/* ══ PANEL ═══════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          background: "#0b0d14",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Screen content */}
        <main style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{renderPanel()}</main>

        {/* Bottom nav */}
        <BottomNav
          current={screen}
          onNavigate={(s) => {
            if (s === "route") {
              setScreen(completedStops.length === stops.length ? "summary" : "route");
            } else if (s === "territory") {
              setScreen("territory");
            } else {
              setScreen(s);
            }
          }}
          unsyncedCount={unsyncedCount}
          completedCount={completedStops.length}
          totalCount={stops.length}
        />
      </div>

      <ActionSheet
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onAction={onAction}
      />

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dot { 0%,80%,100%{opacity:.3;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
