"use client"

import type { ServiceDetail, ServiceStatus } from "@/lib/types"
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"

const statusConfig: Record<
  ServiceStatus,
  { icon: typeof CheckCircle; label: string; bg: string; text: string; border: string; dot: string }
> = {
  operational: {
    icon: CheckCircle,
    label: "Operational",
    bg: "bg-success/5",
    text: "text-success",
    border: "border-success/20",
    dot: "bg-success",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Degraded",
    bg: "bg-warning/5",
    text: "text-warning",
    border: "border-warning/20",
    dot: "bg-warning",
  },
  down: {
    icon: XCircle,
    label: "Down",
    bg: "bg-danger/5",
    text: "text-danger",
    border: "border-danger/20",
    dot: "bg-danger",
  },
}

interface ServiceBreakdownProps {
  services: ServiceDetail[]
}

export function ServiceBreakdown({ services }: ServiceBreakdownProps) {
  const ssoDown = services.find((s) => s.name.includes("SSO"))?.status === "down"
  const bbDown = services.find((s) => s.name.includes("Blackboard"))?.status === "down"
  const ssoOnly = ssoDown && !bbDown

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Service Status</h2>
        <span className="text-xs text-muted-foreground font-mono">
          {services.filter((s) => s.status === "operational").length}/{services.length} services up
        </span>
      </div>

      {ssoOnly && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/5 border border-warning/20">
          <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-warning">SSO is down, but Blackboard itself is working</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {"You can't log in right now because the SSO gateway is offline. If you're already logged in, don't log out — your existing session should still work."}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {services.map((service) => {
          const cfg = statusConfig[service.status]
          const Icon = cfg.icon
          return (
            <div
              key={service.name}
              className={`flex flex-col gap-3 p-4 rounded-lg border ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 ${cfg.text} shrink-0`} strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-foreground truncate">{service.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {service.responseTime !== null && (
                    <span className="text-xs font-mono text-muted-foreground">{service.responseTime}ms</span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{service.description}</p>
            </div>
          )
        })}
      </div>

      <div className="p-4 rounded-lg bg-card border border-border">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-foreground">What is the difference?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">SSO (Single Sign-On)</strong> is the university login page you see first. It verifies your credentials before sending you to Blackboard. If SSO is down, you cannot log in even though Blackboard might be running fine.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Blackboard LMS</strong> is the actual platform with your courses, grades, and assignments. It can be down independently of SSO.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
