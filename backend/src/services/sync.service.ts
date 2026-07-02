import { AppStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { gmailClientForUser, JOB_QUERY, extractBody } from './gmail.service';
import { classifyEmail } from './classifier.service';
import { notifyOnStatus } from './notification.service';

// Status "progression" rank — never downgrade automatically except terminal states.
const RANK: Record<AppStatus, number> = {
  APPLIED: 1, APPLICATION_RECEIVED: 2, UNDER_REVIEW: 3, ASSESSMENT: 4,
  INTERVIEW_SCHEDULED: 5, INTERVIEW_COMPLETED: 6,
  OFFER_RECEIVED: 7, REJECTED: 7, WITHDRAWN: 7,
};

// Prevents two syncs for the same user running at once
const syncing = new Set<string>();

export async function syncUser(userId: string): Promise<{ scanned: number; updated: number }> {
  if (syncing.has(userId)) return { scanned: 0, updated: 0 };
  syncing.add(userId);
  try {
    const ctx = await gmailClientForUser(userId);
    if (!ctx || !ctx.account.syncEnabled) return { scanned: 0, updated: 0 };
    const { gmail, account } = ctx;

    const afterEpoch = account.lastSyncAt
      ? Math.floor(account.lastSyncAt.getTime() / 1000) - 3600 // 1h overlap for safety
      : Math.floor(Date.now() / 1000) - 90 * 86400; // first sync: last 90 days
    const q = `${JOB_QUERY} after:${afterEpoch}`;

    let scanned = 0, updated = 0, pageToken: string | undefined;
    do {
      const list = await gmail.users.messages.list({ userId: 'me', q, maxResults: 50, pageToken });
      pageToken = list.data.nextPageToken || undefined;

      for (const m of list.data.messages || []) {
        const exists = await prisma.emailRecord.findUnique({ where: { gmailMessageId: m.id! } });
        if (exists) continue;
        scanned++;

        const full = await gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'full' });
        const headers = full.data.payload?.headers || [];
        const h = (n: string) => headers.find((x) => x.name?.toLowerCase() === n)?.value || '';
        const subject = h('subject');
        const sender = h('from');
        const receivedAt = new Date(Number(full.data.internalDate));
        const body = extractBody(full.data.payload).slice(0, 8000);

        const result = await classifyEmail(subject, body, sender);
        if (!result.isJobEmail || !result.company) continue;

        const company = result.company.slice(0, 100);
        const jobTitle = (result.jobTitle || 'Unknown Role').slice(0, 150);
        const status = result.status || 'APPLIED';

        const app = await prisma.application.upsert({
          where: { userId_company_jobTitle: { userId, company, jobTitle } },
          create: {
            userId, company, jobTitle,
            location: result.location, portal: result.portal,
            status, appliedAt: receivedAt, lastEmailAt: receivedAt,
          },
          update: {},
        });

        // Only advance status; record newest email date
        const data: any = { lastEmailAt: receivedAt };
        if (RANK[status] > RANK[app.status]) data.status = status;
        if (result.location && !app.location) data.location = result.location;
        const updatedApp = await prisma.application.update({ where: { id: app.id }, data });

        // Upsert (not create) so a concurrent sync can never crash on duplicates
        await prisma.emailRecord.upsert({
          where: { gmailMessageId: m.id! },
          update: {},
          create: {
            applicationId: app.id, gmailMessageId: m.id!,
            subject: subject.slice(0, 500), sender: sender.slice(0, 300),
            snippet: full.data.snippet?.slice(0, 500), receivedAt, detectedStatus: status,
          },
        });

        if (data.status) {
          await notifyOnStatus(userId, updatedApp, status);
          updated++;
        }
      }
    } while (pageToken);

    await prisma.gmailAccount.update({ where: { userId }, data: { lastSyncAt: new Date() } });
    return { scanned, updated };
  } finally {
    syncing.delete(userId);
  }
}

export async function syncAllUsers() {
  const accounts = await prisma.gmailAccount.findMany({ where: { syncEnabled: true } });
  for (const acc of accounts) {
    try {
      await syncUser(acc.userId);
    } catch (e) {
      console.error(`Sync failed for user ${acc.userId}:`, e);
    }
  }
}