"use client"

import type { Incident } from "@/lib/types"
import { Clock, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface IncidentListProps {
  incidents: Incident[]
}

export function IncidentList({ incidents }: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Incidents</h2>
        <div className="p-6 rounded-lg bg-card border border-border text-center">
          <p className="text-sm text-muted-foreground">No recent incidents. All clear!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Recent Incidents</h2>
      <div className="flex flex-col gap-3">
        {incidents.map((incident, i) => {
          const isOngoing = incident.status === "ongoing"
          const startedAgo = formatDistanceToNow(new Date(incident.startedAt), { addSuffix: true })
          const duration = incident.resolvedAt
            ? formatDistanceToNow(new Date(incident.startedAt), {
                addSuffix: false,
              })
            : null

          return (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-lg border ${
                isOngoing
                  ? "bg-danger/5 border-danger/20"
                  : "bg-card border-border"
              }`}
            >
              {isOngoing ? (
                <Clock className="w-5 h-5 text-danger shrink-0 mt-0.5 animate-pulse" strokeWidth={1.5} />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" strokeWidth={1.5} />
              )}
              <div className="flex flex-col gap-1 min-w-0">
                <p className={`text-sm font-medium ${isOngoing ? "text-danger" : "text-card-foreground"}`}>
                  {incident.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    isOngoing
                      ? "bg-danger/10 text-danger"
                      : "bg-success/10 text-success"
                  }`}>
                    {isOngoing ? "Ongoing" : "Resolved"}
                  </span>
                  <span>Started {startedAgo}</span>
                  {duration && <span>Duration: ~{duration}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
