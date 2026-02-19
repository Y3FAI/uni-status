import type { Env, ServiceStatus, Transition } from "./types";
import { SERVICES } from "./config";
import { checkService } from "./monitor/checker";
import { evaluateStatus, detectTransition } from "./monitor/evaluate";
import {
  getCurrentStatus,
  saveStatus,
  saveHistoryPoint,
  openIncident,
  resolveIncident,
  refreshIncidentDurations,
} from "./storage";
import { sendTelegramAlert } from "./notifications/telegram";
import { handleRequest } from "./api/router";

export default {
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log("Cron triggered at", new Date().toISOString());

    // Get previous statuses for transition detection
    const previous = await getCurrentStatus(env.DB);
    const previousMap = new Map(
      previous?.services.map((s) => [s.id, s.status]) ?? []
    );

    // Check all services in parallel
    const results = await Promise.all(
      SERVICES.map(async (service) => {
        const check = await checkService(service);
        const status = evaluateStatus(check, service);

        const serviceStatus: ServiceStatus = {
          id: service.id,
          name: service.name,
          status,
          httpCode: check.httpCode,
          responseTime: check.responseTime,
          lastChecked: check.timestamp,
        };

        return serviceStatus;
      })
    );

    // Detect transitions and handle incidents/notifications
    const transitions: Transition[] = [];

    for (const result of results) {
      const prev = previousMap.get(result.id) ?? null;
      const transition = detectTransition(
        result.id,
        result.name,
        prev,
        result.status
      );

      if (transition) {
        transitions.push(transition);

        // Manage incidents
        if (transition.to === "down" || transition.to === "degraded") {
          await openIncident(env.DB, result.id, result.name, transition.to);
        } else if (transition.to === "up") {
          await resolveIncident(env.DB, result.id);
        }
      }
    }

    // Refresh incident durations
    const incidents = await refreshIncidentDurations(env.DB);

    // Save current status and history
    await saveStatus(env.DB, results, incidents);
    await saveHistoryPoint(env.DB, results);

    // Send Telegram notifications for transitions
    ctx.waitUntil(
      Promise.all(
        transitions.map(async (t) => {
          try {
            await sendTelegramAlert(env, t);
          } catch (err) {
            console.error(`Telegram alert failed for ${t.serviceId}:`, err);
          }
        })
      )
    );

    console.log(
      `Check complete: ${results.map((r) => `${r.id}=${r.status}`).join(", ")}` +
        (transitions.length > 0
          ? ` | Transitions: ${transitions.map((t) => `${t.serviceId}: ${t.from}->${t.to}`).join(", ")}`
          : "")
    );
  },

  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    return handleRequest(request, env);
  },
};
