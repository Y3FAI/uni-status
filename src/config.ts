import type { ServiceConfig } from "./types";

export const SERVICES: ServiceConfig[] = [
  {
    id: "lms",
    name: "Blackboard LMS",
    url: "https://lms.seu.edu.sa/learn/api/public/v1/system/version",
    method: "GET",
    expectedStatuses: [200],
    interval: 60,
  },
  {
    id: "sso",
    name: "SSO Login",
    url: "https://sso.seu.edu.sa/samlsso",
    method: "HEAD",
    expectedStatuses: [200, 301, 302, 400, 401, 403],
    interval: 60,
  },
  {
    id: "eservice",
    name: "E-Services",
    url: "https://eservice.seu.edu.sa/",
    method: "GET",
    expectedStatuses: [200],
    interval: 60,
  },
  {
    id: "email",
    name: "Email (M365)",
    url: "https://outlook.office365.com/owa/seu.edu.sa",
    method: "HEAD",
    expectedStatuses: [401],
    interval: 60,
  },
];

export const DEGRADED_THRESHOLD_MS = 3000;
export const TIMEOUT_MS = 10000;
export const DOWN_HTTP_CODES = [502, 503];
