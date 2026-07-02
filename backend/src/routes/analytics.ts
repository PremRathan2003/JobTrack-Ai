import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/summary', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.userId!;
    const byStatus = await prisma.application.groupBy({
      by: ['status'], where: { userId }, _count: true,
    });
    const count = (s: string[]) =>
      byStatus.filter((b) => s.includes(b.status)).reduce((a, b) => a + b._count, 0);
    const total = byStatus.reduce((a, b) => a + b._count, 0);
    const interviews = count(['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED']);
    const offers = count(['OFFER_RECEIVED']);
    const rejections = count(['REJECTED']);
    res.json({
      total, interviews, offers, rejections,
      pending: total - offers - rejections - count(['WITHDRAWN']),
      statusDistribution: Object.fromEntries(byStatus.map((b) => [b.status, b._count])),
      interviewSuccessRate: interviews ? Math.round((offers / interviews) * 100) : 0,
    });
  } catch (e) { next(e); }
});

router.get('/monthly', async (req: AuthedRequest, res, next) => {
  try {
    const rows = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT to_char(date_trunc('month', "appliedAt"), 'YYYY-MM') AS month, COUNT(*) AS count
      FROM "Application" WHERE "userId" = ${req.userId!}
      GROUP BY 1 ORDER BY 1`;
    res.json(rows.map((r) => ({ month: r.month, count: Number(r.count) })));
  } catch (e) { next(e); }
});

router.get('/top-companies', async (req: AuthedRequest, res, next) => {
  try {
    const rows = await prisma.application.groupBy({
      by: ['company'], where: { userId: req.userId! },
      _count: true, orderBy: { _count: { company: 'desc' } }, take: 10,
    });
    res.json(rows.map((r) => ({ company: r.company, count: r._count })));
  } catch (e) { next(e); }
});

export default router;
