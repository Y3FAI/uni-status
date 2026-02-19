import { TIMEOUT_MS } from "../config";
import type { ServiceConfig, CheckResult } from "../types";

export async function checkService(
  service: ServiceConfig
): Promise<CheckResult> {
  const timestamp = new Date().toISOString();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const start = Date.now();

  try {
    const response = await fetch(service.url, {
      method: service.method,
      signal: controller.signal,
      headers: { "User-Agent": "SEU-StatusMonitor/1.0" },
      redirect: "manual",
    });

    const responseTime = Date.now() - start;

    return {
      httpCode: response.status,
      responseTime,
      error: null,
      timestamp,
    };
  } catch (err) {
    const responseTime = Date.now() - start;
    const error =
      err instanceof Error ? err.message : "Unknown error";

    return {
      httpCode: null,
      responseTime: responseTime >= TIMEOUT_MS ? null : responseTime,
      error,
      timestamp,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
