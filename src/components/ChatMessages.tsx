import { useEffect, useRef, Fragment } from "react";
import type { Message, ToolCall, CardData } from "../types";
import { accounts } from "../data/accounts";
import { RouteCard } from "./cards/RouteCard";
import { AccountCard } from "./cards/AccountCard";
import { DispositionCard } from "./cards/DispositionCard";
import { FollowUpCard } from "./cards/FollowUpCard";
import { SummaryCard } from "./cards/SummaryCard";

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  streamingId: string | null;
  streamingGen: AsyncGenerator<string> | null;
  onStreamChar: (id: string, char: string) => void;
  onStreamDone: (id: string) => void;
  onCardUpdate: (messageId: string, update: Partial<CardData>) => void;
  onLogVisit: (accountId: string) => void;
}

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
  const icon = TOOL_ICONS[tool.name] ?? "⚙";
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
      style={{ background: "#0a0f1a", border: "1px solid #1e2a3a" }}
    >
      <span className="text-[11px]">{icon}</span>
      <span className="text-[10px] font-mono text-[#4b5563] capitalize">
        {tool.name.replace(/_/g, " ")}
      </span>
      {tool.result && (
        <>
          <span className="text-[#2d3748] text-[10px]">→</span>
          <span className="text-[10px] font-mono text-[#22d3ee]">{tool.result}</span>
        </>
      )}
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="text-[11px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: "#0d1117", color: "#22d3ee" }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function CardRenderer({
  card,
  onCardUpdate,
  messageId,
  onLogVisit,
}: {
  card: CardData;
  messageId: string;
  onCardUpdate: (id: string, u: Partial<CardData>) => void;
  onLogVisit: (accountId: string) => void;
}) {
  if (card.type === "route") {
    return <RouteCard data={card} onStartNavigation={() => {}} />;
  }
  if (card.type === "account") {
    const acc = accounts.find((a) => a.id === card.accountId);
    if (!acc) return null;
    return (
      <AccountCard
        account={acc}
        onCall={() => {}}
        onNavigate={() => {}}
        onLogVisit={() => onLogVisit(acc.id)}
      />
    );
  }
  if (card.type === "disposition") {
    return (
      <DispositionCard
        data={card}
        onUpdate={(outcome, note) => onCardUpdate(messageId, { selectedOutcome: outcome, note })}
      />
    );
  }
  if (card.type === "followup") {
    return (
      <FollowUpCard
        data={card}
        onUpdate={(date, time, note) =>
          onCardUpdate(messageId, {
            selectedDate: date,
            selectedTime: time,
            note,
          })
        }
      />
    );
  }
  if (card.type === "summary") {
    return <SummaryCard data={card} onSend={() => {}} />;
  }
  return null;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessages({
  messages,
  isTyping,
  streamingId,
  streamingGen,
  onStreamChar,
  onStreamDone,
  onCardUpdate,
  onLogVisit,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Run streaming generator
  useEffect(() => {
    if (!streamingGen || !streamingId) return;
    let cancelled = false;
    (async () => {
      for await (const char of streamingGen) {
        if (cancelled) break;
        onStreamChar(streamingId, char);
        // tiny yield so React can batch renders
        await new Promise((r) => setTimeout(r, 0));
      }
      if (!cancelled) onStreamDone(streamingId);
    })();
    return () => {
      cancelled = true;
    };
  }, [streamingGen, streamingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  return (
    <div className="messages-scroll flex-1 px-4 py-3 space-y-4" style={{ minHeight: 0 }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div className="max-w-[88%] w-full">
            {msg.role === "assistant" && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
                <span className="text-[10px] font-mono text-[#374151]">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            )}

            {/* Text bubble */}
            {msg.content && (
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                  msg.streaming ? "streaming-cursor" : ""
                }`}
                style={
                  msg.role === "user"
                    ? {
                        background: "#162035",
                        color: "#c8d8f0",
                        borderBottomRightRadius: 4,
                        border: "1px solid #1e3050",
                      }
                    : {
                        background: "#13161d",
                        color: "#c8cbd6",
                        border: "1px solid #1e2230",
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                {renderMarkdown(msg.content)}
              </div>
            )}

            {/* Card */}
            {msg.card && !msg.streaming && (
              <CardRenderer
                card={msg.card}
                messageId={msg.id}
                onCardUpdate={onCardUpdate}
                onLogVisit={onLogVisit}
              />
            )}

            {/* Tool calls */}
            {msg.toolCalls && msg.toolCalls.length > 0 && !msg.streaming && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {msg.toolCalls.map((t, i) => (
                  <ToolBadge key={i} tool={t} />
                ))}
              </div>
            )}

            {msg.role === "user" && (
              <div className="flex justify-end mt-1">
                <span className="text-[10px] font-mono text-[#374151]">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start">
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "#13161d",
              border: "1px solid #1e2230",
              borderBottomLeftRadius: 4,
            }}
          >
            <div className="flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"
                  style={{
                    animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
      <style>{`
        @keyframes dot-pulse {
          0%,80%,100%{opacity:0.3;transform:scale(0.8)}
          40%{opacity:1;transform:scale(1)}
        }
      `}</style>
    </div>
  );
}
