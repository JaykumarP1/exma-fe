import {
  AuthResponse,
  AuthenticatedUser,
  Expense,
  ExpensesResponse,
  HealthStatus,
  Project,
  ProjectDocument,
  StatsSummary,
  Statement,
  StatementsResponse,

  TokenUsageLogItem,
  TokenUsageResponse,
  TokenAnalyticsResponse,
  DailyTokenMetricItem,
  ReleaseNoteItem,
  Workspace,
  WorkspacesResponse,
  SettingsResponse,
  PdfProcessingLogsResponse,
  EmailAccount,
  EmailAccountsResponse,
  EmailSyncLog,
  Card,
  CardsResponse
} from '../types';


const API_BASE = '/api/v1';
const TOKEN_KEY = 'exma.auth_token';
const WORKSPACE_KEY = 'exma.workspace_id';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getActiveWorkspaceId(): string | null {
  return localStorage.getItem(WORKSPACE_KEY);
}

export function setActiveWorkspaceId(id: number | string): void {
  localStorage.setItem(WORKSPACE_KEY, String(id));
}

export class ServerOfflineError extends Error {
  constructor(message = 'Server is currently offline or unreachable.') {
    super(message);
    this.name = 'ServerOfflineError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Session expired or unauthorized.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class InternalServerError extends Error {
  constructor(message = 'An internal server error occurred.') {
    super(message);
    this.name = 'InternalServerError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAuthToken();
  const wsId = getActiveWorkspaceId();

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (wsId) headers.set('X-Workspace-Id', wsId);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (netErr: any) {
    // Network / Server Down error - preserve token in localStorage!
    throw new ServerOfflineError('Rails backend server is offline or unreachable.');
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthToken();
      throw new UnauthorizedError('Your session has expired. Please sign in again.');
    }
    if (res.status >= 502 && res.status <= 504) {
      throw new ServerOfflineError('Server gateway error.');
    }

    const body = await res.json().catch(() => ({}));
    const message = body.error || body.errors?.join(', ') || body.message || `Internal Error (${res.status})`;

    // Preserve local storage session token! Dispatch global event for bottom-right toaster
    window.dispatchEvent(new CustomEvent('app-internal-error', { detail: { message, status: res.status } }));

    if (res.status >= 500) {
      throw new InternalServerError(message);
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function fetchHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/health');
}

export function fetchStats(): Promise<StatsSummary> {
  return request<StatsSummary>('/stats');
}

export function fetchProjects(category = 'all', query = ''): Promise<Project[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (query) params.append('query', query);
  const suffix = params.toString() ? `?${params.toString()}` : '';

  return request<Project[]>(`/projects${suffix}`);
}

export function createProject(data: Partial<Project>, files?: File[]): Promise<Project> {
  if (files && files.length > 0) {
    const formData = new FormData();
    if (data.title) formData.append('project[title]', data.title);
    if (data.description) formData.append('project[description]', data.description);
    if (data.category) formData.append('project[category]', data.category);
    if (data.status) formData.append('project[status]', data.status);
    files.forEach((file) => formData.append('files[]', file));

    return request<Project>('/projects', {
      method: 'POST',
      body: formData
    });
  }

  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify({ project: data })
  });
}

export function updateProject(id: number, data: Partial<Project>): Promise<Project> {
  return request<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ project: data })
  });
}

export function deleteProject(id: number): Promise<void> {
  return request<void>(`/projects/${id}`, { method: 'DELETE' });
}

export function uploadProjectDocument(
  projectId: number,
  file: File,
  password?: string
): Promise<{ message: string; documents: ProjectDocument[]; extracted_expenses_count?: number }> {
  const formData = new FormData();
  formData.append('file', file);
  if (password) formData.append('password', password);
  return request<{ message: string; documents: ProjectDocument[]; extracted_expenses_count?: number }>(
    `/projects/${projectId}/documents`,
    {
      method: 'POST',
      body: formData
    }
  );
}

export function deleteProjectDocument(
  projectId: number,
  documentId: number,
  deleteExpenses: boolean = false
): Promise<{ message: string; documents: ProjectDocument[] }> {
  return request<{ message: string; documents: ProjectDocument[] }>(
    `/projects/${projectId}/documents/${documentId}?delete_expenses=${deleteExpenses}`,
    {
      method: 'DELETE'
    }
  );
}

export function fetchExpenses(category = 'all', query = '', projectId = 'all'): Promise<ExpensesResponse> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (query) params.append('query', query);
  if (projectId && projectId !== 'all') params.append('project_id', projectId);
  const suffix = params.toString() ? `?${params.toString()}` : '';

  return request<ExpensesResponse>(`/expenses${suffix}`);
}

export function uploadExcelExpenseFile(
  file: File,
  projectId?: number,
  password?: string
): Promise<{ message: string; count: number; expenses: Expense[] }> {
  const formData = new FormData();
  formData.append('file', file);
  if (projectId) formData.append('project_id', projectId.toString());
  if (password) formData.append('password', password);

  return request<{ message: string; count: number; expenses: Expense[] }>('/expenses/upload', {
    method: 'POST',
    body: formData
  });
}

export interface StagedExpenseItem {
  id?: string;
  title: string;
  category: string;
  amount: number;
  transaction_type?: 'DR' | 'CR' | string;
  transaction_sign?: '+' | '-' | string;
  amount_formatted?: string;
  expense_date: string;
  vendor?: string;
}


export interface ParseExpenseResponse {
  draft_id: string;
  filename: string;
  is_pdf: boolean;
  pdf_url?: string;
  bank_name?: string;
  statement_date?: string;
  due_date?: string;
  minimum_amount?: number;
  total_due?: number;
  count: number;
  expenses: StagedExpenseItem[];
}


export function fetchExpenseDraft(draftId: string): Promise<ParseExpenseResponse> {
  return request<ParseExpenseResponse>(`/expenses/draft/${draftId}`);
}

export function parseExpenseFile(file: File, projectId?: number, password?: string): Promise<ParseExpenseResponse> {

  const formData = new FormData();
  formData.append('file', file);
  if (projectId) formData.append('project_id', projectId.toString());
  if (password) formData.append('password', password);

  return request<ParseExpenseResponse>('/expenses/parse', {
    method: 'POST',
    body: formData
  });
}

export function confirmStagedExpenses(payload: {
  draft_id: string;
  filename: string;
  project_id?: number;
  bank_name?: string;
  statement_date?: string;
  due_date?: string;
  minimum_amount?: number;
  total_due?: number;
  unlock_and_store?: boolean;
  expenses: StagedExpenseItem[];
}): Promise<{ message: string; statement: any; expenses: Expense[] }> {

  return request<{ message: string; statement: any; expenses: Expense[] }>('/expenses/confirm', {

    method: 'POST',
    body: JSON.stringify(payload)
  });
}


export function deleteExpense(id: number): Promise<void> {
  return request<void>(`/expenses/${id}`, { method: 'DELETE' });
}

export function fetchCards(filters?: { bank_id?: string | number; status?: string; search?: string }): Promise<CardsResponse> {
  const query = new URLSearchParams();
  if (filters?.bank_id && filters.bank_id !== 'all') query.append('bank_id', filters.bank_id.toString());
  if (filters?.status && filters.status !== 'all') query.append('status', filters.status);
  if (filters?.search) query.append('search', filters.search);
  const qStr = query.toString();
  return request<CardsResponse>(`/cards${qStr ? `?${qStr}` : ''}`);
}

export function fetchCard(id: number): Promise<Card> {
  return request<Card>(`/cards/${id}`);
}

export function createCard(
  cardData: {
    project_id: number;
    card_number: string;
    card_holder_name: string;
    card_type: string;
    card_name?: string;
    expiry_date: string;
    status?: string;
  }
): Promise<Card>;
export function createCard(
  projectId: number,
  cardData: { card_number: string; card_holder_name: string; card_type: string; card_name?: string; expiry_date: string; status?: string }
): Promise<any>;
export function createCard(
  arg1: number | { project_id: number; card_number: string; card_holder_name: string; card_type: string; card_name?: string; expiry_date: string; status?: string },
  arg2?: { card_number: string; card_holder_name: string; card_type: string; card_name?: string; expiry_date: string; status?: string }
): Promise<any> {
  if (typeof arg1 === 'number') {
    return request<any>(`/projects/${arg1}/cards`, {
      method: 'POST',
      body: JSON.stringify({ card: arg2 })
    });
  }
  return request<Card>('/cards', {
    method: 'POST',
    body: JSON.stringify({ card: arg1 })
  });
}

export function updateCard(
  id: number,
  cardData: {
    project_id?: number;
    card_holder_name?: string;
    card_type?: string;
    card_name?: string;
    expiry_date?: string;
    status?: string;
  }
): Promise<Card> {
  return request<Card>(`/cards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ card: cardData })
  });
}

export function deleteCard(cardId: number, projectId?: number): Promise<void> {
  if (projectId) {
    return request<void>(`/projects/${projectId}/cards/${cardId}`, { method: 'DELETE' });
  }
  return request<void>(`/cards/${cardId}`, { method: 'DELETE' });
}

export function linkCardStatements(
  cardId: number,
  statementIds: number[],
  propagateToExpenses: boolean = false
): Promise<{ success: boolean; linked_count: number; card: Card }> {
  return request<{ success: boolean; linked_count: number; card: Card }>(`/cards/${cardId}/link_statements`, {
    method: 'POST',
    body: JSON.stringify({ statement_ids: statementIds, propagate_to_expenses: propagateToExpenses })
  });
}

export function unlinkCardStatement(
  cardId: number,
  statementId: number,
  unlinkExpenses: boolean = false
): Promise<{ success: boolean; card: Card }> {
  return request<{ success: boolean; card: Card }>(`/cards/${cardId}/unlink_statement`, {
    method: 'POST',
    body: JSON.stringify({ statement_id: statementId, unlink_expenses: unlinkExpenses })
  });
}

export function linkCardExpenses(
  cardId: number,
  expenseIds: number[]
): Promise<{ success: boolean; linked_count: number; card: Card }> {
  return request<{ success: boolean; linked_count: number; card: Card }>(`/cards/${cardId}/link_expenses`, {
    method: 'POST',
    body: JSON.stringify({ expense_ids: expenseIds })
  });
}

export function unlinkCardExpense(
  cardId: number,
  expenseId: number
): Promise<{ success: boolean; card: Card }> {
  return request<{ success: boolean; card: Card }>(`/cards/${cardId}/unlink_expense`, {
    method: 'POST',
    body: JSON.stringify({ expense_id: expenseId })
  });
}

export function fetchStatements(projectId = 'all'): Promise<StatementsResponse> {
  const suffix = projectId && projectId !== 'all' ? `?project_id=${projectId}` : '';
  return request<StatementsResponse>(`/statements${suffix}`);
}

export function deleteStatement(id: number, deleteExpenses: boolean = true): Promise<void> {
  return request<void>(`/statements/${id}?delete_expenses=${deleteExpenses}`, { method: 'DELETE' });
}

export function unlockAndSaveStatement(
  file: File,
  password: string,
  projectId?: number
): Promise<{ message: string; statement: Statement; extracted_count: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);
  if (projectId) formData.append('project_id', projectId.toString());

  return request<{ message: string; statement: Statement; extracted_count: number }>('/statements/unlock_and_save', {
    method: 'POST',
    body: formData
  });
}

export function unlockExistingStatement(
  id: number,
  password: string
): Promise<{ message: string; statement: Statement }> {
  return request<{ message: string; statement: Statement }>(`/statements/${id}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ password })
  });
}

export function extractStatementExpenses(
  id: number,
  password?: string
): Promise<{ message: string; statement: Statement; extracted_count: number; expenses: any[] }> {
  return request<{ message: string; statement: Statement; extracted_count: number; expenses: any[] }>(`/statements/${id}/extract_expenses`, {
    method: 'POST',
    body: JSON.stringify({ password })
  });
}




export function fetchTokenUsage(): Promise<TokenUsageResponse> {
  return request<TokenUsageResponse>('/token_usage');
}

export function fetchTokenUsageDelta(): Promise<{
  message: string;
  summary: TokenUsageResponse['summary'];
  logs: TokenUsageLogItem[];
}> {
  return request<{ message: string; summary: TokenUsageResponse['summary']; logs: TokenUsageLogItem[] }>(
    '/token_usage/fetch',
    { method: 'POST' }
  );
}

export function fetchTokenAnalytics(): Promise<TokenAnalyticsResponse> {
  return request<TokenAnalyticsResponse>('/token_usage/analytics');
}

export function runTokenAnalytics(): Promise<{ message: string; last_run_at: string; last_status: string; daily_metrics: DailyTokenMetricItem[] }> {
  return request<{ message: string; last_run_at: string; last_status: string; daily_metrics: DailyTokenMetricItem[] }>('/token_usage/analytics/run', {
    method: 'POST'
  });
}

export function fetchReleaseNotes(): Promise<{ releases: ReleaseNoteItem[] }> {
  return request<{ releases: ReleaseNoteItem[] }>('/release_notes');
}

export function createReleaseNote(
  data: Partial<ReleaseNoteItem>
): Promise<{ message: string; release: ReleaseNoteItem }> {
  return request<{ message: string; release: ReleaseNoteItem }>('/release_notes', {
    method: 'POST',
    body: JSON.stringify({ release_note: data })
  });
}

export function updateReleaseNote(
  id: number,
  data: Partial<ReleaseNoteItem>
): Promise<{ message: string; release: ReleaseNoteItem }> {
  return request<{ message: string; release: ReleaseNoteItem }>(`/release_notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ release_note: data })
  });
}

export function deleteReleaseNote(id: number): Promise<void> {
  return request<void>(`/release_notes/${id}`, { method: 'DELETE' });
}

export function getSettings(): Promise<SettingsResponse> {
  return request<SettingsResponse>('/settings');
}

export function updateSettings(data: { default_currency: string }): Promise<SettingsResponse> {
  return request<SettingsResponse>('/settings', {
    method: 'PATCH',
    body: JSON.stringify({ settings: data })
  });
}

export function fetchWorkspaces(): Promise<WorkspacesResponse> {
  return request<WorkspacesResponse>('/workspaces');
}

export function createWorkspace(
  name: string,
  currency?: string,
  pdf_extraction?: 'standard' | 'ai'
): Promise<{ message: string; workspace: Workspace }> {
  return request<{ message: string; workspace: Workspace }>('/workspaces', {
    method: 'POST',
    body: JSON.stringify({ workspace: { name, currency, pdf_extraction } })
  });
}

export function updateWorkspace(
  id: number,
  data: { currency?: string; pdf_extraction?: 'standard' | 'ai'; name?: string }
): Promise<{ message: string; workspace: Workspace }> {
  return request<{ message: string; workspace: Workspace }>(`/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ workspace: data })
  });
}

export function switchWorkspace(id: number): Promise<{ message: string; workspace: Workspace }> {
  return request<{ message: string; workspace: Workspace }>(`/workspaces/${id}/switch`, {
    method: 'POST'
  });
}

export function fetchPdfProcessingLogs(): Promise<PdfProcessingLogsResponse> {
  return request<PdfProcessingLogsResponse>('/pdf_processing_logs');
}


export function register(email: string, password: string, passwordConfirmation: string): Promise<AuthResponse> {

  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ user: { email, password, password_confirmation: passwordConfirmation } })
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ user: { email, password } })
  });
}

export function loginWithGoogle(credential: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential })
  });
}

export function fetchCurrentUser(): Promise<{ user: AuthenticatedUser }> {
  return request<{ user: AuthenticatedUser }>('/auth/me');
}

export function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'DELETE' });
}

export function fetchEmailAccounts(): Promise<EmailAccountsResponse> {
  return request<EmailAccountsResponse>('/email_accounts');
}

export function createEmailAccount(payload: {
  email: string;
  provider: string;
  password?: string;
  username?: string;
  imap_host?: string;
  imap_port?: number;
  use_ssl?: boolean;
  project_id?: number;
  default_pdf_password?: string;
  search_keywords?: string;
  auto_sync?: boolean;
  sync_interval_hours?: number;
  test_first?: boolean;
}): Promise<{ email_account: EmailAccount; message: string }> {
  return request<{ email_account: EmailAccount; message: string }>('/email_accounts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateEmailAccount(
  id: number,
  payload: Partial<EmailAccount> & { password?: string }
): Promise<{ email_account: EmailAccount; message: string }> {
  return request<{ email_account: EmailAccount; message: string }>(`/email_accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function deleteEmailAccount(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/email_accounts/${id}`, { method: 'DELETE' });
}

export function testEmailAccountConnection(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  return request<{ success: boolean; message?: string; error?: string }>(`/email_accounts/${id}/test_connection`, {
    method: 'POST'
  });
}

export function syncEmailAccount(
  id: number,
  options?: {
    async?: boolean;
    limit?: number;
    days?: number;
    full_scan?: boolean;
    keywords?: string;
    pdf_password?: string;
  }
): Promise<{ message: string; result?: any; error?: string; async?: boolean; success?: boolean }> {
  const query = new URLSearchParams();
  if (options?.async) query.append('async', 'true');
  if (options?.limit) query.append('limit', options.limit.toString());
  if (options?.days !== undefined && options?.days !== null) query.append('days', options.days.toString());
  if (options?.full_scan) query.append('full_scan', 'true');
  if (options?.keywords) query.append('keywords', options.keywords);
  if (options?.pdf_password) query.append('pdf_password', options.pdf_password);

  const qStr = query.toString();
  return request<{ message: string; result?: any; error?: string; async?: boolean; success?: boolean }>(
    `/email_accounts/${id}/sync${qStr ? `?${qStr}` : ''}`,
    { method: 'POST' }
  );
}

export function fetchEmailAccountLogs(id: number): Promise<{ logs: EmailSyncLog[] }> {
  return request<{ logs: EmailSyncLog[] }>(`/email_accounts/${id}/logs`);
}

export function fetchEmailSyncLogs(limit: number = 50): Promise<{
  logs: EmailSyncLog[];
  stats?: {
    total_syncs: number;
    total_statements: number;
    total_expenses: number;
    total_attachments: number;
  };
}> {
  return request<{
    logs: EmailSyncLog[];
    stats?: {
      total_syncs: number;
      total_statements: number;
      total_expenses: number;
      total_attachments: number;
    };
  }>(`/email_sync_logs?limit=${limit}`);
}


