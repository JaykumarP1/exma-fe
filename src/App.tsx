import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { BankPage } from './components/BankPage';
import { DashboardPage } from './components/DashboardPage';
import { ExpensePage } from './components/ExpensePage';
import { ExpenseStagingPage, StagingDataState } from './components/ExpenseStagingPage';
import { StatementPage } from './components/StatementPage';
import { CardsPage } from './components/CardsPage';
import { TokenUsagePage } from './components/TokenUsagePage';
import { LogPlansPage } from './components/LogPlansPage';
import { ReleaseNotesPage } from './components/ReleaseNotesPage';

import { SettingsPage } from './components/SettingsPage';
import { ServerDownScreen } from './components/ServerDownScreen';

import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { Sidebar } from './components/Sidebar';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { AuthenticatedUser, HealthStatus, Project, StatsSummary, Workspace } from './types';
import * as api from './services/api';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isServerDown, setIsServerDown] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<string>('USD');
  const [activeStagingData, setActiveStagingDataState] = useState<StagingDataState | null>(() => {
    try {
      const saved = localStorage.getItem('activeStagingData');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setActiveStagingData = (data: StagingDataState | null) => {
    setActiveStagingDataState(data);
    if (data) {
      localStorage.setItem('activeStagingData', JSON.stringify(data));
    } else {
      localStorage.removeItem('activeStagingData');
    }
  };

  const handleStagingReady = (data: StagingDataState) => {
    setActiveStagingData(data);
    const targetId = data.draftId || 'draft-1';
    navigate(`/expenses/staging?draft_id=${encodeURIComponent(targetId)}`);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const draftIdParam = searchParams.get('draft_id') || searchParams.get('statement_id');

    if (draftIdParam && !draftIdParam.startsWith('draft-temp-') && !activeStagingData) {

      let isMounted = true;
      api.fetchExpenseDraft(draftIdParam)
        .then((res) => {
          if (!isMounted) return;
          const restoredData: StagingDataState = {
            draftId: res.draft_id,
            filename: res.filename,
            pdfUrl: res.pdf_url,
            isPdf: res.is_pdf,
            bankName: res.bank_name,
            statementDate: res.statement_date,
            dueDate: res.due_date,
            minimumAmount: res.minimum_amount,
            totalDue: res.total_due,
            cardId: res.card_id,
            cardName: res.card_name,
            cardMaskedNumber: res.card_masked_number,
            cardLastFour: res.card_last_four,
            cardType: res.card_type,
            isCreditCard: res.is_credit_card,
            items: res.expenses
          };
          setActiveStagingData(restoredData);
        })
        .catch((err) => {
          console.error('Failed to restore draft from URL param:', err);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [activeStagingData]);

  useEffect(() => {
    if (currentWorkspace?.currency) {
      setActiveCurrency(currentWorkspace.currency);
    } else if (user?.currency) {
      setActiveCurrency(user.currency);
    }
  }, [currentWorkspace, user]);

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
      const active =
        res.workspaces.find((w) => String(w.id) === api.getActiveWorkspaceId()) || res.workspaces[0] || null;
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
      if (ws.currency) {
        setActiveCurrency(ws.currency);
      }
      await api.switchWorkspace(ws.id);
      loadData();
    } catch (err: any) {
      addToast('error', 'Workspace Error', err.message || 'Failed to switch workspace.');
    }
  };

  const handleCreateWorkspace = async (name: string, currency?: string) => {
    try {
      const res = await api.createWorkspace(name, currency);
      setWorkspaces((prev) => [...prev, res.workspace]);
      api.setActiveWorkspaceId(res.workspace.id);
      setCurrentWorkspace(res.workspace);
      if (res.workspace.currency) {
        setActiveCurrency(res.workspace.currency);
      }
      addToast('success', 'Workspace Created', `Switched to ${res.workspace.name}`);
      loadData();
    } catch (err: any) {
      addToast('error', 'Workspace Error', err.message || 'Failed to create workspace.');
    }
  };

  const handleUpdateWorkspace = async (data: { currency?: string; pdf_extraction?: 'standard' | 'ai' }) => {
    if (!currentWorkspace) return;
    try {
      const res = await api.updateWorkspace(currentWorkspace.id, data);
      setCurrentWorkspace(res.workspace);
      setWorkspaces((prev) => prev.map((w) => (w.id === currentWorkspace.id ? res.workspace : w)));
      if (res.workspace.currency) {
        setActiveCurrency(res.workspace.currency);
      }
    } catch (err: any) {
      console.error('Failed to update workspace settings:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        api.setAuthToken(urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

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
          if (response.user.onboarding_completed === false) {
            setIsOnboardingOpen(true);
          }
        }
      } catch (err: any) {
        if (err instanceof api.ServerOfflineError) {
          if (mounted) setIsServerDown(true);
        } else if (err instanceof api.UnauthorizedError) {
          api.clearAuthToken();
        } else {
          // Internal error: PRESERVE local storage session!
          addToast(
            'error',
            'Internal Server Error',
            err.message || 'An internal server error occurred, but your login session remains active.'
          );
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [h, s, p] = await Promise.all([
        api.fetchHealth().catch(() => null),
        api.fetchStats(),
        api.fetchProjects()
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
  }, [user]);

  const handleAuthenticated = (authenticatedUser: AuthenticatedUser, token: string) => {
    api.setAuthToken(token);
    setUser(authenticatedUser);
    loadWorkspaces();
    if (authenticatedUser.onboarding_completed === false) {
      setIsOnboardingOpen(true);
    }
  };

  const handleOnboardingComplete = (updatedUser: AuthenticatedUser, updatedWorkspace?: Workspace) => {
    setUser(updatedUser);
    if (updatedWorkspace) {
      setCurrentWorkspace(updatedWorkspace);
      setWorkspaces((prev) => prev.map((w) => (w.id === updatedWorkspace.id ? updatedWorkspace : w)));
      if (updatedWorkspace.currency) {
        setActiveCurrency(updatedWorkspace.currency);
      }
    } else if (updatedUser.currency) {
      setActiveCurrency(updatedUser.currency);
    }
    setIsOnboardingOpen(false);
    loadWorkspaces();
    loadData();
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
      setProjects((current) => current.map((p) => (p.id === projectId ? { ...p, documents: res.documents } : p)));
      if (res.extracted_expenses_count && res.extracted_expenses_count > 0) {
        setStats(await api.fetchStats());
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteDocument = async (projectId: number, documentId: number, deleteExpenses: boolean = false) => {
    try {
      const res = await api.deleteProjectDocument(projectId, documentId, deleteExpenses);
      setProjects((current) => current.map((p) => (p.id === projectId ? { ...p, documents: res.documents } : p)));
      setStats(await api.fetchStats());
    } catch (error) {
      console.error('Failed to delete document', error);
    }
  };

  const handleStatusToggle = async (project: Project) => {
    const nextStatus: Project['status'] =
      project.status === 'active' ? 'completed' : project.status === 'completed' ? 'pending' : 'active';

    try {
      const updated = await api.updateProject(project.id, { status: nextStatus });
      setProjects((current) => current.map((item) => (item.id === project.id ? updated : item)));
      setStats(await api.fetchStats());
    } catch (error) {
      console.error('Failed to update project status', error);
    }
  };

  const handleUpdateBankPassword = async (bankId: number, password: string | null) => {
    try {
      const updated = await api.updateBankPassword(bankId, password);
      setProjects((current) => current.map((item) => (item.id === bankId ? updated : item)));
    } catch (error) {
      console.error('Failed to update bank statement password', error);
      throw error;
    }
  };

  const handleUpdateBankTags = async (bankId: number, tags: string[]) => {
    try {
      const updated = await api.updateBankTags(bankId, tags);
      setProjects((current) => current.map((item) => (item.id === bankId ? updated : item)));
      addToast('success', 'Tags Updated', `Tags updated for ${updated.title || 'bank'}.`);
    } catch (error: any) {
      console.error('Failed to update bank tags', error);
      addToast('error', 'Update Failed', error?.message || 'Failed to update bank tags.');
      throw error;
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

  const handleAddCard = async (
    projectId: number,
    cardData: { card_number: string; card_holder_name: string; card_type: string; expiry_date: string; status?: string }
  ) => {
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
        current.map((p) => (p.id === projectId ? { ...p, cards: (p.cards || []).filter((c) => c.id !== cardId) } : p))
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
    return (
      <main className="auth-page">
        <p className="auth-loading">Restoring your session…</p>
      </main>
    );
  }

  const renderProtectedLayout = (
    view: 'dashboard' | 'banks' | 'expenses' | 'statements' | 'cards' | 'settings' | 'usage' | 'release-notes' | 'staging' | 'usage-plan'
  ) => {

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
          {view !== 'staging' && view !== 'statements' && (
            <Header
              health={health}
              loading={loading}
              onRefresh={loadData}
              user={user}
              activeTab={view}
              onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
            />
          )}

          {view === 'dashboard' ? (
            <DashboardPage stats={stats} projects={projects} currency={activeCurrency} />
          ) : view === 'banks' ? (
            <BankPage
              projects={projects}
              loading={loading}
              currency={activeCurrency}
              onStatusToggle={handleStatusToggle}
              onDelete={handleDelete}
              onUploadDocument={handleUploadDocument}
              onDeleteDocument={handleDeleteDocument}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              onCreateBank={handleCreate}
              onUpdatePassword={handleUpdateBankPassword}
              onUpdateTags={handleUpdateBankTags}
            />
          ) : view === 'expenses' ? (
            <ExpensePage projects={projects} currency={activeCurrency} onStagingReady={handleStagingReady} />
          ) : view === 'staging' ? (
            activeStagingData ? (
              <ExpenseStagingPage
                stagingData={activeStagingData}
                currency={activeCurrency}
                projects={projects}
                onBankCreated={(newBank) => setProjects((prev) => [newBank, ...prev])}
                onCancel={() => {
                  const isFromStatement = activeStagingData?.readOnly || activeStagingData?.isExistingStatement || activeStagingData?.draftId?.startsWith('stmt-view-');
                  setActiveStagingData(null);
                  navigate(isFromStatement ? '/statements' : '/expenses');
                }}

                onConfirmSuccess={(count, filename) => {
                  const isExisting = activeStagingData?.isExistingStatement || activeStagingData?.draftId?.startsWith('stmt-view-');
                  const message = count === 0
                    ? `Successfully recorded statement "${filename}" with 0 transactions.`
                    : `Successfully ${isExisting ? 'updated statement and' : 'saved'} ${count} expenses from "${filename}".`;
                  addToast('success', isExisting ? 'Statement Saved' : 'Expenses Created', message);
                  setActiveStagingData(null);
                  loadData();
                  navigate(isExisting ? '/statements' : '/expenses');
                }}
              />
            ) : (
              <Navigate to="/expenses" replace />
            )
          ) : view === 'statements' ? (
            <StatementPage
              projects={projects}
              currency={activeCurrency}
              onStagingReady={handleStagingReady}
              onBankCreated={(newBank) => setProjects((prev) => [newBank, ...prev])}
              onSync={loadData}
              loadingSync={loading}
              onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
            />
          ) : view === 'cards' ? (
            <CardsPage projects={projects} currency={activeCurrency} />
          ) : view === 'settings' ? (
            <SettingsPage
              user={user}
              currentWorkspace={currentWorkspace}
              projects={projects}
              onUpdateWorkspace={handleUpdateWorkspace}
              onShowToast={(msg, type) => addToast(type, type === 'success' ? 'Success' : 'Error', msg)}
            />
          ) : view === 'release-notes' ? (
            user.role === 'admin' ? (
              <ReleaseNotesPage currentUser={user} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : view === 'usage' ? (
            user.role === 'admin' ? (
              <TokenUsagePage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : view === 'usage-plan' ? (
            user.role === 'admin' ? (
              <LogPlansPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
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
        <Route path="/banks" element={renderProtectedLayout('banks')} />
        <Route path="/expenses" element={renderProtectedLayout('expenses')} />
        <Route path="/expenses/staging" element={renderProtectedLayout('staging')} />
        <Route path="/statements" element={renderProtectedLayout('statements')} />
        <Route path="/cards" element={renderProtectedLayout('cards')} />
        <Route path="/settings" element={renderProtectedLayout('settings')} />
        <Route path="/usage" element={renderProtectedLayout('usage')} />
        <Route path="/usage/plan" element={renderProtectedLayout('usage-plan')} />
        <Route path="/usage/plan/:logId" element={renderProtectedLayout('usage-plan')} />

        <Route path="/release-notes" element={renderProtectedLayout('release-notes')} />
        <Route path="/" element={<Navigate to={user ? '/dashboard' : `/login${location.search}`} replace />} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : `/login${location.search}`} replace />} />
      </Routes>

      {user && isOnboardingOpen && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          user={user}
          currentWorkspace={currentWorkspace}
          onComplete={handleOnboardingComplete}
          onShowToast={(msg, type) => addToast(type, type === 'success' ? 'Success' : 'Error', msg)}
        />
      )}

      <ToastNotification toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </>
  );
}

export default App;
