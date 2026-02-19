"use client"

import { useStatus } from "@/hooks/use-status"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { ServiceStatus, ServiceDetail, Incident } from "@/lib/types"
import {
  CheckCircle, AlertTriangle, XCircle, Info, RefreshCw,
  Cookie, Globe, LogIn, Mail, Bell, Send, Clock, CheckCircle2, ArrowLeft,
} from "lucide-react"
import { useState } from "react"

/* ── Colour map ── */
const statusColors: Record<ServiceStatus, { dot: string; text: string; bg: string; border: string }> = {
  operational: { dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200/60" },
  degraded:    { dot: "bg-amber-500",   text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200/60" },
  down:        { dot: "bg-rose-500",     text: "text-rose-600",    bg: "bg-rose-50",     border: "border-rose-200/60" },
}

const statusIcons: Record<ServiceStatus, typeof CheckCircle> = { operational: CheckCircle, degraded: AlertTriangle, down: XCircle }
const statusLabels: Record<ServiceStatus, string> = { operational: "All Systems Operational", degraded: "Experiencing Issues", down: "Major Outage" }
const statusAnswers: Record<ServiceStatus, string> = {
  operational: "Yes — Blackboard is up and running.",
  degraded: "Sort of — it's slow and unstable right now.",
  down: "No — Blackboard is currently unreachable.",
}

/* ── Glass card wrapper ── */
function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-sm shadow-slate-200/50 ${className}`}>
      {children}
    </div>
  )
}

/* ── Hero ── */
function Hero({ status, responseTime, lastChecked, countdown }: { status: ServiceStatus; responseTime: number | null; lastChecked: string; countdown: number }) {
  const c = statusColors[status]
  const Icon = statusIcons[status]
  const timeStr = new Date(lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <div className={`flex items-center justify-center w-24 h-24 rounded-full ${c.bg} border-2 ${c.border} ${status !== "operational" ? "animate-pulse" : ""}`}>
        <Icon className={`w-12 h-12 ${c.text}`} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl text-balance">Can I access Blackboard?</h1>
        <p className={`text-xl font-medium ${c.text}`}>{statusAnswers[status]}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${c.bg} ${c.text} font-medium border ${c.border}`}>
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          {statusLabels[status]}
        </span>
        {responseTime !== null && <span className="font-mono">{responseTime}ms</span>}
        <span>Checked {timeStr}</span>
        <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
          {countdown}s
        </span>
      </div>
    </section>
  )
}

/* ── Services ── */
function Services({ services }: { services: ServiceDetail[] }) {
  const ssoDown = services.find((s) => s.name.includes("SSO"))?.status === "down"
  const bbDown = services.find((s) => s.name.includes("Blackboard"))?.status === "down"

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Service Status</h2>
        <span className="text-xs text-slate-400 font-mono">{services.filter((s) => s.status === "operational").length}/{services.length} up</span>
      </div>
      {ssoDown && !bbDown && (
        <Glass className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-amber-700">SSO is down, but Blackboard itself is working</p>
              <p className="text-xs text-slate-500 leading-relaxed">{"You can't log in right now. If you're already logged in, don't log out — your session may still work."}</p>
            </div>
          </div>
        </Glass>
      )}
      <div className="flex flex-col gap-3">
        {services.map((s) => {
          const cfg = statusColors[s.status]; const Icon = statusIcons[s.status]
          return (
            <Glass key={s.name} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Icon className={`w-5 h-5 ${cfg.text}`} strokeWidth={1.5} /><span className="text-sm font-semibold text-slate-800">{s.name}</span></div>
                <div className="flex items-center gap-3">
                  {s.responseTime !== null && <span className="text-xs font-mono text-slate-400">{s.responseTime}ms</span>}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{s.status === "operational" ? "Operational" : s.status === "degraded" ? "Degraded" : "Down"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">{s.description}</p>
            </Glass>
          )
        })}
      </div>
      <Glass className="p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-slate-700">What is the difference?</p>
            <p className="text-xs text-slate-500 leading-relaxed"><strong className="text-slate-700">SSO</strong> is the university login page. <strong className="text-slate-700">Blackboard LMS</strong> is the course platform. SSO being down means you can{"'"}t log in, even if Blackboard is running fine.</p>
          </div>
        </div>
      </Glass>
    </section>
  )
}

/* ── Tips ── */
const tips = [
  { icon: RefreshCw, text: "Try refreshing the page" },
  { icon: Cookie, text: "Clear your browser cookies" },
  { icon: Globe, text: "Try a different browser" },
  { icon: LogIn, text: "If SSO is down, don't log out — your existing session may still work" },
  { icon: Mail, text: "University email works independently" },
]

function Tips({ status }: { status: ServiceStatus }) {
  if (status === "operational") return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800">{status === "down" ? "While you wait..." : "Things to try"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((t, i) => { const Icon = t.icon; return (
          <Glass key={i} className="p-4 flex items-start gap-3">
            <Icon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-sm text-slate-600 leading-relaxed">{t.text}</p>
          </Glass>
        )})}
      </div>
    </section>
  )
}

/* ── Timeline ── */
function Timeline({ currentStatus }: { currentStatus: ServiceStatus }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const slots: { hour: string; status: ServiceStatus }[] = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600000)
    const h = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    let st: ServiceStatus = "operational"
    if (i === 0) st = currentStatus
    else if (i === 1 && currentStatus !== "operational") st = currentStatus === "down" ? "degraded" : "operational"
    else if (i >= 5 && i <= 6) st = "degraded"
    else if (i === 14) st = "down"
    slots.push({ hour: h, status: st })
  }
  const upCount = slots.filter((s) => s.status === "operational").length
  const pct = ((upCount / slots.length) * 100).toFixed(1)
  const barColors: Record<ServiceStatus, string> = { operational: "bg-emerald-400", degraded: "bg-amber-400", down: "bg-rose-400" }
  const barHover: Record<ServiceStatus, string> = { operational: "bg-emerald-500", degraded: "bg-amber-500", down: "bg-rose-500" }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-800">24-Hour Uptime</h2><span className="text-sm font-mono text-slate-400">{pct}%</span></div>
      <Glass className="p-4">
        <div className="flex gap-0.5 h-10 items-end" role="img" aria-label={`${pct}% uptime`}>
          {slots.map((s, i) => (
            <div key={i} className="relative flex-1 group" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className={`w-full rounded-sm transition-all duration-150 ${hovered === i ? `h-10 ${barHover[s.status]}` : `h-8 ${barColors[s.status]}`}`} />
              {hovered === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-slate-200 shadow-lg whitespace-nowrap">
                  <p className="text-xs font-mono text-slate-700">{s.hour}</p>
                  <p className="text-xs text-slate-500 capitalize">{s.status}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono"><span>{slots[0]?.hour}</span><span>Now</span></div>
      </Glass>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Operational</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Degraded</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Down</span>
      </div>
    </section>
  )
}

/* ── Incidents ── */
function Incidents({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) return (
    <section className="flex flex-col gap-4"><h2 className="text-lg font-semibold text-slate-800">Recent Incidents</h2>
      <Glass className="p-6 text-center"><p className="text-sm text-slate-400">No recent incidents. All clear!</p></Glass>
    </section>
  )
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800">Recent Incidents</h2>
      <div className="flex flex-col gap-3">
        {incidents.map((inc, i) => {
          const ongoing = inc.status === "ongoing"
          return (
            <Glass key={i} className={`p-4 ${ongoing ? "!border-rose-200/70 !bg-rose-50/40" : ""}`}>
              <div className="flex items-start gap-4">
                {ongoing ? <Clock className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" strokeWidth={1.5} /> : <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={1.5} />}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className={`text-sm font-medium ${ongoing ? "text-rose-700" : "text-slate-700"}`}>{inc.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${ongoing ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>{ongoing ? "Ongoing" : "Resolved"}</span>
                    <span>Started {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </Glass>
          )
        })}
      </div>
    </section>
  )
}

/* ── Notify ── */
function Notify() {
  const [pushOn, setPushOn] = useState(false)
  const handlePush = async () => { if (!("Notification" in window)) return; const p = await Notification.requestPermission(); if (p === "granted") setPushOn(true) }
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-800">Get Notified</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={handlePush} disabled={pushOn} className="text-left">
          <Glass className={`p-4 flex items-center gap-3 ${pushOn ? "!border-emerald-200/70 !bg-emerald-50/40" : "hover:!border-blue-200/70"} transition-colors`}>
            <Bell className={`w-5 h-5 shrink-0 ${pushOn ? "text-emerald-500" : "text-slate-400"}`} strokeWidth={1.5} />
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-medium ${pushOn ? "text-emerald-700" : "text-slate-700"}`}>{pushOn ? "Notifications enabled" : "Browser Notifications"}</span>
              <span className="text-xs text-slate-400">{pushOn ? "We'll alert you when status changes" : "Get alerted when Blackboard comes back"}</span>
            </div>
          </Glass>
        </button>
        <a href="https://t.me/BlackboardStatusBot" target="_blank" rel="noopener noreferrer">
          <Glass className="p-4 flex items-center gap-3 hover:!border-blue-200/70 transition-colors">
            <Send className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-slate-700">Telegram Bot</span>
              <span className="text-xs text-slate-400">Join our channel for live updates</span>
            </div>
          </Glass>
        </a>
      </div>
    </section>
  )
}

/* ── Page ── */
export default function GlassPage() {
  const { data, error, isLoading, countdown } = useStatus()

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <div className="flex flex-col items-center gap-4"><div className="w-8 h-8 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-slate-400 font-mono">Checking status...</p></div>
    </div>
  )
  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <Glass className="p-8 max-w-md text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center"><span className="text-rose-500 text-xl font-bold">!</span></div>
        <p className="text-sm text-slate-600">{"Couldn't reach the status API."}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors">Try again</button>
      </Glass>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <main className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-12 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> All designs
        </Link>
        <Hero status={data.status} responseTime={data.responseTime} lastChecked={data.lastChecked} countdown={countdown} />
        <Services services={data.services} />
        <Tips status={data.status} />
        <Timeline currentStatus={data.status} />
        <Incidents incidents={data.incidents} />
        <Notify />
        <footer className="flex flex-col items-center gap-2 pt-8 border-t border-slate-200/60">
          <p className="text-xs text-slate-400 text-center leading-relaxed">Unofficial — not affiliated with the university.</p>
          <p className="text-xs text-slate-400 text-center leading-relaxed">Checks every 30s. Provided as-is.</p>
        </footer>
      </main>
    </div>
  )
}
