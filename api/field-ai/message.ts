import type { IncomingMessage, ServerResponse } from "node:http";
const ALLOWED_TOOLS = new Set(["get_current_route", "get_current_stop", "get_account_brief", "search_osint_accounts", "refresh_account_intelligence", "build_route_preview", "save_visit_note", "record_disposition", "schedule_follow_up", "create_recovery_action", "get_field_day_summary", "queue_offline_action"]);

type Body = { message?: string; accountId?: string | null; sessionId?: string };

async function modelAssist(message: string, accountId?: string | null): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.2, max_tokens: 160, messages: [{ role: "system", content: "You are Reign Territory Field AI. Give concise field-rep guidance. Never claim an external action was completed. Keep observed facts, inference, and unknowns distinct." }, { role: "user", content: `Account: ${accountId || "none"}\nRequest: ${message}` }] }) });
    if (!upstream.ok) return null;
    const data = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch { return null; }
}

export default function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== "POST") { response.statusCode = 405; response.end(JSON.stringify({ error: "Method not allowed" })); return; }
  let raw = "";
  request.on("data", (chunk) => { raw += chunk; });
  request.on("end", () => {
    let body: Body = {};
    try { body = JSON.parse(raw || "{}"); } catch { response.statusCode = 400; response.end(JSON.stringify({ error: "Invalid JSON" })); return; }
    const message = String(body.message || "").trim();
    if (!message) { response.statusCode = 400; response.end(JSON.stringify({ error: "message is required" })); return; }
    const lower = message.toLowerCase();
    const write = /\b(schedule|callback|follow.?up|log|save|record|disposition|recovery)\b/.test(lower);
    const toolName = write ? "schedule_follow_up" : "get_current_stop";
    if (!ALLOWED_TOOLS.has(toolName)) { response.statusCode = 403; response.end(JSON.stringify({ error: "Tool is not allowed" })); return; }
    response.setHeader("Content-Type", "application/json");
    response.statusCode = 200;
    modelAssist(message, body.accountId).then((modelText) => response.end(JSON.stringify({ messageId: `m-${Date.now()}`, sessionId: body.sessionId || `session-${Date.now()}`, text: modelText || (write ? "I prepared a change for review. Confirm it before anything is saved." : "Here is the read-only field answer for the current account and route context."), toolCalls: [{ id: `tool-${Date.now()}`, name: toolName, args: { accountId: body.accountId || null }, status: "completed" }], warnings: modelText ? [] : ["model-fallback"], proposedAction: write ? { type: "schedule_follow_up", status: "proposed", accountId: body.accountId || undefined, payload: { request: message }, sourceMessageId: `m-${Date.now()}`, id: `action-${Date.now()}`, createdAt: new Date().toISOString() } : undefined })));
  });
}
