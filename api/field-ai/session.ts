import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json");
  if (request.method !== "GET") { response.statusCode = 405; response.end(JSON.stringify({ error: "Method not allowed" })); return; }
  const url = new URL(request.url || "/", "http://localhost");
  const id = url.searchParams.get("id") || "field-session";
  response.end(JSON.stringify({ id, messages: [], actions: [], source: "server" }));
}
