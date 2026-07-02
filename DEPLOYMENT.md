# Deployment Guide

## Database — Railway/Render/Neon PostgreSQL
1. Create a PostgreSQL instance (Railway: New → Database → PostgreSQL).
2. Copy the connection string → `DATABASE_URL`.

## Backend — Railway (or Render)
1. Push the repo to GitHub.
2. Railway → New Project → Deploy from GitHub → set root directory to `backend/`.
3. Build command: `npm install && npx prisma generate && npm run build`
   Start command: `npx prisma migrate deploy && npm start`
4. Environment variables: everything from `backend/.env.example`, with
   - `GOOGLE_REDIRECT_URI=https://<backend-domain>/api/gmail/callback`
   - `FRONTEND_URL=https://<your-vercel-domain>`
5. Add the production redirect URI in Google Cloud → Credentials → your OAuth client.

Render equivalent: New → Web Service → root `backend`, same commands, add a Render PostgreSQL.

Note: the hourly cron runs inside the Node process, which works on Railway/Render's always-on services. Do not deploy the backend to a serverless platform (cron would never fire).

## Frontend — Vercel
1. Vercel → New Project → import repo → root directory `frontend/`.
2. Framework preset: Vite. Build: `npm run build`, output `dist`.
3. Environment variables: all `VITE_*` values, with `VITE_API_URL=https://<backend-domain>`.
4. `vercel.json` already handles SPA rewrites.

## Post-deploy checklist
- [ ] Firebase Auth → Settings → Authorized domains: add the Vercel domain.
- [ ] Google OAuth consent screen: publish app (or keep test users) and verify the `gmail.readonly` scope (Google requires verification for sensitive scopes before public launch).
- [ ] Confirm `https://<backend>/health` returns `{"ok":true}`.
- [ ] Sign in, connect Gmail, hit "Sync Gmail", verify applications appear.

## Scaling notes
- Move hourly sync to a queue (BullMQ + Redis) when user count grows; process users in parallel workers.
- Swap Gmail polling for push notifications (Gmail `users.watch` + Pub/Sub) for near-real-time updates.
- Store documents in S3/GCS instead of Postgres `bytea` beyond small scale.
- Add rate limiting (e.g. express-rate-limit) and structured logging (pino) in production.
