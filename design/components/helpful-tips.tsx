"use client"

import type { ServiceStatus } from "@/lib/types"
import { RefreshCw, Cookie, Globe, LogIn, Mail } from "lucide-react"

const tips = [
  { icon: RefreshCw, text: "Try refreshing the page" },
  { icon: Cookie, text: "Clear your browser cookies" },
  { icon: Globe, text: "Try using a different browser" },
  { icon: LogIn, text: "If SSO is down, existing Blackboard sessions may still work — don't log out" },
  { icon: Mail, text: "Email works independently — you can still access your university email" },
]

interface HelpfulTipsProps {
  status: ServiceStatus
}

export function HelpfulTips({ status }: HelpfulTipsProps) {
  if (status === "operational") return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        {status === "down" ? "While you wait..." : "Things to try"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((tip, i) => {
          const Icon = tip.icon
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border"
            >
              <Icon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-sm text-card-foreground leading-relaxed">{tip.text}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
