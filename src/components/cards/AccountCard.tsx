import type { Account } from "../../data/accounts";

interface AccountCardProps {
  account: Account;
  onCall?: () => void;
  onNavigate?: () => void;
  onLogVisit?: () => void;
}

const TIER_COLORS = {
  Enterprise: { bg: "#0d1a35", border: "#1e3a70", text: "#60a5fa" },
  "Mid-Market": { bg: "#0d1f24", border: "#1e4a54", text: "#22d3ee" },
  SMB: { bg: "#0d2013", border: "#1e4a2a", text: "#4ade80" },
};

const INDUSTRY_ICONS: Record<string, string> = {
  Healthcare: "🏥",
  Manufacturing: "🏭",
  Logistics: "🚚",
  Technology: "💻",
};

const ACTIVITY_ICONS = { call: "📞", email: "✉️", visit: "🚶" };

function fmtRevenue(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export function AccountCard({ account, onCall, onNavigate, onLogVisit }: AccountCardProps) {
  const tier = TIER_COLORS[account.tier];

  return (
    <div className="ai-card">
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid #1a2236" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[13px]">{INDUSTRY_ICONS[account.industry]}</span>
              <span className="text-[15px] font-semibold text-[#e8eaf0] leading-tight">
                {account.name}
              </span>
            </div>
            <span className="text-[12px] text-[#9ba3b8] mt-0.5">
              {account.contact.name} · {account.contact.title}
            </span>
            <span className="text-[11px] font-mono text-[#4b5563] mt-0.5">
              {account.contact.phone}
            </span>
          </div>
          <span
            className="text-[10px] font-mono px-2.5 py-1 rounded-full shrink-0 mt-0.5"
            style={{
              background: tier.bg,
              border: `1px solid ${tier.border}`,
              color: tier.text,
            }}
          >
            {account.tier.toUpperCase()}
          </span>
        </div>

        {/* Revenue + last visit */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-[#4b5563] tracking-widest">REVENUE</span>
            <span className="text-sm font-mono font-medium text-[#22d3ee]">
              {fmtRevenue(account.revenue)} ARR
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-[#4b5563] tracking-widest">LAST VISIT</span>
            <span className="text-sm font-mono font-medium text-[#9ba3b8]">
              {account.lastVisitDaysAgo}d ago
            </span>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2236" }}>
        <span className="text-[9px] font-mono text-[#4b5563] tracking-widest">RECENT ACTIVITY</span>
        <div className="mt-2 flex flex-col gap-2">
          {account.activities.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-[12px] mt-0.5">{ACTIVITY_ICONS[a.type]}</span>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#c8cbd6] leading-snug">{a.summary}</span>
                <span className="text-[10px] font-mono text-[#4b5563]">{a.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {account.notes && (
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #1a2236" }}>
          <span className="text-[9px] font-mono text-[#4b5563] tracking-widest">REP NOTES</span>
          <p className="text-[12px] text-[#9ba3b8] mt-1.5 leading-relaxed">{account.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3">
        {[
          { label: "📞 Call", onClick: onCall },
          { label: "🗺 Navigate", onClick: onNavigate },
          { label: "📋 Log Visit", onClick: onLogVisit },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            className="flex-1 py-2 rounded-xl text-[12px] font-medium transition-all"
            style={{
              background: "#13161d",
              color: "#9ba3b8",
              border: "1px solid #1e2230",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "#3b82f6";
              el.style.color = "#93c5fd";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "#1e2230";
              el.style.color = "#9ba3b8";
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
