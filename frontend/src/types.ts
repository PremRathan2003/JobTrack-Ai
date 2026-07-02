export type AppStatus =
  | 'APPLIED' | 'APPLICATION_RECEIVED' | 'UNDER_REVIEW' | 'ASSESSMENT'
  | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_COMPLETED' | 'OFFER_RECEIVED'
  | 'REJECTED' | 'WITHDRAWN';

export const STATUS_LABELS: Record<AppStatus, string> = {
  APPLIED: 'Applied',
  APPLICATION_RECEIVED: 'Application Received',
  UNDER_REVIEW: 'Under Review',
  ASSESSMENT: 'Assessment',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEW_COMPLETED: 'Interview Completed',
  OFFER_RECEIVED: 'Offer Received',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export const STATUS_COLORS: Record<AppStatus, string> = {
  APPLIED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  APPLICATION_RECEIVED: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  ASSESSMENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  INTERVIEW_COMPLETED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  OFFER_RECEIVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  WITHDRAWN: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export interface Application {
  id: string;
  company: string;
  jobTitle: string;
  location: string | null;
  portal: string | null;
  status: AppStatus;
  appliedAt: string;
  lastEmailAt: string | null;
  notes: string | null;
  source: string;
}

export interface Summary {
  total: number;
  interviews: number;
  offers: number;
  rejections: number;
  pending: number;
  statusDistribution: Record<string, number>;
  interviewSuccessRate: number;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
