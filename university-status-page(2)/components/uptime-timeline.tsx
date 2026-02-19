"use client"

import { useState } from "react"
import type { ServiceStatus } from "@/lib/types"

interface UptimeTimelineProps {
  currentStatus: ServiceStatus
}

function generateMockTimeline(currentStatus: ServiceStatus) {
  const slots: { hour: string; status: ServiceStatus }[] = []
  const now = new Date()

  for (let i = 23; i >= 0; i--) {
    const slotTime = new Date(now.getTime() - i * 60 * 60 * 1000)
    const hourStr = slotTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    let status: ServiceStatus = "operational"

    if (i === 0) {
      status = currentStatus
    } else if (i === 1 && currentStatus !== "operational") {
      status = currentStatus === "down" ? "degraded" : "operational"
    } else if (i >= 5 && i <= 6) {
      status = "degraded"
    } else if (i === 14) {
      status = "down"
    }

    slots.push({ hour: hourStr, status })
  }

  return slots
}

const statusColor: Record<ServiceStatus, string> = {
  operational: "bg-success",
  degraded: "bg-warning",
  down: "bg-danger",
}

const statusHoverColor: Record<ServiceStatus, string> = {
  operational: "bg-success/80",
  degraded: "bg-warning/80",
  down: "bg-danger/80",
}

export function UptimeTimeline({ currentStatus }: UptimeTimelineProps) {
  const slots = generateMockTimeline(currentStatus)
  const [hovered, setHovered] = useState<number | null>(null)

  const upCount = slots.filter((s) => s.status === "operational").length
  const uptimePercent = ((upCount / slots.length) * 100).toFixed(1)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">24-Hour Uptime</h2>
        <span className="text-sm font-mono text-muted-foreground">{uptimePercent}% uptime</span>
      </div>

      <div className="relative">
        <div className="flex gap-0.5 h-10 items-end" role="img" aria-label={`Uptime timeline showing ${uptimePercent}% uptime over the last 24 hours`}>
          {slots.map((slot, i) => (
            <div
              key={i}
              className="relative flex-1 group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={`w-full rounded-sm transition-all duration-150 ${
                  hovered === i
                    ? `h-10 ${statusHoverColor[slot.status]}`
                    : `h-8 ${statusColor[slot.status]}`
                }`}
              />
              {hovered === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-md bg-popover border border-border shadow-lg whitespace-nowrap">
                  <p className="text-xs font-mono text-popover-foreground">{slot.hour}</p>
                  <p className="text-xs text-muted-foreground capitalize">{slot.status}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
          <span>{slots[0]?.hour}</span>
          <span>Now</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-success" /> Operational</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-warning" /> Degraded</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-danger" /> Down</span>
      </div>
    </section>
  )
}
