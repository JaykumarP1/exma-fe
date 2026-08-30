import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { ProjectList } from './components/ProjectList';
import { CreateModal } from './components/CreateModal';
import { Project, HealthStatus, StatsSummary } from './types';
import * as api from './services/api';

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [h, s, p] = await Promise.all([
        api.fetchHealth().catch(() => null),
        api.fetchStats().catch(() => null),
        api.fetchProjects(selectedCategory, searchQuery).catch(() => [])
      ]);
      setHealth(h);
      setStats(s);
      setProjects(p);
    } catch (err) {
      console.error('Failed to load application data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, searchQuery]);

  const handleCreate = async (data: Partial<Project>) => {
    try {
      const created = await api.createProject(data);
      setProjects([created, ...projects]);
      // Refresh stats
      const newStats = await api.fetchStats().catch(() => null);
      if (newStats) setStats(newStats);
    } catch (err) {
      console.error('Failed to create project', err);
    }
  };

  const handleStatusToggle = async (project: Project) => {
    const nextStatus: Project['status'] = 
      project.status === 'active' ? 'completed' : 
      project.status === 'completed' ? 'pending' : 'active';

    try {
      const updated = await api.updateProject(project.id, { status: nextStatus });
      setProjects(projects.map(p => p.id === project.id ? updated : p));
      const newStats = await api.fetchStats().catch(() => null);
      if (newStats) setStats(newStats);
    } catch (err) {
      console.error('Failed to update project status', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      const newStats = await api.fetchStats().catch(() => null);
      if (newStats) setStats(newStats);
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  return (
    <div className="container">
      {/* Top Header */}
      <Header health={health} loading={loading} onRefresh={loadData} />

      {/* Analytics Overview Cards */}
      <StatsOverview stats={stats} />

      {/* Action Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', minWidth: '280px' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: '#1e293b',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="all">All Categories</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Security">Security</option>
              <option value="DevOps">DevOps</option>
            </select>
          </div>

        </div>

        {/* Add Project Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
          }}
        >
          <Plus size={16} /> New Entry
        </button>

      </div>

      {/* Project Cards */}
      <ProjectList
        projects={projects}
        loading={loading}
        onStatusToggle={handleStatusToggle}
        onDelete={handleDelete}
      />

      {/* Modal */}
      <CreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

export default App;
