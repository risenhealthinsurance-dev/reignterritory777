import type { IncomingMessage, ServerResponse } from "node:http";

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Content-Type", "application/json");
  if (request.method !== "GET") { response.statusCode = 405; response.end(JSON.stringify({ error: "Method not allowed" })); return; }
  const source = process.env.OSINT_API_URL;
  if (!source) { response.statusCode = 503; response.end(JSON.stringify({ error: "OSINT_API_URL is not configured", warnings: [{ code: "missing-osint-url", message: "Using local or cached intelligence." }] })); return; }
  const incoming = new URL(request.url || "/", "http://localhost");
  const target = new URL("/api/rep-brief", source);
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  try { const upstream = await fetch(target); response.statusCode = upstream.status; response.end(await upstream.text()); }
  catch { response.statusCode = 502; response.end(JSON.stringify({ error: "OSINT service unavailable", warnings: [{ code: "osint-unavailable", message: "Using local or cached intelligence." }] })); }
}
