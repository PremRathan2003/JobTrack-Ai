import { Router } from 'express';
import { z } from 'zod';
import { AppStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthedRequest } from '../middleware/auth';

const router = Router();

const appSchema = z.object({
  company: z.string().min(1).max(100),
  jobTitle: z.string().min(1).max(150),
  location: z.string().max(150).nullish(),
  portal: z.string().max(50).nullish(),
  status: z.nativeEnum(AppStatus).optional(),
  appliedAt: z.coerce.date().optional(),
  notes: z.string().max(5000).nullish(),
  source: z.enum(['email', 'manual', 'extension']).optional(),
});

// GET /api/applications?search=&status=&company=&from=&to=&sort=&page=
router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const { search, status, company, from, to, sort = 'newest' } = req.query as Record<string, string>;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 25);

    const where: Prisma.ApplicationWhereInput = { userId: req.userId! };
    if (search) where.OR = [
      { company: { contains: search, mode: 'insensitive' } },
      { jobTitle: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status as AppStatus;
    if (company) where.company = { equals: company, mode: 'insensitive' };
    if (from || to) where.appliedAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };

    const orderBy: Prisma.ApplicationOrderByWithRelationInput =
      sort === 'oldest' ? { appliedAt: 'asc' } :
      sort === 'company' ? { company: 'asc' } :
      sort === 'status' ? { status: 'asc' } : { appliedAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.application.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.application.count({ where }),
    ]);
    res.json({ items, total, page, pageSize });
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const data = appSchema.parse(req.body);
    const app = await prisma.application.create({
      data: { ...data, userId: req.userId!, source: data.source || 'manual' },
    });
    res.status(201).json(app);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const data = appSchema.partial().parse(req.body);
    const result = await prisma.application.updateMany({
      where: { id: req.params.id, userId: req.userId! },
      data,
    });
    if (!result.count) return res.status(404).json({ error: 'Not found' });
    res.json(await prisma.application.findUnique({ where: { id: req.params.id } }));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const result = await prisma.application.deleteMany({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!result.count) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

// Email history for one application
router.get('/:id/emails', async (req: AuthedRequest, res, next) => {
  try {
    const app = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: { emails: { orderBy: { receivedAt: 'desc' } } },
    });
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json(app.emails);
  } catch (e) { next(e); }
});

export default router;
