import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { Filter, Plus, Search } from 'lucide-react';
import { PdfPasswordModal } from './components/PdfPasswordModal';

import { CreateModal } from './components/CreateModal';
import { ExpensePage } from './components/ExpensePage';
import { ExpenseStagingPage, StagingDataState } from './components/ExpenseStagingPage';
import { StatementPage } from './components/StatementPage';
import { TokenUsagePage } from './components/TokenUsagePage';
import { ReleaseNotesPage } from './components/ReleaseNotesPage';
import { SettingsPage } from './components/SettingsPage';
import { ServerDownScreen } from './components/ServerDownScreen';




import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ProjectList } from './components/ProjectList';
import { Sidebar } from './components/Sidebar';
import { StatsOverview } from './components/StatsOverview';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { AuthenticatedUser, HealthStatus, Project, StatsSummary, Workspace } from './types';
import * as api from './services/api';

export function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<string>('USD');
  const [activeStagingData, setActiveStagingData] = useState<StagingDataState | null>(null);

  const handleStagingReady = (data: StagingDataState) => {
    setActiveStagingData(data);
    navigate('/expenses/staging');
  };



  useEffect(() => {
    if (user?.currency) {
      setActiveCurrency(user.currency);
    }
  }, [user]);

  const handleCurrencyChange = async (newCurrency: string) => {
    setActiveCurrency(newCurrency);
    if (user) {
      setUser({ ...user, currency: newCurrency });
      try {
        await api.updateSettings({ default_currency: newCurrency });
        addToast('success', 'Currency Updated', `Default currency set to ${newCurrency}`);
      } catch (err) {
        console.error('Failed to sync currency preference:', err);
      }
    }
  };


  const addToast = (type: 'error' | 'warning' | 'info' | 'success', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  useEffect(() => {
    const handleInternalError = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; status: number }>;
      const msg = customEvent.detail?.message || 'An internal error occurred.';
      addToast('error', 'Internal Server Error', msg);
    };

    window.addEventListener('app-internal-error', handleInternalError);
    return () => window.removeEventListener('app-internal-error', handleInternalError);
  }, []);






  const loadWorkspaces = async () => {
    try {
      const res = await api.fetchWorkspaces();
      setWorkspaces(res.workspaces || []);
      const active = res.workspaces.find((w) => String(w.id) === api.getActiveWorkspaceId()) || res.workspaces[0] || null;
      if (active) {
        api.setActiveWorkspaceId(active.id);
        setCurrentWorkspace(active);
      }
      return active;
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
      return null;
    }
  };

  const handleSelectWorkspace = async (ws: Workspace) => {
    try {
      api.setActiveWorkspaceId(ws.id);
      setCurrentWorkspace(ws);
      await api.switchWorkspace(ws.id);
      loadData();
    } catch (err: any) {
      addToast('error', 'Workspace Error', err.message || 'Failed to switch workspace.');
    }
  };

  const handleCreateWorkspace = async (name: string) => {
    try {
      const res = await api.createWorkspace(name);
      setWorkspaces((prev) => [...prev, res.workspace]);
      api.setActiveWorkspaceId(res.workspace.id);
      setCurrentWorkspace(res.workspace);
      addToast('success', 'Workspace Created', `Switched to ${res.workspace.name}`);
      loadData();
    } catch (err: any) {
      addToast('error', 'Workspace Error', err.message || 'Failed to create workspace.');
    }
  };

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
          await loadWorkspaces();
        }
      } catch (err: any) {
        if (err instanceof api.ServerOfflineError) {
          if (mounted) setIsServerDown(true);
        } else if (err instanceof api.UnauthorizedError) {
          api.clearAuthToken();
        } else {
          // Internal error: PRESERVE local storage session!
          addToast('error', 'Internal Server Error', err.message || 'An internal server error occurred, but your login session remains active.');
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


  const handleDeleteDocument = async (projectId: number, documentId: number, deleteExpenses: boolean = false) => {
    try {
      const res = await api.deleteProjectDocument(projectId, documentId, deleteExpenses);
      setProjects((current) =>
        current.map((p) => (p.id === projectId ? { ...p, documents: res.documents } : p))
      );
      setStats(await api.fetchStats());
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


  const renderProtectedLayout = (view: 'dashboard' | 'expenses' | 'statements' | 'settings' | 'usage' | 'release-notes' | 'staging') => {







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
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
        />

        <main className={`app-main ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <Header
            health={health}
            loading={loading}
            onRefresh={loadData}
            user={user}
            activeTab={view}
            activeCurrency={activeCurrency}
            onCurrencyChange={handleCurrencyChange}
            onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
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
                currency={activeCurrency}
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
            <ExpensePage projects={projects} currency={activeCurrency} onStagingReady={handleStagingReady} />
          ) : view === 'staging' ? (
            activeStagingData ? (
              <ExpenseStagingPage
                stagingData={activeStagingData}
                currency={activeCurrency}
                onCancel={() => {
                  setActiveStagingData(null);
                  navigate('/expenses');
                }}
                onConfirmSuccess={(count, filename) => {
                  addToast('success', 'Expenses Created', `Successfully saved ${count} expenses from "${filename}".`);
                  setActiveStagingData(null);
                  loadData();
                  navigate('/expenses');
                }}
              />
            ) : (
              <Navigate to="/expenses" replace />
            )
          ) : view === 'statements' ? (
            <StatementPage projects={projects} currency={activeCurrency} />
          ) : view === 'settings' ? (
            <SettingsPage user={user} onShowToast={(msg, type) => addToast(type, type === 'success' ? 'Success' : 'Error', msg)} />
          ) : view === 'release-notes' ? (

            user.role === 'admin' ? <ReleaseNotesPage currentUser={user} /> : <Navigate to="/dashboard" replace />
          ) : view === 'usage' ? (
            user.role === 'admin' ? <TokenUsagePage /> : <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )}

        </main>
      </div>
    );
  };

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={!user ? <LoginScreen onAuthenticated={handleAuthenticated} /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="/dashboard" element={renderProtectedLayout('dashboard')} />
        <Route path="/expenses" element={renderProtectedLayout('expenses')} />
        <Route path="/expenses/staging" element={renderProtectedLayout('staging')} />
        <Route path="/statements" element={renderProtectedLayout('statements')} />
        <Route path="/settings" element={renderProtectedLayout('settings')} />
        <Route path="/usage" element={renderProtectedLayout('usage')} />


        <Route path="/release-notes" element={renderProtectedLayout('release-notes')} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>


      <ToastNotification toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </>
  );



}

export default App;
