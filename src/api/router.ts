import type { Env } from "../types";
import { handleGetStatus, handleGetHistory, handleTestTelegram } from "./handlers";

export async function handleRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return corsResponse(new Response(null, { status: 204 }));
  }

  let response: Response;

  if (path === "/api/status" && request.method === "GET") {
    response = await handleGetStatus(env);
  } else if (path === "/api/status/history" && request.method === "GET") {
    response = await handleGetHistory(request, env);
  } else if (path === "/api/test/telegram" && request.method === "POST") {
    response = await handleTestTelegram(env);
  } else {
    response = new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return corsResponse(response);
}

function corsResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
