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

const sc: Record<ServiceStatus, { dot: string; text: string; bg: string; border: string }> = {
  operational: { dot: "bg-green-700", text: "text-green-800", bg: "bg-green-50", border: "border-green-200" },
  degraded:    { dot: "bg-amber-700", text: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200" },
  down:        { dot: "bg-red-700",   text: "text-red-800",   bg: "bg-red-50",   border: "border-red-200" },
}
const sIcons: Record<ServiceStatus, typeof CheckCircle> = { operational: CheckCircle, degraded: AlertTriangle, down: XCircle }
const sLabels: Record<ServiceStatus, string> = { operational: "All Systems Operational", degraded: "Experiencing Issues", down: "Major Outage" }
const sAnswers: Record<ServiceStatus, string> = {
  operational: "Yes — Blackboard is up and running.",
  degraded: "Sort of — it's slow and unstable right now.",
  down: "No — Blackboard is currently unreachable.",
}

function Divider() { return <hr className="border-stone-200" /> }

function Hero({ status, responseTime, lastChecked, countdown }: { status: ServiceStatus; responseTime: number | null; lastChecked: string; countdown: number }) {
  const c = sc[status]; const Icon = sIcons[status]
  const timeStr = new Date(lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className={`inline-flex items-center gap-2 w-fit px-3 py-1 rounded-sm ${c.bg} border ${c.border}`}>
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          <span className={`text-xs font-medium tracking-wide uppercase ${c.text}`}>{sLabels[status]}</span>
        </div>
        <h1 className="text-4xl font-serif tracking-tight text-stone-900 sm:text-5xl text-balance leading-tight">Can I access Blackboard?</h1>
        <p className={`text-xl ${c.text} font-serif italic`}>{sAnswers[status]}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
        {responseTime !== null && <span className="font-mono text-xs">{responseTime}ms response</span>}
        <span className="text-xs">Last checked: {timeStr}</span>
        <span className="font-mono text-xs text-stone-400">Next check in {countdown}s</span>
      </div>
    </section>
  )
}

function Services({ services }: { services: ServiceDetail[] }) {
  const ssoDown = services.find((s) => s.name.includes("SSO"))?.status === "down"
  const bbDown = services.find((s) => s.name.includes("Blackboard"))?.status === "down"
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-serif text-stone-900">Service Status</h2>
        <span className="text-xs text-stone-400 font-mono">{services.filter((s) => s.status === "operational").length}/{services.length} up</span>
      </div>
      {ssoDown && !bbDown && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-amber-800">SSO is down, but Blackboard itself is working</p>
              <p className="text-xs text-stone-600 leading-relaxed">{"You can't log in right now. If you're already logged in, don't log out."}</p>
            </div>
          </div>
        </div>
      )}
      {services.map((s) => {
        const cfg = sc[s.status]; const Icon = sIcons[s.status]
        return (
          <div key={s.name} className={`flex flex-col gap-3 p-5 border ${cfg.border} rounded-sm ${cfg.bg}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><Icon className={`w-5 h-5 ${cfg.text}`} strokeWidth={1.5} /><span className="text-sm font-semibold text-stone-800">{s.name}</span></div>
              <div className="flex items-center gap-3">
                {s.responseTime !== null && <span className="text-xs font-mono text-stone-400">{s.responseTime}ms</span>}
                <span className={`text-xs font-medium uppercase tracking-wider ${cfg.text}`}>{s.status}</span>
              </div>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">{s.description}</p>
          </div>
        )
      })}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-stone-700">What is the difference?</p>
            <p className="text-xs text-stone-500 leading-relaxed"><strong className="text-stone-700">SSO</strong> is the university login page. <strong className="text-stone-700">Blackboard LMS</strong> is the course platform. SSO being down means you can{"'"}t log in, even if Blackboard is running.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

const tips = [
  { icon: RefreshCw, text: "Try refreshing the page" },
  { icon: Cookie, text: "Clear your browser cookies" },
  { icon: Globe, text: "Try a different browser" },
  { icon: LogIn, text: "If SSO is down, don't log out" },
  { icon: Mail, text: "University email works independently" },
]
function Tips({ status }: { status: ServiceStatus }) {
  if (status === "operational") return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-serif text-stone-900">{status === "down" ? "While you wait..." : "Things to try"}</h2>
      <ul className="flex flex-col gap-2">
        {tips.map((t, i) => { const Icon = t.icon; return (
          <li key={i} className="flex items-start gap-3 py-2 border-b border-stone-100 last:border-b-0">
            <Icon className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-sm text-stone-600 leading-relaxed">{t.text}</p>
          </li>
        )})}
      </ul>
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
  const barColors: Record<ServiceStatus, string> = { operational: "bg-green-600", degraded: "bg-amber-500", down: "bg-red-500" }
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="text-lg font-serif text-stone-900">24-Hour Uptime</h2><span className="text-sm font-mono text-stone-400">{pct}%</span></div>
      <div className="flex gap-px h-8 items-end" role="img" aria-label={`${pct}% uptime`}>
        {slots.map((s, i) => (
          <div key={i} className="relative flex-1 group" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div className={`w-full rounded-none transition-all duration-150 ${hovered === i ? "h-8" : "h-6"} ${barColors[s.status]}`} />
            {hovered === i && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-stone-800 text-white rounded-sm shadow-lg whitespace-nowrap">
                <p className="text-xs font-mono">{s.hour}</p><p className="text-xs capitalize opacity-80">{s.status}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-stone-400 font-mono"><span>{slots[0]?.hour}</span><span>Now</span></div>
      <div className="flex items-center gap-4 text-xs text-stone-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-600" /> Operational</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500" /> Degraded</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500" /> Down</span>
      </div>
    </section>
  )
}

function Incidents({ incidents }: { incidents: Incident[] }) {
  if (!incidents.length) return (
    <section className="flex flex-col gap-4"><h2 className="text-lg font-serif text-stone-900">Recent Incidents</h2>
      <p className="text-sm text-stone-400 italic">No recent incidents. All clear!</p>
    </section>
  )
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-serif text-stone-900">Recent Incidents</h2>
      {incidents.map((inc, i) => {
        const ongoing = inc.status === "ongoing"
        return (
          <div key={i} className={`flex items-start gap-4 p-4 border rounded-sm ${ongoing ? "bg-red-50 border-red-200" : "bg-stone-50 border-stone-200"}`}>
            {ongoing ? <Clock className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" strokeWidth={1.5} /> : <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" strokeWidth={1.5} />}
            <div className="flex flex-col gap-1 min-w-0">
              <p className={`text-sm font-medium ${ongoing ? "text-red-800" : "text-stone-700"}`}>{inc.title}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
                <span className={`px-1.5 py-0.5 font-medium uppercase tracking-wider text-[10px] ${ongoing ? "text-red-700" : "text-green-700"}`}>{ongoing ? "Ongoing" : "Resolved"}</span>
                <span>Started {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

function Notify() {
  const [pushOn, setPushOn] = useState(false)
  const handlePush = async () => { if (!("Notification" in window)) return; const p = await Notification.requestPermission(); if (p === "granted") setPushOn(true) }
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-serif text-stone-900">Get Notified</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={handlePush} disabled={pushOn} className={`text-left p-4 border rounded-sm transition-colors ${pushOn ? "bg-green-50 border-green-200" : "bg-stone-50 border-stone-200 hover:border-stone-400"}`}>
          <div className="flex items-center gap-3">
            <Bell className={`w-5 h-5 shrink-0 ${pushOn ? "text-green-700" : "text-stone-400"}`} strokeWidth={1.5} />
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-medium ${pushOn ? "text-green-800" : "text-stone-700"}`}>{pushOn ? "Notifications enabled" : "Browser Notifications"}</span>
              <span className="text-xs text-stone-400">{pushOn ? "We'll alert you" : "Get alerted when it's back"}</span>
            </div>
          </div>
        </button>
        <a href="https://t.me/BlackboardStatusBot" target="_blank" rel="noopener noreferrer" className="p-4 border border-stone-200 rounded-sm bg-stone-50 hover:border-stone-400 transition-colors">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-stone-400 shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-stone-700">Telegram Bot</span>
              <span className="text-xs text-stone-400">Join for live updates</span>
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}

export default function WarmPage() {
  const { data, error, isLoading, countdown } = useStatus()
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50/30">
      <div className="flex flex-col items-center gap-4"><div className="w-6 h-6 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-stone-400 font-serif italic">Checking status...</p></div>
    </div>
  )
  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50/30">
      <div className="p-8 max-w-md text-center border border-stone-200 rounded-sm bg-white flex flex-col items-center gap-4">
        <p className="text-sm text-stone-600">{"Couldn't reach the status API."}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium bg-stone-800 text-white hover:bg-stone-700 transition-colors">Try again</button>
      </div>
    </div>
  )
  return (
    <div className="min-h-screen bg-orange-50/30">
      <main className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-10 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> All designs
        </Link>
        <Hero status={data.status} responseTime={data.responseTime} lastChecked={data.lastChecked} countdown={countdown} />
        <Divider />
        <Services services={data.services} />
        <Divider />
        <Tips status={data.status} />
        {data.status !== "operational" && <Divider />}
        <Timeline currentStatus={data.status} />
        <Divider />
        <Incidents incidents={data.incidents} />
        <Divider />
        <Notify />
        <Divider />
        <footer className="flex flex-col items-center gap-1">
          <p className="text-xs text-stone-400 text-center italic">Unofficial — not affiliated with the university.</p>
          <p className="text-xs text-stone-400 text-center">Checks every 30s. Provided as-is.</p>
        </footer>
      </main>
    </div>
  )
}
