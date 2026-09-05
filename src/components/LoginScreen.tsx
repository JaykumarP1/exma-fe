import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Gem, KeyRound, LogIn, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { AuthenticatedUser } from '../types';
import * as api from '../services/api';

interface LoginScreenProps {
  onAuthenticated: (user: AuthenticatedUser, token: string) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'mfa';

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const resetTokenFromUrl = searchParams.get('reset_token') || '';

  const [mode, setMode] = useState<AuthMode>(() => (resetTokenFromUrl ? 'reset' : 'login'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [resetToken, setResetToken] = useState(resetTokenFromUrl);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('reset_token');
    if (token) {
      setResetToken(token);
      setMode('reset');
      setError('');
      setSuccessMessage('');
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const backendUrl = import.meta.env.VITE_API_HOST || 'http://localhost:4000';
    window.location.href = `${backendUrl}/api/v1/auth/google/authorize`;
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    if (newMode !== 'reset' && searchParams.has('reset_token')) {
      searchParams.delete('reset_token');
      setSearchParams(searchParams, { replace: true });
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (mode === 'mfa') {
      if (!mfaCode.trim()) {
        setError('Please enter your 6-digit code or recovery code.');
        return;
      }
      setSubmitting(true);
      try {
        const response = await api.verifyMfa(mfaToken, mfaCode.trim());
        onAuthenticated(response.user, response.token);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Invalid 2FA code.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      setSubmitting(true);
      try {
        const response = await api.forgotPassword(email.trim());
        setSuccessMessage(
          response.message ||
            'If an account exists with that email address, a password reset link has been sent.'
        );
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to send password reset email.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (!resetToken) {
        setError('Password reset token is missing. Please use the link sent to your email.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== passwordConfirmation) {
        setError('Passwords do not match.');
        return;
      }

      setSubmitting(true);
      try {
        const response = await api.resetPassword(resetToken, password, passwordConfirmation);
        searchParams.delete('reset_token');
        setSearchParams(searchParams, { replace: true });
        onAuthenticated(response.user, response.token);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to reset password.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'register' && password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        const response = await api.register(email, password, passwordConfirmation);
        onAuthenticated(response.user, response.token);
      } else {
        const response = await api.login(email, password);
        if ('mfa_required' in response && response.mfa_required) {
          setMfaToken(response.mfa_token);
          setMode('mfa');
          setMfaCode('');
        } else {
          onAuthenticated((response as any).user, (response as any).token);
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to continue.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card glass-panel">
        <div className="auth-brand">
          <span className="auth-brand-icon">
            <Gem size={26} />
          </span>
          <div>
            {mode === 'mfa' ? (
              <>
                <h1>
                  <span className="ruby-gradient">Two-Factor</span> Authentication
                </h1>
                <p>Enter the 6-digit code or recovery code.</p>
              </>
            ) : mode === 'forgot' ? (
              <>
                <h1>
                  <span className="ruby-gradient">Reset</span> Password
                </h1>
                <p>Enter your email to receive recovery instructions.</p>
              </>
            ) : mode === 'reset' ? (
              <>
                <h1>
                  <span className="ruby-gradient">Set New</span> Password
                </h1>
                <p>Choose a secure new password for your account.</p>
              </>
            ) : (
              <>
                <h1>
                  <span className="ruby-gradient">Exma</span> Workspace
                </h1>
                <p>Sign in to manage your projects.</p>
              </>
            )}
          </div>
        </div>

        {/* Standard Login / Register Flow */}
        {(mode === 'login' || mode === 'register') && (
          <>
            {/* Google OAuth Login (Server Redirection Flow) */}
            <div style={{ margin: '1rem 0 1.25rem 0' }}>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.1 0-5.74-2.09-6.68-4.91H1.26v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.56H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.44l4.06-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.26 6.56l4.06 3.15c.94-2.82 3.58-4.96 6.68-4.96z"
                  />
                </svg>
                <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '1.25rem 0 0.5rem 0',
                  color: 'var(--text-dim)',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
                <span
                  style={{
                    padding: '0 0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  or sign in with email
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
              </div>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="Authentication options">
              <button
                className={mode === 'login' ? 'active' : ''}
                onClick={() => switchMode('login')}
                type="button"
              >
                Sign in
              </button>
              <button
                className={mode === 'register' ? 'active' : ''}
                onClick={() => switchMode('register')}
                type="button"
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </label>

              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Password</span>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#fb7185',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </label>

              {mode === 'register' && (
                <label>
                  Confirm password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    required
                    minLength={6}
                    placeholder="Repeat your password"
                  />
                </label>
              )}

              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}

              <button className="auth-submit" disabled={submitting} type="submit">
                {mode === 'register' ? <UserPlus size={17} /> : <LogIn size={17} />}
                {submitting ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
              </button>
            </form>
          </>
        )}

        {/* 2FA Challenge Flow */}
        {mode === 'mfa' && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Authenticator Code
              <input
                type="text"
                autoComplete="one-time-code"
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                required
                placeholder="6-digit code or recovery code"
                autoFocus
              />
            </label>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button className="auth-submit" disabled={submitting} type="submit">
              <ShieldCheck size={17} />
              {submitting ? 'Verifying code…' : 'Verify & Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                <ArrowLeft size={15} /> Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Flow */}
        {mode === 'forgot' && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Account Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                autoFocus
              />
            </label>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            {successMessage && (
              <p className="auth-success" role="status">
                {successMessage}
              </p>
            )}

            <button className="auth-submit" disabled={submitting} type="submit">
              <Mail size={17} />
              {submitting ? 'Sending instructions…' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                <ArrowLeft size={15} /> Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* Reset Password Flow (from email link) */}
        {mode === 'reset' && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              New Password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                autoFocus
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
                minLength={6}
                placeholder="Repeat your new password"
              />
            </label>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            {successMessage && (
              <p className="auth-success" role="status">
                {successMessage}
              </p>
            )}

            <button className="auth-submit" disabled={submitting} type="submit">
              <KeyRound size={17} />
              {submitting ? 'Updating password…' : 'Update Password & Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                <ArrowLeft size={15} /> Back to sign in
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
