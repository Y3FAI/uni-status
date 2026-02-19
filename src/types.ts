export type Status = "up" | "degraded" | "down";

export type HttpMethod = "GET" | "HEAD";

export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  expectedStatuses: number[];
  interval: number; // seconds
}

export interface CheckResult {
  httpCode: number | null;
  responseTime: number | null; // ms
  error: string | null;
  timestamp: string; // ISO 8601
}

export interface ServiceStatus {
  id: string;
  name: string;
  status: Status;
  httpCode: number | null;
  responseTime: number | null;
  lastChecked: string;
}

export interface Incident {
  service: string;
  title: string;
  status: "ongoing" | "resolved";
  startedAt: string;
  resolvedAt: string | null;
  duration: string;
}

export interface StatusResponse {
  canAccessBlackboard: boolean;
  lastChecked: string;
  services: ServiceStatus[];
  incidents: Incident[];
}

export interface Transition {
  serviceId: string;
  serviceName: string;
  from: Status;
  to: Status;
  timestamp: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface HistoryPoint {
  timestamp: string;
  services: ServiceStatus[];
}

export interface Env {
  STATUS_KV: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}
