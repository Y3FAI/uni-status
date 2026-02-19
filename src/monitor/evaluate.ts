import { DEGRADED_THRESHOLD_MS, DOWN_HTTP_CODES } from "../config";
import type { CheckResult, ServiceConfig, Status, Transition } from "../types";

export function evaluateStatus(
  check: CheckResult,
  service: ServiceConfig
): Status {
  // Connection error or timeout → down
  if (check.error !== null || check.httpCode === null) {
    return "down";
  }

  // Known-bad status codes → down
  if (DOWN_HTTP_CODES.includes(check.httpCode)) {
    return "down";
  }

  // HTTP 500 → degraded
  if (check.httpCode === 500) {
    return "degraded";
  }

  // Acceptable status codes
  const acceptable = [200, 301, 302, 400, 401, 403];
  if (!acceptable.includes(check.httpCode)) {
    return "down";
  }

  // Slow response → degraded
  if (
    check.responseTime !== null &&
    check.responseTime >= DEGRADED_THRESHOLD_MS
  ) {
    return "degraded";
  }

  return "up";
}

export function detectTransition(
  serviceId: string,
  serviceName: string,
  previous: Status | null,
  current: Status
): Transition | null {
  if (previous === null || previous === current) {
    return null;
  }

  return {
    serviceId,
    serviceName,
    from: previous,
    to: current,
    timestamp: new Date().toISOString(),
  };
}
