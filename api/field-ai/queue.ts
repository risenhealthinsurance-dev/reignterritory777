import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json");
  if (request.method === "GET") { response.end(JSON.stringify({ actions: [], source: "server", message: "Queue is empty on this server instance." })); return; }
  if (request.method === "POST") { response.end(JSON.stringify({ accepted: true, replayed: 0 })); return; }
  response.statusCode = 405; response.end(JSON.stringify({ error: "Method not allowed" }));
}
