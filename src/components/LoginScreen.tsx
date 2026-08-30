import { FormEvent, useState } from 'react';
import { Gem, LogIn, UserPlus } from 'lucide-react';
import { AuthenticatedUser } from '../types';
import * as api from '../services/api';

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

  const isRegistering = mode === 'register';

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
          <span className="auth-brand-icon"><Gem size={26} /></span>
          <div>
            <h1><span className="ruby-gradient">Exma</span> Workspace</h1>
            <p>Sign in to manage your projects.</p>
          </div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication options">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">Create account</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="At least 6 characters" />
          </label>
          {isRegistering && (
            <label>
              Confirm password
              <input type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required minLength={6} placeholder="Repeat your password" />
            </label>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={submitting} type="submit">
            {isRegistering ? <UserPlus size={17} /> : <LogIn size={17} />}
            {submitting ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
