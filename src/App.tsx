import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { Filter, Plus, Search } from 'lucide-react';
import { PdfPasswordModal } from './components/PdfPasswordModal';

import { CreateModal } from './components/CreateModal';
import { ExpensePage } from './components/ExpensePage';
import { StatementPage } from './components/StatementPage';
import { TokenUsagePage } from './components/TokenUsagePage';
import { ServerDownScreen } from './components/ServerDownScreen';

import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ProjectList } from './components/ProjectList';
import { Sidebar } from './components/Sidebar';
import { StatsOverview } from './components/StatsOverview';
import { AuthenticatedUser, HealthStatus, Project, StatsSummary } from './types';
import * as api from './services/api';

export function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lockedDocument, setLockedDocument] = useState<{ projectId: number; file: File } | null>(null);
  const [isServerDown, setIsServerDown] = useState(false);





  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      if (!api.getAuthToken()) {
        if (mounted) setAuthLoading(false);
        return;
      }

      try {
        const response = await api.fetchCurrentUser();
        if (mounted) {
          setUser(response.user);
          setIsServerDown(false);
        }
      } catch (err: any) {
        if (err instanceof api.ServerOfflineError) {
          if (mounted) setIsServerDown(true);
        } else {
          api.clearAuthToken();
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    restoreSession();
    return () => { mounted = false; };
  }, []);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [h, s, p] = await Promise.all([
        api.fetchHealth().catch(() => null),
        api.fetchStats(),
        api.fetchProjects(selectedCategory, searchQuery),
      ]);
      setHealth(h);
      setStats(s);
      setProjects(p);
      setIsServerDown(false);
    } catch (error: any) {
      if (error instanceof api.ServerOfflineError) {
        setIsServerDown(true);
      }
      console.error('Failed to load application data', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (user) loadData();
  }, [user, selectedCategory, searchQuery]);

  const handleAuthenticated = (authenticatedUser: AuthenticatedUser, token: string) => {
    api.setAuthToken(token);
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Clearing the local token still ends the client session if the API is unavailable.
    } finally {
      api.clearAuthToken();
      setUser(null);
      setProjects([]);
      setStats(null);
      setHealth(null);
    }
  };

  const handleCreate = async (data: Partial<Project>, files?: File[]) => {
    try {
      const created = await api.createProject(data, files);
      setProjects((current) => [created, ...current]);
      const newStats = await api.fetchStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const handleUploadDocument = async (projectId: number, file: File, password?: string) => {
    try {
      const res = await api.uploadProjectDocument(projectId, file, password);
      setProjects((current) =>
        current.map((p) => (p.id === projectId ? { ...p, documents: res.documents } : p))
      );
      if (res.extracted_expenses_count && res.extracted_expenses_count > 0) {
        setStats(await api.fetchStats());
      }
      setLockedDocument(null);
    } catch (error: any) {
      if (error.message && (error.message.includes('PDF_LOCKED') || error.message.includes('password-protected'))) {
        setLockedDocument({ projectId, file });
      } else {
        console.error('Failed to upload document', error);
        alert(`Upload failed: ${error.message || 'Failed to upload document.'}`);
      }
    }
  };


  const handleDeleteDocument = async (projectId: number, documentId: number) => {
    try {
      const res = await api.deleteProjectDocument(projectId, documentId);
      setProjects((current) =>
        current.map((p) => (p.id === projectId ? { ...p, documents: res.documents } : p))
      );
    } catch (error) {
      console.error('Failed to delete document', error);
    }
  };

  const handleStatusToggle = async (project: Project) => {
    const nextStatus: Project['status'] =
      project.status === 'active' ? 'completed' :
      project.status === 'completed' ? 'pending' : 'active';

    try {
      const updated = await api.updateProject(project.id, { status: nextStatus });
      setProjects((current) => current.map((item) => item.id === project.id ? updated : item));
      setStats(await api.fetchStats());
    } catch (error) {
      console.error('Failed to update project status', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteProject(id);
      setProjects((current) => current.filter((project) => project.id !== id));
      setStats(await api.fetchStats());
    } catch (error) {
      console.error('Failed to delete project', error);
    }
  };

  const handleAddCard = async (projectId: number, cardData: { card_number: string; card_holder_name: string; card_type: string; expiry_date: string; status?: string }) => {

    try {
      const newCard = await api.createCard(projectId, cardData);
      setProjects((current) =>
        current.map((p) => (p.id === projectId ? { ...p, cards: [newCard, ...(p.cards || [])] } : p))
      );
    } catch (error) {
      console.error('Failed to create card', error);
    }
  };

  const handleDeleteCard = async (projectId: number, cardId: number) => {
    try {
      await api.deleteCard(projectId, cardId);
      setProjects((current) =>
        current.map((p) =>
          p.id === projectId ? { ...p, cards: (p.cards || []).filter((c) => c.id !== cardId) } : p
        )
      );
    } catch (error) {
      console.error('Failed to delete card', error);
    }
  };

  if (isServerDown) {
    return (
      <ServerDownScreen
        onReconnected={(reconnectedUser) => {
          setUser(reconnectedUser);
          setIsServerDown(false);
          loadData();
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (authLoading) {
    return <main className="auth-page"><p className="auth-loading">Restoring your session…</p></main>;
  }


  const renderProtectedLayout = (view: 'dashboard' | 'expenses' | 'statements' | 'usage') => {




    if (!user) return <Navigate to="/login" replace />;

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          user={user}
          health={health}
          loading={loading}
          onRefresh={loadData}
          onLogout={handleLogout}
        />

        <main style={{
          marginLeft: isSidebarCollapsed ? '80px' : '260px',
          flex: 1,
          padding: '2rem 2.5rem',
          width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 260px)',
          minWidth: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Header
            health={health}
            loading={loading}
            onRefresh={loadData}
            user={user}
            activeTab={view}
          />


          {view === 'dashboard' ? (
            <>
              <StatsOverview stats={stats} />

              <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', minWidth: '280px' }}>
                  <div style={{ position: 'relative', flex: '1' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search banks..."
                      onChange={(event) => setSearchQuery(event.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                    <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} style={{ padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-sm)', background: '#1e293b', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }}>
                      <option value="all">All Categories</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Security">Security</option>
                      <option value="DevOps">DevOps</option>
                    </select>
                  </div>
                </div>

                <button onClick={() => setIsModalOpen(true)} style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)' }}>
                  <Plus size={16} /> New Entry
                </button>
              </div>

              <ProjectList

                projects={projects}
                loading={loading}
                onStatusToggle={handleStatusToggle}
                onDelete={handleDelete}
                onUploadDocument={handleUploadDocument}
                onDeleteDocument={handleDeleteDocument}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
              />
              <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
              {lockedDocument && (
                <PdfPasswordModal
                  isOpen={!!lockedDocument}
                  filename={lockedDocument.file.name}
                  onClose={() => setLockedDocument(null)}
                  onSubmit={(password) => {
                    if (lockedDocument) {
                      handleUploadDocument(lockedDocument.projectId, lockedDocument.file, password);
                    }
                  }}
                />
              )}


            </>
          ) : view === 'expenses' ? (
            <ExpensePage projects={projects} />
          ) : view === 'statements' ? (
            <StatementPage projects={projects} />
          ) : user.role === 'admin' ? (
            <TokenUsagePage />
          ) : (
            <Navigate to="/dashboard" replace />
          )}

        </main>
      </div>
    );
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <LoginScreen onAuthenticated={handleAuthenticated} /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="/dashboard" element={renderProtectedLayout('dashboard')} />
      <Route path="/expenses" element={renderProtectedLayout('expenses')} />
      <Route path="/statements" element={renderProtectedLayout('statements')} />
      <Route path="/usage" element={renderProtectedLayout('usage')} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );


}

export default App;
