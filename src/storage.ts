import type {
  HistoryPoint,
  Incident,
  PushSubscription,
  ServiceStatus,
  StatusResponse,
} from "./types";

// --- Status ---

export async function getCurrentStatus(
  db: D1Database
): Promise<StatusResponse | null> {
  // Get current status for all services
  const services = await db
    .prepare("SELECT * FROM current_status ORDER BY service_id")
    .all<{
      service_id: string;
      service_name: string;
      status: "up" | "degraded" | "down";
      http_code: number | null;
      response_time: number | null;
      last_checked: string;
    }>();

  if (!services.results || services.results.length === 0) {
    return null;
  }

  // Get metadata
  const lastCheckedRow = await db
    .prepare("SELECT value FROM metadata WHERE key = 'last_checked'")
    .first<{ value: string }>();

  // Get active incidents
  const incidents = await getActiveIncidents(db);

  const serviceStatuses: ServiceStatus[] = services.results.map((s) => ({
    id: s.service_id,
    name: s.service_name,
    status: s.status,
    httpCode: s.http_code,
    responseTime: s.response_time,
    lastChecked: s.last_checked,
  }));

  const canAccessBlackboard =
    serviceStatuses.find((s) => s.id === "sso")?.status !== "down" &&
    serviceStatuses.find((s) => s.id === "lms")?.status !== "down";

  return {
    canAccessBlackboard,
    lastChecked: lastCheckedRow?.value || new Date().toISOString(),
    services: serviceStatuses,
    incidents: incidents.filter((i) => i.status === "ongoing"),
  };
}

export async function saveStatus(
  db: D1Database,
  statuses: ServiceStatus[],
  _incidents: Incident[]
): Promise<void> {
  const now = new Date().toISOString();

  // Upsert current status for each service
  const stmt = db.prepare(`
    INSERT INTO current_status (service_id, service_name, status, http_code, response_time, last_checked)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(service_id) DO UPDATE SET
      service_name = excluded.service_name,
      status = excluded.status,
      http_code = excluded.http_code,
      response_time = excluded.response_time,
      last_checked = excluded.last_checked
  `);

  const batch = statuses.map((s) =>
    stmt.bind(s.id, s.name, s.status, s.httpCode, s.responseTime, s.lastChecked)
  );

  // Update last_checked metadata
  batch.push(
    db.prepare(`
      INSERT INTO metadata (key, value, updated_at)
      VALUES ('last_checked', ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).bind(now)
  );

  await db.batch(batch);
}

// --- History ---

export async function saveHistoryPoint(
  db: D1Database,
  statuses: ServiceStatus[]
): Promise<void> {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO status_checks (checked_at, service_id, service_name, status, http_code, response_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const batch = statuses.map((s) =>
    stmt.bind(now, s.id, s.name, s.status, s.httpCode, s.responseTime)
  );

  await db.batch(batch);

  // Cleanup old history (keep 30 days)
  await db
    .prepare("DELETE FROM status_checks WHERE checked_at < datetime('now', '-30 days')")
    .run();
}

export async function getHistory(
  db: D1Database,
  date: string
): Promise<HistoryPoint[]> {
  // Get all checks for the given date
  const results = await db
    .prepare(`
      SELECT checked_at, service_id, service_name, status, http_code, response_time
      FROM status_checks
      WHERE date(checked_at) = ?
      ORDER BY checked_at ASC
    `)
    .bind(date)
    .all<{
      checked_at: string;
      service_id: string;
      service_name: string;
      status: "up" | "degraded" | "down";
      http_code: number | null;
      response_time: number | null;
    }>();

  if (!results.results || results.results.length === 0) {
    return [];
  }

  // Group by timestamp
  const grouped = new Map<string, ServiceStatus[]>();

  for (const row of results.results) {
    const timestamp = row.checked_at;
    if (!grouped.has(timestamp)) {
      grouped.set(timestamp, []);
    }
    grouped.get(timestamp)!.push({
      id: row.service_id,
      name: row.service_name,
      status: row.status,
      httpCode: row.http_code,
      responseTime: row.response_time,
      lastChecked: row.checked_at,
    });
  }

  return Array.from(grouped.entries()).map(([timestamp, services]) => ({
    timestamp,
    services,
  }));
}

// --- Incidents ---

export async function getActiveIncidents(
  db: D1Database
): Promise<Incident[]> {
  const results = await db
    .prepare(`
      SELECT id, service_id, title, description, status, started_at, resolved_at
      FROM incidents
      WHERE status != 'resolved'
      ORDER BY started_at DESC
    `)
    .all<{
      id: string;
      service_id: string;
      title: string;
      description: string | null;
      status: string;
      started_at: string;
      resolved_at: string | null;
    }>();

  if (!results.results) return [];

  const now = new Date();
  return results.results.map((i) => ({
    service: i.service_id,
    title: i.title,
    status: "ongoing" as const,
    startedAt: i.started_at,
    resolvedAt: i.resolved_at,
    duration: formatDuration(new Date(i.started_at), now),
  }));
}

export async function openIncident(
  db: D1Database,
  serviceId: string,
  serviceName: string,
  status: "down" | "degraded"
): Promise<void> {
  // Check if incident already exists
  const existing = await db
    .prepare(`
      SELECT id FROM incidents
      WHERE service_id = ? AND status != 'resolved'
    `)
    .bind(serviceId)
    .first();

  if (existing) return;

  const label = status === "down" ? "is down" : "is degraded";
  const id = crypto.randomUUID();

  await db
    .prepare(`
      INSERT INTO incidents (id, service_id, title, status, started_at)
      VALUES (?, ?, ?, 'investigating', ?)
    `)
    .bind(id, serviceId, `${serviceName} ${label}`, new Date().toISOString())
    .run();
}

export async function resolveIncident(
  db: D1Database,
  serviceId: string
): Promise<void> {
  await db
    .prepare(`
      UPDATE incidents
      SET status = 'resolved', resolved_at = ?
      WHERE service_id = ? AND status != 'resolved'
    `)
    .bind(new Date().toISOString(), serviceId)
    .run();
}

export async function getIncidentLog(
  db: D1Database
): Promise<Incident[]> {
  const results = await db
    .prepare(`
      SELECT id, service_id, title, description, status, started_at, resolved_at
      FROM incidents
      ORDER BY started_at DESC
      LIMIT 500
    `)
    .all<{
      id: string;
      service_id: string;
      title: string;
      description: string | null;
      status: string;
      started_at: string;
      resolved_at: string | null;
    }>();

  if (!results.results) return [];

  return results.results.map((i) => ({
    service: i.service_id,
    title: i.title,
    status: i.status === "resolved" ? "resolved" as const : "ongoing" as const,
    startedAt: i.started_at,
    resolvedAt: i.resolved_at,
    duration: i.resolved_at
      ? formatDuration(new Date(i.started_at), new Date(i.resolved_at))
      : formatDuration(new Date(i.started_at), new Date()),
  }));
}

// Update durations on active incidents (called each cycle)
export async function refreshIncidentDurations(
  db: D1Database
): Promise<Incident[]> {
  // D1 doesn't need to update durations in DB - they're computed on read
  return getActiveIncidents(db);
}

// --- Push Subscriptions ---

export async function savePushSubscription(
  db: D1Database,
  sub: PushSubscription
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth)
      VALUES (?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        p256dh = excluded.p256dh,
        auth = excluded.auth
    `)
    .bind(sub.endpoint, sub.keys.p256dh, sub.keys.auth)
    .run();
}

export async function deletePushSubscription(
  db: D1Database,
  endpoint: string
): Promise<void> {
  await db
    .prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
    .bind(endpoint)
    .run();
}

export async function getAllPushSubscriptions(
  db: D1Database
): Promise<PushSubscription[]> {
  const results = await db
    .prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions")
    .all<{ endpoint: string; p256dh: string; auth: string }>();

  if (!results.results) return [];

  return results.results.map((r) => ({
    endpoint: r.endpoint,
    keys: {
      p256dh: r.p256dh,
      auth: r.auth,
    },
  }));
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
