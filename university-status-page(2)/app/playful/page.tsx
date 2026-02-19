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

const sc: Record<ServiceStatus, { dot: string; text: string; bg: string; border: string; cardBg: string }> = {
  operational: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-300", cardBg: "bg-emerald-50" },
  degraded:    { dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-100",   border: "border-amber-300",   cardBg: "bg-amber-50" },
  down:        { dot: "bg-rose-500",     text: "text-rose-700",    bg: "bg-rose-100",     border: "border-rose-300",    cardBg: "bg-rose-50" },
}
const sIcons: Record<ServiceStatus, typeof CheckCircle> = { operational: CheckCircle, degraded: AlertTriangle, down: XCircle }
const sLabels: Record<ServiceStatus, string> = { operational: "All Systems Go!", degraded: "A Little Wobbly", down: "It's Down" }
const sAnswers: Record<ServiceStatus, string> = {
  operational: "Yes! Blackboard is working great.",
  degraded: "Kind of... it's being sluggish right now.",
  down: "Nope. Blackboard is down right now.",
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border-2 p-5 ${className}`}>{children}</div>
}

function Hero({ status, responseTime, lastChecked, countdown }: { status: ServiceStatus; responseTime: number | null; lastChecked: string; countdown: number }) {
  const c = sc[status]; const Icon = sIcons[status]
  const timeStr = new Date(lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <div className={`flex items-center justify-center w-28 h-28 rounded-full ${c.bg} border-2 ${c.border} ${status !== "operational" ? "animate-bounce" : ""}`}>
        <Icon className={`w-14 h-14 ${c.text}`} strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 sm:text-5xl text-balance">Can I access Blackboard?</h1>
        <p className={`text-2xl font-bold ${c.text}`}>{sAnswers[status]}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${c.bg} ${c.text} font-bold border-2 ${c.border}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
          {sLabels[status]}
        </span>
        {responseTime !== null && <span className="font-mono px-3 py-1 rounded-full bg-slate-100 border-2 border-slate-200">{responseTime}ms</span>}
        <span className="px-3 py-1 rounded-full bg-slate-100 border-2 border-slate-200 text-xs">Checked {timeStr}</span>
        <span className="font-mono text-xs px-3 py-1 rounded-full bg-teal-100 text-teal-700 border-2 border-teal-200 font-bold">{countdown}s</span>
      </div>
    </section>
  )
}

function Services({ services }: { services: ServiceDetail[] }) {
  const ssoDown = services.find((s) => s.name.includes("SSO"))?.status === "down"
  const bbDown = services.find((s) => s.name.includes("Blackboard"))?.status === "down"
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-800">Service Status</h2>
        <span className="text-sm text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full border-2 border-slate-200">{services.filter((s) => s.status === "operational").length}/{services.length} up</span>
      </div>
      {ssoDown && !bbDown && (
        <Card className="border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-amber-800">Heads up! SSO is down but Blackboard is fine</p>
              <p className="text-xs text-slate-600 leading-relaxed">{"Can't log in right now. Already logged in? Stay logged in!"}</p>
            </div>
          </div>
        </Card>
      )}
      <div className="flex flex-col gap-3">
        {services.map((s) => {
          const cfg = sc[s.status]; const Icon = sIcons[s.status]
          return (
            <Card key={s.name} className={`${cfg.border} ${cfg.cardBg}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Icon className={`w-6 h-6 ${cfg.text}`} strokeWidth={2} /><span className="text-sm font-extrabold text-slate-800">{s.name}</span></div>
                <div className="flex items-center gap-3">
                  {s.responseTime !== null && <span className="text-xs font-mono text-slate-400 bg-white/60 px-2 py-0.5 rounded-full">{s.responseTime}ms</span>}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{s.status === "operational" ? "Up" : s.status === "degraded" ? "Slow" : "Down"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">{s.description}</p>
            </Card>
          )
        })}
      </div>
      <Card className="border-slate-200 bg-white">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold text-slate-700">Wait, what is the difference?</p>
            <p className="text-xs text-slate-500 leading-relaxed"><strong className="text-slate-700">SSO</strong> = the login page. <strong className="text-slate-700">Blackboard</strong> = the actual courses. SSO down means no login, even if Blackboard is fine!</p>
          </div>
        </div>
      </Card>
    </section>
  )
}

const tips = [
  { icon: RefreshCw, text: "Refresh the page" },
  { icon: Cookie, text: "Clear cookies" },
  { icon: Globe, text: "Try another browser" },
  { icon: LogIn, text: "SSO down? Don't log out!" },
  { icon: Mail, text: "Email still works separately" },
]
function Tips({ status }: { status: ServiceStatus }) {
  if (status === "operational") return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-extrabold text-slate-800">{status === "down" ? "While you wait..." : "Quick fixes"}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((t, i) => { const Icon = t.icon; return (
          <Card key={i} className="border-slate-200 bg-white flex items-start gap-3 !p-4">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-teal-600" strokeWidth={2} />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">{t.text}</p>
          </Card>
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

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold text-slate-800">24-Hour Uptime</h2><span className="text-sm font-bold text-teal-600 bg-teal-100 px-3 py-1 rounded-full border-2 border-teal-200">{pct}%</span></div>
      <Card className="border-slate-200 bg-white !p-4">
        <div className="flex gap-1 h-12 items-end" role="img" aria-label={`${pct}% uptime`}>
          {slots.map((s, i) => (
            <div key={i} className="relative flex-1 group" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className={`w-full rounded-full transition-all duration-200 ${hovered === i ? "h-12" : "h-8"} ${barColors[s.status]}`} />
              {hovered === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-2xl bg-slate-800 text-white shadow-lg whitespace-nowrap border-2 border-slate-700">
                  <p className="text-xs font-mono">{s.hour}</p><p className="text-xs capitalize opacity-80">{s.status}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-xs text-slate-400 font-mono"><span>{slots[0]?.hour}</span><span>Now</span></div>
      </Card>
      <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400" /> Up</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400" /> Slow</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-400" /> Down</span>
      </div>
    </section>
  )
}

function Incidents({ incidents }: { incidents: Incident[] }) {
  if (!incidents.length) return (
    <section className="flex flex-col gap-4"><h2 className="text-xl font-extrabold text-slate-800">Recent Incidents</h2>
      <Card className="border-slate-200 bg-white text-center"><p className="text-sm text-slate-400 font-medium">All clear! Nothing to report.</p></Card>
    </section>
  )
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-extrabold text-slate-800">Recent Incidents</h2>
      <div className="flex flex-col gap-3">
        {incidents.map((inc, i) => {
          const ongoing = inc.status === "ongoing"
          return (
            <Card key={i} className={ongoing ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"}>
              <div className="flex items-start gap-4">
                {ongoing ? <Clock className="w-6 h-6 text-rose-500 shrink-0 mt-0.5 animate-pulse" strokeWidth={2} /> : <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className={`text-sm font-bold ${ongoing ? "text-rose-700" : "text-slate-700"}`}>{inc.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${ongoing ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>{ongoing ? "Ongoing" : "Resolved"}</span>
                    <span>Started {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </Card>
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
      <h2 className="text-xl font-extrabold text-slate-800">Get Notified</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={handlePush} disabled={pushOn} className="text-left">
          <Card className={`flex items-center gap-3 !p-4 transition-colors ${pushOn ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-teal-300"}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${pushOn ? "bg-emerald-100" : "bg-slate-100"}`}>
              <Bell className={`w-5 h-5 ${pushOn ? "text-emerald-600" : "text-slate-400"}`} strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-bold ${pushOn ? "text-emerald-700" : "text-slate-700"}`}>{pushOn ? "You're all set!" : "Browser Alerts"}</span>
              <span className="text-xs text-slate-400">{pushOn ? "We'll ping you" : "Know when it's back"}</span>
            </div>
          </Card>
        </button>
        <a href="https://t.me/BlackboardStatusBot" target="_blank" rel="noopener noreferrer">
          <Card className="flex items-center gap-3 !p-4 border-slate-200 bg-white hover:border-teal-300 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-sky-600" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-slate-700">Telegram</span>
              <span className="text-xs text-slate-400">Live updates channel</span>
            </div>
          </Card>
        </a>
      </div>
    </section>
  )
}

export default function PlayfulPage() {
  const { data, error, isLoading, countdown } = useStatus()
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-teal-50/40">
      <div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-teal-300 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-slate-400 font-bold">Checking...</p></div>
    </div>
  )
  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-teal-50/40">
      <Card className="border-slate-200 bg-white max-w-md text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center"><span className="text-rose-500 text-2xl font-extrabold">!</span></div>
        <p className="text-sm text-slate-600">{"Couldn't reach the status API."}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2 text-sm font-bold rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-colors">Try again</button>
      </Card>
    </div>
  )
  return (
    <div className="min-h-screen bg-teal-50/40">
      <main className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-12 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-teal-600 transition-colors w-fit font-bold">
          <ArrowLeft className="w-4 h-4" /> All designs
        </Link>
        <Hero status={data.status} responseTime={data.responseTime} lastChecked={data.lastChecked} countdown={countdown} />
        <Services services={data.services} />
        <Tips status={data.status} />
        <Timeline currentStatus={data.status} />
        <Incidents incidents={data.incidents} />
        <Notify />
        <footer className="flex flex-col items-center gap-2 pt-8 border-t-2 border-slate-200">
          <p className="text-xs text-slate-400 text-center font-medium">Unofficial. Not affiliated with the university. Checks every 30s.</p>
        </footer>
      </main>
    </div>
  )
}
