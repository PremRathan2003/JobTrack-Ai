import Anthropic from '@anthropic-ai/sdk';
import { AppStatus } from '@prisma/client';
import { env } from '../config/env';

export interface ExtractedJob {
  isJobEmail: boolean;
  company?: string;
  jobTitle?: string;
  location?: string;
  portal?: string;
  status?: AppStatus;
}

const PORTAL_DOMAINS: Record<string, string> = {
  'linkedin.com': 'linkedin',
  'indeed.com': 'indeed',
  'myworkday.com': 'workday',
  'workday.com': 'workday',
  'greenhouse.io': 'greenhouse',
  'lever.co': 'lever',
  'smartrecruiters.com': 'smartrecruiters',
  'ashbyhq.com': 'ashby',
};

const STATUS_RULES: Array<{ re: RegExp; status: AppStatus }> = [
  { re: /congratulations|pleased to offer|offer letter|offer of employment/i, status: 'OFFER_RECEIVED' },
  { re: /unfortunately|not (be )?moving forward|other candidates|regret to inform|not selected|decided to pursue/i, status: 'REJECTED' },
  { re: /interview (is )?(confirmed|scheduled)|invite you to (an )?interview|schedule (an|your) interview|book a time/i, status: 'INTERVIEW_SCHEDULED' },
  { re: /thank you for (interviewing|taking the time to (speak|meet))/i, status: 'INTERVIEW_COMPLETED' },
  { re: /(online |coding |take-home |technical )?assessment|hackerrank|codility|coding challenge|take.home/i, status: 'ASSESSMENT' },
  { re: /under review|reviewing your application|application is being reviewed/i, status: 'UNDER_REVIEW' },
  { re: /application (was |has been )?(received|submitted)|we('ve| have) received your application/i, status: 'APPLICATION_RECEIVED' },
  { re: /thank you for applying|application (to|for)/i, status: 'APPLIED' },
];

export function detectPortal(sender: string): string {
  const domain = sender.toLowerCase().split('@')[1] || '';
  for (const [d, portal] of Object.entries(PORTAL_DOMAINS)) {
    if (domain.endsWith(d)) return portal;
  }
  return 'other';
}

/** Company name from the sender's display name, e.g. "Stripe Careers <no-reply@...>" */
function companyFromSender(sender: string): string | undefined {
  const display = sender.split('<')[0].replace(/["']/g, '').trim();
  if (!display || display.includes('@')) return undefined;
  const cleaned = display
    .replace(/\b(careers?|recruiting|recruitment|talent( acquisition)?|jobs?|hiring|team|hr|no-?reply|notifications?)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Skip generic portal names — they aren't the employer
  if (/^(linkedin|indeed|glassdoor|ziprecruiter|greenhouse|lever|workday|smartrecruiters|ashby|icims|jobvite)$/i.test(cleaned)) {
    return undefined;
  }
  return cleaned.length >= 2 && cleaned.length <= 50 ? cleaned : undefined;
}

export function classifyByRules(subject: string, body: string, sender: string): ExtractedJob {
  const text = `${subject}\n${body}`;
  const jobSignal = /appl(y|ied|ication)|interview|position|role|job|candidate|recruiter|hiring|offer/i.test(text);
  if (!jobSignal) return { isJobEmail: false };

  let status: AppStatus = 'APPLIED';
  for (const rule of STATUS_RULES) {
    if (rule.re.test(text)) { status = rule.status; break; }
  }

  // ---- Company heuristics (most specific first) ----
  const companyMatch =
    // LinkedIn: "Your application was sent to Stripe"
    text.match(/application (?:was |has been )?(?:sent|submitted) to ([A-Z][\w.& -]{1,40}?)(?:[.,!\n]|$)/im) ||
    // "Thank you for applying to Stripe" / "Your application to Stripe"
    text.match(/(?:thank you for applying|your application) (?:to|at|with) ([A-Z][\w.& -]{1,40}?)(?:[.,!\n]| for| was| has)/i) ||
    text.match(/application (?:to|at|with) ([A-Z][\w.& -]{1,40}?)(?:[.,!\n]| for| was| has)/) ||
    // "Software Engineer at Stripe" anywhere in subject
    subject.match(/\bat ([A-Z][\w.& -]{1,40}?)(?:\s*[-|–(]|$)/) ||
    // "Stripe application received"
    subject.match(/(?:^|- )([A-Z][\w.& -]{1,40}) (?:application|team)/);
  const company = companyMatch?.[1]?.trim() || companyFromSender(sender);

  // ---- Job title heuristics ----
  const titleMatch =
    // "for the Software Engineer position/role"
    text.match(/(?:for the|position of|role of|applying for(?: the)?|application for(?: the)?) ([A-Z][\w()/,& -]{2,60}?)(?: position| role| at|[.,!\n])/i) ||
    // Indeed: "Indeed Application: Software Engineer"
    subject.match(/^Indeed Application:\s*(.+?)(?:\s+at\s+|\s*$)/i) ||
    // "Application submitted: Software Engineer at X" / "Application for Software Engineer"
    subject.match(/application (?:submitted:|for|to)\s*(?:the )?([A-Z][\w()/,& -]{2,60}?)(?:\s+at\s+|\s*[-|–]|\s*$)/i) ||
    // "Your application to Stripe for Software Engineer"
    text.match(/\bfor (?:the )?([A-Z][\w()/,& -]{2,60}?) (?:position|role|opening|opportunity)\b/i) ||
    // Subject like "Software Engineer - Stripe" or "Software Engineer | Stripe"
    subject.match(/^([A-Z][\w()/,& -]{2,60}?)\s*[-|–]\s*[A-Z]/);

  // ---- Location heuristics ----
  const locationMatch =
    // "Location: London, UK"
    text.match(/location[:\s]+([A-Z][\w .,-]{2,50}?)(?:[.\n]|$)/im) ||
    // "based in London" / "located in New York"
    text.match(/\b(?:based|located) in ([A-Z][\w .,-]{2,50}?)(?:[.,\n]|$)/m) ||
    // "(Remote)" / "Hybrid" / "On-site"
    text.match(/\b(Remote|Hybrid|On-?site)\b/);

  return {
    isJobEmail: true,
    company,
    jobTitle: titleMatch?.[1]?.trim(),
    location: locationMatch?.[1]?.trim(),
    portal: detectPortal(sender),
    status,
  };
}

const anthropic = env.anthropicApiKey ? new Anthropic({ apiKey: env.anthropicApiKey }) : null;

export async function classifyEmail(subject: string, body: string, sender: string): Promise<ExtractedJob> {
  const rules = classifyByRules(subject, body, sender);
  if (!anthropic) return rules;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:
        'You extract job application data from emails. Respond with ONLY minified JSON: ' +
        '{"isJobEmail":bool,"company":str|null,"jobTitle":str|null,"location":str|null,' +
        '"status":"APPLIED"|"APPLICATION_RECEIVED"|"UNDER_REVIEW"|"ASSESSMENT"|"INTERVIEW_SCHEDULED"|' +
        '"INTERVIEW_COMPLETED"|"OFFER_RECEIVED"|"REJECTED"|"WITHDRAWN"|null}',
      messages: [{
        role: 'user',
        content: `From: ${sender}\nSubject: ${subject}\n\n${body.slice(0, 4000)}`,
      }],
    });
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const parsed = JSON.parse(raw.replace(/^```json?|```$/g, '').trim());
    return {
      isJobEmail: !!parsed.isJobEmail,
      company: parsed.company || rules.company,
      jobTitle: parsed.jobTitle || rules.jobTitle,
      location: parsed.location || undefined,
      portal: detectPortal(sender),
      status: (parsed.status as AppStatus) || rules.status,
    };
  } catch (e) {
    console.warn('AI classification failed, using rules:', e);
    return rules;
  }
}