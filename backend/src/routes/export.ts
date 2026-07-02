import { Router } from 'express';
import { stringify } from 'csv-stringify/sync';
import { prisma } from '../lib/prisma';
import { AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/csv', async (req: AuthedRequest, res, next) => {
  try {
    const apps = await prisma.application.findMany({
      where: { userId: req.userId! }, orderBy: { appliedAt: 'desc' },
    });
    const csv = stringify(
      apps.map((a) => ({
        Company: a.company, Role: a.jobTitle, Location: a.location || '',
        'Date Applied': a.appliedAt.toISOString().slice(0, 10),
        Status: a.status, Portal: a.portal || '',
        'Last Email': a.lastEmailAt?.toISOString().slice(0, 10) || '',
        Notes: a.notes || '',
      })),
      { header: true }
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
    res.send(csv);
  } catch (e) { next(e); }
});

export default router;
