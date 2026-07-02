import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { getAuthUrl, handleCallback, disconnect } from '../services/gmail.service';
import { syncUser } from '../services/sync.service';
import { firebaseAuth } from '../config/firebase';
import { env } from '../config/env';

const router = Router();

// Returns Google consent URL. State = Firebase ID token (verified in callback).
router.get('/connect', requireAuth, async (req: AuthedRequest, res) => {
  const token = (req.headers.authorization as string).slice(7);
  res.json({ url: getAuthUrl(token) });
});

// OAuth callback (no auth middleware — Google redirects the browser here)
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query as Record<string, string>;
    if (!code || !state) return res.status(400).send('Missing code/state');
    const decoded = await firebaseAuth.verifyIdToken(state);
    const user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });
    if (!user) return res.status(404).send('User not found');
    await handleCallback(code, user.id);
    syncUser(user.id).catch(console.error); // kick off initial sync in background
    res.redirect(`${env.frontendUrl}/settings?gmail=connected`);
  } catch (e) {
    console.error(e);
    res.redirect(`${env.frontendUrl}/settings?gmail=error`);
  }
});

router.get('/status', requireAuth, async (req: AuthedRequest, res) => {
  const account = await prisma.gmailAccount.findUnique({ where: { userId: req.userId! } });
  res.json(account ? {
    connected: true,
    gmailAddress: account.gmailAddress,
    lastSyncAt: account.lastSyncAt,
    syncEnabled: account.syncEnabled,
  } : { connected: false });
});

router.post('/sync', requireAuth, async (req: AuthedRequest, res, next) => {
  try { res.json(await syncUser(req.userId!)); } catch (e) { next(e); }
});

router.delete('/disconnect', requireAuth, async (req: AuthedRequest, res, next) => {
  try { await disconnect(req.userId!); res.status(204).end(); } catch (e) { next(e); }
});

export default router;
