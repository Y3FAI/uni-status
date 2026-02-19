import type { Env, PushSubscription } from "../types";
import {
  getCurrentStatus,
  savePushSubscription,
  deletePushSubscription,
} from "../storage";

export async function handleGetStatus(env: Env): Promise<Response> {
  const status = await getCurrentStatus(env.STATUS_KV);

  if (!status) {
    return jsonResponse({ error: "No status data yet. Check back soon." }, 503);
  }

  return jsonResponse(status);
}

export async function handleSubscribe(
  request: Request,
  env: Env
): Promise<Response> {
  let body: PushSubscription;

  try {
    body = await request.json<PushSubscription>();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return jsonResponse({ error: "Missing subscription fields" }, 400);
  }

  await savePushSubscription(env.STATUS_KV, body);
  return jsonResponse({ ok: true });
}

export async function handleUnsubscribe(
  request: Request,
  env: Env
): Promise<Response> {
  let body: { endpoint?: string };

  try {
    body = await request.json<{ endpoint: string }>();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.endpoint) {
    return jsonResponse({ error: "Missing endpoint" }, 400);
  }

  await deletePushSubscription(env.STATUS_KV, body.endpoint);
  return jsonResponse({ ok: true });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
