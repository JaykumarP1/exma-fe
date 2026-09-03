export interface ProjectDocument {
  id: number;
  filename: string;
  content_type: string;
  byte_size: number;
  url: string;
  created_at?: string;
}

export interface Card {
  id: number;
  project_id: number;
  card_number: string;
  masked_number?: string;
  card_holder_name: string;
  card_type: string;
  expiry_date: string;
  status: 'active' | 'locked' | 'expired';
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'pending';
  category: string;
  latency: number;
  created_at?: string;
  updated_at?: string;
  documents?: ProjectDocument[];
  cards?: Card[];
}

export interface Expense {
  id: number;
  project_id?: number;
  project_title?: string;
  statement_id?: number;
  statement_filename?: string;
  statement_pdf_url?: string;
  statement_file_type?: string;
  statement_bank_name?: string;
  statement_date?: string;
  statement_due_date?: string;
  statement_minimum_amount?: number;
  statement_total_due?: number;
  title: string;
  category: string;
  amount: number;
  currency?: string;
  currency_symbol?: string;
  formatted_amount?: string;
  expense_date?: string;
  vendor?: string;
  source_filename?: string;
  created_at?: string;
}


export interface ExpenseSummary {
  total_amount: number;
  total_count: number;
  avg_amount: number;
  top_category: string;
  category_breakdown: Record<string, number>;
}

export interface ExpensesResponse {
  expenses: Expense[];
  summary: ExpenseSummary;
}

export interface Statement {
  id: number;
  project_id?: number;
  filename: string;
  file_type: 'PDF' | 'Excel' | string;
  expenses_count: number;
  total_amount: number;
  currency?: string;
  currency_symbol?: string;
  formatted_amount: string;
  is_unlocked?: boolean;
  file_url?: string;
  uploaded_at_formatted: string;
  uploaded_at?: string;
  bank_title: string;
  bank_name?: string;
  due_date?: string;
  minimum_amount?: number;
  total_due?: number;
  created_at?: string;
}




export interface StatementsResponse {
  statements: Statement[];
  stats: {
    total_statements: number;
    pdf_statements: number;
    excel_statements: number;
    total_amount_sum: string;
  };
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  ruby_version: string;
  rails_version: string;
  database: string;
  redis?: string;
  redis_latency_ms?: number;
  sidekiq?: string;
  cron_schedule?: string;
  latency_ms: number;
  projects_count: number;
  environment: string;
}

export interface StatsSummary {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  pending_projects: number;
  avg_latency_ms: number;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: 'admin' | 'member';
  currency?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export interface SettingsResponse {
  settings: {
    default_currency: string;
  };
  supported_currencies: CurrencyOption[];
  user: AuthenticatedUser;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  token: string;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  owner_id: number;
  currency?: string;
  pdf_extraction?: 'standard' | 'ai';
  members_count?: number;
  projects_count?: number;
  created_at?: string;
}

export interface PdfProcessingLogItem {
  id: number;
  workspace_id: number;
  workspace_name: string;
  filename: string;
  extraction_mode: 'standard' | 'ai';
  page_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  formatted_cost: string;
  created_at_formatted: string;
  created_at?: string;
  raw_response_data?: any[];
}


export interface PdfProcessingLogsResponse {
  logs: PdfProcessingLogItem[];
  stats: {
    total_pdfs_processed: number;
    ai_processed_count: number;
    standard_processed_count: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    total_cost_formatted: string;
  };
}

export interface WorkspacesResponse {
  active_workspace_id: number;
  workspaces: Workspace[];
}

export interface FeatureItem {
  text: string;
  done: boolean;
}

export interface ReleaseNoteItem {
  id: number;
  version: string;
  tagline?: string;
  release_date: string;
  release_date_formatted?: string;
  author?: string;
  status?: string;
  features: (string | FeatureItem)[];
  created_at?: string;
}

export interface PlanItem {
  id: string;
  title: string;
  status: 'completed' | 'verified' | 'in_progress';
  created_at: string;
  steps: string[];
}

export interface TokenUsageLogItem {
  id: number;
  triggered_by?: 'manual' | 'recurring_job' | string;

  fetch_start_time: string;

  fetch_end_time: string;
  delta_tokens: number;
  cumulative_total_tokens: number;
  remaining_balance: number;
  total_budget: number;
  content_tokens: number;
  tool_tokens: number;
  thinking_tokens: number;
  step_count: number;
  formatted_delta: string;
  formatted_cumulative: string;
  formatted_balance: string;
  formatted_budget: string;
  balance_percentage: number;
  interval_formatted: string;
  fetched_at_formatted: string;
  created_at?: string;
  plans?: PlanItem[];
}

export interface TokenUsageResponse {
  summary: {
    total_fetches: number;
    cumulative_tokens: number;
    remaining_balance: number;
    total_budget: number;
    formatted_balance: string;
    formatted_cumulative: string;
    formatted_budget: string;
    balance_percentage: number;
    next_gemini_reset_at: string;
    next_gemini_reset_formatted: string;
    seconds_to_reset: number;
  };
  logs: TokenUsageLogItem[];
}

export interface DailyTokenMetricItem {
  id: number;
  metric_date: string;
  total_tokens: number;
  content_tokens: number;
  tool_tokens: number;
  thinking_tokens: number;
  fetches_count: number;
  formatted_total: string;
  formatted_date: string;
  day_name: string;
  day_number: number;
  iso_date: string;
}

export interface TokenAnalyticsResponse {
  cron_schedule: string;
  cron_active: boolean;
  last_run_at: string;
  daily_metrics: DailyTokenMetricItem[];
}
