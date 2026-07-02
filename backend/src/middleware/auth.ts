import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';
import { prisma } from '../lib/prisma';

export interface AuthedRequest extends Request {
  userId?: string; // internal DB user id
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }
    const decoded = await firebaseAuth.verifyIdToken(header.slice(7));
    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: { name: decoded.name ?? undefined, photoUrl: decoded.picture ?? undefined },
      create: {
        firebaseUid: decoded.uid,
        email: decoded.email || `${decoded.uid}@unknown`,
        name: decoded.name,
        photoUrl: decoded.picture,
      },
    });
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
