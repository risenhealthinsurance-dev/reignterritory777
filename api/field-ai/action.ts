import type { IncomingMessage, ServerResponse } from "node:http";

type ActionBody = { action?: { id?: string; status?: string; type?: string; payload?: unknown }; operation?: "confirm" | "cancel" | "replay" };
const completed = new Set<string>();

export default function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json");
  if (request.method !== "POST") { response.statusCode = 405; response.end(JSON.stringify({ error: "Method not allowed" })); return; }
  let raw = "";
  request.on("data", (chunk) => { raw += chunk; });
  request.on("end", () => {
    let body: ActionBody = {};
    try { body = JSON.parse(raw || "{}"); } catch { response.statusCode = 400; response.end(JSON.stringify({ error: "Invalid JSON" })); return; }
    const action = body.action;
    if (!action?.id || !body.operation) { response.statusCode = 400; response.end(JSON.stringify({ error: "action and operation are required" })); return; }
    if (body.operation === "cancel") { response.end(JSON.stringify({ ...action, status: "cancelled" })); return; }
    if (completed.has(action.id)) { response.end(JSON.stringify({ ...action, status: "completed" })); return; }
    completed.add(action.id);
    response.end(JSON.stringify({ ...action, status: "completed", confirmedAt: new Date().toISOString(), completedAt: new Date().toISOString() }));
  });
}
