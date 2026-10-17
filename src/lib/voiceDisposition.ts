export type VoiceDisposition = "reloop" | "waiting_on_decision" | "lost" | "unknown";

export interface ExtractedVoiceDisposition {
  disposition: VoiceDisposition;
  contactName?: string;
  dayOrWindow?: string;
  notes: string;
  confidence: "high" | "medium";
}

export function extractVoiceDisposition(transcript: string): ExtractedVoiceDisposition {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const disposition: VoiceDisposition = /not interested|lost|no thanks/.test(lower)
    ? "lost"
    : /think it over|talk to|decision|follow up later|follow-up later/.test(lower)
      ? "waiting_on_decision"
      : /reloop|back|there (on|at)|will be there|available|in (the|on)/.test(lower)
        ? "reloop"
        : "unknown";
  const name = text.match(/(?:owner|dm|manager|contact)(?: is|:)?\s+([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+){0,1})(?=\s+(?:will|is|can|should)\b|$)/i)?.[1];
  const dayOrWindow = text.match(/\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i)?.[0];
  return { disposition, contactName: name, dayOrWindow, notes: text, confidence: disposition === "unknown" ? "medium" : "high" };
}
