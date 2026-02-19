# SEU Status Monitor

Status monitoring page for Saudi Electronic University (SEU) services. Tracks Blackboard LMS, SSO, E-Services, and Email availability.

## Architecture

- **Backend**: Cloudflare Worker with D1 database
- **Frontend**: Astro + React deployed to Cloudflare Pages
- **Notifications**: Telegram channel (`@seu_status`)
- **Design**: Brutalist style, fully Arabic (RTL)

## Live URLs

- **Frontend**: https://seu-status.y3f.me
- **Backend API**: https://seu-status.smmrai.workers.dev
- **Telegram**: https://t.me/seu_status
- **GitHub**: https://github.com/Y3FAI/uni-status

## Project Structure

```
/
├── src/                          # Backend (Cloudflare Worker)
│   ├── index.ts                  # Worker entry point, cron handler
│   ├── config.ts                 # Service definitions (lms, sso, eservice, email)
│   ├── types.ts                  # TypeScript types
│   ├── storage.ts                # D1 database operations
│   ├── api/
│   │   ├── router.ts             # API route handler
│   │   └── handlers.ts           # Route handlers (status, history, telegram test)
│   ├── monitor/
│   │   ├── checker.ts            # HTTP health checks
│   │   └── evaluate.ts           # Status evaluation, transition detection
│   └── notifications/
│       └── telegram.ts           # Telegram notifications (Arabic messages)
│
├── web/                          # Frontend (Astro + React)
│   ├── src/
│   │   ├── components/
│   │   │   └── StatusApp.tsx     # Main React component (~640 lines)
│   │   ├── layouts/
│   │   │   └── Layout.astro      # RTL Arabic layout with SEO meta tags
│   │   ├── pages/
│   │   │   └── index.astro       # Index page
│   │   └── lib/
│   │       ├── api.ts            # API fetch helpers
│   │       └── types.ts          # Frontend types
│   ├── public/                   # Static assets
│   │   ├── og-image.svg          # Open Graph image
│   │   ├── manifest.json         # PWA manifest
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   └── astro.config.mjs          # Static output config
│
├── wrangler.toml                 # Worker config (D1 binding, cron)
├── schema.sql                    # D1 database schema
└── package.json                  # Root dependencies (wrangler, typescript)
```

## Key Configuration

### Services Monitored

| ID | Name | URL | Check Method |
|----|------|-----|--------------|
| `lms` | Blackboard LMS | `https://lms.seu.edu.sa/learn/api/public/v1/system/version` | GET 200 |
| `sso` | SSO Login | `https://sso.seu.edu.sa/samlsso` | HEAD 200/301/302/400/401/403 |
| `eservice` | E-Services | `https://eservice.seu.edu.sa/` | GET 200 |
| `email` | Email (M365) | `https://outlook.office365.com/owa/seu.edu.sa` | HEAD 401 |

### Cron Schedule

- Runs every **5 minutes** (`*/5 * * * *`)
- Frontend polls every **5 minutes** (300 seconds)

### D1 Database

- **ID**: `0a83f2aa-c2a9-4a72-9122-b1bde88c2fd9`
- **Name**: `seu-status-db`

### Secrets (set via `wrangler secret put`)

- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `TELEGRAM_CHAT_ID` - Channel username (`@seu_status`)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Current status of all services |
| `/api/status/history` | GET | 24-hour history (optional `?date=YYYY-MM-DD`) |
| `/api/test/telegram` | POST | Send test message to Telegram channel |

## Development

### Backend

```bash
# Install dependencies
npm install

# Run locally
npx wrangler dev

# Deploy
npx wrangler deploy

# Test cron locally
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"
```

### Frontend

```bash
cd web

# Install dependencies
npm install

# Run locally
npm run dev

# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=seu-status-web
```

## Status Labels (Arabic)

| Status | Label | Color |
|--------|-------|-------|
| `up` | شغال | Emerald (#6EE7B7) |
| `degraded` | مشاكل | Yellow (#FDE047) |
| `down` | واقف | Red (#F87171) |

## Frontend Layout Order

1. Hero (هل البلاك بورد شغال؟)
2. Services (حالة الخدمات)
3. Timeline (آخر 24 ساعة)
4. Incidents (الحوادث)
5. Tips (نصائح وحلول للأعطال)
6. Notifications (التنبيهات - Telegram link)
7. Footer

## Telegram Notifications

Notifications are sent to `@seu_status` channel when service status changes:

- ✅ Service recovered (شغال)
- ⚠️ Service degraded (مشاكل)
- 🛑 Service down (واقف)

Messages are in Arabic with Riyadh timezone.

## Design System

- **Style**: Neo-brutalist
- **Shadows**: Hard offset `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- **Borders**: 3px black (`border-3 border-black`)
- **Font**: System fonts, bold weights
- **Colors**: Cyan, emerald, yellow, red on white/black
- **Layout**: RTL, Arabic only
