# JobTrack AI

Full-stack app that automatically tracks job applications by scanning your Gmail with AI.

## Stack
React 18 + TypeScript + Tailwind (Vite) · Node.js + Express + TypeScript · PostgreSQL + Prisma · Firebase Auth (Google Sign-In) · Gmail API (read-only OAuth) · Claude API for email extraction (regex fallback) · node-cron hourly background sync.

## Folder structure

```
jobtrack-ai/
├── backend/
│   ├── prisma/schema.prisma        # DB schema (User, GmailAccount, Application, EmailRecord, Notification, Document)
│   └── src/
│       ├── index.ts                # Express app + hourly cron
│       ├── config/                 # env validation, Firebase Admin
│       ├── lib/                    # Prisma client, AES-256-GCM crypto
│       ├── middleware/             # Firebase token auth, error handler
│       ├── routes/                 # applications, gmail, analytics, notifications, export, documents
│       └── services/               # gmail (OAuth+fetch), classifier (Claude+rules), sync, notifications
├── frontend/
│   └── src/
│       ├── pages/                  # Login, Dashboard, Analytics, Settings
│       ├── components/             # Layout, StatsCards, Filters, JobTable, EditModal
│       ├── context/                # Auth (Firebase), Theme (dark mode)
│       └── lib/                    # firebase init, API client
└── extension/                      # Chrome MV3 extension to save jobs manually
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/applications | List with search, status/company/date filters, sort, pagination |
| POST | /api/applications | Create manually |
| PATCH | /api/applications/:id | Edit fields, notes, status |
| DELETE | /api/applications/:id | Delete |
| GET | /api/applications/:id/emails | Email history for an application |
| GET | /api/gmail/connect | Get Google OAuth consent URL |
| GET | /api/gmail/callback | OAuth redirect handler |
| GET | /api/gmail/status | Connection status |
| POST | /api/gmail/sync | Manual sync now |
| DELETE | /api/gmail/disconnect | Revoke + delete tokens |
| GET | /api/analytics/summary | Totals, status distribution, interview success rate |
| GET | /api/analytics/monthly | Applications per month |
| GET | /api/analytics/top-companies | Top 10 companies |
| GET | /api/notifications | Recent notifications |
| POST | /api/notifications/read-all | Mark all read |
| GET | /api/export/csv | Download CSV |
| GET/POST/DELETE | /api/documents | Resume/cover-letter storage |

All routes (except /api/gmail/callback and /health) require `Authorization: Bearer <Firebase ID token>`.

## Setup

### 1. Prerequisites
Node 20+, PostgreSQL 14+, a Firebase project, a Google Cloud project.

### 2. Firebase
1. console.firebase.google.com → create project → Authentication → enable **Google** provider.
2. Project settings → General → add a Web app → copy config into `frontend/.env`.
3. Project settings → Service accounts → Generate new private key → base64-encode the JSON:
   `base64 -i serviceAccount.json | tr -d '\n'` → paste as `FIREBASE_SERVICE_ACCOUNT_B64`.

### 3. Google Cloud (Gmail API)
1. console.cloud.google.com → enable **Gmail API**.
2. OAuth consent screen → External → add scope `gmail.readonly` → add yourself as test user.
3. Credentials → Create OAuth client ID (Web application):
   - Authorized redirect URI: `http://localhost:8080/api/gmail/callback` (and your prod URL later).
4. Copy client ID/secret into `backend/.env`.

### 4. Backend
```bash
cd backend
cp .env.example .env        # fill in values; TOKEN_ENCRYPTION_KEY: openssl rand -hex 32
npm install
npx prisma migrate dev --name init
npm run dev                 # http://localhost:8080
```

### 5. Frontend
```bash
cd frontend
cp .env.example .env        # Firebase web config + VITE_API_URL
npm install
npm run dev                 # http://localhost:5173
```

### 6. Chrome extension (optional)
chrome://extensions → Developer mode → Load unpacked → select `extension/`. Paste your backend URL and a Firebase ID token (grab from DevTools: `await firebase.auth().currentUser.getIdToken()` or add a "copy token" button).

## How syncing works
1. User connects Gmail (read-only scope). Tokens are AES-256-GCM encrypted at rest.
2. Sync queries Gmail for job-portal senders (LinkedIn, Indeed, Workday, Greenhouse, Lever, SmartRecruiters, Ashby, iCIMS, Jobvite, career/recruiting addresses). First sync covers 90 days; later syncs are incremental.
3. Each new email is classified by Claude (or regex rules if no `ANTHROPIC_API_KEY`) into company, title, location, portal, and one of 9 statuses.
4. Applications are deduplicated by (user, company, title); status only moves forward automatically.
5. Interview/offer/assessment emails create in-app notifications.
6. A cron job repeats this hourly for all connected users.

## Security notes
- Gmail scope is read-only; users can disconnect anytime (tokens are revoked with Google and deleted).
- OAuth tokens encrypted with AES-256-GCM before storage.
- All data is scoped by user ID from a verified Firebase token; helmet + CORS restricted to the frontend origin.

See DEPLOYMENT.md for production deployment.
