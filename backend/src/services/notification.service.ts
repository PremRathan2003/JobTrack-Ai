import { AppStatus, Application } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function notifyOnStatus(userId: string, app: Application, status: AppStatus) {
  const map: Partial<Record<AppStatus, { type: string; title: string }>> = {
    INTERVIEW_SCHEDULED: { type: 'interview', title: `Interview: ${app.company}` },
    OFFER_RECEIVED: { type: 'offer', title: `Offer from ${app.company}!` },
    ASSESSMENT: { type: 'assessment_deadline', title: `Assessment from ${app.company}` },
  };
  const n = map[status];
  if (!n) return;
  await prisma.notification.create({
    data: {
      userId, type: n.type, title: n.title,
      body: `${app.jobTitle} at ${app.company} — status changed to ${status.replace(/_/g, ' ').toLowerCase()}.`,
    },
  });
}
