import type { Env, Transition } from "../types";

// Service names in Arabic
const serviceNamesAr: Record<string, string> = {
  lms: "البلاك بورد",
  sso: "تسجيل الدخول SSO",
  eservice: "الخدمات الإلكترونية",
  email: "البريد الإلكتروني",
};

export async function sendTelegramAlert(
  env: Env,
  transition: Transition
): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.log("Telegram not configured, skipping alert");
    return;
  }

  const message = formatMessage(transition);
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Telegram API error ${response.status}: ${body}`);
  }
}

function formatMessage(t: Transition): string {
  const emoji = getEmoji(t.to);
  const serviceName = serviceNamesAr[t.serviceId] || t.serviceName;
  const statusAr = getStatusAr(t.to);
  const prevStatusAr = getStatusAr(t.from);

  if (t.to === "up") {
    return [
      `${emoji} <b>${serviceName}</b> رجع شغال`,
      ``,
      `كان: ${prevStatusAr}`,
      `الوقت: ${formatTime(t.timestamp)}`,
    ].join("\n");
  }

  return [
    `${emoji} <b>${serviceName}</b> ${statusAr}`,
    ``,
    `كان: ${prevStatusAr}`,
    `الوقت: ${formatTime(t.timestamp)}`,
  ].join("\n");
}

function getEmoji(status: string): string {
  switch (status) {
    case "up":
      return "\u2705"; // green check
    case "degraded":
      return "\u26A0\uFE0F"; // warning
    case "down":
      return "\uD83D\uDED1"; // stop sign
    default:
      return "\u2753";
  }
}

function getStatusAr(status: string): string {
  switch (status) {
    case "up":
      return "شغال";
    case "degraded":
      return "فيه مشاكل";
    case "down":
      return "واقف";
    default:
      return status;
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
