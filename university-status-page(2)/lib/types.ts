export type ServiceStatus = "operational" | "degraded" | "down"

export interface ServiceDetail {
  name: string
  status: ServiceStatus
  description: string
  responseTime: number | null
}

export interface Incident {
  title: string
  status: "ongoing" | "resolved"
  startedAt: string
  resolvedAt?: string
}

export interface StatusResponse {
  canAccessBlackboard: boolean
  status: ServiceStatus
  responseTime: number | null
  lastChecked: string
  services: ServiceDetail[]
  incidents: Incident[]
}

export interface UptimeSlot {
  hour: number
  status: ServiceStatus
}
