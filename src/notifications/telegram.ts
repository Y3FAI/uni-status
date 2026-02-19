import type { Env, Transition } from "../types";

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
  const action = getAction(t.to);

  if (t.to === "up") {
    return [
      `${emoji} <b>${t.serviceName}</b> is back up`,
      ``,
      `Was: ${t.from}`,
      `Recovered at: ${formatTime(t.timestamp)}`,
    ].join("\n");
  }

  return [
    `${emoji} <b>${t.serviceName}</b> ${action}`,
    ``,
    `Previous: ${t.from}`,
    `Detected at: ${formatTime(t.timestamp)}`,
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

function getAction(status: string): string {
  switch (status) {
    case "degraded":
      return "is experiencing issues";
    case "down":
      return "is DOWN";
    default:
      return "status changed";
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
