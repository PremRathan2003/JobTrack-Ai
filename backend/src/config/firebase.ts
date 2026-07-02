import admin from 'firebase-admin';
import { env } from './env';

const serviceAccount = JSON.parse(
  Buffer.from(env.firebaseServiceAccountB64, 'base64').toString('utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

export const firebaseAuth = admin.auth();
