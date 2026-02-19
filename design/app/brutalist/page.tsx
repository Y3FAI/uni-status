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

const shadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
const shadowSm = "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"

const sc: Record<ServiceStatus, { text: string; bg: string; border: string }> = {
  operational: { text: "text-black", bg: "bg-emerald-300", border: "border-black" },
  degraded:    { text: "text-black", bg: "bg-yellow-300",  border: "border-black" },
  down:        { text: "text-black", bg: "bg-red-400",     border: "border-black" },
}
const sIcons: Record<ServiceStatus, typeof CheckCircle> = { operational: CheckCircle, degraded: AlertTriangle, down: XCircle }
const sLabels: Record<ServiceStatus, string> = { operational: "ALL SYSTEMS GO", degraded: "HAVING ISSUES", down: "IT'S DOWN" }
const sAnswers: Record<ServiceStatus, string> = {
  operational: "YES.",
  degraded: "BARELY.",
  down: "NO.",
}

function BCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-3 border-black ${shadow} ${className}`}>{children}</div>
}

function Hero({ status, responseTime, lastChecked, countdown }: { status: ServiceStatus; responseTime: number | null; lastChecked: string; countdown: number }) {
  const c = sc[status]; const Icon = sIcons[status]
  const timeStr = new Date(lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  return (
    <section className="flex flex-col gap-6">
      <BCard className={`p-6 ${c.bg}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <Icon className="w-16 h-16 text-black" strokeWidth={2.5} />
          <h1 className="text-5xl font-black uppercase tracking-tighter text-black sm:text-6xl leading-none">CAN I ACCESS BLACKBOARD?</h1>
          <p className="text-4xl font-black uppercase text-black">{sAnswers[status]}</p>
        </div>
      </BCard>
      <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
        <span className={`inline-flex items-center gap-2 px-3 py-1 border-3 border-black ${c.bg} font-bold uppercase ${shadowSm}`}>
          {sLabels[status]}
        </span>
        {responseTime !== null && <span className={`px-3 py-1 border-3 border-black bg-white font-bold ${shadowSm}`}>{responseTime}ms</span>}
        <span className={`px-3 py-1 border-3 border-black bg-white ${shadowSm}`}>{timeStr}</span>
        <span className={`px-3 py-1 border-3 border-black bg-cyan-200 font-bold ${shadowSm}`}>{countdown}s</span>
      </div>
    </section>
  )
}

function Services({ services }: { services: ServiceDetail[] }) {
  const ssoDown = services.find((s) => s.name.includes("SSO"))?.status === "down"
  const bbDown = services.find((s) => s.name.includes("Blackboard"))?.status === "down"
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-black">SERVICE STATUS</h2>
      {ssoDown && !bbDown && (
        <BCard className="p-4 bg-yellow-300">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-black shrink-0 mt-0.5" strokeWidth={2.5} />
            <div><p className="text-sm font-black uppercase text-black">SSO IS DOWN. BLACKBOARD IS FINE.</p><p className="text-xs text-black/70 mt-1">{"Can't log in. Already in? DON'T LOG OUT."}</p></div>
          </div>
        </BCard>
      )}
      <div className="flex flex-col gap-4">
        {services.map((s) => {
          const cfg = sc[s.status]; const Icon = sIcons[s.status]
          return (
            <BCard key={s.name} className={`p-4 ${cfg.bg}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Icon className="w-6 h-6 text-black" strokeWidth={2.5} /><span className="text-sm font-black uppercase text-black">{s.name}</span></div>
                <div className="flex items-center gap-3">
                  {s.responseTime !== null && <span className="text-xs font-mono font-bold text-black/60">{s.responseTime}ms</span>}
                  <span className={`text-xs font-black uppercase px-2 py-0.5 border-2 border-black bg-white ${shadowSm}`}>{s.status === "operational" ? "UP" : s.status === "degraded" ? "SLOW" : "DOWN"}</span>
                </div>
              </div>
              <p className="text-xs text-black/70 mt-2 font-medium">{s.description}</p>
            </BCard>
          )
        })}
      </div>
      <BCard className="p-4 bg-white">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-black shrink-0 mt-0.5" strokeWidth={2.5} />
          <div>
            <p className="text-xs font-black uppercase text-black">WHAT IS THE DIFFERENCE?</p>
            <p className="text-xs text-black/70 mt-1"><strong>SSO</strong> = login page. <strong>BLACKBOARD</strong> = courses. SSO down = no login even if Blackboard works.</p>
          </div>
        </div>
      </BCard>
    </section>
  )
}

const tips = [
  { icon: RefreshCw, text: "REFRESH THE PAGE" },
  { icon: Cookie, text: "CLEAR COOKIES" },
  { icon: Globe, text: "TRY ANOTHER BROWSER" },
  { icon: LogIn, text: "SSO DOWN? DON'T LOG OUT" },
  { icon: Mail, text: "EMAIL STILL WORKS" },
]
function Tips({ status }: { status: ServiceStatus }) {
  if (status === "operational") return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-black">{status === "down" ? "WHILE YOU WAIT" : "TRY THIS"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {tips.map((t, i) => { const Icon = t.icon; return (
          <BCard key={i} className="p-4 bg-white flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-200 border-2 border-black flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-black" strokeWidth={2.5} /></div>
            <p className="text-xs font-bold text-black">{t.text}</p>
          </BCard>
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
  const barColors: Record<ServiceStatus, string> = { operational: "bg-emerald-400", degraded: "bg-yellow-400", down: "bg-red-400" }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-black uppercase tracking-tighter text-black">24H UPTIME</h2><span className={`text-sm font-black px-3 py-1 border-3 border-black bg-cyan-200 ${shadowSm}`}>{pct}%</span></div>
      <BCard className="p-4 bg-white">
        <div className="flex gap-0.5 h-10 items-end" role="img" aria-label={`${pct}% uptime`}>
          {slots.map((s, i) => (
            <div key={i} className="relative flex-1" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className={`w-full transition-all duration-100 ${hovered === i ? "h-10" : "h-7"} ${barColors[s.status]} border-x border-black/20`} />
              {hovered === i && (
                <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-2 py-1 bg-black text-white border-2 border-black whitespace-nowrap`}>
                  <p className="text-xs font-mono font-bold">{s.hour}</p><p className="text-xs uppercase">{s.status}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono font-bold text-black/50"><span>{slots[0]?.hour}</span><span>NOW</span></div>
      </BCard>
      <div className="flex items-center gap-4 text-xs font-bold uppercase">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-400 border-2 border-black" /> Up</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-400 border-2 border-black" /> Slow</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400 border-2 border-black" /> Down</span>
      </div>
    </section>
  )
}

function Incidents({ incidents }: { incidents: Incident[] }) {
  if (!incidents.length) return (
    <section className="flex flex-col gap-4"><h2 className="text-2xl font-black uppercase tracking-tighter text-black">INCIDENTS</h2>
      <BCard className="p-6 bg-emerald-300 text-center"><p className="text-sm font-bold text-black uppercase">ALL CLEAR. NOTHING TO REPORT.</p></BCard>
    </section>
  )
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-black">INCIDENTS</h2>
      <div className="flex flex-col gap-4">
        {incidents.map((inc, i) => {
          const ongoing = inc.status === "ongoing"
          return (
            <BCard key={i} className={`p-4 ${ongoing ? "bg-red-400" : "bg-white"}`}>
              <div className="flex items-start gap-4">
                {ongoing ? <Clock className="w-6 h-6 text-black shrink-0 mt-0.5 animate-pulse" strokeWidth={2.5} /> : <CheckCircle2 className="w-6 h-6 text-black shrink-0 mt-0.5" strokeWidth={2.5} />}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm font-black uppercase text-black">{inc.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-black/70">
                    <span className={`px-2 py-0.5 border-2 border-black uppercase ${ongoing ? "bg-yellow-300" : "bg-emerald-300"}`}>{ongoing ? "ONGOING" : "RESOLVED"}</span>
                    <span>{formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </BCard>
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
      <h2 className="text-2xl font-black uppercase tracking-tighter text-black">GET NOTIFIED</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={handlePush} disabled={pushOn} className="text-left">
          <BCard className={`p-4 flex items-center gap-3 ${pushOn ? "bg-emerald-300" : "bg-white hover:bg-cyan-50"} transition-colors`}>
            <div className="w-10 h-10 bg-yellow-300 border-2 border-black flex items-center justify-center shrink-0"><Bell className="w-5 h-5 text-black" strokeWidth={2.5} /></div>
            <div><p className="text-xs font-black uppercase text-black">{pushOn ? "ENABLED" : "BROWSER ALERTS"}</p><p className="text-[10px] text-black/60 mt-0.5">{pushOn ? "WE'LL PING YOU" : "KNOW WHEN IT'S BACK"}</p></div>
          </BCard>
        </button>
        <a href="https://t.me/BlackboardStatusBot" target="_blank" rel="noopener noreferrer">
          <BCard className="p-4 flex items-center gap-3 bg-white hover:bg-cyan-50 transition-colors">
            <div className="w-10 h-10 bg-cyan-200 border-2 border-black flex items-center justify-center shrink-0"><Send className="w-5 h-5 text-black" strokeWidth={2.5} /></div>
            <div><p className="text-xs font-black uppercase text-black">TELEGRAM</p><p className="text-[10px] text-black/60 mt-0.5">LIVE UPDATES</p></div>
          </BCard>
        </a>
      </div>
    </section>
  )
}

export default function BrutalistPage() {
  const { data, error, isLoading, countdown } = useStatus()
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f5f0e8]">
      <div className="flex flex-col items-center gap-4"><div className={`w-12 h-12 border-4 border-black border-t-transparent rounded-none animate-spin`} /><p className="text-sm font-black uppercase text-black">CHECKING...</p></div>
    </div>
  )
  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f5f0e8]">
      <BCard className="p-8 bg-red-400 max-w-md text-center flex flex-col items-center gap-4">
        <p className="text-sm font-black uppercase text-black">STATUS API UNREACHABLE</p>
        <button onClick={() => window.location.reload()} className={`px-5 py-2 text-sm font-black uppercase bg-yellow-300 border-3 border-black text-black hover:bg-yellow-200 ${shadow}`}>TRY AGAIN</button>
      </BCard>
    </div>
  )
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <main className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-10 sm:px-6 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black uppercase text-black hover:text-black/60 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> ALL DESIGNS
        </Link>
        <Hero status={data.status} responseTime={data.responseTime} lastChecked={data.lastChecked} countdown={countdown} />
        <Services services={data.services} />
        <Tips status={data.status} />
        <Timeline currentStatus={data.status} />
        <Incidents incidents={data.incidents} />
        <Notify />
        <footer className="flex flex-col items-center gap-1 pt-8 border-t-3 border-black">
          <p className="text-xs font-bold uppercase text-black/50 text-center tracking-wider">UNOFFICIAL. NOT THE UNIVERSITY. CHECKS EVERY 30S.</p>
        </footer>
      </main>
    </div>
  )
}
