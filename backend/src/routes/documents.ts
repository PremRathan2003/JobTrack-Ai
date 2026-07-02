import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { AuthedRequest } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    res.json(await prisma.document.findMany({
      where: { userId: req.userId! },
      select: { id: true, kind: true, filename: true, mimeType: true, createdAt: true },
    }));
  } catch (e) { next(e); }
});

router.post('/', upload.single('file'), async (req: AuthedRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const kind = req.body.kind === 'cover_letter' ? 'cover_letter' : 'resume';
    const doc = await prisma.document.create({
      data: {
        userId: req.userId!, kind,
        filename: req.file.originalname, mimeType: req.file.mimetype, data: req.file.buffer,
      },
      select: { id: true, kind: true, filename: true, createdAt: true },
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

router.get('/:id/download', async (req: AuthedRequest, res, next) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.send(Buffer.from(doc.data));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    await prisma.document.deleteMany({ where: { id: req.params.id, userId: req.userId! } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
