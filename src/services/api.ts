import { AuthResponse, AuthenticatedUser, Expense, ExpensesResponse, HealthStatus, Project, ProjectDocument, StatsSummary, StatementsResponse, TokenUsageLogItem, TokenUsageResponse } from '../types';





const API_BASE = '/api/v1';
const TOKEN_KEY = 'exma.auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAuthToken();

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

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
    const message = body.error || body.errors?.join(', ') || `Request failed (${res.status})`;
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

export function deleteProjectDocument(projectId: number, documentId: number): Promise<{ message: string; documents: ProjectDocument[] }> {
  return request<{ message: string; documents: ProjectDocument[] }>(`/projects/${projectId}/documents/${documentId}`, {
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

export function deleteStatement(id: number): Promise<void> {
  return request<void>(`/statements/${id}`, { method: 'DELETE' });
}

export function fetchTokenUsage(): Promise<TokenUsageResponse> {
  return request<TokenUsageResponse>('/token_usage');
}

export function fetchTokenUsageDelta(): Promise<{ message: string; summary: TokenUsageResponse['summary']; logs: TokenUsageLogItem[] }> {
  return request<{ message: string; summary: TokenUsageResponse['summary']; logs: TokenUsageLogItem[] }>('/token_usage/fetch', { method: 'POST' });
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
