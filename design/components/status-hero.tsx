"use client"

import type { ServiceStatus } from "@/lib/types"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

const config: Record<
  ServiceStatus,
  { icon: typeof CheckCircle; label: string; answer: string; bg: string; ring: string; text: string; pulse: string }
> = {
  operational: {
    icon: CheckCircle,
    label: "All Systems Operational",
    answer: "Yes — Blackboard is up and running.",
    bg: "bg-success/10",
    ring: "ring-success/30",
    text: "text-success",
    pulse: "",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Experiencing Issues",
    answer: "Sort of — it's slow and unstable right now.",
    bg: "bg-warning/10",
    ring: "ring-warning/30",
    text: "text-warning",
    pulse: "animate-pulse",
  },
  down: {
    icon: XCircle,
    label: "Major Outage",
    answer: "No — Blackboard is currently unreachable.",
    bg: "bg-danger/10",
    ring: "ring-danger/30",
    text: "text-danger",
    pulse: "animate-pulse",
  },
}

interface StatusHeroProps {
  status: ServiceStatus
  responseTime: number | null
  lastChecked: string
  countdown: number
}

export function StatusHero({ status, responseTime, lastChecked, countdown }: StatusHeroProps) {
  const c = config[status]
  const Icon = c.icon
  const checkedDate = new Date(lastChecked)
  const timeStr = checkedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <div
        className={`flex items-center justify-center w-24 h-24 rounded-full ${c.bg} ring-2 ${c.ring} ${c.pulse}`}
      >
        <Icon className={`w-12 h-12 ${c.text}`} strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
          Can I access Blackboard?
        </h1>
        <p className={`text-xl font-medium ${c.text}`}>{c.answer}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${c.bg} ${c.text} font-medium`}>
          <span className={`w-2 h-2 rounded-full ${c.text === "text-success" ? "bg-success" : c.text === "text-warning" ? "bg-warning" : "bg-danger"}`} />
          {c.label}
        </span>
        {responseTime !== null && (
          <span className="font-mono">{responseTime}ms response</span>
        )}
        <span>Last checked: {timeStr}</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
          Next check in {countdown}s
        </span>
      </div>
    </section>
  )
}
