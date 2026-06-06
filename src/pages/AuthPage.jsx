import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await onSignIn(email, password);
    if (err) { setError(err.message); setLoading(false); return; }
    navigate('/');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="kicker" style={{ marginBottom: 12 }}>Prep Console</div>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>
          Sign in <span className="slash">// track your progress</span>
        </h1>
        <p className="sub" style={{ marginBottom: 28 }}>
          Access is invite-only. Sign in with the credentials you were given.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          {error && <div className="modal-err" style={{ marginTop: 0 }}>{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
