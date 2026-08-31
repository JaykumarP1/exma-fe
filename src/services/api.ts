import { AuthResponse, AuthenticatedUser, Expense, ExpensesResponse, HealthStatus, Project, ProjectDocument, StatsSummary, StatementsResponse, TokenUsageLogItem, TokenUsageResponse, TokenAnalyticsResponse, ReleaseNoteItem, Workspace, WorkspacesResponse, SettingsResponse } from '../types';


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
      body: formData,
    });
  }

  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify({ project: data }),
  });
}

export function updateProject(id: number, data: Partial<Project>): Promise<Project> {
  return request<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ project: data }),
  });
}

export function deleteProject(id: number): Promise<void> {
  return request<void>(`/projects/${id}`, { method: 'DELETE' });
}

export function uploadProjectDocument(projectId: number, file: File, password?: string): Promise<{ message: string; documents: ProjectDocument[]; extracted_expenses_count?: number }> {
  const formData = new FormData();
  formData.append('file', file);
  if (password) formData.append('password', password);
  return request<{ message: string; documents: ProjectDocument[]; extracted_expenses_count?: number }>(`/projects/${projectId}/documents`, {
    method: 'POST',
    body: formData,
  });
}

export function deleteProjectDocument(projectId: number, documentId: number, deleteExpenses: boolean = false): Promise<{ message: string; documents: ProjectDocument[] }> {
  return request<{ message: string; documents: ProjectDocument[] }>(`/projects/${projectId}/documents/${documentId}?delete_expenses=${deleteExpenses}`, {
    method: 'DELETE',
  });
}

export function fetchExpenses(category = 'all', query = '', projectId = 'all'): Promise<ExpensesResponse> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (query) params.append('query', query);
  if (projectId && projectId !== 'all') params.append('project_id', projectId);
  const suffix = params.toString() ? `?${params.toString()}` : '';

  return request<ExpensesResponse>(`/expenses${suffix}`);
}

export function uploadExcelExpenseFile(file: File, projectId?: number, password?: string): Promise<{ message: string; count: number; expenses: Expense[] }> {
  const formData = new FormData();
  formData.append('file', file);
  if (projectId) formData.append('project_id', projectId.toString());
  if (password) formData.append('password', password);

  return request<{ message: string; count: number; expenses: Expense[] }>('/expenses/upload', {
    method: 'POST',
    body: formData,
  });
}

export interface StagedExpenseItem {
  id?: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  vendor?: string;
}

export interface ParseExpenseResponse {
  draft_id: string;
  filename: string;
  is_pdf: boolean;
  pdf_url?: string;
  count: number;
  expenses: StagedExpenseItem[];
}

export function parseExpenseFile(file: File, projectId?: number, password?: string): Promise<ParseExpenseResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (projectId) formData.append('project_id', projectId.toString());
  if (password) formData.append('password', password);

  return request<ParseExpenseResponse>('/expenses/parse', {
    method: 'POST',
    body: formData,
  });
}

export function confirmStagedExpenses(payload: { draft_id: string; filename: string; project_id?: number; expenses: StagedExpenseItem[] }): Promise<{ message: string; statement: any; expenses: Expense[] }> {
  return request<{ message: string; statement: any; expenses: Expense[] }>('/expenses/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(id: number): Promise<void> {
  return request<void>(`/expenses/${id}`, { method: 'DELETE' });
}


export function createCard(projectId: number, cardData: { card_number: string; card_holder_name: string; card_type: string; expiry_date: string; status?: string }): Promise<any> {
  return request<any>(`/projects/${projectId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ card: cardData }),
  });
}

export function deleteCard(projectId: number, cardId: number): Promise<void> {
  return request<void>(`/projects/${projectId}/cards/${cardId}`, {
    method: 'DELETE',
  });
}

export function fetchStatements(projectId = 'all'): Promise<StatementsResponse> {
  const suffix = projectId && projectId !== 'all' ? `?project_id=${projectId}` : '';
  return request<StatementsResponse>(`/statements${suffix}`);
}

export function deleteStatement(id: number, deleteExpenses: boolean = true): Promise<void> {
  return request<void>(`/statements/${id}?delete_expenses=${deleteExpenses}`, { method: 'DELETE' });
}



export function fetchTokenUsage(): Promise<TokenUsageResponse> {
  return request<TokenUsageResponse>('/token_usage');
}

export function fetchTokenUsageDelta(): Promise<{ message: string; summary: TokenUsageResponse['summary']; logs: TokenUsageLogItem[] }> {
  return request<{ message: string; summary: TokenUsageResponse['summary']; logs: TokenUsageLogItem[] }>('/token_usage/fetch', { method: 'POST' });
}

export function fetchTokenAnalytics(): Promise<TokenAnalyticsResponse> {
  return request<TokenAnalyticsResponse>('/token_usage/analytics');
}

export function fetchReleaseNotes(): Promise<{ releases: ReleaseNoteItem[] }> {
  return request<{ releases: ReleaseNoteItem[] }>('/release_notes');
}

export function createReleaseNote(data: Partial<ReleaseNoteItem>): Promise<{ message: string; release: ReleaseNoteItem }> {
  return request<{ message: string; release: ReleaseNoteItem }>('/release_notes', {
    method: 'POST',
    body: JSON.stringify({ release_note: data }),
  });
}

export function updateReleaseNote(id: number, data: Partial<ReleaseNoteItem>): Promise<{ message: string; release: ReleaseNoteItem }> {
  return request<{ message: string; release: ReleaseNoteItem }>(`/release_notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ release_note: data }),
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
    body: JSON.stringify({ settings: data }),
  });
}



export function fetchWorkspaces(): Promise<WorkspacesResponse> {
  return request<WorkspacesResponse>('/workspaces');
}

export function createWorkspace(name: string, currency?: string): Promise<{ message: string; workspace: Workspace }> {
  return request<{ message: string; workspace: Workspace }>('/workspaces', {
    method: 'POST',
    body: JSON.stringify({ workspace: { name, currency } }),
  });
}

export function updateWorkspace(id: number, currency: string): Promise<{ message: string; workspace: Workspace }> {
  return request<{ message: string; workspace: Workspace }>(`/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ workspace: { currency } }),
  });
}

export function switchWorkspace(id: number): Promise<{ message: string; workspace: Workspace }> {
  return request<{ message: string; workspace: Workspace }>(`/workspaces/${id}/switch`, {
    method: 'POST',
  });
}









export function register(email: string, password: string, passwordConfirmation: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ user: { email, password, password_confirmation: passwordConfirmation } }),
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ user: { email, password } }),
  });
}

export function fetchCurrentUser(): Promise<{ user: AuthenticatedUser }> {
  return request<{ user: AuthenticatedUser }>('/auth/me');
}

export function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'DELETE' });
}
