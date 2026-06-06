import { useState } from 'react';

export default function ShareModal({ currentUsername, onSave, onClose }) {
  const [username, setUsername] = useState(currentUsername || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const publicUrl = username ? `${window.location.origin}/u/${username}` : null;

  async function handleSave() {
    setSaving(true);
    setError('');
    const { error: err } = await onSave(username.trim() || null);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
  }

  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: 400 }}>
        <h3 style={{ marginBottom: 4 }}>Share your tracker</h3>
        <p style={{ marginBottom: 16 }}>
          Set a username to get a public read-only link. Anyone with the link can see your progress. Leave blank to keep it private.
        </p>

        <label className="field-label">Username</label>
        <input
          className="auth-input"
          placeholder="e.g. hrithik"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          autoFocus
        />

        {publicUrl && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', marginBottom: 14, wordBreak: 'break-all' }}>
            {publicUrl}
          </div>
        )}

        {saved && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--proc)', marginBottom: 10 }}>
            ✓ Saved! Share the link above.
          </div>
        )}
        {error && <div className="modal-err" style={{ marginBottom: 10 }}>{error}</div>}

        <div className="modal-row">
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
