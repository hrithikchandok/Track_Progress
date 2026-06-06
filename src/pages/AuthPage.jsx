import { useState } from 'react';

export default function AuthPage({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  function switchMode(m) {
    setMode(m);
    setError('');
    setConfirmSent(false);
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);

    if (mode === 'signin') {
      const { error: err } = await onSignIn(email, password);
      if (err) { setError(err.message); setLoading(false); }
      // on success, useAuth session update re-renders App → dashboard
    } else {
      const { needsConfirmation, error: err } = await onSignUp(email, password);
      setLoading(false);
      if (err) { setError(err.message); return; }
      if (needsConfirmation) { setConfirmSent(true); } // email confirm required
      // if no confirmation needed, session fires → App re-renders
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="kicker" style={{ marginBottom: 16 }}>Prep Console · Track your progress</div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'signin' ? ' active' : ''}`} onClick={() => switchMode('signin')}>Sign in</button>
          <button className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>Create account</button>
        </div>

        {confirmSent ? (
          <div style={{ marginTop: 20 }}>
            <p style={{ color: 'var(--proc)', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.7 }}>
              ✓ Check your email — we sent a confirmation link to <b>{email}</b>.<br />
              Click the link to activate your account, then sign in here.
            </p>
            <button className="btn" style={{ marginTop: 16 }} onClick={() => { setConfirmSent(false); setMode('signin'); }}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <input
              type="email"
              placeholder="Email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="auth-input"
            />
            {mode === 'signup' && (
              <input
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="auth-input"
              />
            )}
            {error && <div className="modal-err" style={{ marginTop: 0 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Create account')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
