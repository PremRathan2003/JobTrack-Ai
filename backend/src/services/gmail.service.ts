import { google } from 'googleapis';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../lib/crypto';

export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Senders worth scanning (job portals + generic recruiting patterns)
export const JOB_QUERY =
  'from:(linkedin.com OR indeed.com OR myworkday.com OR greenhouse.io OR lever.co ' +
  'OR smartrecruiters.com OR ashbyhq.com OR icims.com OR jobvite.com OR bamboohr.com ' +
  'OR "no-reply" OR careers OR recruiting OR talent) ' +
  '(subject:(application OR interview OR offer OR assessment OR position OR "thank you for applying"))';

export function oauthClient() {
  return new google.auth.OAuth2(env.google.clientId, env.google.clientSecret, env.google.redirectUri);
}

export function getAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES,
    state,
  });
}

export async function handleCallback(code: string, userId: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token || !tokens.access_token) {
    throw Object.assign(new Error('Google did not return tokens'), { status: 400 });
  }
  client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: client });
  const profile = await gmail.users.getProfile({ userId: 'me' });

  await prisma.gmailAccount.upsert({
    where: { userId },
    update: {
      gmailAddress: profile.data.emailAddress!,
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: encrypt(tokens.refresh_token),
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      syncEnabled: true,
    },
    create: {
      userId,
      gmailAddress: profile.data.emailAddress!,
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: encrypt(tokens.refresh_token),
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });
}

export async function gmailClientForUser(userId: string) {
  const account = await prisma.gmailAccount.findUnique({ where: { userId } });
  if (!account) return null;
  const client = oauthClient();
  client.setCredentials({
    access_token: decrypt(account.accessTokenEnc),
    refresh_token: decrypt(account.refreshTokenEnc),
    expiry_date: account.tokenExpiry?.getTime(),
  });
  // Persist refreshed tokens
  client.on('tokens', async (tokens) => {
    await prisma.gmailAccount.update({
      where: { userId },
      data: {
        ...(tokens.access_token && { accessTokenEnc: encrypt(tokens.access_token) }),
        ...(tokens.refresh_token && { refreshTokenEnc: encrypt(tokens.refresh_token) }),
        ...(tokens.expiry_date && { tokenExpiry: new Date(tokens.expiry_date) }),
      },
    });
  });
  return { gmail: google.gmail({ version: 'v1', auth: client }), account };
}

export async function disconnect(userId: string) {
  const account = await prisma.gmailAccount.findUnique({ where: { userId } });
  if (!account) return;
  try {
    await oauthClient().revokeToken(decrypt(account.refreshTokenEnc));
  } catch { /* token may already be revoked */ }
  await prisma.gmailAccount.delete({ where: { userId } });
}

export function extractBody(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data) {
    const text = Buffer.from(payload.body.data, 'base64url').toString('utf8');
    return payload.mimeType === 'text/html' ? text.replace(/<[^>]+>/g, ' ') : text;
  }
  for (const part of payload.parts || []) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return Buffer.from(part.body.data, 'base64url').toString('utf8');
    }
  }
  for (const part of payload.parts || []) {
    const nested = extractBody(part);
    if (nested) return nested;
  }
  return '';
}
