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

const sc: Record<ServiceStatus, { dot: string; text: string; bg: string; left: string }> = {
  operational: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", left: "border-l-emerald-500" },
  degraded:    { dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",   left: "border-l-amber-500" },
  down:        { dot: "bg-red-500",      text: "text-red-700",     bg: "bg-red-50",      left: "border-l-red-500" },
}
const sIcons: Record<ServiceStatus, typeof CheckCircle> = { operational: CheckCircle, degraded: AlertTriangle, down: XCircle }
const sLabels: Record<ServiceStatus, string> = { operational: "All Systems Operational", degraded: "Experiencing Issues", down: "Major Outage" }
const sAnswers: Record<ServiceStatus, string> = {
  operational: "Yes -- Blackboard is up and running.",
  degraded: "Sort of -- it's slow and unstable right now.",
  down: "No -- Blackboard is currently unreachable.",
}

function FCard({ children, className = "", accent = "" }: { children: React.ReactNode; className?: string; accent?: string }) {
  return <div className={`rounded-lg bg-white border border-slate-200 ${accent ? `border-l-4 ${accent}` : ""} ${className}`}>{children}</div>
}

function Hero({ status, responseTime, lastChecked, countdown }: { status: ServiceStatus; responseTime: number | null; lastChecked: string; countdown: number }) {
  const c = sc[status]; const Icon = sIcons[status]
  const timeStr = new Date(lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  return (
    <section className="flex flex-col gap-6">
      <FCard className="p-8" accent={c.left}>
        <div className="flex flex-col items-center gap-5 text-center">
          <div className={`w-16 h-16 rounded-lg ${c.bg} flex items-center justify-center ${status !== "operational" ? "animate-pulse" : ""}`}>
            <Icon className={`w-8 h-8 ${c.text}`} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl text-balance">Can I access Blackboard?</h1>
            <p className={`text-lg font-semibold ${c.text}`}>{sAnswers[status]}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-md ${c.bg} ${c.text} font-medium`}>
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />{sLabels[status]}
            </span>
            {responseTime !== null && <span className="font-mono bg-slate-100 px-2 py-1 rounded-md text-xs">{responseTime}ms</span>}
            <span className="text-xs">{timeStr}</span>
            <span className="font-mono text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded-md">{countdown}s</span>
          </div>
        </div>
      </FCard>
    </section>
  )
}

function Services({ services }: { services: ServiceDetail[] }) {
  const ssoDown = services.find((s) => s.name.includes("SSO"))?.status === "down"
  const bbDown = services.find((s) => s.name.includes("Blackboard"))?.status === "down"
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Service Status</h2>
        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded-md">{services.filter((s) => s.status === "operational").length}/{services.length} up</span>
      </div>
      {ssoDown && !bbDown && (
        <FCard className="p-4" accent="border-l-amber-500">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1"><p className="text-sm font-semibold text-amber-800">SSO is down, but Blackboard itself is working</p><p className="text-xs text-slate-500 leading-relaxed">{"Can't log in. If already in, don't log out."}</p></div>
          </div>
        </FCard>
      )}
      <div className="flex flex-col gap-3">
        {services.map((s) => {
          const cfg = sc[s.status]; const Icon = sIcons[s.status]
          return (
            <FCard key={s.name} className="p-4" accent={cfg.left}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Icon className={`w-5 h-5 ${cfg.text}`} strokeWidth={1.5} /><span className="text-sm font-bold text-slate-800">{s.name}</span></div>
                <div className="flex items-center gap-3">
                  {s.responseTime !== null && <span className="text-xs font-mono text-slate-400">{s.responseTime}ms</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>{s.status === "operational" ? "Up" : s.status === "degraded" ? "Degraded" : "Down"}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">{s.description}</p>
            </FCard>
          )
        })}
      </div>
      <FCard className="p-4" accent="border-l-sky-500">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold text-slate-700">What is the difference?</p>
            <p className="text-xs text-slate-500 leading-relaxed"><strong className="text-slate-700">SSO</strong> is the login page. <strong className="text-slate-700">Blackboard LMS</strong> is the course platform. SSO down = no login even if Blackboard works.</p>
          </div>
        </div>
      </FCard>
    </section>
  )
}

const tips = [
  { icon: RefreshCw, text: "Refresh the page", color: "bg-sky-100 text-sky-600" },
  { icon: Cookie, text: "Clear cookies", color: "bg-orange-100 text-orange-600" },
  { icon: Globe, text: "Try another browser", color: "bg-indigo-100 text-indigo-600" },
  { icon: LogIn, text: "SSO down? Don't log out", color: "bg-emerald-100 text-emerald-600" },
  { icon: Mail, text: "Email still works", color: "bg-pink-100 text-pink-600" },
]
function Tips({ status }: { status: ServiceStatus }) {
  if (status === "operational") return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-slate-800">{status === "down" ? "While you wait..." : "Things to try"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((t, i) => { const Icon = t.icon; return (
          <FCard key={i} className="p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${t.color} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">{t.text}</p>
          </FCard>
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
  const barColors: Record<ServiceStatus, string> = { operational: "bg-emerald-400", degraded: "bg-amber-400", down: "bg-red-400" }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-800">24-Hour Uptime</h2><span className="text-sm font-mono text-sky-700 bg-sky-50 px-2 py-1 rounded-md">{pct}%</span></div>
      <FCard className="p-4">
        <div className="flex gap-0.5 h-10 items-end" role="img" aria-label={`${pct}% uptime`}>
          {slots.map((s, i) => (
            <div key={i} className="relative flex-1" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className={`w-full rounded-sm transition-all duration-150 ${hovered === i ? "h-10" : "h-7"} ${barColors[s.status]}`} />
              {hovered === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg bg-slate-800 text-white shadow-lg whitespace-nowrap">
                  <p className="text-xs font-mono">{s.hour}</p><p className="text-xs capitalize opacity-80">{s.status}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono"><span>{slots[0]?.hour}</span><span>Now</span></div>
      </FCard>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Operational</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Degraded</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Down</span>
      </div>
    </section>
  )
}

function Incidents({ incidents }: { incidents: Incident[] }) {
  if (!incidents.length) return (
    <section className="flex flex-col gap-4"><h2 className="text-lg font-bold text-slate-800">Recent Incidents</h2>
      <FCard className="p-6 text-center"><p className="text-sm text-slate-400">No recent incidents. All clear!</p></FCard>
    </section>
  )
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-slate-800">Recent Incidents</h2>
      <div className="flex flex-col gap-3">
        {incidents.map((inc, i) => {
          const ongoing = inc.status === "ongoing"
          return (
            <FCard key={i} className="p-4" accent={ongoing ? "border-l-red-500" : "border-l-emerald-500"}>
              <div className="flex items-start gap-4">
                {ongoing ? <Clock className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" strokeWidth={1.5} /> : <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={1.5} />}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className={`text-sm font-semibold ${ongoing ? "text-red-700" : "text-slate-700"}`}>{inc.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className={`px-1.5 py-0.5 rounded-md font-semibold ${ongoing ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>{ongoing ? "Ongoing" : "Resolved"}</span>
                    <span>{formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </FCard>
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
      <h2 className="text-lg font-bold text-slate-800">Get Notified</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={handlePush} disabled={pushOn} className="text-left">
          <FCard className={`p-4 flex items-center gap-3 transition-colors ${pushOn ? "!border-l-4 !border-l-emerald-500" : "hover:border-sky-300"}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${pushOn ? "bg-emerald-100" : "bg-slate-100"}`}>
              <Bell className={`w-4 h-4 ${pushOn ? "text-emerald-600" : "text-slate-500"}`} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-0.5"><span className={`text-sm font-semibold ${pushOn ? "text-emerald-700" : "text-slate-700"}`}>{pushOn ? "Enabled" : "Browser Notifications"}</span><span className="text-xs text-slate-400">{pushOn ? "We'll alert you" : "Get pinged when it's back"}</span></div>
          </FCard>
        </button>
        <a href="https://t.me/BlackboardStatusBot" target="_blank" rel="noopener noreferrer">
          <FCard className="p-4 flex items-center gap-3 hover:border-sky-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0"><Send className="w-4 h-4 text-sky-600" strokeWidth={1.5} /></div>
            <div className="flex flex-col gap-0.5"><span className="text-sm font-semibold text-slate-700">Telegram</span><span className="text-xs text-slate-400">Live updates</span></div>
          </FCard>
        </a>
      </div>
    </section>
  )
}

export default function FlatPage() {
  const { data, error, isLoading, countdown } = useStatus()
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4"><div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-slate-400 font-mono">Checking status...</p></div>
    </div>
  )
  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <FCard className="p-8 max-w-md text-center flex flex-col items-center gap-4" accent="border-l-red-500">
        <p className="text-sm text-slate-600">{"Couldn't reach the status API."}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors">Try again</button>
      </FCard>
    </div>
  )
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-10 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-sky-600 transition-colors w-fit font-medium">
          <ArrowLeft className="w-4 h-4" /> All designs
        </Link>
        <Hero status={data.status} responseTime={data.responseTime} lastChecked={data.lastChecked} countdown={countdown} />
        <Services services={data.services} />
        <Tips status={data.status} />
        <Timeline currentStatus={data.status} />
        <Incidents incidents={data.incidents} />
        <Notify />
        <footer className="flex flex-col items-center gap-2 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center">Unofficial. Not affiliated with the university. Checks every 30s.</p>
        </footer>
      </main>
    </div>
  )
}
