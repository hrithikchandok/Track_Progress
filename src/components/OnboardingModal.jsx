import { useState } from 'react';

export default function OnboardingModal({ onSetup }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleStart() {
    setLoading(true);
    setError('');
    const { error: err } = await onSetup({
      selectedSections: [],
      usernameStr: username.trim() || null,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="modal">
      <div className="modal-card" style={{ maxWidth: 480 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>Welcome</div>
        <h3 style={{ fontSize: 18, marginBottom: 4 }}>Set up your tracker</h3>
        <p style={{ marginBottom: 20 }}>
          Get a shareable link to your progress, or start private and add one later.
        </p>

        <div className="kicker" style={{ marginBottom: 8 }}>Public username (optional)</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
          Get a shareable read-only link — e.g.{' '}
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>yoursite.com/u/you</span>.
          Leave blank to keep it private.
        </p>
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          className="auth-input"
          style={{ marginBottom: 16 }}
        />

        {error && <div className="modal-err" style={{ marginBottom: 10 }}>{error}</div>}
        <button className="btn btn-primary" onClick={handleStart} disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Setting up…' : 'Start tracking'}
        </button>
      </div>
    </div>
  );
}
