import { useState } from 'react';
import { TEMPLATES } from '../data/templates';

export default function OnboardingModal({ onSetup }) {
  const [selectedTemplate, setSelectedTemplate] = useState('backend-switch');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleStart() {
    setLoading(true);
    setError('');
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    const { error: err } = await onSetup({
      selectedSections: template.sections,
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
        <p style={{ marginBottom: 20 }}>Pick a starting template — you can add, remove, and customise everything later.</p>

        <div className="kicker" style={{ marginBottom: 10 }}>Starting template</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {TEMPLATES.map(t => (
            <label key={t.id} className={`template-option${selectedTemplate === t.id ? ' selected' : ''}`}>
              <input
                type="radio"
                name="template"
                value={t.id}
                checked={selectedTemplate === t.id}
                onChange={() => setSelectedTemplate(t.id)}
                style={{ display: 'none' }}
              />
              <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t.description}</div>
            </label>
          ))}
        </div>

        <div className="kicker" style={{ marginBottom: 8 }}>Public username (optional)</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
          Set a username to get a shareable link — e.g. <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>yoursite.com/u/you</span>. Leave blank to keep your tracker private.
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
