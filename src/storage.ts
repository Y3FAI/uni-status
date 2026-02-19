import type {
  Env,
  HistoryPoint,
  Incident,
  PushSubscription,
  ServiceStatus,
  StatusResponse,
} from "./types";

const KEYS = {
  currentStatus: "status:current",
  historyPrefix: "status:history:",
  activeIncidents: "incidents:active",
  incidentLog: "incidents:log",
  pushPrefix: "push:sub:",
};

// --- Status ---

export async function getCurrentStatus(
  kv: KVNamespace
): Promise<StatusResponse | null> {
  return kv.get<StatusResponse>(KEYS.currentStatus, "json");
}

export async function saveStatus(
  kv: KVNamespace,
  statuses: ServiceStatus[],
  incidents: Incident[]
): Promise<void> {
  const canAccessBlackboard =
    statuses.find((s) => s.id === "sso")?.status !== "down" &&
    statuses.find((s) => s.id === "lms")?.status !== "down";

  const response: StatusResponse = {
    canAccessBlackboard,
    lastChecked: new Date().toISOString(),
    services: statuses,
    incidents: incidents.filter((i) => i.status === "ongoing"),
  };

  await kv.put(KEYS.currentStatus, JSON.stringify(response));
}

// --- History ---

export async function saveHistoryPoint(
  kv: KVNamespace,
  statuses: ServiceStatus[]
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const key = KEYS.historyPrefix + today;

  const existing = (await kv.get<HistoryPoint[]>(key, "json")) || [];

  existing.push({
    timestamp: new Date().toISOString(),
    services: statuses,
  });

  // Keep max ~1440 points per day (one per minute)
  const trimmed = existing.length > 1440 ? existing.slice(-1440) : existing;

  await kv.put(key, JSON.stringify(trimmed), {
    expirationTtl: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function getHistory(
  kv: KVNamespace,
  date: string
): Promise<HistoryPoint[]> {
  return (await kv.get<HistoryPoint[]>(KEYS.historyPrefix + date, "json")) || [];
}

// --- Incidents ---

export async function getActiveIncidents(
  kv: KVNamespace
): Promise<Incident[]> {
  return (await kv.get<Incident[]>(KEYS.activeIncidents, "json")) || [];
}

export async function saveActiveIncidents(
  kv: KVNamespace,
  incidents: Incident[]
): Promise<void> {
  await kv.put(KEYS.activeIncidents, JSON.stringify(incidents));
}

export async function openIncident(
  kv: KVNamespace,
  serviceId: string,
  serviceName: string,
  status: "down" | "degraded"
): Promise<void> {
  const incidents = await getActiveIncidents(kv);

  // Don't duplicate
  if (incidents.some((i) => i.service === serviceId && i.status === "ongoing")) {
    return;
  }

  const label = status === "down" ? "is down" : "is degraded";
  const incident: Incident = {
    service: serviceId,
    title: `${serviceName} ${label}`,
    status: "ongoing",
    startedAt: new Date().toISOString(),
    resolvedAt: null,
    duration: "just now",
  };

  incidents.push(incident);
  await saveActiveIncidents(kv, incidents);
}

export async function resolveIncident(
  kv: KVNamespace,
  serviceId: string
): Promise<void> {
  const incidents = await getActiveIncidents(kv);
  let changed = false;

  for (const incident of incidents) {
    if (incident.service === serviceId && incident.status === "ongoing") {
      incident.status = "resolved";
      incident.resolvedAt = new Date().toISOString();
      incident.duration = formatDuration(
        new Date(incident.startedAt),
        new Date(incident.resolvedAt)
      );
      changed = true;

      // Append to incident log
      await appendToIncidentLog(kv, incident);
    }
  }

  if (changed) {
    // Remove resolved from active list
    const active = incidents.filter((i) => i.status === "ongoing");
    await saveActiveIncidents(kv, active);
  }
}

async function appendToIncidentLog(
  kv: KVNamespace,
  incident: Incident
): Promise<void> {
  const log = (await kv.get<Incident[]>(KEYS.incidentLog, "json")) || [];
  log.push(incident);

  // Keep last 500 entries
  const trimmed = log.length > 500 ? log.slice(-500) : log;

  await kv.put(KEYS.incidentLog, JSON.stringify(trimmed), {
    expirationTtl: 90 * 24 * 60 * 60, // 90 days
  });
}

export async function getIncidentLog(
  kv: KVNamespace
): Promise<Incident[]> {
  return (await kv.get<Incident[]>(KEYS.incidentLog, "json")) || [];
}

// Update durations on active incidents (called each cycle)
export async function refreshIncidentDurations(
  kv: KVNamespace
): Promise<Incident[]> {
  const incidents = await getActiveIncidents(kv);
  const now = new Date();

  for (const incident of incidents) {
    if (incident.status === "ongoing") {
      incident.duration = formatDuration(new Date(incident.startedAt), now);
    }
  }

  await saveActiveIncidents(kv, incidents);
  return incidents;
}

// --- Push Subscriptions ---

export async function savePushSubscription(
  kv: KVNamespace,
  sub: PushSubscription
): Promise<void> {
  const hash = await hashEndpoint(sub.endpoint);
  await kv.put(KEYS.pushPrefix + hash, JSON.stringify(sub));
}

export async function deletePushSubscription(
  kv: KVNamespace,
  endpoint: string
): Promise<void> {
  const hash = await hashEndpoint(endpoint);
  await kv.delete(KEYS.pushPrefix + hash);
}

export async function getAllPushSubscriptions(
  kv: KVNamespace
): Promise<PushSubscription[]> {
  const list = await kv.list({ prefix: KEYS.pushPrefix });
  const subs: PushSubscription[] = [];

  for (const key of list.keys) {
    const sub = await kv.get<PushSubscription>(key.name, "json");
    if (sub) subs.push(sub);
  }

  return subs;
}

// --- Helpers ---

function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;

  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;

  if (hours < 24) {
    if (remainMinutes === 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
    return `${hours}h ${remainMinutes}m`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ${hours % 24}h`;
}

async function hashEndpoint(endpoint: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(endpoint);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
