import { FormEvent, useState, useEffect } from 'react';
import { Gem, LogIn, UserPlus } from 'lucide-react';
import { AuthenticatedUser } from '../types';
import * as api from '../services/api';

declare global {
  interface Window {
    google?: any;
  }
}

interface LoginScreenProps {
  onAuthenticated: (user: AuthenticatedUser, token: string) => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isRegistering = mode === 'register';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    // Dynamically load Google GSI script
    if (!window.google && !document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.body.appendChild(script);
    } else if (window.google) {
      initializeGoogleAuth();
    }
  }, []);

  const initializeGoogleAuth = () => {
    if (!window.google?.accounts?.id || !googleClientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse
      });

      const btnContainer = document.getElementById('google-button-div');
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'pill'
        });
      }
    } catch (err) {
      console.warn('Failed to initialize Google Auth:', err);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response.credential) return;

    setGoogleLoading(true);
    setError('');
    try {
      const res = await api.loginWithGoogle(response.credential);
      onAuthenticated(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDevGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      // Mock JWT token payload for local dev when no Google Client ID is set
      const mockHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const mockPayload = btoa(
        JSON.stringify({
          sub: 'google_user_123456',
          email: 'google.user@example.com',
          picture: 'https://lh3.googleusercontent.com/a/default-user',
          name: 'Google Test User'
        })
      );
      const mockToken = `${mockHeader}.${mockPayload}.mock_signature`;

      const res = await api.loginWithGoogle(mockToken);
      onAuthenticated(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Google Login failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (isRegistering && password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = isRegistering
        ? await api.register(email, password, passwordConfirmation)
        : await api.login(email, password);
      onAuthenticated(response.user, response.token);
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
            <h1>
              <span className="ruby-gradient">Exma</span> Workspace
            </h1>
            <p>Sign in to manage your projects.</p>
          </div>
        </div>

        {/* Google OAuth Section */}
        <div style={{ margin: '1rem 0 1.25rem 0' }}>
          <div id="google-button-div" style={{ minHeight: '40px', width: '100%' }}></div>

          {!googleClientId && (
            <button
              type="button"
              onClick={handleDevGoogleLogin}
              disabled={googleLoading}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#f8fafc',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
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
          )}

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
              style={{ padding: '0 0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              or sign in with email
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
          </div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication options">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Sign in
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
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
            Password
            <input
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </label>
          {isRegistering && (
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
            {isRegistering ? <UserPlus size={17} /> : <LogIn size={17} />}
            {submitting ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
