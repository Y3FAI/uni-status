import { useState, useEffect, useCallback } from "react";
import type { StatusResponse, Status, HistoryPoint } from "@/lib/types";
import { fetchStatus, fetchHistory, fetchVapidKey, subscribeToPush } from "@/lib/api";

// Brutalist shadow utilities
const shadow = "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
const shadowSm = "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]";

// Status config
const statusConfig: Record<Status, { bg: string; label: string }> = {
  up: { bg: "bg-emerald-300", label: "شغال" },
  degraded: { bg: "bg-yellow-300", label: "مشاكل" },
  down: { bg: "bg-red-400", label: "واقف" },
};

const overallLabels: Record<Status, { answer: string; status: string }> = {
  up: { answer: "ايه شغال", status: "كل الخدمات شغالة" },
  degraded: { answer: "شغال بس بطيء", status: "فيه مشاكل" },
  down: { answer: "لا واقف", status: "واقف" },
};

// Service name translations
const serviceNames: Record<string, string> = {
  lms: "البلاك بورد",
  sso: "تسجيل الدخول SSO",
  eservice: "الخدمات الإلكترونية",
  email: "البريد الإلكتروني",
};

const serviceDescriptions: Record<string, string> = {
  lms: "نظام إدارة التعلم - المحاضرات والواجبات والدرجات",
  sso: "بوابة تسجيل الدخول الموحد للجامعة",
  eservice: "الخدمات الإلكترونية للطلاب",
  email: "البريد الإلكتروني (Microsoft 365)",
};

// Icons as inline SVGs
const CheckIcon = () => (
  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const XIcon = () => (
  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const SmallCheckIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SmallAlertIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SmallXIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const CookieIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
    <path d="M8.5 8.5v.01" />
    <path d="M16 15.5v.01" />
    <path d="M12 12v.01" />
    <path d="M11 17v.01" />
    <path d="M7 14v.01" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LogInIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// Card component
function BCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-3 border-black ${shadow} ${className}`}>{children}</div>;
}

// Calculate overall status from services
function getOverallStatus(data: StatusResponse): Status {
  if (!data.canAccessBlackboard) return "down";
  const hasDown = data.services.some((s) => s.status === "down");
  if (hasDown) return "down";
  const hasDegraded = data.services.some((s) => s.status === "degraded");
  if (hasDegraded) return "degraded";
  return "up";
}

// Get response time of main services
function getMainResponseTime(data: StatusResponse): number | null {
  const lms = data.services.find((s) => s.id === "lms");
  return lms?.responseTime ?? null;
}

// Format relative time in Arabic
function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;

  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}

// Hero section
function Hero({
  status,
  responseTime,
  lastChecked,
  countdown,
}: {
  status: Status;
  responseTime: number | null;
  lastChecked: string;
  countdown: number;
}) {
  const config = statusConfig[status];
  const labels = overallLabels[status];
  const timeStr = new Date(lastChecked).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const StatusIcon = status === "up" ? CheckIcon : status === "degraded" ? AlertIcon : XIcon;

  return (
    <section className="flex flex-col gap-6">
      <BCard className={`p-6 ${config.bg}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <StatusIcon />
          <h1 className="text-4xl font-black uppercase tracking-tight text-black sm:text-5xl leading-tight">
            هل البلاك بورد شغال؟
          </h1>
          <p className="text-3xl font-black text-black sm:text-4xl">{labels.answer}</p>
        </div>
      </BCard>
      <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
        <span className={`inline-flex items-center gap-2 px-3 py-1 border-3 border-black ${config.bg} font-bold ${shadowSm}`}>
          {labels.status}
        </span>
        {responseTime !== null && (
          <span className={`px-3 py-1 border-3 border-black bg-white font-bold ${shadowSm}`}>
            {responseTime}ms
          </span>
        )}
        <span className={`px-3 py-1 border-3 border-black bg-white font-bold ${shadowSm}`}>{timeStr}</span>
        <span className={`px-3 py-1 border-3 border-black bg-cyan-200 font-bold ${shadowSm}`}>
          {countdown}ث
        </span>
      </div>
    </section>
  );
}

// Services section
function Services({ data }: { data: StatusResponse }) {
  const ssoDown = data.services.find((s) => s.id === "sso")?.status === "down";
  const lmsDown = data.services.find((s) => s.id === "lms")?.status === "down";

  const StatusIconSmall = (status: Status) => {
    if (status === "up") return <SmallCheckIcon />;
    if (status === "degraded") return <SmallAlertIcon />;
    return <SmallXIcon />;
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-black tracking-tight text-black">حالة الخدمات</h2>

      {ssoDown && !lmsDown && (
        <BCard className="p-4 bg-yellow-300">
          <div className="flex items-start gap-3">
            <InfoIcon />
            <div>
              <p className="text-sm font-black text-black">الـ SSO واقف، البلاك بورد شغال</p>
              <p className="text-xs text-black/70 mt-1">ما تقدر تسجل دخول. إذا أنت داخل لا تسجل خروج!</p>
            </div>
          </div>
        </BCard>
      )}

      <div className="flex flex-col gap-4">
        {data.services.map((s) => {
          const config = statusConfig[s.status];
          const name = serviceNames[s.id] || s.name;
          const desc = serviceDescriptions[s.id] || "";

          return (
            <BCard key={s.id} className={`p-4 ${config.bg}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {StatusIconSmall(s.status)}
                  <span className="text-sm font-black text-black">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {s.responseTime !== null && (
                    <span className="text-xs font-mono font-bold text-black/60">{s.responseTime}ms</span>
                  )}
                  <span className={`text-xs font-black px-2 py-0.5 border-2 border-black bg-white ${shadowSm}`}>
                    {config.label}
                  </span>
                </div>
              </div>
              {desc && <p className="text-xs text-black/70 mt-2 font-medium">{desc}</p>}
            </BCard>
          );
        })}
      </div>
    </section>
  );
}

// Tips section
const tips = [
  { Icon: LinkIcon, text: "ادخل البلاك بورد مباشرة", desc: "إذا SSO واقف، ادخل من الرابط المباشر بدون موقع الجامعة", link: "https://lms.seu.edu.sa/" },
  { Icon: LogInIcon, text: "لا تسجل خروج!", desc: "إذا أنت داخل البلاك بورد وSSO واقف، لا تطلع لأنك ما راح تقدر تدخل مرة ثانية" },
  { Icon: RefreshIcon, text: "حدّث الصفحة", desc: "أحياناً المشكلة تنحل بتحديث بسيط" },
  { Icon: CookieIcon, text: "امسح الكوكيز", desc: "امسح بيانات المتصفح وجرب مرة ثانية" },
];

function Tips() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-black tracking-tight text-black">نصائح وحلول</h2>
      
      {/* ما الفرق explanation */}
      <BCard className="p-4 bg-yellow-100">
        <div className="flex items-start gap-3">
          <InfoIcon />
          <div>
            <p className="text-sm font-black text-black">ما الفرق؟</p>
            <p className="text-xs text-black/70 mt-1">
              <strong>SSO</strong> = صفحة تسجيل الدخول الموحد للجامعة. <strong>البلاك بورد</strong> = نظام المحاضرات والواجبات.
            </p>
            <p className="text-xs text-black/70 mt-1">
              إذا الـ SSO واقف ما تقدر تدخل حتى لو البلاك بورد شغال، لأن تسجيل الدخول يمر عبر SSO أولاً.
            </p>
          </div>
        </div>
      </BCard>

      <div className="grid gap-4 sm:grid-cols-2">
        {tips.map((t, i) => {
          const { Icon } = t;
          const content = (
            <BCard key={i} className={`p-4 bg-white flex items-start gap-3 ${t.link ? "hover:bg-cyan-50 transition-colors" : ""}`}>
              <div className="w-10 h-10 bg-cyan-200 border-2 border-black flex items-center justify-center shrink-0">
                <Icon />
              </div>
              <div>
                <p className="text-sm font-black text-black">{t.text}</p>
                <p className="text-xs text-black/60 mt-1">{t.desc}</p>
              </div>
            </BCard>
          );
          
          if (t.link) {
            return (
              <a key={i} href={t.link} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            );
          }
          return content;
        })}
      </div>
    </section>
  );
}

// Timeline section with real history data
function Timeline({ currentStatus, history }: { currentStatus: Status; history: HistoryPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  // Build 24 hourly slots from history
  const slots: { hour: string; status: Status }[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600000);
    const hourStart = new Date(t);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 3600000);

    const h = t.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

    // Find history points in this hour
    const pointsInHour = history.filter((p) => {
      const pt = new Date(p.timestamp);
      return pt >= hourStart && pt < hourEnd;
    });

    let st: Status = "up";
    if (i === 0) {
      st = currentStatus;
    } else if (pointsInHour.length > 0) {
      // Check if any service was down or degraded
      const hasDown = pointsInHour.some((p) => p.services.some((s) => s.status === "down"));
      const hasDegraded = pointsInHour.some((p) => p.services.some((s) => s.status === "degraded"));
      if (hasDown) st = "down";
      else if (hasDegraded) st = "degraded";
    }

    slots.push({ hour: h, status: st });
  }

  const upCount = slots.filter((s) => s.status === "up").length;
  const pct = ((upCount / slots.length) * 100).toFixed(1);

  const barColors: Record<Status, string> = {
    up: "bg-emerald-400",
    degraded: "bg-yellow-400",
    down: "bg-red-400",
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-black">آخر 24 ساعة</h2>
        <span className={`text-sm font-black px-3 py-1 border-3 border-black bg-cyan-200 ${shadowSm}`}>
          {pct}%
        </span>
      </div>
      <BCard className="p-4 bg-white">
        <div className="flex gap-0.5 h-10 items-end" role="img" aria-label={`${pct}% وقت التشغيل`}>
          {slots.map((s, i) => (
            <div
              key={i}
              className="relative flex-1"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={`w-full transition-all duration-100 ${hovered === i ? "h-10" : "h-7"} ${barColors[s.status]} border-x border-black/20`}
              />
              {hovered === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 px-2 py-1 bg-black text-white border-2 border-black whitespace-nowrap">
                  <p className="text-xs font-mono font-bold">{s.hour}</p>
                  <p className="text-xs">{statusConfig[s.status].label}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono font-bold text-black/50">
          <span>{slots[0]?.hour}</span>
          <span>الآن</span>
        </div>
      </BCard>
      <div className="flex items-center gap-4 text-xs font-bold">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-emerald-400 border-2 border-black" /> شغال
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-yellow-400 border-2 border-black" /> مشاكل
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-red-400 border-2 border-black" /> واقف
        </span>
      </div>
    </section>
  );
}

// Incidents section
function Incidents({ data }: { data: StatusResponse }) {
  if (!data.incidents.length) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-black tracking-tight text-black">الأعطال</h2>
        <BCard className="p-6 bg-emerald-300 text-center">
          <p className="text-sm font-bold text-black">كل شي تمام، ما فيه أعطال</p>
        </BCard>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-black tracking-tight text-black">الأعطال</h2>
      <div className="flex flex-col gap-4">
        {data.incidents.map((inc, i) => {
          const ongoing = inc.status === "ongoing";
          const serviceName = serviceNames[inc.service] || inc.service;

          return (
            <BCard key={i} className={`p-4 ${ongoing ? "bg-red-400" : "bg-white"}`}>
              <div className="flex items-start gap-4">
                {ongoing ? <ClockIcon /> : <SmallCheckIcon />}
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm font-black text-black">{serviceName} - {inc.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-black/70">
                    <span className={`px-2 py-0.5 border-2 border-black ${ongoing ? "bg-yellow-300" : "bg-emerald-300"}`}>
                      {ongoing ? "مستمر" : "تم الحل"}
                    </span>
                    <span>{formatTimeAgo(inc.startedAt)}</span>
                    {inc.duration && <span>• {inc.duration}</span>}
                  </div>
                </div>
              </div>
            </BCard>
          );
        })}
      </div>
    </section>
  );
}

// Notifications section
function Notify({ apiUrl }: { apiUrl: string }) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePushSubscribe = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("المتصفح لا يدعم الإشعارات");
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("تم رفض إذن الإشعارات");
        setLoading(false);
        return;
      }

      const vapidKey = await fetchVapidKey();
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      await subscribeToPush(subscription);
      setPushEnabled(true);
    } catch (err) {
      console.error("Failed to subscribe:", err);
      alert("فشل تفعيل الإشعارات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-black tracking-tight text-black">التنبيهات</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={handlePushSubscribe} disabled={pushEnabled || loading} className="text-right">
          <BCard
            className={`p-4 flex items-center gap-3 ${pushEnabled ? "bg-emerald-300" : "bg-white hover:bg-cyan-50"} transition-colors`}
          >
            <div className="w-10 h-10 bg-yellow-300 border-2 border-black flex items-center justify-center shrink-0">
              <BellIcon />
            </div>
            <div>
              <p className="text-xs font-black text-black">
                {loading ? "جاري التفعيل..." : pushEnabled ? "مفعّل" : "تنبيهات المتصفح"}
              </p>
              <p className="text-[10px] text-black/60 mt-0.5">
                {pushEnabled ? "راح ننبهك" : "اعرف لما يرجع"}
              </p>
            </div>
          </BCard>
        </button>
        <a href="https://t.me/seu_status" target="_blank" rel="noopener noreferrer">
          <BCard className="p-4 flex items-center gap-3 bg-white hover:bg-cyan-50 transition-colors">
            <div className="w-10 h-10 bg-cyan-200 border-2 border-black flex items-center justify-center shrink-0">
              <SendIcon />
            </div>
            <div>
              <p className="text-xs font-black text-black">قناة تيليجرام</p>
              <p className="text-[10px] text-black/60 mt-0.5">اشترك للتحديثات</p>
            </div>
          </BCard>
        </a>
      </div>
    </section>
  );
}

// Main component
const POLL_INTERVAL = 60;

export default function StatusApp() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);

  const apiUrl = import.meta.env.PUBLIC_API_URL || "https://seu-status.smmrai.workers.dev";

  const loadData = useCallback(async () => {
    try {
      const [statusData, historyData] = await Promise.all([fetchStatus(), fetchHistory()]);
      setData(statusData);
      setHistory(historyData.points);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير معروف");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadData();
          return POLL_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Show skeleton while loading - matches actual layout structure
  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-10 sm:px-6 sm:py-16">
        <header className="text-center">
          <h1 className="text-lg font-bold text-black/60 tracking-wide">حالة أنظمة الجامعة السعودية الإلكترونية</h1>
        </header>
        <section className="flex flex-col gap-6">
          <BCard className="p-6 bg-gray-200 animate-pulse">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full" />
              <h1 className="text-4xl font-black uppercase tracking-tight text-black sm:text-5xl leading-tight">
                هل البلاك بورد شغال؟
              </h1>
              <div className="h-10 w-40 bg-gray-300 rounded" />
            </div>
          </BCard>
        </section>
      </main>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BCard className="p-8 bg-red-400 max-w-md text-center flex flex-col items-center gap-4">
          <p className="text-sm font-black text-black">تعذر الاتصال بالخادم</p>
          <button
            onClick={() => window.location.reload()}
            className={`px-5 py-2 text-sm font-black bg-yellow-300 border-3 border-black text-black hover:bg-yellow-200 ${shadow}`}
          >
            حاول مرة ثانية
          </button>
        </BCard>
      </div>
    );
  }

  const overallStatus = getOverallStatus(data);
  const responseTime = getMainResponseTime(data);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-10 sm:px-6 sm:py-16">
      <header className="text-center">
        <h1 className="text-lg font-bold text-black/60 tracking-wide">حالة أنظمة الجامعة السعودية الإلكترونية</h1>
      </header>
      <Hero
        status={overallStatus}
        responseTime={responseTime}
        lastChecked={data.lastChecked}
        countdown={countdown}
      />
      <Services data={data} />
      <Tips />
      <Timeline currentStatus={overallStatus} history={history} />
      <Incidents data={data} />
      <Notify apiUrl={apiUrl} />
      <footer className="flex flex-col items-center gap-2 pt-8 border-t-3 border-black">
        <p className="text-xs font-bold text-black/50 text-center tracking-wider">
          تطبيق غير رسمي تم تطويره من قبل طلاب الجامعة السعودية الإلكترونية
        </p>
        <p className="text-xs text-black/40 text-center">
          لمتابعة حالة أنظمة الجامعة الإلكترونية وتقديم نصائح وحلول للمشاكل التي قد تواجه الطلاب
        </p>
      </footer>
    </main>
  );
}
