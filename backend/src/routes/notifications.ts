import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthedRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    res.json(await prisma.notification.findMany({
      where: { userId: req.userId! }, orderBy: { createdAt: 'desc' }, take: 50,
    }));
  } catch (e) { next(e); }
});

router.post('/read-all', async (req: AuthedRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, read: false }, data: { read: true },
    });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
