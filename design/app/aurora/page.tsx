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

const sc: Record<ServiceStatus, { dot: string; text: string; glow: string; bg: string; border: string }> = {
  operational: { dot: "bg-emerald-400", text: "text-emerald-400", glow: "shadow-emerald-400/40", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  degraded:    { dot: "bg-amber-400",   text: "text-amber-400",   glow: "shadow-amber-400/40",   bg: "bg-amber-400/10",   border: "border-amber-400/20" },
  down:        { dot: "bg-rose-400",     text: "text-rose-400",    glow: "shadow-rose-400/40",     bg: "bg-rose-400/10",    border: "border-rose-400/20" },
}
const sIcons: Record<ServiceStatus, typeof CheckCircle> = { operational: CheckCircle, degraded: AlertTriangle, down: XCircle }
const sLabels: Record<ServiceStatus, string> = { operational: "All Systems Operational", degraded: "Experiencing Issues", down: "Major Outage" }
const sAnswers: Record<ServiceStatus, string> = {
  operational: "Yes — Blackboard is up and running.",
  degraded: "Sort of — it's slow and unstable right now.",
  down: "No — Blackboard is currently unreachable.",
}

function GCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] ${className}`}>{children}</div>
}

function Hero({ status, responseTime, lastChecked, countdown }: { status: ServiceStatus; responseTime: number | null; lastChecked: string; countdown: number }) {
  const c = sc[status]; const Icon = sIcons[status]
  const timeStr = new Date(lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <div className={`relative flex items-center justify-center w-28 h-28 rounded-full ${c.bg} border ${c.border} shadow-lg ${c.glow} ${status !== "operational" ? "animate-pulse" : ""}`}>
        <Icon className={`w-14 h-14 ${c.text}`} strokeWidth={1.5} />
        <div className={`absolute inset-0 rounded-full ${c.bg} blur-xl opacity-60 -z-10`} />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent sm:text-5xl text-balance">Can I access Blackboard?</h1>
        <p className={`text-xl font-medium ${c.text}`}>{sAnswers[status]}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neutral-400">
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${c.bg} ${c.text} font-medium border ${c.border}`}>
          <span className={`w-2 h-2 rounded-full ${c.dot} shadow-sm ${c.glow}`} />{sLabels[status]}
        </span>
        {responseTime !== null && <span className="font-mono text-neutral-500">{responseTime}ms</span>}
        <span className="text-neutral-500">{timeStr}</span>
        <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-neutral-400">{countdown}s</span>
      </div>
    </section>
  )
}

function Services({ services }: { services: ServiceDetail[] }) {
  const ssoDown = services.find((s) => s.name.includes("SSO"))?.status === "down"
  const bbDown = services.find((s) => s.name.includes("Blackboard"))?.status === "down"
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Service Status</h2>
        <span className="text-xs text-neutral-500 font-mono">{services.filter((s) => s.status === "operational").length}/{services.length} up</span>
      </div>
      {ssoDown && !bbDown && (
        <GCard className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1"><p className="text-sm font-medium text-amber-400">SSO is down, but Blackboard itself is working</p><p className="text-xs text-neutral-400 leading-relaxed">{"Can't log in right now. Don't log out if you're already in."}</p></div>
          </div>
        </GCard>
      )}
      <div className="flex flex-col gap-3">
        {services.map((s) => {
          const cfg = sc[s.status]; const Icon = sIcons[s.status]
          return (
            <GCard key={s.name} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Icon className={`w-5 h-5 ${cfg.text}`} strokeWidth={1.5} /><span className="text-sm font-semibold text-white">{s.name}</span></div>
                <div className="flex items-center gap-3">
                  {s.responseTime !== null && <span className="text-xs font-mono text-neutral-500">{s.responseTime}ms</span>}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{s.status === "operational" ? "Operational" : s.status === "degraded" ? "Degraded" : "Down"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed mt-2">{s.description}</p>
            </GCard>
          )
        })}
      </div>
      <GCard className="p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-neutral-300">What is the difference?</p>
            <p className="text-xs text-neutral-500 leading-relaxed"><strong className="text-neutral-300">SSO</strong> is the login page. <strong className="text-neutral-300">Blackboard LMS</strong> is the course platform. SSO down = no login even if Blackboard works.</p>
          </div>
        </div>
      </GCard>
    </section>
  )
}

const tips = [
  { icon: RefreshCw, text: "Refresh the page" },
  { icon: Cookie, text: "Clear browser cookies" },
  { icon: Globe, text: "Try another browser" },
  { icon: LogIn, text: "SSO down? Don't log out" },
  { icon: Mail, text: "Email still works" },
]
function Tips({ status }: { status: ServiceStatus }) {
  if (status === "operational") return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white">{status === "down" ? "While you wait..." : "Things to try"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((t, i) => { const Icon = t.icon; return (
          <GCard key={i} className="p-4 flex items-start gap-3">
            <Icon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-sm text-neutral-300 leading-relaxed">{t.text}</p>
          </GCard>
        )})}
      </div>
    </section>
  )
}

function Timeline({ currentStatus }: { currentStatus: ServiceStatus }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const slots: { hour: string; status: ServiceStatus }[] = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600000)
    const h = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    let st: ServiceStatus = "operational"
    if (i === 0) st = currentStatus; else if (i === 1 && currentStatus !== "operational") st = currentStatus === "down" ? "degraded" : "operational"
    else if (i >= 5 && i <= 6) st = "degraded"; else if (i === 14) st = "down"
    slots.push({ hour: h, status: st })
  }
  const pct = ((slots.filter((s) => s.status === "operational").length / slots.length) * 100).toFixed(1)
  const barColors: Record<ServiceStatus, string> = { operational: "bg-emerald-400", degraded: "bg-amber-400", down: "bg-rose-400" }
  const barGlow: Record<ServiceStatus, string> = { operational: "shadow-emerald-400/30", degraded: "shadow-amber-400/30", down: "shadow-rose-400/30" }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">24-Hour Uptime</h2><span className="text-sm font-mono text-neutral-500">{pct}%</span></div>
      <GCard className="p-4">
        <div className="flex gap-0.5 h-10 items-end" role="img" aria-label={`${pct}% uptime`}>
          {slots.map((s, i) => (
            <div key={i} className="relative flex-1" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className={`w-full rounded-sm transition-all duration-200 ${hovered === i ? `h-10 shadow-sm ${barGlow[s.status]}` : "h-8"} ${barColors[s.status]}`} />
              {hovered === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 shadow-xl whitespace-nowrap">
                  <p className="text-xs font-mono text-white">{s.hour}</p><p className="text-xs text-neutral-400 capitalize">{s.status}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-600 font-mono"><span>{slots[0]?.hour}</span><span>Now</span></div>
      </GCard>
      <div className="flex items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Operational</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Degraded</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Down</span>
      </div>
    </section>
  )
}

function Incidents({ incidents }: { incidents: Incident[] }) {
  if (!incidents.length) return (
    <section className="flex flex-col gap-4"><h2 className="text-lg font-semibold text-white">Recent Incidents</h2>
      <GCard className="p-6 text-center"><p className="text-sm text-neutral-500">No incidents. All clear!</p></GCard>
    </section>
  )
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white">Recent Incidents</h2>
      <div className="flex flex-col gap-3">
        {incidents.map((inc, i) => {
          const ongoing = inc.status === "ongoing"
          return (
            <GCard key={i} className={`p-4 ${ongoing ? "!border-rose-400/20 !bg-rose-400/5" : ""}`}>
              <div className="flex items-start gap-4">
                {ongoing ? <Clock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" strokeWidth={1.5} /> : <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.5} />}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className={`text-sm font-medium ${ongoing ? "text-rose-300" : "text-neutral-200"}`}>{inc.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${ongoing ? "bg-rose-400/10 text-rose-400" : "bg-emerald-400/10 text-emerald-400"}`}>{ongoing ? "Ongoing" : "Resolved"}</span>
                    <span>{formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </GCard>
          )
        })}
      </div>
    </section>
  )
}

function Notify() {
  const [pushOn, setPushOn] = useState(false)
  const handlePush = async () => { if (!("Notification" in window)) return; const p = await Notification.requestPermission(); if (p === "granted") setPushOn(true) }
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white">Get Notified</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={handlePush} disabled={pushOn} className="text-left">
          <GCard className={`p-4 flex items-center gap-3 transition-colors ${pushOn ? "!border-emerald-400/20 !bg-emerald-400/5" : "hover:!border-cyan-400/20"}`}>
            <Bell className={`w-5 h-5 shrink-0 ${pushOn ? "text-emerald-400" : "text-neutral-500"}`} strokeWidth={1.5} />
            <div className="flex flex-col gap-0.5"><span className={`text-sm font-medium ${pushOn ? "text-emerald-400" : "text-neutral-200"}`}>{pushOn ? "Enabled" : "Browser Notifications"}</span><span className="text-xs text-neutral-500">{pushOn ? "We'll alert you" : "Get notified when it's back"}</span></div>
          </GCard>
        </button>
        <a href="https://t.me/BlackboardStatusBot" target="_blank" rel="noopener noreferrer">
          <GCard className="p-4 flex items-center gap-3 hover:!border-cyan-400/20 transition-colors">
            <Send className="w-5 h-5 text-neutral-500 shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col gap-0.5"><span className="text-sm font-medium text-neutral-200">Telegram</span><span className="text-xs text-neutral-500">Live updates</span></div>
          </GCard>
        </a>
      </div>
    </section>
  )
}

export default function AuroraPage() {
  const { data, error, isLoading, countdown } = useStatus()
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#08080f] relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="flex flex-col items-center gap-4 relative z-10"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-neutral-500 font-mono">Checking status...</p></div>
    </div>
  )
  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-[#08080f]">
      <GCard className="p-8 max-w-md text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-400/10 border border-rose-400/20 flex items-center justify-center"><span className="text-rose-400 text-xl font-bold">!</span></div>
        <p className="text-sm text-neutral-300">{"Couldn't reach the status API."}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:opacity-90 transition-opacity">Try again</button>
      </GCard>
    </div>
  )
  return (
    <div className="min-h-screen bg-[#08080f] text-white relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-cyan-500/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[30rem] h-[30rem] bg-emerald-500/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-indigo-500/[0.05] rounded-full blur-3xl pointer-events-none" />
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-12 flex flex-col gap-12 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-cyan-400 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> All designs
        </Link>
        <Hero status={data.status} responseTime={data.responseTime} lastChecked={data.lastChecked} countdown={countdown} />
        <Services services={data.services} />
        <Tips status={data.status} />
        <Timeline currentStatus={data.status} />
        <Incidents incidents={data.incidents} />
        <Notify />
        <footer className="flex flex-col items-center gap-2 pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-neutral-600 text-center">Unofficial. Not affiliated with the university. Checks every 30s.</p>
        </footer>
      </main>
    </div>
  )
}
