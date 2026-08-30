import { AuthResponse, AuthenticatedUser, HealthStatus, Project, StatsSummary } from '../types';

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAuthToken();

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.error || body.errors?.join(', ') || 'Request failed';
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

export function createProject(data: Partial<Project>): Promise<Project> {
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
