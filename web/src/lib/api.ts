import type { StatusResponse, HistoryResponse } from "./types";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8787";

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_URL}/api/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch status: ${res.status}`);
  }
  return res.json();
}

export async function fetchHistory(date?: string): Promise<HistoryResponse> {
  const url = date
    ? `${API_URL}/api/status/history?date=${date}`
    : `${API_URL}/api/status/history`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch history: ${res.status}`);
  }
  return res.json();
}

export async function fetchVapidKey(): Promise<string> {
  const res = await fetch(`${API_URL}/api/push/vapid-key`);
  if (!res.ok) {
    throw new Error(`Failed to fetch VAPID key: ${res.status}`);
  }
  const data = await res.json();
  return data.publicKey;
}

export async function subscribeToPush(subscription: PushSubscription): Promise<void> {
  const res = await fetch(`${API_URL}/api/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!res.ok) {
    throw new Error(`Failed to subscribe: ${res.status}`);
  }
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/push/subscribe`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok) {
    throw new Error(`Failed to unsubscribe: ${res.status}`);
  }
}
