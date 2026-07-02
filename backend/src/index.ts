import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { env } from './config/env';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/error';
import applications from './routes/applications';
import gmail from './routes/gmail';
import analytics from './routes/analytics';
import notifications from './routes/notifications';
import exportRoutes from './routes/export';
import documents from './routes/documents';
import { syncAllUsers } from './services/sync.service';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/gmail', gmail); // has its own auth (callback must be public)
app.use('/api/applications', requireAuth, applications);
app.use('/api/analytics', requireAuth, analytics);
app.use('/api/notifications', requireAuth, notifications);
app.use('/api/export', requireAuth, exportRoutes);
app.use('/api/documents', requireAuth, documents);

app.use(errorHandler);

// Background sync: every hour
cron.schedule('0 * * * *', () => {
  console.log('Hourly Gmail sync starting…');
  syncAllUsers().catch(console.error);
});

app.listen(env.port, () => console.log(`JobTrack AI API on :${env.port}`));
