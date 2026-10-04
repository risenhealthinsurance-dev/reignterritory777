import { useRef, useEffect, useState } from "react";

interface InputBarProps {
  input: string;
  setInput: (v: string) => void;
  onSend: (text: string) => void;
  onPlusClick: () => void;
  isTyping: boolean;
}

const PLACEHOLDERS = [
  "Ask anything...",
  "Log a call...",
  "Plan my route...",
  "Add a note...",
  "Look up an account...",
];

export function InputBar({ input, setInput, onSend, onPlusClick, isTyping }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(id);
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const canSend = input.trim().length > 0 && !isTyping;

  return (
    <div style={{ flexShrink: 0, padding: "8px 12px 28px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          background: "#13161d",
          border: `1.5px solid ${focused ? "#2a3a54" : "#1e2230"}`,
          borderRadius: 20,
          padding: "8px 10px",
          boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        {/* Plus button */}
        <button
          onClick={onPlusClick}
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "#1e2230",
            border: "none",
            color: "#6b7490",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
            marginBottom: 2,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = "#1e2a40";
            el.style.color = "#60a5fa";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = "#1e2230";
            el.style.color = "#6b7490";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={autoResize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: 14,
            lineHeight: "22px",
            color: "#e8eaf0",
            fontFamily: "Inter, sans-serif",
            maxHeight: 110,
            overflowY: "auto",
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: 10,
            background: canSend ? "#3b82f6" : "#1e2230",
            border: "none",
            color: canSend ? "#fff" : "#4b5563",
            cursor: canSend ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            marginBottom: 2,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
