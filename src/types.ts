export interface Project {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'pending';
  category: string;
  latency: number;
  created_at?: string;
  updated_at?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  ruby_version: string;
  rails_version: string;
  database: string;
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
