import 'dotenv/config';

const req = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing required env var ${k}`);
  return v;
};

export const env = {
  port: Number(process.env.PORT || 8080),
  databaseUrl: req('DATABASE_URL'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  firebaseServiceAccountB64: req('FIREBASE_SERVICE_ACCOUNT_B64'),
  google: {
    clientId: req('GOOGLE_CLIENT_ID'),
    clientSecret: req('GOOGLE_CLIENT_SECRET'),
    redirectUri: req('GOOGLE_REDIRECT_URI'),
  },
  tokenEncryptionKey: req('TOKEN_ENCRYPTION_KEY'), // 64 hex chars
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
};
