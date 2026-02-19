import type { Env, PushSubscription } from "../types";
import {
  getCurrentStatus,
  getHistory,
  savePushSubscription,
  deletePushSubscription,
} from "../storage";

export async function handleGetStatus(env: Env): Promise<Response> {
  const status = await getCurrentStatus(env.DB);

  if (!status) {
    return jsonResponse({ error: "No status data yet. Check back soon." }, 503);
  }

  return jsonResponse(status);
}

export async function handleGetHistory(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");

  // Default to today if no date provided
  const targetDate = date || new Date().toISOString().slice(0, 10);

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return jsonResponse({ error: "Invalid date format. Use YYYY-MM-DD." }, 400);
  }

  const history = await getHistory(env.DB, targetDate);

  return jsonResponse({
    date: targetDate,
    points: history,
  });
}

export function handleGetVapidKey(env: Env): Response {
  if (!env.VAPID_PUBLIC_KEY) {
    return jsonResponse({ error: "VAPID not configured" }, 503);
  }

  return jsonResponse({ publicKey: env.VAPID_PUBLIC_KEY });
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

  await savePushSubscription(env.DB, body);
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

  await deletePushSubscription(env.DB, body.endpoint);
  return jsonResponse({ ok: true });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
