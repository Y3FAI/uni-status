"use client"

import { useState } from "react"
import { Bell, Send } from "lucide-react"

export function NotifySection() {
  const [pushEnabled, setPushEnabled] = useState(false)

  const handleEnablePush = async () => {
    if (!("Notification" in window)) {
      alert("Your browser doesn't support push notifications.")
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      setPushEnabled(true)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Get Notified</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={handleEnablePush}
          disabled={pushEnabled}
          className={`flex items-center gap-3 p-4 rounded-lg border transition-colors text-left ${
            pushEnabled
              ? "bg-success/10 border-success/20 cursor-default"
              : "bg-card border-border hover:border-primary/40 cursor-pointer"
          }`}
        >
          <Bell className={`w-5 h-5 shrink-0 ${pushEnabled ? "text-success" : "text-muted-foreground"}`} strokeWidth={1.5} />
          <div className="flex flex-col gap-0.5">
            <span className={`text-sm font-medium ${pushEnabled ? "text-success" : "text-card-foreground"}`}>
              {pushEnabled ? "Notifications enabled" : "Browser Notifications"}
            </span>
            <span className="text-xs text-muted-foreground">
              {pushEnabled ? "We'll alert you when status changes" : "Get alerted when Blackboard comes back"}
            </span>
          </div>
        </button>

        <a
          href="https://t.me/BlackboardStatusBot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
        >
          <Send className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-card-foreground">Telegram Bot</span>
            <span className="text-xs text-muted-foreground">Join our Telegram channel for live updates</span>
          </div>
        </a>
      </div>
    </section>
  )
}
