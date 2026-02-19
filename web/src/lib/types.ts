// Matches backend src/types.ts

export type Status = "up" | "degraded" | "down";

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

export interface HistoryPoint {
  timestamp: string;
  services: ServiceStatus[];
}

export interface HistoryResponse {
  date: string;
  points: HistoryPoint[];
}
