import type { Env, Transition, PushSubscription } from "../types";
import { getAllPushSubscriptions, deletePushSubscription } from "../storage";

export async function sendPushNotifications(
  env: Env,
  transition: Transition
): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.log("VAPID keys not configured, skipping web push");
    return;
  }

  const subscriptions = await getAllPushSubscriptions(env.DB);
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: getTitle(transition),
    body: getBody(transition),
    tag: `status-${transition.serviceId}`,
    data: { url: "/" },
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendToSubscription(env, sub, payload))
  );

  // Clean up expired/invalid subscriptions
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected" || (result.status === "fulfilled" && !result.value)) {
      await deletePushSubscription(env.DB, subscriptions[i].endpoint);
    }
  }
}

async function sendToSubscription(
  env: Env,
  sub: PushSubscription,
  payload: string
): Promise<boolean> {
  try {
    // Build JWT for VAPID auth
    const jwt = await createVapidJwt(env, sub.endpoint);
    const p256dhKey = env.VAPID_PUBLIC_KEY;

    const response = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Authorization: `vapid t=${jwt}, k=${p256dhKey}`,
      },
      body: payload,
    });

    // 201 = success, 410 = subscription expired
    if (response.status === 410 || response.status === 404) {
      return false; // signal for cleanup
    }

    return response.ok;
  } catch (err) {
    console.error(`Push failed for ${sub.endpoint}: ${err}`);
    return false;
  }
}

async function createVapidJwt(env: Env, endpoint: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);

  const header = { typ: "JWT", alg: "ES256" };
  const claims = {
    aud: audience,
    exp: now + 86400,
    sub: env.VAPID_SUBJECT,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const claimsB64 = base64url(JSON.stringify(claims));
  const unsigned = `${headerB64}.${claimsB64}`;

  // Import the VAPID private key
  const privateKeyBytes = base64urlDecode(env.VAPID_PRIVATE_KEY);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned)
  );

  return `${unsigned}.${base64url(signature)}`;
}

function base64url(input: string | ArrayBuffer): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = new Uint8Array(input);
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): ArrayBuffer {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getTitle(t: Transition): string {
  if (t.to === "up") return `${t.serviceName} is back up`;
  if (t.to === "down") return `${t.serviceName} is DOWN`;
  return `${t.serviceName} is having issues`;
}

function getBody(t: Transition): string {
  if (t.to === "up") return `Service has recovered from ${t.from} state.`;
  if (t.to === "down") return "Service is not responding. We're monitoring the situation.";
  return "Service is responding slowly or partially.";
}
