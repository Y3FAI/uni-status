import type { Env } from "../types";
import { getCurrentStatus, getHistory } from "../storage";

export async function handleGetStatus(env: Env): Promise<Response> {
  const status = await getCurrentStatus(env.DB);

  if (!status) {
    return jsonResponse({ error: "No status data yet. Check back soon." }, 503);
  }

  return jsonResponse(status);
}

export async function handleGetHistory(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");

  // Default to today if no date provided
  const targetDate = date || new Date().toISOString().slice(0, 10);

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return jsonResponse({ error: "Invalid date format. Use YYYY-MM-DD." }, 400);
  }

  const history = await getHistory(env.DB, targetDate);

  return jsonResponse({
    date: targetDate,
    points: history,
  });
}

export async function handleTestTelegram(env: Env): Promise<Response> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return jsonResponse({ error: "Telegram not configured" }, 503);
  }

  const message = `🧪 <b>اختبار</b>\n\nهذه رسالة اختبار من seu-status\nالوقت: ${new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}`;

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

  const body = await response.json();

  if (!response.ok) {
    return jsonResponse({ error: "Telegram API error", details: body }, 500);
  }

  return jsonResponse({ ok: true, message: "Test message sent to Telegram channel" });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
