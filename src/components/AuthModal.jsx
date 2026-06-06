import { useState } from 'react';

export default function AuthModal({ onSignIn, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('Signing in…');
    const { error: err } = await onSignIn(email, password);
    if (err) { setError(err.message); return; }
    setPassword('');
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSignIn();
  }

  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>Owner sign-in</h3>
        <p>Sign in to edit. Visitors view only.</p>
        <input
          type="email"
          placeholder="email"
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <input
          type="password"
          placeholder="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="modal-err">{error}</div>
        <div className="modal-row">
          <button className="btn" style={{ flex: 1 }} onClick={handleSignIn}>Sign in</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
