export type EmailCategory =
  | "Important"
  | "Work"
  | "Transactions"
  | "Promotions"
  | "Updates";

export type EmailPriority = "High" | "Medium" | "Low";

export interface UserRecord {
  id: string;
  email: string;
  refresh_token: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface EmailRecord {
  id: string;
  user_id: string;
  gmail_message_id: string;
  sender: string;
  subject: string;
  received_at: string;
  category: EmailCategory;
  priority: EmailPriority;
  summary: string;
  action_required: boolean;
  is_read: boolean;
  created_at: string;
}

export interface EmailClassificationResult {
  category: EmailCategory;
  priority: EmailPriority;
  summary: string;
  action_required: boolean;
}

export interface RawParsedEmail {
  id: string;
  threadId?: string;
  sender: string;
  subject: string;
  date: string;
  bodySnippet: string;
}

export interface SyncResult {
  success: boolean;
  userEmail: string;
  totalFetched: number;
  newEmailsClassified: number;
  skippedAlreadyProcessed: number;
  errors?: string[];
  durationMs?: number;
}

export interface DashboardMetrics {
  total: number;
  highPriority: number;
  actionRequired: number;
  categories: Record<EmailCategory, number>;
}

export interface UserSession {
  userId: string;
  email: string;
  isDemo?: boolean;
}
