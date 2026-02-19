# SEU (Saudi Electronic University) Services Analysis

> Date of investigation: 2026-02-18
> Updated: 2026-02-18 (comprehensive service discovery)
> Conducted from: macOS client via curl/DNS probes + web research

## Overview

Saudi Electronic University's Blackboard LMS was inaccessible due to a SSO (Single Sign-On) server outage. The Blackboard instance itself was fully operational — only the authentication gateway was down, blocking all student logins.

**Note:** As of the second investigation (~19:17 UTC), the SSO server is DOWN again (connection timeout on `/samlsso`, 502 on earlier check). This confirms the SSO is an unstable, recurring point of failure.

---

## Complete Service Map

### 1. Blackboard LMS — `lms.seu.edu.sa`

| Property | Value |
|----------|-------|
| **Current status** | UP (HTTP 401 — needs auth) |
| **Software** | Blackboard Learn 4000.8.0-rel.21+34512b9 |
| **Hosting** | AWS eu-central-1 (Frankfurt) |
| **DNS** | CNAME → `seu.blackboard.com` → `learn-prod-68223fc117c39-1371861797.eu-central-1.elb.amazonaws.com` |
| **IPs** | 52.59.122.219 (ELB) |
| **Load Balancer** | AWS ELB with sticky sessions (AWSELB/AWSELBCORS cookies, 900s TTL) |
| **Security Headers** | HSTS (63072000s, includeSubDomains, preload), X-Frame-Options: SAMEORIGIN, CSP: frame-ancestors 'self', nosniff |
| **Auth method** | SAML 2.0 SSO (redirects to `sso.seu.edu.sa/samlsso`) |
| **SAML Issuer** | `https://lms.seu.edu.sa/shibboleth` |
| **SAML ACS URL** | `https://lms.seu.edu.sa/auth-saml/saml/SSO/alias/_220_1` |

**Key endpoints:**
- `/webapps/login/` — Redirects to SAML SSO (no direct login form exists)
- `/webapps/bb-auth-provider-shibboleth-BBLEARN/execute/shibbolethLogin` — Also redirects to SAML SSO
- `/learn/api/public/v1/system/version` — **Public, no auth needed**, returns JSON: `{"learn":{"major":4000,"minor":8,"patch":0,"build":"rel.21+34512b9"}}`
- `/learn/api/public/v1/oauth2/token` — Exists (returns 400 without credentials)

**Important:** There is NO direct username/password login. Every auth path goes through SAML SSO.

---

### 2. SSO Server — `sso.seu.edu.sa` (CRITICAL — SINGLE POINT OF FAILURE)

| Property | Value |
|----------|-------|
| **Current status** | DOWN (timeout on SAML endpoint) |
| **Hosting** | Microsoft Azure |
| **IP** | 20.224.211.28 |
| **Reverse proxy** | Azure Application Gateway v2 |
| **Application** | WSO2 Identity Server (confirmed via `WSO2 Carbon Server` header, cookie: `App-Wso2-Affinty`) |
| **Sticky sessions** | Yes (`App-Wso2-Affinty` cookie) |

**Observed failure patterns:**
1. Connection timeout (HTTP 000) — Server completely unreachable
2. HTTP 502 Bad Gateway — Azure App Gateway up, WSO2 backend down
3. HTTP 401 with WSO2 headers — Partially responding but not functioning correctly

**Key endpoints:**
- `/samlsso` — SAML SSO endpoint (receives SAML AuthnRequest)
- `/SEUSSO/pages/login.jsp` — Login page UI

---

### 3. IAM Portal — `iam.seu.edu.sa`

| Property | Value |
|----------|-------|
| **Current status** | UP (HTTP 200) |
| **Response time** | ~0.47s |
| **Hosting** | Microsoft Azure |
| **IP** | 51.138.115.254 (different from SSO!) |
| **Application** | WSO2 Identity Server (same SEUSSO app, different deployment) |
| **Login page** | `/SEUSSO/pages/login.jsp` |
| **Features** | Username/password login, forgot password, language toggle (EN/AR) |

**Critical insight:** This is a **separate deployment** of the same SEUSSO/WSO2 application on different Azure infrastructure. It was UP during both SSO outages. Blackboard is hardcoded to `sso.seu.edu.sa` — this portal being up doesn't help with LMS access.

---

### 4. E-Services Portal — `eservice.seu.edu.sa`

| Property | Value |
|----------|-------|
| **Current status** | UP (HTTP 200) |
| **Hosting** | Microsoft Azure (IP: 40.74.17.248) |
| **Technology** | JavaScript SPA (requires JS), Microsoft IIS 8.5 backend |
| **Analytics** | Google Analytics |

**Sub-services hosted under eservice.seu.edu.sa:**
- `/` — Main e-services dashboard (SPA)
- `/innovate` — Idea/Innovation submission platform (HTTP 301 → loads SPA)
- `/contactus/index.html` — Contact center / support form (HTTP 200, static HTML)

---

### 5. Admission Portal — `admission.seu.edu.sa`

| Property | Value |
|----------|-------|
| **Current status** | UP (HTTP 200) |
| **Response time** | ~1.65s (slower than other services) |
| **Hosting** | **ServiceNow** (CNAME → `seuprod1.service-now.com`, IP: 148.139.90.113) |
| **Technology** | ServiceNow platform (confirmed: `stats.do` returns 302, `/api/now/table/` returns 401) |
| **Frontend** | Angular.js + Bootstrap, IBM Plex Sans Arabic font |
| **Features** | Program browsing, application submission, document upload, RTL Arabic support |
| **Load Balancer** | snow_adc (ServiceNow ADC), `BIGipServerpool_seuprod1` cookie |
| **Security** | HSTS (63072000s, includeSubDomains), HttpOnly + SameSite cookies |

---

### 6. Apps Platform — `apps.seu.edu.sa`

| Property | Value |
|----------|-------|
| **Current status** | Partially UP (HTTP 403 on root, sub-paths return 200) |
| **Hosting** | Microsoft Azure (IP: 40.74.17.248 — same as eservice) |

**Known services:**
- `/eservices/dis_print/disc/get_disc` — Clearance document issuance (dismissed students) — HTTP 200
- `/fees/is/check` — Tuition fee payment / check — HTTP 200
- `/eservices/cands/attract/login.php` — Saudi Talents Collaboration System
- `/seuEidFtr/index.php` — Greeting cards service

---

### 7. API Server — `api.seu.edu.sa`

| Property | Value |
|----------|-------|
| **Current status** | UP (HTTP 200) |
| **Hosting** | Microsoft Azure (IP: 40.74.17.248 — same as eservice/apps) |
| **Technology** | PHP 5.6.31, Windows Server 2012 R2, IIS 8.5 |
| **Database** | MySQL, Oracle (OCI8), SQL Server via PDO |
| **Security concern** | phpinfo() exposed publicly — leaks server config |

---

### 8. Email — Microsoft 365 (Outlook)

| Property | Value |
|----------|-------|
| **Current status** | UP (HTTP 401 — requires auth) |
| **Access URL** | `https://outlook.office365.com/owa/seu.edu.sa` |
| **Redirect** | `mail.seu.edu.sa` → `https://outlook.com/owa/seu.edu.sa/` (HTTP 301 via Azure App Gateway v2) |
| **Platform** | Microsoft 365 / Exchange Online |
| **Email format** | `F.Last@seu.edu.sa` |
| **Backend** | `MI0P293MB0218.ITAP293.PROD.OUTLOOK.COM` |

---

### 9. Main Website — `seu.edu.sa` / `www.seu.edu.sa`

| Property | Value |
|----------|-------|
| **Current status** | UP (HTTP 200) |
| **Hosting** | Microsoft Azure (IP: 20.238.169.168) |
| **Technology** | ASP.NET |
| **Security** | HSTS, X-XSS-Protection, nosniff, X-Frame-Options: SAMEORIGIN |
| **Content size** | ~159KB (full website with all branches info) |
| **Features** | University info, news, branch pages (Riyadh, Dammam, Jeddah, Madinah, Qassim, Abha, Tabuk, Alahsa, Jazan, Aljubail, Yanbu, Qurayyat, Alula, Hail) |

---

### 10. Live Support — Webex Contact Center

| Property | Value |
|----------|-------|
| **Access URL** | `https://seu-sa.webex.com/sc3300/supportcenter/webacd.do` |
| **Platform** | Cisco Webex |
| **Status** | External service (Webex managed) |

---

### 11. Saudi Digital Library — `sdl.edu.sa`

| Property | Value |
|----------|-------|
| **Status** | UP (HTTP 301 → `/SDLPortal/Publishers.aspx`) |
| **Technology** | Microsoft IIS 8.5 |
| **Description** | Largest academic/scientific info source in Arab world (310K+ references) |
| **Note** | External service shared across Saudi universities, not SEU-specific |

---

### 12. Mobile Applications

| Platform | Store |
|----------|-------|
| **Android** | Google Play — `com.seu.services` |
| **iOS** | Apple App Store |
| **Huawei** | AppGallery |

Features: Digital ID, university news, academic schedules, event viewing, e-services access.

---

## Infrastructure Map

```
                        ┌─────────────────────────────────┐
                        │        Microsoft Azure           │
                        │                                  │
                        │  20.238.169.168                  │
                        │  ├── seu.edu.sa (ASP.NET)        │
                        │  ├── www.seu.edu.sa              │
                        │  └── mail.seu.edu.sa (→ O365)    │
                        │                                  │
                        │  40.74.17.248                    │
                        │  ├── eservice.seu.edu.sa (IIS)   │
                        │  ├── apps.seu.edu.sa (PHP/IIS)   │
                        │  └── api.seu.edu.sa (PHP/IIS)    │
                        │                                  │
                        │  20.224.211.28                   │
                        │  └── sso.seu.edu.sa (WSO2)  *** UNSTABLE *** │
                        │                                  │
                        │  51.138.115.254                  │
                        │  └── iam.seu.edu.sa (WSO2)       │
                        └─────────────────────────────────┘

                        ┌─────────────────────────────────┐
                        │        ServiceNow Cloud          │
                        │  148.139.90.113                  │
                        │  └── admission.seu.edu.sa        │
                        └─────────────────────────────────┘

                        ┌─────────────────────────────────┐
                        │     AWS eu-central-1 (Frankfurt) │
                        │  52.59.122.219 (ELB)             │
                        │  └── lms.seu.edu.sa (Blackboard) │
                        └─────────────────────────────────┘

                        ┌─────────────────────────────────┐
                        │        Microsoft 365             │
                        │  └── Email (Exchange Online)     │
                        └─────────────────────────────────┘

                        ┌─────────────────────────────────┐
                        │        Cisco Webex               │
                        │  └── Live Support Chat           │
                        └─────────────────────────────────┘

                        ┌─────────────────────────────────┐
                        │        External (Saudi gov)      │
                        │  └── sdl.edu.sa (Digital Library) │
                        └─────────────────────────────────┘
```

### Authentication Flow

```
Student Browser
    │
    ├──► lms.seu.edu.sa (Blackboard)          [AWS Frankfurt]
    │        │
    │        │ SAML AuthnRequest (POST)
    │        ▼
    │    sso.seu.edu.sa/samlsso               [Azure, WSO2]
    │        │                                 *** SINGLE POINT OF FAILURE ***
    │        │ SAML Response (POST back)       *** CURRENTLY DOWN ***
    │        ▼
    │    lms.seu.edu.sa/auth-saml/saml/SSO/alias/_220_1
    │        │
    │        ▼ Session established (AWSELB cookies)
    │    Student accesses courses
    │
    ├──► eservice.seu.edu.sa                  [Azure 40.74.17.248]
    │        └──► SSO auth likely via sso.seu.edu.sa
    │
    ├──► admission.seu.edu.sa                 [ServiceNow]
    │        └──► Own auth system (ServiceNow)
    │
    ├──► iam.seu.edu.sa                       [Azure 51.138.115.254, UP]
    ├──► mail → outlook.office365.com          [Microsoft 365]
    └──► seu.edu.sa                           [Azure 20.238.169.168]
```

---

## Root Cause Analysis

### What failed
The SSO application (WSO2 Identity Server) behind Azure Application Gateway at `sso.seu.edu.sa` (IP: 20.224.211.28) crashed or became unresponsive. **This happened TWICE on the same day.**

### Why it blocked everything
Blackboard is configured with SAML 2.0 as the **only** authentication method:
- No direct login form fallback
- No alternative IdP configured
- No cached/offline authentication mode
- The SAML AuthnRequest is cryptographically signed — tokens cannot be forged

### Infrastructure weaknesses
1. **Single point of failure:** One SSO server handles all Blackboard authentication
2. **No redundancy:** `iam.seu.edu.sa` (identical app, different server) exists but is not used as failover
3. **Cross-cloud dependency:** Blackboard on AWS depends on SSO on Azure
4. **Aging infrastructure:** `api.seu.edu.sa` runs PHP 5.6.31 (EOL since Dec 2018) on Windows Server 2012 R2 (EOL)
5. **Security gaps:** phpinfo() exposed publicly on api.seu.edu.sa

---

## Services to Monitor (for status page)

### Primary Monitors (Student-Critical)

| # | Service | URL to Probe | Method | Expected Healthy | Priority |
|---|---------|-------------|--------|-----------------|----------|
| 1 | **Blackboard LMS** | `https://lms.seu.edu.sa/learn/api/public/v1/system/version` | GET | HTTP 200 + JSON | CRITICAL |
| 2 | **SSO Server** | `https://sso.seu.edu.sa/samlsso` | HEAD | Any response except 502/503/timeout | CRITICAL |
| 3 | **SSO Login Page** | `https://sso.seu.edu.sa/SEUSSO/pages/login.jsp` | GET | HTTP 200 | CRITICAL |
| 4 | **IAM Portal** | `https://iam.seu.edu.sa/SEUSSO/pages/login.jsp` | GET | HTTP 200 | HIGH |
| 5 | **E-Services Portal** | `https://eservice.seu.edu.sa/` | GET | HTTP 200 | HIGH |
| 6 | **Admission Portal** | `https://admission.seu.edu.sa/admission` | GET | HTTP 200 | HIGH |

### Secondary Monitors

| # | Service | URL to Probe | Method | Expected Healthy | Priority |
|---|---------|-------------|--------|-----------------|----------|
| 7 | **Main Website** | `https://seu.edu.sa/` | GET | HTTP 200 | MEDIUM |
| 8 | **Email (M365)** | `https://outlook.office365.com/owa/seu.edu.sa` | HEAD | HTTP 401 (auth required = server up) | MEDIUM |
| 9 | **Fees Payment** | `https://apps.seu.edu.sa/fees/is/check` | GET | HTTP 200 | MEDIUM |
| 10 | **Clearance Service** | `https://apps.seu.edu.sa/eservices/dis_print/disc/get_disc` | GET | HTTP 200 | LOW |
| 11 | **Contact Center** | `https://eservice.seu.edu.sa/contactus/index.html` | GET | HTTP 200 | LOW |
| 12 | **Innovation Platform** | `https://eservice.seu.edu.sa/innovate` | GET | HTTP 200/301 | LOW |
| 13 | **Saudi Digital Library** | `https://sdl.edu.sa/` | GET | HTTP 200/301 | LOW |

### Health Check Logic

```
SERVICE_UP:
  - HTTP 200, 301, 302, 400, 401, 403 = UP (server is responding)

SERVICE_DEGRADED:
  - Response time > 5 seconds = SLOW
  - HTTP 500 = Server error but reachable

SERVICE_DOWN:
  - HTTP 502, 503 = Backend down
  - Connection timeout (no response within 10s) = Unreachable
  - DNS resolution failure = DNS down
  - SSL/TLS error = Certificate issue
  - HTTP 000 = No connection at all
```

### Compound Status (What Students Care About)

```
CAN_LOGIN_TO_BLACKBOARD:
  requires: SSO_UP AND LMS_UP
  (This is the #1 thing students check)

CAN_ACCESS_COURSES:
  requires: CAN_LOGIN (or existing valid session)

CAN_CHECK_EMAIL:
  requires: EMAIL_M365_UP
  (Independent of SSO — Microsoft 365 has own auth)

CAN_APPLY:
  requires: ADMISSION_UP
  (Independent — runs on ServiceNow)

CAN_PAY_FEES:
  requires: APPS_UP (apps.seu.edu.sa)

FULL_SERVICE:
  requires: ALL services UP
```

---

## DNS Summary

| Domain | IP / Target | Cloud |
|--------|------------|-------|
| `seu.edu.sa` | 20.238.169.168 | Azure |
| `www.seu.edu.sa` | 20.238.169.168 | Azure |
| `lms.seu.edu.sa` | CNAME → `seu.blackboard.com` → AWS ELB | AWS |
| `sso.seu.edu.sa` | 20.224.211.28 | Azure |
| `iam.seu.edu.sa` | 51.138.115.254 | Azure |
| `eservice.seu.edu.sa` | 40.74.17.248 | Azure |
| `api.seu.edu.sa` | 40.74.17.248 | Azure |
| `apps.seu.edu.sa` | 40.74.17.248 | Azure |
| `admission.seu.edu.sa` | CNAME → `seuprod1.service-now.com` | ServiceNow |
| `mail.seu.edu.sa` | 20.238.169.168 (redirects to O365) | Azure → M365 |

---

## Subdomains That Do NOT Exist

The following subdomains were probed and timed out (no DNS/no server):
`library`, `portal`, `banner`, `cms`, `helpdesk`, `support`, `dl`, `dms`, `hr`, `erp`, `sis`, `m`, `app`, `exam`, `vle`, `meet`, `wiki`, `git`, `vpn`, `proxy`, `webmail`, `idp`, `login`, `my`, `learn`, `training`, `careers`, `jobs`, `research`, `community`, `alumni`, `moodle`, `proctoring`, `zoom`, `webex`

---

## Recommended Monitoring Intervals

| Check | Interval | Reason |
|-------|----------|--------|
| SSO health | 30 seconds | Most critical, proven unstable, failed twice today |
| LMS health | 60 seconds | Core service, hosted externally |
| E-Services + Admission | 120 seconds | Important but more stable (Azure/ServiceNow) |
| Email (M365) | 300 seconds | Microsoft-managed, very reliable |
| Other services | 300 seconds | Less critical for daily student use |

---

## Browser Notification Strategy

### Web Push notifications:

1. **Subscribe** — Student visits status page, clicks "Notify me"
2. **Monitor** — Backend checks services per intervals above
3. **Detect transition** — Service goes DOWN → UP or UP → DOWN
4. **Push notification** — Send browser push notification

### Notification triggers (priority order):

| Event | Message | Impact |
|-------|---------|--------|
| SSO DOWN | "Blackboard login is currently unavailable" | Can't login to LMS |
| SSO RECOVERED | "Blackboard login is back! Go login now" | Can login again |
| LMS DOWN | "Blackboard is completely down" | No course access at all |
| LMS RECOVERED | "Blackboard is back online" | Course access restored |
| Admission DOWN | "Admission portal is down" | Can't apply/check status |
| Email DOWN | "University email is down" | Can't access email |

---

## Technology Stack Summary

| Service | Platform | Hosting | Status |
|---------|----------|---------|--------|
| Main Website | ASP.NET | Azure | Stable |
| Blackboard LMS | Blackboard Learn 4000.8 | AWS Frankfurt | Stable |
| SSO | WSO2 Identity Server | Azure | **Unstable** |
| IAM | WSO2 Identity Server | Azure (different IP) | Stable |
| E-Services | IIS 8.5 + JS SPA | Azure | Stable |
| Admission | ServiceNow (Angular.js) | ServiceNow Cloud | Stable |
| API Server | PHP 5.6 / IIS 8.5 | Azure | Stable (but outdated) |
| Apps | PHP / IIS | Azure | Stable |
| Email | Exchange Online | Microsoft 365 | Stable |
| Live Support | Webex | Cisco | External |
| Digital Library | IIS 8.5 | External (Saudi gov) | External |

---

## Raw Diagnostic Commands Reference

```bash
# Quick SSO check
curl -sI --max-time 10 "https://sso.seu.edu.sa/samlsso" | head -1

# Blackboard version (public API, no auth needed)
curl -s "https://lms.seu.edu.sa/learn/api/public/v1/system/version"

# Check all critical services at once
for url in \
  "https://lms.seu.edu.sa/learn/api/public/v1/system/version" \
  "https://sso.seu.edu.sa/samlsso" \
  "https://iam.seu.edu.sa/SEUSSO/pages/login.jsp" \
  "https://eservice.seu.edu.sa/" \
  "https://admission.seu.edu.sa/admission" \
  "https://seu.edu.sa/"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
  echo "$code | $url"
done

# DNS resolution
for d in seu.edu.sa lms.seu.edu.sa sso.seu.edu.sa iam.seu.edu.sa eservice.seu.edu.sa admission.seu.edu.sa; do
  echo "$d -> $(dig +short $d | head -1)"
done

# Monitor SSO with alerting (macOS)
while true; do
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://sso.seu.edu.sa/samlsso")
  echo "$(date): HTTP $status"
  if [ "$status" = "200" ]; then say "SSO is back"; break; fi
  sleep 30
done
```
